import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { personInfo, sortPeople, fmtDuration, fmtDistance, haversine, batteryOf, cssUrl, lang, PresenceCard, PresenceMiniCard, PresenceCardEditor, STRINGS, movesFrom, proximityOf, distanceKm, intlLang, proximitySensors } =
  load("presence-card.js", [
    "intlLang",
    "proximitySensors",
    "proximityOf",
    "distanceKm",
    "personInfo",
    "sortPeople",
    "fmtDuration",
    "fmtDistance",
    "haversine",
    "batteryOf",
    "cssUrl",
    "lang",
    "PresenceCard",
    "PresenceMiniCard",
    "PresenceCardEditor",
    "STRINGS",
    "movesFrom",
  ]);

const NOW = Date.parse("2026-10-25T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const person = (id, state, attributes = {}, min = 30) => ({
  entity_id: `person.${id}`,
  state,
  last_changed: ago(min),
  attributes: { friendly_name: id[0].toUpperCase() + id.slice(1), ...attributes },
});
const HOME = { "zone.home": { entity_id: "zone.home", state: "0", attributes: { latitude: 48.1173, longitude: -1.6778 } } };
const tr = (k) => STRINGS.en[k];

test("state kinds: home, away, zone and unknown", () => {
  const states = {
    ...HOME,
    "person.a": person("a", "home"),
    "person.b": person("b", "not_home"),
    "person.c": person("c", "Work"),
    "person.d": person("d", "unavailable"),
  };
  const kinds = ["a", "b", "c", "d"].map((id) => personInfo({ states }, { entity: `person.${id}` }, NOW));
  assert.deepEqual(
    kinds.map((p) => [p.kind, p.zone]),
    [
      ["home", null],
      ["away", null],
      ["zone", "Work"],
      ["unknown", null],
    ]
  );
  assert.equal(kinds[0].since, 1800);
});

test("distance from home only when away, from the person's coordinates", () => {
  const states = {
    ...HOME,
    "person.a": person("a", "home", { latitude: 48.1173, longitude: -1.6778 }),
    "person.b": person("b", "not_home", { latitude: 48.2154, longitude: -1.5622 }),
  };
  assert.equal(personInfo({ states }, { entity: "person.a" }, NOW).km, null);
  const km = personInfo({ states }, { entity: "person.b" }, NOW).km;
  assert.ok(km > 13 && km < 14, `got ${km}`);
  assert.equal(fmtDistance(km, false), `${Math.round(km)} km`);
  assert.equal(fmtDistance(0.42, false), "420 m");
  assert.equal(fmtDistance(16.09344, true), "10 mi");
  assert.equal(Math.round(haversine(0, 0, 0, 1)), 111);
});

test("name, picture and order from the configuration override the entity", () => {
  const states = { "person.a": person("a", "home", { entity_picture: "/api/a.png" }) };
  const p = personInfo({ states }, { entity: "person.a", name: "Me", picture: "/local/me.png" }, NOW);
  assert.equal(p.name, "Me");
  assert.equal(p.picture, "/local/me.png");
});

test("presence order: home, then zones, then away, keeping the configured order within a group", () => {
  const ps = [
    { id: "1", name: "Z", kind: "away" },
    { id: "2", name: "Y", kind: "home" },
    { id: "3", name: "X", kind: "zone" },
    { id: "4", name: "W", kind: "home" },
  ];
  assert.deepEqual([...sortPeople(ps, undefined).map((p) => p.id)], ["2", "4", "3", "1"]);
  assert.deepEqual([...sortPeople(ps, "name").map((p) => p.id)], ["4", "3", "2", "1"]);
  assert.deepEqual([...sortPeople(ps, "config").map((p) => p.id)], ["1", "2", "3", "4"]);
});

test("name sort accepts a non-string YAML name", () => {
  const states = { "person.a": person("a", "home"), "person.b": person("b", "home") };
  const a = personInfo({ states }, { entity: "person.a", name: 2024 }, NOW);
  const b = personInfo({ states }, { entity: "person.b" }, NOW);
  assert.equal(a.name, "2024");
  assert.deepEqual([...sortPeople([b, a], "name").map((p) => p.id)], ["person.a", "person.b"]);
  // Even when a raw number reaches the sort.
  assert.doesNotThrow(() => sortPeople([{ id: "x", name: 7 }, { id: "y", name: "Y" }], "name"));
});

