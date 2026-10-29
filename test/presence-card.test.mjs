import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { personInfo, sortPeople, fmtDuration, fmtDistance, haversine, batteryOf, cssUrl, PresenceCard, PresenceMiniCard, PresenceCardEditor, STRINGS } =
  load("presence-card.js", [
    "personInfo",
    "sortPeople",
    "fmtDuration",
    "fmtDistance",
    "haversine",
    "batteryOf",
    "cssUrl",
    "PresenceCard",
    "PresenceMiniCard",
    "PresenceCardEditor",
    "STRINGS",
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

for (const l of ["fr", "de", "es"]) {
  test(`${l} strings cover exactly the English keys`, () => {
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, v] of Object.entries(STRINGS.en)) {
      const ph = (x) => (x.match(/\{\w+\}/g) || []).sort();
      assert.deepEqual(ph(STRINGS[l][k]), ph(v), `${l}.${k} placeholders`);
    }
  });
}
