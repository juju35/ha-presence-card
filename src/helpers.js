// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A URL for a CSS url('…') inside a style attribute: esc() alone is not enough, as the browser decodes the
// attribute's HTML entities before parsing the CSS, so an escaped quote would come back and close the string.
// Keep it a plain CSS string: percent-encode the quotes, backslashes, parentheses and whitespace that could break
// out of url('…'), so the URL stays valid (a "/local/Jean Pierre.jpg" or "photo (2).jpg" still loads).
export const pct = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
export const cssUrl = (v) =>
  esc(
    String(v ?? "")
      .replace(/["'()\\]/g, pct)
      .replace(/\s/g, (c) => (c.charCodeAt(0) < 0x80 ? pct(c) : encodeURIComponent(c)))
  );

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: Home Assistant's full locale when it is the card's language (pt-BR keeps Brazilian formats)
// or a language the card does not translate (ja, ko…: its formats, English texts), else the card's language.
// A bare "pt" is Home Assistant's European Portuguese: Intl reads it as Brazilian.
export const intlLang = (hass, config) => {
  const l = lang(hass, config);
  const full = config?.language ? "" : (hass && (hass.locale?.language || hass.language)) || "";
  const base = l.split("-")[0];
  const untranslated = full && !STRINGS[full] && !STRINGS[full.split("-")[0]];
  let out = l;
  if (untranslated || (full && full.split("-")[0] === base && !(l === "sr" && /-Latn\b/.test(full)))) out = full;
  return out === "pt" ? "pt-PT" : out;
};

// 12 / 24 h clock from the Home Assistant profile (time_format): "12", "24", "system" (the browser's own
// locale) or "language" (the locale's default: undefined).
export const hour12Of = (hass) => {
  const tf = hass?.locale?.time_format;
  if (tf === "12") return true;
  if (tf === "24") return false;
  if (tf === "system") return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  return undefined;
};

export const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Elapsed time, short: "12 min", "3 h 5 min", "2 d 4 h".
export const fmtDuration = (sec, tr) => {
  if (sec < 60) return tr("just_now");
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return h ? `${d} ${tr("days")} ${h} ${tr("hours")}` : `${d} ${tr("days")}`;
  if (h > 0) return m ? `${h} ${tr("hours")} ${m} ${tr("minutes")}` : `${h} ${tr("hours")}`;
  return `${m} ${tr("minutes")}`;
};

// Great-circle distance in km.
export const haversine = (lat1, lon1, lat2, lon2) => {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Distance in the locale's number format: meters under 1 km, one decimal under 10, none above.
export const fmtDistance = (km, miles, locale) => {
  const v = miles ? km / 1.609344 : km;
  const meters = !miles && v < 1;
  const [value, unit] = meters ? [Math.round(v * 1000), "meter"] : [v, miles ? "mile" : "kilometer"];
  const digits = !meters && v < 10 ? 1 : 0;
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits }).format(value);
  } catch {
    return `${digits ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value)} ${meters ? "m" : miles ? "mi" : "km"}`;
  }
};

export const level = (v, warn, crit) => (v === null ? "" : v <= crit ? "crit" : v <= warn ? "warn" : "ok");

export const initials = (name) =>
  String(name || "?")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// A stable color per person, for the initials avatar.
// Dark enough for the white initials to reach the WCAG AA 4.5:1 contrast.
export const AVATAR_COLORS = ["#5768e6", "#00827d", "#b35c2e", "#c0449c", "#3378b4", "#6a7c29", "#9656c9", "#cb4646"];
export const avatarColor = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// Card logo: a house sheltering two people, drawn in the accent color on a round tinted badge like the other
// ha-* cards.
export const logo = (label, status = "") => `<div class="logo${status ? ` ${status}` : ""}"><svg class="icon" viewBox="6 6 36 36" role="img" aria-label="${esc(label)}">
  <path d="M24 9 8 22.5h4.5V38h23V22.5H40Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="19.5" cy="25" r="3.2"/><path d="M13.5 37c0-4 2.7-6.6 6-6.6s6 2.6 6 6.6Z"/>
  <circle cx="29" cy="26.5" r="2.7" opacity=".85"/><path d="M24.6 37c0-3.3 2-5.4 4.4-5.4s4.4 2.1 4.4 5.4Z" opacity=".85"/>
</svg></div>`;
