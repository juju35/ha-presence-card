// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
import { haversine } from "./helpers.js";

// `entities` items: "person.x" or { entity: "person.x", name: "…", picture: "…", travel_time: "sensor.…" }.
export const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((e) => (typeof e === "string" ? { entity: e } : e))
    .filter((e) => e?.entity);

// People found automatically, cached on the states object (replaced by Home Assistant on every state
// change): `_signature()` and `_render()` both walk the list on every `set hass`, compute it once.
export let _people = { states: null, ids: [] };
export const listPeople = (hass) => {
  if (_people.states !== hass.states) {
    const ids = Object.keys(hass.states)
      .filter((id) => id.startsWith("person."))
      .sort((a, b) =>
        String(hass.states[a].attributes?.friendly_name || a).localeCompare(String(hass.states[b].attributes?.friendly_name || b))
      );
    _people = { states: hass.states, ids };
  }
  return _people.ids;
};

// Battery sensors by device id, cached on the entity registry object (replaced only when it changes).
export let _batteries = { entities: null, byDevice: new Map() };
export const RE_BATTERY = /^sensor\..*battery(?:_level)?(?:_\d+)?$/;
export const batteriesByDevice = (hass) => {
  if (_batteries.entities !== hass.entities) {
    const byDevice = new Map();
    for (const [id, e] of Object.entries(hass.entities || {})) {
      if (!e?.device_id || !RE_BATTERY.test(id) || byDevice.has(e.device_id)) continue;
      byDevice.set(e.device_id, id);
    }
    _batteries = { entities: hass.entities, byDevice };
  }
  return _batteries.byDevice;
};

// Device trackers of a person: the one in use first (`source`), then the others.
export const trackersOf = (st) => [...new Set([st.attributes?.source, ...(st.attributes?.device_trackers || [])].filter(Boolean))];

// Phone battery: the battery sensor of the tracker's device, or the tracker's own battery attribute.
export const batteryOf = (hass, st) => {
  for (const tr of trackersOf(st)) {
    const dev = hass.entities?.[tr]?.device_id;
    const id = dev && batteriesByDevice(hass).get(dev);
    const v = id ? parseFloat(hass.states[id]?.state) : NaN;
    if (Number.isFinite(v)) return { value: v, entity: id };
    const a = hass.states[tr]?.attributes;
    const attr = parseFloat(a?.battery_level ?? a?.battery);
    if (Number.isFinite(attr)) return { value: attr, entity: tr };
  }
  return null;
};

// Proximity integration (core): for each tracked person, a direction of travel sensor and a distance sensor,
// named "<proximity> <person> Direction of travel" / "… Distance" (sensor.home_alex_direction_of_travel in
// English, translated in other languages). Found in the entity registry by platform and translation key, a
// pair per proximity entry (its device); without registry, by the English entity ids.
export const DIRECTIONS = ["towards", "away_from", "stationary"];
export const PROX_KEYS = { dir_of_travel: "direction", dist_to_zone: "distance" };
export const RE_PROX = /^sensor\.(.+)_(direction_of_travel|distance)$/;
export let _prox = { entities: null, states: null, list: [] };
export const proximitySensors = (hass) => {
  if (_prox.entities === hass.entities && (_prox.registry || _prox.states === hass.states)) return _prox.list;
  let list = Object.entries(hass.entities || {})
    .filter(([, e]) => e?.platform === "proximity" && PROX_KEYS[e.translation_key])
    .map(([id, e]) => ({ id, key: PROX_KEYS[e.translation_key], group: e.device_id || "" }));
  // A registry without Proximity sensors has none to find in the states either: its empty result is kept
  // until the registry changes, instead of scanning the states at each update.
  const registry = list.length > 0 || Object.keys(hass.entities || {}).length > 0;
  if (!registry)
    list = Object.keys(hass.states).flatMap((id) => {
      const m = RE_PROX.exec(id);
      // Only a distance sensor next to a direction of travel sensor: any other "_distance" sensor is not one.
      if (!m || (m[2] === "distance" && !hass.states[`sensor.${m[1]}_direction_of_travel`])) return [];
      return [{ id, key: m[2] === "distance" ? "distance" : "direction", group: m[1] }];
    });
  _prox = { entities: hass.entities, states: hass.states, registry, list };
  return list;
};

