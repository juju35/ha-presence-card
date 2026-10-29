/*
 * Presence Card for Home Assistant
 * https://github.com/juju35/ha-presence-card
 *
 * Lovelace cards showing the people of the house (person entities) and where they are:
 * at home, in a zone or away, since when, how far from home and their phone battery.
 */

const VERSION = "__VERSION__";

const ICONS = {
  // mdi:home, mdi:map-marker, mdi:walk, mdi:help, mdi:clock-outline, mdi:map-marker-distance
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  zone: "M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z",
  away: "M14.12,10H19V8.2H15.38L13.38,4.87C13.08,4.37 12.54,4.03 11.92,4.03C11.74,4.03 11.58,4.06 11.42,4.11L6,5.8V11H7.8V7.33L9.91,6.67L6,22H7.8L10.67,13.89L13,17V22H14.8V15.59L12.31,11.05L13.04,8.18M14,3.8C15,3.8 15.8,3 15.8,2C15.8,1 15,0.2 14,0.2C13,0.2 12.2,1 12.2,2C12.2,3 13,3.8 14,3.8Z",
  unknown:
    "M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  distance:
    "M6.5,8.11C5.61,8.11 4.89,7.39 4.89,6.5A1.61,1.61 0 0,1 6.5,4.89C7.39,4.89 8.11,5.61 8.11,6.5V6.5A1.61,1.61 0 0,1 6.5,8.11M6.5,2C4,2 2,4 2,6.5C2,9.87 6.5,14.86 6.5,14.86C6.5,14.86 11,9.87 11,6.5C11,4 9,2 6.5,2M17.5,8.11A1.61,1.61 0 0,1 15.89,6.5C15.89,5.61 16.61,4.89 17.5,4.89C18.39,4.89 19.11,5.61 19.11,6.5A1.61,1.61 0 0,1 17.5,8.11M17.5,2C15,2 13,4 13,6.5C13,9.87 17.5,14.86 17.5,14.86C17.5,14.86 22,9.87 22,6.5C22,4 20,2 17.5,2M17.5,16C16.23,16 15.1,16.8 14.68,18H9.32C8.77,16.44 7.05,15.62 5.5,16.17C3.93,16.72 3.11,18.44 3.66,20C4.22,21.56 5.93,22.38 7.5,21.83C8.35,21.53 9,20.85 9.32,20H14.69C15.24,21.56 16.96,22.38 18.5,21.83C20.08,21.27 20.9,19.56 20.35,18C19.92,16.8 18.78,16 17.5,16V16Z",
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's zoom button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

const STRINGS = {
  en: {
    title: "Presence",
    home: "Home",
    away: "Away",
    unknown: "Unknown",
    at_home: "{n} of {total} at home",
    all_home: "Everyone is home",
    nobody_home: "Nobody home",
    for: "for",
    just_now: "just now",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Battery",
    from_home: "from home",
    no_person: "No person found. Add people in Settings → People.",
    unknown_person: "Person not found",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    entities: "People (all by default)",
    title_option: "Title (optional)",
    sort: "Order",
    sort_presence: "At home first",
    sort_name: "By name",
    sort_config: "As listed",
    show_since: "Show since when",
    show_distance: "Show distance from home",
    show_battery: "Show phone battery",
    show_away: "Show people away",
    zoom: "Zoom button",
    zoom_helper: "Switches the mini card to the full card and back",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    title: "Présence",
    home: "Maison",
    away: "Absent",
    unknown: "Inconnu",
    at_home: "{n} sur {total} à la maison",
    all_home: "Tout le monde est là",
    nobody_home: "Personne à la maison",
    for: "depuis",
    just_now: "à l'instant",
    days: "j",
    hours: "h",
    minutes: "min",
    battery: "Batterie",
    from_home: "de la maison",
    no_person: "Aucune personne trouvée. Ajoutez des personnes dans Paramètres → Personnes.",
    unknown_person: "Personne introuvable",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    entities: "Personnes (toutes par défaut)",
    title_option: "Titre (facultatif)",
    sort: "Ordre",
    sort_presence: "Présents d'abord",
    sort_name: "Par nom",
    sort_config: "Dans l'ordre de la liste",
    show_since: "Afficher depuis quand",
    show_distance: "Afficher la distance de la maison",
    show_battery: "Afficher la batterie du téléphone",
    show_away: "Afficher les absents",
    zoom: "Bouton zoom",
    zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    title: "Anwesenheit",
    home: "Zuhause",
    away: "Abwesend",
    unknown: "Unbekannt",
    at_home: "{n} von {total} zu Hause",
    all_home: "Alle sind zu Hause",
    nobody_home: "Niemand zu Hause",
    for: "seit",
    just_now: "gerade eben",
    days: "Tg.",
    hours: "Std.",
    minutes: "Min.",
    battery: "Akku",
    from_home: "von zu Hause",
    no_person: "Keine Person gefunden. Füge Personen unter Einstellungen → Personen hinzu.",
    unknown_person: "Person nicht gefunden",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    entities: "Personen (standardmäßig alle)",
    title_option: "Titel (optional)",
    sort: "Reihenfolge",
    sort_presence: "Anwesende zuerst",
    sort_name: "Nach Name",
    sort_config: "Wie aufgelistet",
    show_since: "Seit wann anzeigen",
    show_distance: "Entfernung von zu Hause anzeigen",
    show_battery: "Handy-Akku anzeigen",
    show_away: "Abwesende Personen anzeigen",
    zoom: "Zoom-Schaltfläche",
    zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    title: "Presencia",
    home: "En casa",
    away: "Fuera",
    unknown: "Desconocido",
    at_home: "{n} de {total} en casa",
    all_home: "Todos están en casa",
    nobody_home: "No hay nadie en casa",
    for: "desde hace",
    just_now: "ahora mismo",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Batería",
    from_home: "de casa",
    no_person: "No se encontró ninguna persona. Añade personas en Ajustes → Personas.",
    unknown_person: "Persona no encontrada",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    entities: "Personas (todas por defecto)",
    title_option: "Título (opcional)",
    sort: "Orden",
    sort_presence: "Primero los que están en casa",
    sort_name: "Por nombre",
    sort_config: "Según la lista",
    show_since: "Mostrar desde cuándo",
    show_distance: "Mostrar la distancia desde casa",
    show_battery: "Mostrar la batería del teléfono",
    show_away: "Mostrar a las personas ausentes",
    zoom: "Botón de zoom",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A URL for a CSS url('…') inside a style attribute: esc() alone is not enough, as the browser decodes the
// attribute's HTML entities before parsing the CSS, so an escaped quote would come back and close the string.
// Keep it a plain CSS string: percent-encode the quotes, backslashes, parentheses and whitespace that could break
// out of url('…'), so the URL stays valid (a "/local/Jean Pierre.jpg" or "photo (2).jpg" still loads).
const pct = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
const cssUrl = (v) =>
  esc(
    String(v ?? "")
      .replace(/["'()\\]/g, pct)
      .replace(/\s/g, (c) => (c.charCodeAt(0) < 0x80 ? pct(c) : encodeURIComponent(c)))
  );

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Elapsed time, short: "12 min", "3 h 5 min", "2 d 4 h".
const fmtDuration = (sec, tr) => {
  if (sec < 60) return tr("just_now");
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return h ? `${d} ${tr("days")} ${h} ${tr("hours")}` : `${d} ${tr("days")}`;
  if (h > 0) return m ? `${h} ${tr("hours")} ${m} ${tr("minutes")}` : `${h} ${tr("hours")}`;
  return `${m} ${tr("minutes")}`;
};

// Great-circle distance in km.
const haversine = (lat1, lon1, lat2, lon2) => {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
};

const fmtDistance = (km, miles) => {
  const v = miles ? km / 1.609344 : km;
  const unit = miles ? "mi" : "km";
  if (!miles && v < 1) return `${Math.round(v * 1000)} m`;
  return `${v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)} ${unit}`;
};

const level = (v, warn, crit) => (v === null ? "" : v <= crit ? "crit" : v <= warn ? "warn" : "ok");

const initials = (name) =>
  String(name || "?")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// A stable color per person, for the initials avatar.
const AVATAR_COLORS = ["#5b6cf0", "#00a7a0", "#e8783c", "#c2459e", "#3d8fd6", "#7a8f2f", "#a05cd6", "#d64a4a"];
const avatarColor = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// Card logo: a house sheltering two people, drawn in the accent color on a round tinted badge like the other
// ha-* cards.
const logo = () => `<div class="logo"><svg class="icon" viewBox="6 6 36 36" role="img" aria-label="Presence">
  <path d="M24 9 8 22.5h4.5V38h23V22.5H40Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="19.5" cy="25" r="3.2"/><path d="M13.5 37c0-4 2.7-6.6 6-6.6s6 2.6 6 6.6Z"/>
  <circle cx="29" cy="26.5" r="2.7" opacity=".85"/><path d="M24.6 37c0-3.3 2-5.4 4.4-5.4s4.4 2.1 4.4 5.4Z" opacity=".85"/>
</svg></div>`;

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

// `entities` items: "person.x" or { entity: "person.x", name: "…", picture: "…" }.
const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((e) => (typeof e === "string" ? { entity: e } : e))
    .filter((e) => e?.entity);

// People found automatically, cached on the states object (replaced by Home Assistant on every state
// change): `_signature()` and `_render()` both walk the list on every `set hass`, compute it once.
let _people = { states: null, ids: [] };
const listPeople = (hass) => {
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
let _batteries = { entities: null, byDevice: new Map() };
const RE_BATTERY = /^sensor\..*battery(?:_level)?(?:_\d+)?$/;
const batteriesByDevice = (hass) => {
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
const trackersOf = (st) => [...new Set([st.attributes?.source, ...(st.attributes?.device_trackers || [])].filter(Boolean))];

// Phone battery: the battery sensor of the tracker's device, or the tracker's own battery attribute.
const batteryOf = (hass, st) => {
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

const ORDER = { home: 0, zone: 1, away: 2, unknown: 3 };

/** What the card shows for one person. */
const personInfo = (hass, item, now = Date.now()) => {
  const st = hass.states[item.entity];
  if (!st) return null;
  const state = String(st.state);
  const kind =
    state === "home" ? "home" : state === "not_home" ? "away" : /^(unknown|unavailable)$/.test(state) ? "unknown" : "zone";
  const a = st.attributes || {};
  const homeZone = hass.states["zone.home"]?.attributes;
  let km = null;
  if (kind !== "home" && Number.isFinite(a.latitude) && Number.isFinite(a.longitude) && homeZone) {
    km = haversine(a.latitude, a.longitude, homeZone.latitude, homeZone.longitude);
  }
  const changed = Date.parse(st.last_changed);
  return {
    id: item.entity,
    name: String(item.name || a.friendly_name || item.entity.split(".")[1]),
    picture: item.picture || a.entity_picture || null,
    kind,
    zone: kind === "zone" ? state : null,
    since: Number.isFinite(changed) ? Math.max(0, Math.floor((now - changed) / 1000)) : null,
    km,
    battery: batteryOf(hass, st),
  };
};

const sortPeople = (people, sort) => {
  const pos = new Map(people.map((p, i) => [p.id, i]));
  if (sort === "config") return people;
  if (sort === "name") return [...people].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return [...people].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || pos.get(a.id) - pos.get(b.id));
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
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
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --pr-accent: #5b6cf0; --pr-home: var(--success-color, #43a047); --pr-zone: var(--info-color, #039be5);
          --pr-away: var(--disabled-text-color, #9e9e9e); --pr-unknown: var(--warning-color, #ffa600);
          --pr-ok: var(--success-color, #43a047); --pr-warn: var(--warning-color, #ffa600); --pr-crit: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .home { --c: var(--pr-home); } .zone { --c: var(--pr-zone); } .away { --c: var(--pr-away); } .unknown { --c: var(--pr-unknown); }
  .ok { --b: var(--pr-ok); } .warn { --b: var(--pr-warn); } .crit { --b: var(--pr-crit); }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--pr-home)) 15%, transparent); color: var(--c, var(--pr-home)); white-space: nowrap; }
  .chip .icon { width: 12px; height: 12px; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .titles { flex: 1; min-width: 0; }
  .logo { --c: var(--pr-accent); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; align-self: flex-start;
          background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .logo .icon { width: 24px; height: 24px; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header > .chip { align-self: flex-start; margin-top: 2px; }
  .warning { padding: 16px; color: var(--pr-warn); }
  .avatar { position: relative; flex: none; width: var(--size, 40px); height: var(--size, 40px); }
  .avatar .pic { width: 100%; height: 100%; border-radius: 50%; box-sizing: border-box; border: 2px solid var(--c);
                 background: var(--bg, var(--pr-accent)) center / cover no-repeat; display: grid; place-items: center;
                 color: #fff; font-weight: 600; font-size: calc(var(--size, 40px) * .36); transition: border-color .4s ease, filter .4s ease; }
  .avatar.away .pic, .avatar.unknown .pic { filter: grayscale(.85) opacity(.75); }
  .avatar .badge { position: absolute; right: -3px; bottom: -3px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
                   background: var(--c); color: #fff; box-shadow: 0 0 0 2px var(--card-background-color, var(--ha-card-background, #fff)); }
  .avatar .badge .icon { width: 12px; height: 12px; }
  .zoom { all: unset; flex: none; align-self: flex-start; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px 0 -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

const BADGE = { home: ICONS.home, zone: ICONS.zone, away: ICONS.away, unknown: ICONS.unknown };

class PresenceBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => {
      const el = ev.composedPath().find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  connectedCallback() {
    this._startTimer();
  }

  // "Since" durations move on with the clock: a render check every minute, no state change needed.
  // No timer when `show_since: false` — the signature then ignores the minute, the tick would do nothing.
  _startTimer() {
    clearInterval(this._timer);
    if (!this.isConnected || this._config?.show_since === false) return;
    this._timer = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.entities !== undefined && !Array.isArray(config.entities)) throw new Error("entities must be a list");
    this._config = { ...config };
    this._html = "";
    this._update();
    this._startTimer();
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _items() {
    const items = normalize(this._config.entities);
    return items.length ? items : listPeople(this._hass).map((entity) => ({ entity }));
  }

  // What the render depends on: language, theme, unit system, the minute, and the states of the
  // people, their trackers, their battery sensors and the home zone.
  _signature() {
    const h = this._hass;
    const sig = [h.language, h.locale?.language, h.themes?.darkMode, h.config?.unit_system?.length, h.entities, h.states["zone.home"]];
    if (this._config.show_since !== false) sig.push(Math.floor(Date.now() / 60000));
    for (const item of this._items()) {
      const st = h.states[item.entity];
      sig.push(item.entity, st);
      if (!st) continue;
      for (const tr of trackersOf(st)) {
        sig.push(h.states[tr]);
        const dev = h.entities?.[tr]?.device_id;
        if (dev) sig.push(h.states[batteriesByDevice(h).get(dev)]);
      }
    }
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  _people() {
    const now = Date.now();
    const all = this._items().map((item) => personInfo(this._hass, item, now) ?? { missing: item.entity });
    return { all, people: sortPeople(all.filter((p) => !p.missing), this._config.sort) };
  }

  _summary(people) {
    const n = people.filter((p) => p.kind === "home").length;
    if (people.length > 1 && n === people.length) return { n, text: this._t("all_home") };
    if (n === 0) return { n, text: this._t("nobody_home") };
    return { n, text: this._t("at_home").replace("{n}", n).replace("{total}", people.length) };
  }

  _header(people) {
    const { n, text } = this._summary(people);
    return `
      <div class="header">
        ${logo()}
        <div class="titles">
          <div class="name">${esc(this._config.title || this._t("title"))}</div>
          <div class="sub">${esc(text)}</div>
        </div>
        <span class="chip ${n ? "home" : "away"}">${svgIcon(ICONS.home)}${n}/${people.length}</span>
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  _avatar(p, size) {
    const bg = p.picture ? `--bg:url('${cssUrl(p.picture)}');` : `--bg:${avatarColor(p.id)};`;
    return `<div class="avatar ${p.kind}" style="--size:${size}px">
      <div class="pic" style="${bg}">${p.picture ? "" : esc(initials(p.name))}</div>
      <span class="badge">${svgIcon(BADGE[p.kind])}</span>
    </div>`;
  }

  _place(p) {
    return p.kind === "zone" ? p.zone : this._t(p.kind);
  }

  _noPeople(all) {
    const missing = all.find((p) => p.missing);
    const msg = missing ? `${this._t("unknown_person")}: ${missing.missing}` : this._t("no_person");
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(msg)}</div></ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
  .person { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 12px;
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .person .who { flex: 1; min-width: 0; }
  .person .pname { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .person .where { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .person .where .chip { flex: none; }
  .person .where .since { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .person .facts { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12px; flex: none; }
  .person .facts span { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .person .facts .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .batt { display: inline-flex; align-items: center; gap: 4px; }
  .batt .cell { position: relative; width: 18px; height: 9px; border: 1.5px solid var(--secondary-text-color); border-radius: 2.5px; box-sizing: border-box; }
  .batt .cell::after { content: ""; position: absolute; right: -4px; top: 1.5px; width: 2px; height: 3px; border-radius: 0 1px 1px 0; background: var(--secondary-text-color); }
  .batt .cell > i { position: absolute; left: 1px; top: 1px; bottom: 1px; border-radius: 1px; background: var(--b, var(--pr-ok)); }
`;

class PresenceCard extends PresenceBase {
  static getConfigElement() {
    return document.createElement("presence-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 1 + (this._hass && this._config ? this._items().length : 2);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { all, people } = this._people();
    if (!people.length || all.some((p) => p.missing)) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(people)}
        <div class="content">${shown.map((p) => this._row(p)).join("")}</div>
      </ha-card>`;
  }

  _battery(b) {
    const v = Math.max(0, Math.min(100, b.value));
    return `<span class="batt ${level(v, 40, 20)} clickable" role="button" tabindex="0" data-entity="${esc(b.entity)}" title="${esc(
      this._t("battery")
    )}" aria-label="${esc(this._t("battery"))} ${Math.round(v)}%"><span class="cell"><i style="width:calc((100% - 2px) * ${(v / 100).toFixed(2)})"></i></span>${Math.round(v)}%</span>`;
  }

  _row(p) {
    const c = this._config;
    const miles = this._hass.config?.unit_system?.length === "mi";
    const tr = (k) => this._t(k);
    const facts = [];
    if (c.show_distance !== false && p.km !== null)
      facts.push(`<span title="${esc(tr("from_home"))}">${svgIcon(ICONS.distance)}${fmtDistance(p.km, miles)}</span>`);
    if (c.show_battery !== false && p.battery) facts.push(this._battery(p.battery));
    const since = c.show_since !== false && p.since !== null ? `<span class="since">${esc(p.since < 60 ? tr("just_now") : `${tr("for")} ${fmtDuration(p.since, tr)}`)}</span>` : "";
    return `<div class="person clickable ${p.kind}" role="button" tabindex="0" data-key="${esc(p.id)}" data-entity="${esc(p.id)}">
      ${this._avatar(p, 40)}
      <div class="who">
        <div class="pname">${esc(p.name)}</div>
        <div class="where"><span class="chip">${esc(this._place(p))}</span>${since}</div>
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

// Same layout as the alarm mini card: one row with the logo, the title, the summary in color under it,
// the round avatars and the detail button, all centered vertically. The avatars stay on that row only while
// the title and the summary fit there in full next to them (measured on every render and resize of the
// card, see `_fit`); otherwise they wrap onto their own line under the title.
const FACE = 32;
const FACE_GAP = 8;

const MINI_STYLE = `
  .mini .header { padding: 12px; flex-wrap: wrap; row-gap: 10px; }
  .mini .header > .logo, .mini .zoom { align-self: center; }
  .mini .header > .logo { width: 32px; height: 32px; }
  .mini .header > .logo .icon { width: 20px; height: 20px; }
  .mini .header > .titles { margin-block: -2px; }
  .mini .zoom { margin: -4px -4px -4px 0; }
  .sub .st { color: var(--c); font-weight: 500; }
  .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--c); margin-right: 4px; vertical-align: 1px; }
  .faces { order: 9; flex: 1 0 100%; display: flex; flex-wrap: wrap; gap: ${FACE_GAP}px; }
  .mini.row .faces { order: 0; flex: none; }
  .faces .avatar .badge { width: 14px; height: 14px; right: -2px; bottom: -2px; }
  .faces .avatar .badge .icon { width: 10px; height: 10px; }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class PresenceMiniCard extends PresenceCard {
  static getConfigElement() {
    return document.createElement("presence-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this._inline = true;
    this._resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => this._fit()) : null;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onOutside, true);
    this._resize?.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onOutside, true);
    this._resize?.disconnect();
  }

  _update(sig) {
    super._update(sig);
    this._fit();
  }

  // Avatars on the title row, or under it: on the row when the logo, the whole title or summary (the
  // wider of the two, not cut), the avatars and the detail button fit in the card's width.
  _fit() {
    if (this._zoomed) return;
    const root = this.shadowRoot;
    const header = root.querySelector?.(".mini .header");
    if (!header) return;
    const width = header.clientWidth - 24;
    if (width <= 0) return; // not laid out (hidden tab, card being created)
    const titles = Math.max(...[...root.querySelectorAll(".mini .titles > div")].map((n) => n.scrollWidth));
    const n = root.querySelectorAll(".mini .face").length;
    const faces = n ? 10 + n * FACE + (n - 1) * FACE_GAP : 0; // header gap + avatars, nothing with zero faces
    const zoomEl = root.querySelector(".mini .zoom");
    // Header gap + the button's measured footprint (its width plus its negative margins).
    const zs = zoomEl && getComputedStyle(zoomEl);
    const zoom = zoomEl ? 10 + zoomEl.offsetWidth + (parseFloat(zs.marginLeft) || 0) + (parseFloat(zs.marginRight) || 0) : 0;
    const row = 32 + 10 + titles + faces + zoom <= width;
    if (row === this._inline) return;
    this._inline = row;
    this._update(this._sig);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update(this._sig);
  }

  // A click on the zoom button: never a tap on anything else of the card.
  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus();
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { all, people } = this._people();
    if (!people.length || all.some((p) => p.missing)) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    const { n, text } = this._summary(people);
    const faces = shown.map(
      (p) => `<div class="face clickable" role="button" tabindex="0" data-key="${esc(p.id)}" data-entity="${esc(p.id)}" title="${esc(
        `${p.name} · ${this._place(p)}`
      )}">${this._avatar(p, FACE)}</div>`
    );
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        <div class="mini${this._inline ? " row" : ""}">
          <div class="header">
            ${logo()}
            <div class="titles">
              <div class="name">${esc(c.title || this._t("title"))}</div>
              <div class="sub"><span class="st ${n ? "home" : "away"}"><span class="dot"></span>${esc(text)}</span></div>
            </div>
            <div class="faces">${faces.join("")}</div>
            ${this._zoomButton()}
          </div>
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class PresenceEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "entities", selector: { entity: { domain: "person", multiple: true } } },
      { name: "title", selector: { text: {} } },
      {
        name: "sort",
        selector: {
          select: {
            mode: "dropdown",
            options: ["presence", "name", "config"].map((v) => ({ value: v, label: tr(`sort_${v}`) })),
          },
        },
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name === "title" ? "title_option" : s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // The entity selector works on plain ids: restore the original entries (objects carrying
        // name/picture, configured in YAML) for the entities that were kept; new ones stay strings.
        if (Array.isArray(config.entities)) {
          const byId = new Map(
            (Array.isArray(this._config.entities) ? this._config.entities : []).map((e) => [typeof e === "string" ? e : e?.entity, e])
          );
          config.entities = config.entities.map((id) => byId.get(id) ?? id);
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values, defaults and toggles left on (their default).
          const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
          if (empty || (k === "sort" && v === "presence") || (this.constructor.toggles.includes(k) && v === true)) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    // A state update only needs the new hass: rebuilding data and a fresh schema (new option arrays) on every one
    // would re-render the whole ha-form while editing. Reassign them only when the config or the language changed.
    const l = lang(this._hass, this._config);
    if (this._formConfig === this._config && this._formLang === l) return;
    this._formConfig = this._config;
    this._formLang = l;
    const data = { sort: "presence", ...this._config, entities: normalize(this._config.entities).map((e) => e.entity) };
    for (const name of this.constructor.toggles) if (data[name] === undefined) data[name] = true;
    this._schemas ??= {};
    this._schemas[l] ??= this._schema();
    this._form.data = data;
    this._form.schema = this._schemas[l];
  }
}

class PresenceCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["show_since", "show_distance", "show_battery", "show_away"];
  }
}

class PresenceMiniCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["show_away", "show_since", "show_distance", "show_battery", "zoom"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("presence-card", PresenceCard);
define("presence-mini-card", PresenceMiniCard);
define("presence-card-editor", PresenceCardEditor);
define("presence-mini-card-editor", PresenceMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "presence-card",
    name: "Presence Card",
    description: "People of the house and where they are: home, zone or away, since when, distance and phone battery.",
  },
  {
    type: "presence-mini-card",
    name: "Presence Mini Card",
    description: "Compact presence overview: one avatar per person with a home / zone / away badge.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-presence-card" });
}

console.info(
  `%c PRESENCE-CARD %c v${VERSION} `,
  "color: white; background: #5b6cf0; font-weight: 700;",
  "color: #5b6cf0; background: white; font-weight: 700;"
);
