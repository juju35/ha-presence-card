// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { avatarColor, cssUrl, esc, initials, logo, svgIcon, t } from "./helpers.js";
import { isNight, presenceScene } from "./illustrated-header.js";
import { batteriesByDevice, fireMoreInfo, listPeople, morph, normalize, personInfo, proximityOf, sameSig, sortPeople, trackersOf } from "./people.js";

export const BASE_STYLE = `
  :host { display: block; --pr-accent: #5b6cf0; --pr-home: var(--success-color, #43a047); --pr-zone: var(--info-color, #039be5);
          --pr-away: var(--secondary-text-color, #727272); --pr-unknown: var(--warning-color, #ffa600);
          --pr-ok: var(--success-color, #43a047); --pr-warn: var(--warning-color, #ffa600); --pr-crit: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  /* A state color is kept for backgrounds, dots, borders and icons; a text in that color is mixed with the
     primary text color (darker in a light theme, lighter in a dark one) to stay readable (WCAG AA 4.5:1). */
  .home { --c: var(--pr-home); } .zone { --c: var(--pr-zone); } .away { --c: var(--pr-away); } .unknown { --c: var(--pr-unknown); }
  .ok { --b: var(--pr-ok); } .warn { --b: var(--pr-warn); } .crit { --b: var(--pr-crit); }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--pr-home)) 15%, transparent);
          color: color-mix(in srgb, var(--c, var(--pr-home)) 40%, var(--primary-text-color, #212121)); white-space: nowrap; }
  .chip .icon { width: 12px; height: 12px; }
  .chip .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  /* The title block takes the room left and cuts its texts, but always keeps a few characters of the title.
     A zero basis (not auto): in the mini card's wrapping header, a basis at the text's width would push the
     zoom button onto a second line at narrow widths. */
  .titles { flex: 1 1 0%; min-width: 6ch; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .logo { --c: var(--pr-accent); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; align-self: flex-start;
          background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .logo .icon { width: 24px; height: 24px; }
  /* The header icon's color follows the house's status: someone home, someone in a zone, unknown, nobody. */
  .logo.home { --c: var(--pr-home); } .logo.zone { --c: var(--pr-zone); } .logo.away { --c: var(--pr-away); } .logo.unknown { --c: var(--pr-unknown); }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Title row (both headers): the name, then the status pill right after it, only when the whole name and the whole
     label fit there (measured by the card, see _fitPill); else the pill takes a line of its own under the subtitle
     (the subtitle then on one line, its whole text in its tooltip), and when even that does not fit, only its dot or
     icon stays (the summary in its title and for screen readers). */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow > .name { flex: 0 1 auto; min-width: 4ch; }
  .trow > .chip { flex: none; max-width: none; margin: 0; line-height: 16px; white-space: nowrap; overflow: hidden; box-sizing: border-box; }
  .titles.below { display: flex; flex-direction: column; }
  .titles.below .trow { display: contents; }
  .titles.below > .sub { order: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titles.below .trow > .chip { order: 2; align-self: flex-start; max-width: 100%; margin-top: 2px; }
  .titles.dot-only .trow > .chip { padding: 1px 4px; }
  .titles.dot-only .trow > .chip .txt { display: none; }
  .banner .titles.dot-only .chip.st { padding: 0; width: 16px; height: 16px; justify-content: center; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--pr-warn) 40%, var(--primary-text-color, #212121)); overflow-wrap: anywhere; }
  .warning + .warning { padding-top: 0; }
  .avatar { position: relative; flex: none; width: var(--size, 40px); height: var(--size, 40px); }
  .avatar .pic { width: 100%; height: 100%; border-radius: 50%; box-sizing: border-box; border: 2px solid var(--c);
                 background: var(--bg, var(--pr-accent)) center / cover no-repeat; display: grid; place-items: center;
                 color: #fff; font-weight: 600; font-size: calc(var(--size, 40px) * .36); transition: border-color .4s ease, filter .4s ease; }
  /* Away or unknown: a faded photo; initials are only desaturated, so that they stay readable. */
  .avatar.away .pic, .avatar.unknown .pic { filter: grayscale(.85); }
  .avatar.away .pic.photo, .avatar.unknown .pic.photo { filter: grayscale(.85) opacity(.75); }
  .avatar .badge { position: absolute; right: -3px; bottom: -3px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
                   background: var(--c); color: #212121;
                   box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color, #fff)); }
  .avatar .badge .icon { width: 12px; height: 12px; }
  .zoom { all: unset; flex: none; align-self: flex-start; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px 0 -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  /* Classic header: the detail button in the card's top right corner, out of the title row. */
  .header:has(> .zoom), .mini .header:has(> .zoom) { position: relative; padding-right: 40px; }
  .header > .zoom, .mini .header > .zoom { position: absolute; top: 10px; right: 10px; margin: 0; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  @media (prefers-reduced-motion: reduce) { .avatar .pic { transition: none; } }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

export const BADGE = { home: ICONS.home, zone: ICONS.zone, away: ICONS.away, unknown: ICONS.unknown };

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count, and a scroll cancels the pointer); keyboard clicks (no click count) still go through the click
// event. The handler keeps its own checks (dialogs opened from the card…). `tap(ev)` is for the tests.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

export class PresenceBase extends HTMLElement {
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
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._pillResize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._pillResize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
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
    this._pillResize?.disconnect();
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    this._fitWidth = null;
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
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
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
    const sig = [h.language, h.locale?.language, h.locale?.time_format, h.themes?.darkMode, h.config?.unit_system?.length, h.entities, h.states["zone.home"]];
    if (this._config.show_since !== false) sig.push(Math.floor(Date.now() / 60000));
    // Unfolded movements: dropped once older than 24 hours, read again each hour.
    if (this._movesOpen) sig.push(Math.floor(Date.now() / 60000));
    for (const item of this._items()) {
      const st = h.states[item.entity];
      sig.push(item.entity, st);
      if (!st) continue;
      const prox = proximityOf(h, item);
      if (prox) sig.push(h.states[prox.direction], h.states[prox.distance]);
      if (item.travel_time) sig.push(h.states[item.travel_time]);
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
    this._fitPill();
  }

  // The status pill goes right after the title only when the whole title and the whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.below, the subtitle kept to one line, its whole text in its tooltip).
  // When the label does not fit that line either, or the banner has no room for the lines above its ground strip, the
  // pill keeps its dot only (.dot-only, back beside the title when the dot fits there). Measured after render, so that
  // it holds in every language.
  _fitPill() {
    const root = this.shadowRoot;
    if (!root?.querySelectorAll || typeof getComputedStyle !== "function") return;
    for (const t of root.querySelectorAll(".titles")) {
      const chip = t.querySelector(".trow > .chip");
      t.classList.remove("below", "dot-only");
      if (!chip?.getClientRects().length) continue;
      const row = chip.parentElement;
      const name = row.querySelector(".name");
      const fits = () => {
        let title = 0;
        if (name && getComputedStyle(name).display !== "none") {
          const range = document.createRange();
          range.selectNodeContents(name);
          const cs = getComputedStyle(name);
          title = Math.max(name.scrollWidth, range.getBoundingClientRect().width) + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0) +
            (parseFloat(getComputedStyle(row).columnGap) || 0);
        }
        return title + chip.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5;
      };
      if (fits()) continue;
      t.classList.add("below");
      for (const sub of t.querySelectorAll(".sub")) sub.title = sub.scrollWidth > sub.clientWidth ? sub.textContent.trim() : "";
      const text = chip.querySelector(".txt");
      const banner = t.closest(".banner");
      const tb = t.getBoundingClientRect();
      const bb = banner?.getBoundingClientRect();
      const ground = banner ? parseFloat(getComputedStyle(banner).getPropertyValue("--pr-g")) || 0 : 0;
      const tall = !!bb && (tb.top < bb.top - 0.5 || tb.bottom > bb.bottom - ground + 0.5);
      if (!tall && !(text && text.scrollWidth > text.clientWidth + 0.5)) continue;
      t.classList.add("dot-only");
      t.classList.remove("below");
      if (!fits()) t.classList.add("below");
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

  // The header's subtitle beside the count pill ("2/4"): who is away, rather than the count again; everyone home or
  // nobody home as the summary says it.
  _subtitle(people) {
    const { n, text } = this._summary(people);
    if (n === 0 || n === people.length) return text;
    const away = people.filter((p) => p.kind !== "home").map((p) => p.name);
    return this._t("away_names").replace("{names}", away.join(", "));
  }

  // The house's status, for the header icon's color: someone home, else someone in a zone, else someone unknown,
  // else nobody (grey).
  _status(people) {
    for (const kind of ["home", "zone", "unknown"]) if (people.some((p) => p.kind === kind)) return kind;
    return "away";
  }

  _illustrated() {
    return this._config.illustration !== false;
  }

  // The illustrated header: the living room scene on its wall, the round mdi:home icon and the title at its left.
  _banner(people) {
    const { n, text } = this._summary(people);
    const title = esc(this._config.title || this._t("title"));
    const status = this._status(people);
    // The status pill: a dot in the header icon's colour and the count at home, the summary in its title.
    const pill = `<span class="chip st ${status}" role="img" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="txt">${n}/${people.length}</span></span>`;
    return `<div class="banner${isNight(this._hass, this._config) ? " night" : ""}">${presenceScene(n, people.length)}<div class="htext">
        <div class="logo ${status}" role="img" aria-label="${esc(this._t("title"))}">${svgIcon(ICONS.home)}</div>
        <div class="titles"><div class="trow"><div class="name"><span>${title}</span></div>${pill}</div><div class="sub"><span>${esc(this._subtitle(people))}</span></div></div>
      </div>${this._zoomButton()}</div>`;
  }

  _header(people) {
    if (this._illustrated()) return this._banner(people);
    const { n, text } = this._summary(people);
    return `
      <div class="header">
        ${logo(this._t("title"), this._status(people))}
        <div class="titles">
          <div class="trow"><div class="name">${esc(this._config.title || this._t("title"))}</div><span class="chip ${n ? "home" : "away"}" role="img" title="${esc(text)}" aria-label="${esc(text)}">${svgIcon(ICONS.home)}<span class="txt">${n}/${people.length}</span></span></div>
          <div class="sub">${esc(this._subtitle(people))}</div>
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  _avatar(p, size) {
    const bg = p.picture ? `--bg:url('${cssUrl(p.picture)}');` : `--bg:${avatarColor(p.id)};`;
    return `<div class="avatar ${p.kind}" style="--size:${size}px" aria-hidden="true">
      <div class="pic${p.picture ? " photo" : ""}" style="${bg}">${p.picture ? "" : esc(initials(p.name))}</div>
      <span class="badge">${svgIcon(BADGE[p.kind])}</span>
    </div>`;
  }

  _place(p) {
    return p.kind === "zone" ? p.zone : this._t(p.kind);
  }

  // Direction of travel from the Proximity sensors ("Arriving"), or "" when unknown or hidden.
  _direction(p) {
    return this._config.show_direction !== false && p.direction ? this._t(`dir_${p.direction}`) : "";
  }

  // One warning line per configured person that does not exist (deleted or renamed), shown with the others.
  _missing(all) {
    return all
      .filter((p) => p.missing)
      .map((p) => `<div class="warning" data-key="missing:${esc(p.missing)}">${esc(`${this._t("unknown_person")}: ${p.missing}`)}</div>`)
      .join("");
  }

  // Nobody to show: every configured person missing, or no person at all in Home Assistant.
  _noPeople(all) {
    const body = this._missing(all) || `<div class="warning">${esc(this._t("no_person"))}</div>`;
    return `<style>${BASE_STYLE}</style><ha-card>${body}</ha-card>`;
  }
}