// Entity id form of a name, as Home Assistant builds it ("Jean-Pierre" → "jean_pierre").
export const slugify = (v) =>
  String(v ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// The Proximity sensors of a person: { direction, distance } entity ids, set in the configuration
// (`proximity_direction`, `proximity_distance`) or found by the person's id or name in the sensors' ids.
export const proximityOf = (hass, item) => {
  if (item.proximity_direction || item.proximity_distance)
    return { direction: item.proximity_direction || null, distance: item.proximity_distance || null };
  const names = [item.entity.split(".")[1], slugify(hass.states[item.entity]?.attributes?.friendly_name)].filter(Boolean);
  // The person's part comes after the proximity's name: of two sensors matching in one entry (a proximity
  // named after a person), the one with the name furthest in its id.
  const groups = new Map();
  for (const s of proximitySensors(hass)) {
    const id = `_${s.id.slice(7)}_`;
    const at = Math.max(...names.map((n) => id.lastIndexOf(`_${n}_`)));
    if (at < 0) continue;
    const g = groups.get(s.group) ?? { direction: null, distance: null, at: {} };
    if (!(g.at[s.key] >= at)) {
      g[s.key] = s.id;
      g.at[s.key] = at;
    }
    groups.set(s.group, g);
  }
  const found = [...groups.values()].find((g) => g.direction) ?? [...groups.values()][0];
  return found ? { direction: found.direction, distance: found.distance } : null;
};

// A distance sensor's value in km, from its unit (meters by default, or the unit chosen for it).
export const TO_KM = { mm: 1e-6, cm: 1e-5, m: 1e-3, km: 1, in: 2.54e-5, ft: 3.048e-4, yd: 9.144e-4, mi: 1.609344 };
export const distanceKm = (st) => {
  const v = parseFloat(st?.state);
  const k = TO_KM[st?.attributes?.unit_of_measurement ?? "m"];
  return Number.isFinite(v) && k ? Math.max(0, v * k) : null;
};

export const ORDER = { home: 0, zone: 1, away: 2, unknown: 3 };

/** What the card shows for one person. */
export const personInfo = (hass, item, now = Date.now()) => {
  const st = hass.states[item.entity];
  if (!st) return null;
  const state = String(st.state);
  const kind =
    state === "home" ? "home" : state === "not_home" ? "away" : /^(unknown|unavailable)$/.test(state) ? "unknown" : "zone";
  const a = st.attributes || {};
  const homeZone = hass.states["zone.home"]?.attributes;
  let km = null;
  // Unknown / unavailable: the last GPS fix and the Proximity sensors are stale, no distance or direction.
  const located = kind === "away" || kind === "zone";
  if (located && Number.isFinite(a.latitude) && Number.isFinite(a.longitude) && homeZone) {
    km = haversine(a.latitude, a.longitude, homeZone.latitude, homeZone.longitude);
  }
  // Proximity sensors, when the person has some: their direction of travel, and their distance first.
  const prox = located ? proximityOf(hass, item) : null;
  const dir = prox?.direction ? hass.states[prox.direction]?.state : null;
  const proxKm = prox?.distance ? distanceKm(hass.states[prox.distance]) : null;
  if (proxKm !== null) km = proxKm;
  const changed = Date.parse(st.last_changed);
  return {
    id: item.entity,
    name: String(item.name || a.friendly_name || item.entity.split(".")[1]),
    picture: item.picture || a.entity_picture || null,
    kind,
    zone: kind === "zone" ? state : null,
    since: Number.isFinite(changed) ? Math.max(0, Math.floor((now - changed) / 1000)) : null,
    km,
    direction: DIRECTIONS.includes(dir) ? dir : null,
    battery: batteryOf(hass, st),
    travel: located ? travelMinutes(hass.states[item.travel_time]) : null,
  };
};

// Travel time home, in minutes, from a travel time sensor (Waze, Google Maps…: `travel_time` of a person), whatever
// its unit; null when unknown.
export const TRAVEL_FACTORS = { s: 1 / 60, min: 1, h: 60, d: 1440 };
export const travelMinutes = (st) => {
  const v = st ? Number.parseFloat(st.state) : Number.NaN;
  if (!Number.isFinite(v) || v < 0) return null;
  return Math.round(v * (TRAVEL_FACTORS[st.attributes?.unit_of_measurement] ?? 1));
};

// Movements of the people from their state changes (any order): arrivals at home or in a zone, departures. A
// person going from a zone straight to "away" left that zone; unknown / unavailable states are skipped.
// Events at or before `start` (the state each person was in when the window opened) are not movements
// themselves, only what the first movement is read against: leaving Work early in the window is "left Work".
export const MOVES_MAX = 8;
export const MOVES_HOURS = 24;
export const movesFrom = (events, names, start = Number.NEGATIVE_INFINITY) => {
  const prev = {};
  const out = [];
  const whenOf = (ev) => (typeof ev?.when === "number" ? ev.when * 1000 : Date.parse(ev?.when));
  // Oldest first, whatever order the events came in: each movement is read against the state before it.
  const sorted = [...(events || [])].sort((a, b) => whenOf(a) - whenOf(b));
  for (const ev of sorted) {
    const id = ev?.entity_id;
    const state = ev?.state;
    if (!id || !(id in names) || !state || state === "unknown" || state === "unavailable") continue;
    const when = whenOf(ev);
    if (!Number.isFinite(when)) continue;
    const before = prev[id];
    prev[id] = state;
    if (before === state || when <= start) continue;
    let kind;
    let zone = "";
    if (state === "home") kind = "moved_home";
    else if (state === "not_home") {
      if (before && before !== "home") {
        kind = "left_zone";
        zone = before;
      } else kind = "moved_away";
    } else {
      kind = "moved_zone";
      zone = state;
    }
    out.push({ id, name: names[id], kind, zone, when });
  }
  return out.reverse().slice(0, MOVES_MAX);
};

// The answer of history/history_during_period (compressed: {entity: [{s, lu, lc?}]}, times in seconds) as
// the events movesFrom reads.
export const historyEvents = (history) =>
  Object.entries(history || {}).flatMap(([entity_id, rows]) =>
    (Array.isArray(rows) ? rows : []).map((r) => ({ entity_id, state: r?.s, when: r?.lc ?? r?.lu }))
  );

export const sortPeople = (people, sort) => {
  const pos = new Map(people.map((p, i) => [p.id, i]));
  if (sort === "config") return people;
  if (sort === "name") return [...people].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return [...people].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || pos.get(a.id) - pos.get(b.id));
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
export const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

export const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};