test("photo URL for CSS url(): quotes, parentheses, backslashes and spaces are percent-encoded, not dropped", () => {
  assert.equal(cssUrl("/local/people/Jean Pierre.jpg"), "/local/people/Jean%20Pierre.jpg");
  assert.equal(cssUrl("/local/photo (2).jpg"), "/local/photo%20%282%29.jpg");
  assert.equal(cssUrl("/local/Zoé's.jpg"), "/local/Zoé%27s.jpg");
  assert.equal(cssUrl('a"b\\c\nd'), "a%22b%5Cc%0Ad");
  // Nothing left that could close the url('…') string once the browser decodes the attribute's entities.
  assert.doesNotMatch(cssUrl("x'); background:url(https://evil/"), /['"()\\\s]/);
});

test("durations", () => {
  assert.equal(fmtDuration(30, tr), "just now");
  assert.equal(fmtDuration(12 * 60, tr), "12 min");
  assert.equal(fmtDuration(3 * 3600 + 5 * 60, tr), "3 h 5 min");
  assert.equal(fmtDuration(2 * 86400 + 4 * 3600, tr), "2 d 4 h");
  assert.equal(fmtDuration(86400, tr), "1 d");
});

test("battery: sensor of the tracker's device first, else the tracker attribute", () => {
  const tracker = { entity_id: "device_tracker.p", state: "home", attributes: { battery_level: 50 } };
  const st = person("a", "home", { source: "device_tracker.p" });
  const states = { "device_tracker.p": tracker, "sensor.phone_battery_level": { state: "81" } };
  assert.deepEqual({ ...batteryOf({ states }, st) }, { value: 50, entity: "device_tracker.p" });
  const entities = {
    "device_tracker.p": { device_id: "dev1" },
    "sensor.phone_battery_level": { device_id: "dev1" },
    "sensor.phone_battery_state": { device_id: "dev1" },
  };
  assert.deepEqual({ ...batteryOf({ states, entities }, st) }, { value: 81, entity: "sensor.phone_battery_level" });
});

const render = (Cls, config, states) => {
  const el = new Cls();
  el._config = config;
  el._hass = { states, language: "en" };
  return el._render();
};

test("all person entities by default, summary in the header", () => {
  const states = { ...HOME, "person.a": person("a", "home"), "person.b": person("b", "not_home"), "light.x": { state: "on" } };
  const html = render(PresenceCard, {}, states);
  assert.match(html, /1 of 2 at home/);
  assert.match(html, /data-entity="person\.a"/);
  assert.match(html, /data-entity="person\.b"/);
  assert.match(render(PresenceCard, {}, { ...states, "person.b": person("b", "home") }), /Everyone is home/);
});

test("show_away: false hides people away, a missing person is reported", () => {
  const states = { "person.a": person("a", "home"), "person.b": person("b", "not_home") };
  assert.doesNotMatch(render(PresenceCard, { show_away: false }, states), /data-entity="person\.b"/);
  assert.match(render(PresenceCard, { entities: ["person.a", "person.zz"] }, states), /Person not found: person\.zz/);
  assert.match(render(PresenceCard, {}, {}), /No person found/);
});

test("a configured person that no longer exists is reported on its own line, the others stay shown", () => {
  const states = { ...HOME, "person.a": person("a", "home"), "person.b": person("b", "not_home") };
  const config = { entities: ["person.a", "person.zz", "person.b"] };
  const full = render(PresenceCard, config, states);
  assert.match(full, /data-entity="person\.a"/);
  assert.match(full, /data-entity="person\.b"/);
  assert.match(full, /class="header"/);
  assert.match(full, /1 of 2 at home/);
  assert.equal(full.match(/class="warning[ "]/g).length, 1);
  assert.match(full, /Person not found: person\.zz/);
  const mini = render(PresenceMiniCard, config, states);
  assert.equal(mini.match(/class="face /g).length, 2);
  assert.match(mini, /Person not found: person\.zz/);
  // Two missing: one line each; all missing: the warning alone, every missing one listed.
  const two = render(PresenceCard, { entities: ["person.a", "person.x", "person.y"] }, states);
  assert.match(two, /Person not found: person\.x[\s\S]*Person not found: person\.y/);
  const none = render(PresenceCard, { entities: ["person.x", "person.y"] }, states);
  assert.doesNotMatch(none, /class="header"/);
  assert.match(none, /Person not found: person\.x[\s\S]*Person not found: person\.y/);
  // show_away: false never hides the warning.
  assert.match(render(PresenceCard, { ...config, show_away: false }, states), /Person not found: person\.zz/);
});

test("mini card: one face per person, the zoom button switches to the full card", () => {
  const states = { "person.a": person("a", "home"), "person.b": person("b", "Work") };
  const el = new PresenceMiniCard();
  el._config = {};
  el._hass = { states, language: "en" };
  const mini = el._render();
  assert.equal(mini.match(/class="face /g).length, 2);
  assert.match(mini, /class="zoom"/);
  // One row like the alarm mini card: the summary in color under the title, no chip, the faces before
  // the zoom button, on the row when the card is wide enough for two faces.
  assert.match(mini, /class="st home"><span class="dot"><\/span>1 of 2 at home/);
  assert.doesNotMatch(mini, /class="chip/);
  assert.match(mini, /class="faces">[\s\S]*class="zoom"/);
  // Faces on the title row until the card is measured too narrow for them.
  assert.match(mini, /class="mini row"/);
  el._inline = false;
  assert.match(el._render(), /class="mini">/);
  el._inline = true;
  el._zoomed = true;
  assert.match(el._render(), /class="person /);
  el._config = { zoom: false };
  el._zoomed = false;
  assert.doesNotMatch(el._render(), /class="zoom"/);
});

test("editor keeps the YAML name/picture entity objects when the form re-emits plain ids", () => {
  const editor = new PresenceCardEditor();
  const events = [];
  editor.dispatchEvent = (ev) => events.push(ev);
  editor.setConfig({ entities: [{ entity: "person.a", name: "Me", picture: "/local/me.png" }, "person.b"] });
  editor.hass = { states: {}, language: "en" };
  // The entity selector works on plain ids: person.b removed, person.c added.
  editor._form.listeners["value-changed"]({
    stopPropagation() {},
    detail: { value: { entities: ["person.a", "person.c"], sort: "presence", show_since: true, show_distance: true, show_battery: true, show_away: true } },
  });
  // JSON comparison: the config objects were created in the card's realm, with its own Object prototype.
  assert.equal(
    JSON.stringify(events[0].detail.config),
    JSON.stringify({ entities: [{ entity: "person.a", name: "Me", picture: "/local/me.png" }, "person.c"] })
  );
});

test("editor: a state update alone does not rebuild the form's data and schema", () => {
  const editor = new PresenceCardEditor();
  editor.setConfig({ entities: ["person.a"] });
  editor.hass = { states: {}, language: "en" };
  const { data, schema } = editor._form;
  editor.hass = { states: { "person.a": {} }, language: "en" };
  assert.equal(editor._form.data, data);
  assert.equal(editor._form.schema, schema);
  editor.setConfig({ entities: ["person.a"], title: "T" });
  assert.notEqual(editor._form.data, data);
  assert.equal(editor._form.schema, schema);
  editor.hass = { states: {}, language: "fr" };
  assert.notEqual(editor._form.schema, schema);
  assert.equal(editor._form.schema[2].selector.select.options[0].label, STRINGS.fr.sort_presence);
});

const LANGS = ["fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

test("every supported language has a dictionary", () => {
  assert.deepEqual(Object.keys(STRINGS).sort(), ["en", ...LANGS].sort());
});

for (const l of LANGS) {
  test(`${l} strings cover exactly the English keys, same placeholders, no empty value`, () => {
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, v] of Object.entries(STRINGS.en)) {
      const ph = (x) => (x.match(/\{\w+\}/g) || []).sort();
      assert.deepEqual(ph(STRINGS[l][k]), ph(v), `${l}.${k} placeholders`);
      assert.ok(String(STRINGS[l][k]).trim(), `${l}.${k} is empty`);
    }
  });
}

test("language: full tag if translated, else the part before the dash, else English", () => {
  const of = (language) => lang({ language }, {});
  assert.equal(of("fr-FR"), "fr");
  assert.equal(of("de-CH"), "de");
  assert.equal(of("sr-Latn"), "sr-Latn");
  assert.equal(of("sr"), "sr");
  assert.equal(of("it-IT"), "it");
  assert.equal(of("nl-BE"), "nl");
  assert.equal(of("pt"), "pt");
  // Brazilian Portuguese falls back to European Portuguese, on purpose.
  assert.equal(of("pt-BR"), "pt");
  assert.equal(of("pl-PL"), "pl");
  assert.equal(of("ro-RO"), "ro");
  assert.equal(of("sv-SE"), "sv");
  assert.equal(of("uk-UA"), "uk");
  assert.equal(of("cs-CZ"), "cs");
  assert.equal(of("el-GR"), "el");
  assert.equal(of("ja"), "en");
  // Priority unchanged: the card's language, then the user's locale, then the server language.
  assert.equal(lang({ language: "fr", locale: { language: "sr-Latn" } }, {}), "sr-Latn");
  assert.equal(lang({ language: "fr", locale: { language: "sr-Latn" } }, { language: "de" }), "de");
});

// Same key paths as English, arrays of the same length, same placeholders.
const paths = (o, pre = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? [`${pre}${k}${Array.isArray(v) ? `[${v.length}]` : ""}`, ...paths(v, `${pre}${k}.`)] : [`${pre}${k}`]
  );
for (const l of LANGS) {
  test(`${l} strings cover exactly the English key paths`, () => {
    assert.deepEqual(paths(STRINGS[l]).sort(), paths(STRINGS.en).sort());
  });
}

test("Serbian scripts: no Latin letters in sr, units included, no Cyrillic in sr-Latn (placeholders aside)", () => {
  for (const [k, v] of Object.entries(STRINGS.sr)) assert.doesNotMatch(v.replace(/\{\w+\}/g, ""), /[A-Za-z]/, `sr.${k}`);
  for (const [k, v] of Object.entries(STRINGS["sr-Latn"])) assert.doesNotMatch(v, /[\u0400-\u04FF]/, `sr-Latn.${k}`);
});

test("editor offers Serbian in Cyrillic and Latin script", () => {
  const editor = new PresenceCardEditor();
  editor.setConfig({});
  editor.hass = { states: {}, language: "sr-Latn" };
  const options = editor._form.schema.find((s) => s.name === "language").selector.select.options;
  const serbian = options.filter((o) => o.value.startsWith("sr")).map((o) => `${o.value}=${o.label}`);
  assert.equal(serbian.join(", "), "sr=Српски, sr-Latn=Srpski (latinica)");
  assert.equal(editor._form.schema[2].selector.select.options[0].label, STRINGS["sr-Latn"].sort_presence);
});

test("editor offers every language, after Serbian, with its native name", () => {
  const editor = new PresenceCardEditor();
  editor.setConfig({});
  editor.hass = { states: {}, language: "pl" };
  const options = editor._form.schema.find((s) => s.name === "language").selector.select.options;
  assert.equal(options.map((o) => o.value).join(","), ",en,fr,de,es,sr,sr-Latn,it,nl,pt,pl,ro,da,sv,bg,ru,uk,hu,sk,cs,sl,lv,el");
  assert.equal(
    options.slice(7, 11).map((o) => o.label).join(", "),
    "Italiano, Nederlands, Português (Portugal), Polski"
  );
  assert.equal(
    options.slice(-12).map((o) => o.label).join(", "),
    "Română, Dansk, Svenska, Български, Русский, Українська, Magyar, Slovenčina, Čeština, Slovenščina, Latviešu, Ελληνικά"
  );
  assert.equal(options[0].label, STRINGS.pl.lang_auto);
  for (const o of options.slice(1)) assert.ok(STRINGS[o.value], `no dictionary for ${o.value}`);
});


test("movements: arrivals, departures and zones from the logbook, newest first", () => {
  const t0 = Date.parse("2026-10-25T07:00:00Z") / 1000;
  const events = [
    { entity_id: "person.a", state: "home", when: t0 },
    { entity_id: "person.a", state: "not_home", when: t0 + 600 },
    { entity_id: "person.a", state: "Work", when: t0 + 1800 },
    { entity_id: "person.a", state: "unavailable", when: t0 + 2000 },
    { entity_id: "person.a", state: "not_home", when: t0 + 30000 },
    { entity_id: "person.b", state: "home", when: t0 + 31000 },
    { entity_id: "person.b", state: "home", when: t0 + 32000 },
    { entity_id: "light.x", state: "on", when: t0 + 33000 },
  ];
  const moves = movesFrom(events, { "person.a": "A", "person.b": "B" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(moves.map((m) => [m.name, m.kind, m.zone]))),
    [
      ["B", "moved_home", ""],
      ["A", "left_zone", "Work"],
      ["A", "moved_zone", "Work"],
      ["A", "moved_away", ""],
      ["A", "moved_home", ""],
    ]
  );
  assert.equal(moves[0].when, (t0 + 31000) * 1000);
});

test("movements: the state at the start of the window is read against, not shown", () => {
  const start = Date.parse("2026-10-25T07:00:00Z");
  const t0 = start / 1000;
  const events = [
    // At Work when the window opened, then away: left Work, not left home.
    { entity_id: "person.a", state: "Work", when: t0 },
    { entity_id: "person.a", state: "not_home", when: t0 + 600 },
    // Home all along: no movement.
    { entity_id: "person.b", state: "home", when: t0 - 3600 },
  ];
  const moves = movesFrom(events, { "person.a": "A", "person.b": "B" }, start);
  assert.deepEqual(
    JSON.parse(JSON.stringify(moves.map((m) => [m.name, m.kind, m.zone]))),
    [["A", "left_zone", "Work"]]
  );
});

test("movements section: folded by default, read from the history once unfolded", async () => {
  const states = { ...HOME, "person.a": person("a", "home") };
  const el = new PresenceCard();
  el._config = {};
  const calls = [];
  el._hass = {
    states,
    language: "en",
    callWS: async (msg) => {
      calls.push(msg);
      // Compressed history: the start-time state (stamped with the start), then the changes.
      const start = Date.parse(msg.start_time) / 1000;
      return {
        "person.a": [
          { s: "Work", lu: start },
          { s: "not_home", lu: Date.now() / 1000 - 600 },
          { s: "home", lu: Date.now() / 1000 - 60 },
        ],
      };
    },
  };
  el._update = () => {};
  let html = el._render();
  assert.match(html, /class="moves-toggle" aria-expanded="false"/);
  assert.doesNotMatch(html, /class="mlist"/);
  assert.equal(calls.length, 0);
  el._movesOpen = true;
  el._render();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "history/history_during_period");
  assert.deepEqual([...calls[0].entity_ids], ["person.a"]);
  assert.equal(calls[0].include_start_time_state, true);
  assert.equal(calls[0].no_attributes, true);
  await new Promise((r) => setTimeout(r, 0));
  html = el._render();
  assert.match(html, /class="move moved_home"/);
  assert.match(html, /A arrived home/);
  assert.match(html, /A left Work/);
  assert.doesNotMatch(html, /A left home/);
  assert.doesNotMatch(html, /A arrived at Work/);
  // Unchanged people: the history is not read again.
  assert.equal(calls.length, 1);
  assert.doesNotMatch(render(PresenceCard, { show_moves: false }, states), /class="moves-toggle"/);
});

// Proximity sensors as the core integration creates them: one pair per tracked person and proximity entry.
const prox = (id, state, attributes = {}) => ({ entity_id: id, state, attributes });

test("proximity: sensors found in the entity registry by platform and translation key, whatever their language", () => {
  const states = {
    ...HOME,
    "person.alex": person("alex", "not_home", { friendly_name: "Alex", latitude: 48.2154, longitude: -1.5622 }),
    "person.jean": person("jean", "not_home", { friendly_name: "Jean-Pierre" }),
    "sensor.maison_alex_direction_de_deplacement": prox("sensor.maison_alex_direction_de_deplacement", "towards"),
    "sensor.maison_alex_distance": prox("sensor.maison_alex_distance", "2.5", { unit_of_measurement: "km" }),
    "sensor.maison_jean_pierre_direction_de_deplacement": prox("sensor.maison_jean_pierre_direction_de_deplacement", "away_from"),
    "sensor.maison_plus_proche_direction": prox("sensor.maison_plus_proche_direction", "towards"),
  };
  const entities = {
    "sensor.maison_alex_direction_de_deplacement": { platform: "proximity", translation_key: "dir_of_travel", device_id: "p1" },
    "sensor.maison_alex_distance": { platform: "proximity", translation_key: "dist_to_zone", device_id: "p1" },
    "sensor.maison_jean_pierre_direction_de_deplacement": { platform: "proximity", translation_key: "dir_of_travel", device_id: "p1" },
    // The "nearest" sensors of the entry are not a person's.
    "sensor.maison_plus_proche_direction": { platform: "proximity", translation_key: "nearest_dir_of_travel", device_id: "p1" },
  };
  const hass = { states, entities };
  assert.deepEqual(
    { ...proximityOf(hass, { entity: "person.alex" }) },
    { direction: "sensor.maison_alex_direction_de_deplacement", distance: "sensor.maison_alex_distance" }
  );
  // Matched by the person's name when its id differs.
  assert.equal(proximityOf(hass, { entity: "person.jean" }).direction, "sensor.maison_jean_pierre_direction_de_deplacement");
  const p = personInfo(hass, { entity: "person.alex" }, NOW);
  assert.equal(p.direction, "towards");
  // The Proximity distance comes before the one computed from the coordinates.
  assert.equal(p.km, 2.5);
  // At home: neither direction nor distance.
  const home = personInfo({ ...hass, states: { ...states, "person.alex": person("alex", "home") } }, { entity: "person.alex" }, NOW);
  assert.equal(home.direction, null);
  assert.equal(home.km, null);
});

test("proximity: without registry, the English entity ids; a proximity named after a person keeps each one's sensors", () => {
  const states = {
    "person.alex": person("alex", "not_home"),
    "person.sam": person("sam", "Work"),
    "sensor.alex_alex_direction_of_travel": prox("sensor.alex_alex_direction_of_travel", "stationary"),
    "sensor.alex_alex_distance": prox("sensor.alex_alex_distance", "1200", { unit_of_measurement: "m" }),
    "sensor.alex_sam_direction_of_travel": prox("sensor.alex_sam_direction_of_travel", "away_from"),
    "sensor.alex_sam_distance": prox("sensor.alex_sam_distance", "3", { unit_of_measurement: "mi" }),
    // A distance sensor of another integration is not a Proximity one.
    "sensor.car_alex_distance": prox("sensor.car_alex_distance", "99"),
  };
  assert.deepEqual(
    { ...proximityOf({ states }, { entity: "person.alex" }) },
    { direction: "sensor.alex_alex_direction_of_travel", distance: "sensor.alex_alex_distance" }
  );
  assert.deepEqual(
    { ...proximityOf({ states }, { entity: "person.sam" }) },
    { direction: "sensor.alex_sam_direction_of_travel", distance: "sensor.alex_sam_distance" }
  );
  assert.equal(personInfo({ states }, { entity: "person.alex" }, NOW).km, 1.2);
  const sam = personInfo({ states }, { entity: "person.sam" }, NOW);
  assert.equal(sam.direction, "away_from");
  assert.ok(Math.abs(sam.km - 4.828032) < 1e-9);
  // No sensor for that person.
  assert.equal(proximityOf({ states }, { entity: "person.robin" }), null);
});

test("proximity: sensors set in the configuration, unknown states ignored, distances converted to km", () => {
  const states = {
    ...HOME,
    "person.a": person("a", "not_home", { latitude: 48.2154, longitude: -1.5622 }),
    "sensor.my_dir": prox("sensor.my_dir", "arrived"),
    "sensor.my_dist": prox("sensor.my_dist", "unknown", { unit_of_measurement: "m" }),
  };
  const item = { entity: "person.a", proximity_direction: "sensor.my_dir", proximity_distance: "sensor.my_dist" };
  assert.deepEqual({ ...proximityOf({ states }, item) }, { direction: "sensor.my_dir", distance: "sensor.my_dist" });
  const p = personInfo({ states }, item, NOW);
  // "arrived" and "unknown" show nothing; an unknown distance falls back to the coordinates.
  assert.equal(p.direction, null);
  assert.ok(p.km > 13 && p.km < 14);
  assert.equal(distanceKm(prox("x", "500", { unit_of_measurement: "m" })), 0.5);
  assert.equal(distanceKm(prox("x", "500")), 0.5);
  assert.equal(distanceKm(prox("x", "1", { unit_of_measurement: "parsec" })), null);
});

test("proximity: direction icon and label in the row and the mini card's face, show_direction: false hides it", () => {
  const states = {
    ...HOME,
    "person.alex": person("alex", "not_home"),
    "sensor.home_alex_direction_of_travel": prox("sensor.home_alex_direction_of_travel", "towards"),
    "sensor.home_alex_distance": prox("sensor.home_alex_distance", "3400", { unit_of_measurement: "m" }),
  };
  const html = render(PresenceCard, {}, states);
  assert.match(html, /class="dir towards" title="Arriving · from home"><svg class="icon" viewBox="0 0 24 24" role="img" aria-label="Arriving">/);
  assert.match(html, /3\.4 km<\/span>/);
  // Distance hidden: the direction keeps its label.
  assert.match(render(PresenceCard, { show_distance: false }, states), /class="dir towards" title="Arriving">[\s\S]*?<\/svg>Arriving<\/span>/);
  const off = render(PresenceCard, { show_direction: false }, states);
  assert.doesNotMatch(off, /class="dir /);
  assert.match(off, /class="dist" title="from home">/);
  assert.match(render(PresenceMiniCard, {}, states), /title="Alex · Away · Arriving"/);
  assert.match(render(PresenceMiniCard, { show_direction: false }, states), /title="Alex · Away"/);
  // Every direction is translated in every language.
  for (const l of Object.keys(STRINGS)) for (const d of ["towards", "away_from", "stationary"]) assert.ok(STRINGS[l][`dir_${d}`], `${l}.dir_${d}`);
});

test("proximity: a change of direction re-renders the card", () => {
  const states = {
    "person.alex": person("alex", "not_home"),
    "sensor.home_alex_direction_of_travel": prox("sensor.home_alex_direction_of_travel", "towards"),
  };
  const el = new PresenceCard();
  el._config = { show_since: false };
  el._hass = { states, language: "en" };
  const before = el._signature();
  el._hass = { states: { ...states, "sensor.home_alex_direction_of_travel": prox("sensor.home_alex_direction_of_travel", "away_from") }, language: "en" };
  assert.notDeepEqual(el._signature(), before);
});

test("unknown / unavailable person: no distance from the last GPS fix", () => {
  const gps = { latitude: 48.2154, longitude: -1.5622 };
  const states = { ...HOME, "person.a": person("a", "unknown", gps), "person.b": person("b", "unavailable", gps) };
  assert.equal(personInfo({ states }, { entity: "person.a" }, NOW).km, null);
  assert.equal(personInfo({ states }, { entity: "person.b" }, NOW).km, null);
});

test("header logo: aria-label in the card's language", () => {
  const states = { ...HOME, "person.a": person("a", "home") };
  for (const Card of [PresenceCard, PresenceMiniCard]) {
    const html = render(Card, { language: "fr" }, states);
    assert.match(html, new RegExp(`role="img" aria-label="${STRINGS.fr.title}"`));
    assert.doesNotMatch(render(Card, { language: "de" }, states), /aria-label="Presence"/);
  }
});

// A card with the movements unfolded and already read, rendered without the history being read again.
const movesCard = (config, hass, moves) => {
  const el = new PresenceCard();
  el._config = config;
  el._hass = { states: { ...HOME, "person.a": person("a", "home") }, ...hass };
  el._update = () => {};
  el._movesOpen = true;
  el._loadMoves = () => {};
  el._moves = moves;
  return el._render();
};

test("movements: entries older than 24 hours are dropped at render", () => {
  const html = movesCard({}, { language: "en" }, [
    { id: "person.a", name: "A", kind: "moved_home", zone: "", when: Date.now() - 3600000 },
    { id: "person.a", name: "A", kind: "moved_away", zone: "", when: Date.now() - 25 * 3600000 },
  ]);
  assert.match(html, /A arrived home/);
  assert.doesNotMatch(html, /A left home/);
});

test("movements: read again each hour, not only when someone moves", () => {
  const el = new PresenceCard();
  el._config = {};
  let calls = 0;
  el._hass = { states: { ...HOME, "person.a": person("a", "home") }, language: "en", callWS: async () => {
      calls++;
      return {};
    },
  };
  const people = [{ id: "person.a", name: "A" }];
  const realNow = Date.now;
  try {
    Date.now = () => NOW;
    el._loadMoves(people);
    el._loadMoves(people);
    assert.equal(calls, 1);
    Date.now = () => NOW + 3600000;
    el._loadMoves(people);
    assert.equal(calls, 2);
  } finally {
    Date.now = realNow;
  }
});

test("movements: times follow the profile's time format and the card's language", () => {
  const when = Date.now() - 60000;
  const m = [{ id: "person.a", name: "A", kind: "moved_home", zone: "", when }];
  const time = (locale, hour12) => new Date(when).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12 });
  // (Ends with: a weekday comes first just after midnight.)
  const mtime = (html) => html.match(/class="mtime">([^<]*)</)[1];
  assert.ok(mtime(movesCard({}, { language: "en", locale: { language: "en", time_format: "24" } }, m)).endsWith(time("en", false)));
  assert.ok(mtime(movesCard({}, { language: "fr", locale: { language: "fr", time_format: "12" } }, m)).endsWith(time("fr", true)));
  // The card's language wins over Home Assistant's.
  assert.ok(mtime(movesCard({ language: "de" }, { language: "en", locale: { language: "en", time_format: "language" } }, m)).endsWith(new Date(when).toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" })));
});

test("distances in the locale's number format", () => {
  const nf = (locale, unit, digits, v) =>
    new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits }).format(v);
  assert.equal(fmtDistance(2.54, false, "fr"), nf("fr", "kilometer", 1, 2.54));
  assert.match(fmtDistance(2.54, false, "fr"), /^2,5\s?km$/);
  assert.equal(fmtDistance(2.54, false, "en"), "2.5 km");
  assert.equal(fmtDistance(12345.6, false, "de"), nf("de", "kilometer", 0, 12345.6));
  assert.match(fmtDistance(12345.6, false, "de"), /^12\.346\s?km$/);
  assert.equal(fmtDistance(0.42, false, "fr"), nf("fr", "meter", 0, 420));
  assert.equal(fmtDistance(3, true, "en"), "1.9 mi");
  // The row follows the card's language.
  const states = { ...HOME, "person.b": person("b", "not_home", { latitude: 48.1273, longitude: -1.6778 }) };
  const html = render(PresenceCard, { entities: ["person.b"], language: "fr" }, states);
  assert.ok(html.includes(nf("fr", "kilometer", 1, personInfo({ states }, { entity: "person.b" }, NOW).km)));
});

test("Intl locale: Home Assistant's region kept, a bare pt is European Portuguese", () => {
  assert.equal(intlLang({ locale: { language: "pt" } }, {}), "pt-PT");
  assert.equal(intlLang({ locale: { language: "en" } }, { language: "pt" }), "pt-PT");
  assert.equal(intlLang({ locale: { language: "pt-BR" } }, {}), "pt-BR");
  assert.equal(intlLang({ locale: { language: "fr-CA" } }, {}), "fr-CA");
  assert.equal(intlLang({ locale: { language: "fr-CA" } }, { language: "de" }), "de");
  assert.equal(intlLang({ locale: { language: "sr-Latn" } }, {}), "sr-Latn");
  // A language the card does not translate keeps its own formats (texts in English).
  assert.equal(intlLang({ locale: { language: "ja" } }, {}), "ja");
  assert.equal(intlLang({ locale: { language: "zh-Hant" } }, {}), "zh-Hant");
  assert.equal(intlLang({ language: "fi" }, {}), "fi");
  assert.equal(intlLang({ locale: { language: "ja" } }, { language: "de" }), "de");
  assert.equal(intlLang({}, {}), "en");
});

test("proximity: a registry without Proximity sensors is not searched again in the states at each update", () => {
  let scans = 0;
  const counted = (states) =>
    new Proxy(states, {
      ownKeys(t) {
        scans++;
        return Reflect.ownKeys(t);
      },
    });
  const entities = { "sensor.phone_battery": { platform: "mobile_app", device_id: "d1" } };
  const states = { "person.alex": person("alex", "not_home") };
  assert.deepEqual([...proximitySensors({ entities, states: counted(states) })], []);
  assert.deepEqual([...proximitySensors({ entities, states: counted({ ...states }) })], []);
  assert.equal(scans, 0);
  // Without registry, the states are read (and again when they change).
  proximitySensors({ states: counted(states) });
  proximitySensors({ states: counted({ ...states }) });
  assert.equal(scans, 2);
});

test("travel time home from the person's travel_time sensor, only while away", () => {
  const states = {
    ...HOME,
    "person.a": person("a", "not_home"),
    "person.b": person("b", "home"),
    "sensor.a_to_home": { entity_id: "sensor.a_to_home", state: "0.4", attributes: { unit_of_measurement: "h" } },
  };
  assert.equal(personInfo({ states }, { entity: "person.a", travel_time: "sensor.a_to_home" }, NOW).travel, 24);
  assert.equal(personInfo({ states }, { entity: "person.b", travel_time: "sensor.a_to_home" }, NOW).travel, null);
  assert.equal(personInfo({ states }, { entity: "person.a" }, NOW).travel, null);

  const el = new PresenceCard();
  el._config = {};
  el._hass = { states, language: "en" };
  const p = personInfo({ states }, { entity: "person.a", travel_time: "sensor.a_to_home" }, NOW);
  assert.match(el._row(p), /<span class="eta" title="Travel time home">.*24 min<\/span>/);
  el._config = { show_travel: false };
  assert.doesNotMatch(el._row(p), /class="eta"/);
});

test("folding: a tap elsewhere (pointer) folds the movements and collapses the mini card, not a press in the card released outside; leaving the page folds back too", () => {
  const outside = { composedPath: () => [{ tagName: "DIV" }] };
  const el = new PresenceCard();
  el._config = {};
  el._hass = { states: { ...HOME, "person.a": person("a", "home") }, language: "en" };
  el._update = () => {};
  el.connectedCallback();
  el._movesOpen = true;
  // Pressed in the card and released outside: the movements stay unfolded.
  el._foldMovesWatch.tap({ composedPath: () => [el] });
  assert.equal(el._movesOpen, true);
  // A tap on a spot that sends no click (iOS): the pointer alone folds them.
  el._foldMovesWatch.tap(outside);
  assert.equal(el._movesOpen, false);
  // Left unfolded and back on the page: folded.
  el._movesOpen = true;
  el.disconnectedCallback();
  el.connectedCallback();
  assert.equal(el._movesOpen, false);
  el.disconnectedCallback();
  // The mini card comes back compact.
  const mini = new PresenceMiniCard();
  mini._config = {};
  mini._hass = el._hass;
  mini._update = () => {};
  mini.connectedCallback();
  mini._zoomed = true;
  mini._onOutsideWatch.tap(outside);
  assert.equal(mini._zoomed, false);
  mini._zoomed = true;
  mini.disconnectedCallback();
  mini.connectedCallback();
  assert.equal(mini._zoomed, false);
  mini.disconnectedCallback();
});
