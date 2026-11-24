// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, fmtDistance, fmtDuration, hour12Of, intlLang, level, svgIcon } from "./helpers.js";
import { BANNER_STYLE } from "./illustrated-header.js";
import { MOVES_HOURS, historyEvents, movesFrom } from "./people.js";
import { BASE_STYLE, PresenceBase, inDialog, watchOutside } from "./shared-styles.js";

export const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
  .content .warning { padding: 2px 10px; font-size: 12px; }
  /* Narrow header (a card under about 205 px, narrower than its 9 columns on a phone): the count chip keeps
     only its icon, the count stays in its title and label. At phone widths it shows its whole "2/4". */
  .header { container: pr-head / inline-size; }
  /* The summary ("Nikogo nie ma w domu") wraps between words rather than being cut next to the chip. */
  .header .sub { white-space: normal; }
  @container pr-head (max-width: 200px) { .trow > .chip .txt { display: none; } .trow > .chip { padding: 1px 4px; } }
  /* A small gap before the facts column: the name and place already stretch up to it, and at a phone's 9
     columns (about 234 px) every pixel goes to the zone or state chip ("Poza domem"). */
  .person { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 12px;
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  /* The person's button (avatar, name, place) and the battery's are side by side, never one inside the other. */
  .person .main { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; border-radius: 8px; }
  @supports selector(:has(*)) {
    .person:has(> .main:focus-visible) { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
    .person > .main:focus-visible { outline: none; }
  }
  .person .who { flex: 1; min-width: 0; }
  .person .pname { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .person .where { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  /* A long zone name is cut in its chip (full name in its title), never over the distance and battery. */
  .person .where .chip { flex: 0 1 auto; min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; }
  /* The duration goes under the chip when it does not fit next to it, and wraps between words if still too long. */
  .person .where .since { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
  .person .facts { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12px; flex: none; }
  .person .facts span { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .person .facts .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .person .facts .towards .icon { color: var(--pr-home); }
  /* Movements of the last 24 hours: folded under the people, chevron right folded and down unfolded. */
  .moves { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
  .moves-toggle { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 4px 2px;
                  font-size: 12px; font-weight: 500; color: var(--secondary-text-color); border-radius: 6px; }
  .moves-toggle:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .moves-toggle .icon { width: 16px; height: 16px; transition: transform .2s ease; }
  .moves-toggle .icon.open { transform: rotate(90deg); }
  .mlist { display: flex; flex-direction: column; gap: 2px; }
  .move { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; font-size: 12px; cursor: pointer; }
  .move:hover { background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .move .icon { width: 16px; height: 16px; flex: none; color: var(--secondary-text-color); }
  .move.moved_home .icon { color: var(--pr-home); }
  .move.moved_zone .icon { color: var(--pr-zone); }
  .move .mtext { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .move .mtime { flex: none; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .move.none { cursor: default; color: var(--secondary-text-color); }
  @media (prefers-reduced-motion: reduce) { .moves-toggle .icon { transition: none; } }
  .batt { display: inline-flex; align-items: center; gap: 4px; }
  .batt .cell { position: relative; width: 18px; height: 9px; border: 1.5px solid var(--secondary-text-color); border-radius: 2.5px; box-sizing: border-box; }
  .batt .cell::after { content: ""; position: absolute; right: -4px; top: 1.5px; width: 2px; height: 3px; border-radius: 0 1px 1px 0; background: var(--secondary-text-color); }
  .batt .cell > i { position: absolute; left: 1px; top: 1px; bottom: 1px; border-radius: 1px; background: var(--b, var(--pr-ok)); }
  /* Very narrow card (under 225 px: the mini card zoomed in keeps its 6-column cell, about 156-178 px on a
     phone). The card is a size container for that; a size container has no width of its own content, so in a
     parent sized by its content (an inline-block, a grid "auto" column) the card would fall to a few pixels.
     The empty, zero-height grid before it gives a natural width (max-content 360 px) with no minimum
     (min-content 0): in a "1fr 1fr" grid, wrapped in a div or not, the card still shrinks to its track. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 360px); height: 0; }
  ha-card { container: pr-card / inline-size; }
  /* There the header drops its logo, and each row puts its distance and battery on a line under the name,
     with a smaller avatar: the name, the place chip and the duration keep their whole text. */
  @container pr-card (max-width: 224px) {
    .header > .logo { display: none; }
    .content { padding: 8px 8px 8px; }
    .person { flex-wrap: wrap; row-gap: 4px; padding: 6px 8px; }
    .person .main { flex: 1 1 100%; gap: 8px; }
    .person .main .avatar { width: 32px; height: 32px; }
    .person .main .avatar .pic { font-size: 12px; }
    .person .main .avatar .badge { width: 14px; height: 14px; right: -2px; bottom: -2px; }
    .person .main .avatar .badge .icon { width: 10px; height: 10px; }
    .person .facts { flex: 1 1 100%; min-width: 0; box-sizing: border-box; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 2px 10px; padding-left: 40px; }
    .person .where .since { overflow-wrap: normal; }
  }
`;

export class PresenceCard extends PresenceBase {
  constructor() {
    super();
    this._movesOpen = false;
    this._moves = null;
    this.shadowRoot.addEventListener("click", (ev) => {
      if (!ev.composedPath().some((n) => n.classList?.contains("moves-toggle"))) return;
      this._movesOpen = !this._movesOpen;
      this._update();
    });
    // A click elsewhere folds the movements back, like the other sections of the ha-* cards.
    this._foldMoves = (ev) => {
      if (!this._movesOpen || ev.composedPath().includes(this) || inDialog(ev)) return;
      this._movesOpen = false;
      this._update();
    };
  }

  static getConfigElement() {
    return document.createElement("presence-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._foldMovesWatch ??= watchOutside(this, (ev) => this._foldMoves(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._foldMovesWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._movesOpen = false;
  }

  // Reads the history of the people when the section is unfolded, and again once one of them has moved since:
  // their state changes of the window plus the state each was in when it opened (one call for all of them).
  _loadMoves(people) {
    if (!this._hass?.callWS) return;
    // Read again each hour too, so the window keeps sliding when nobody moves.
    const hour = Math.floor(Date.now() / 3600000);
    const key = `${hour}|${people.map((p) => `${p.id}:${this._hass.states[p.id]?.last_changed}`).join("|")}`;
    if (key === this._movesKey) return;
    this._movesKey = key;
    const names = Object.fromEntries(people.map((p) => [p.id, p.name]));
    const start = Date.now() - MOVES_HOURS * 3600000;
    Promise.resolve(
      this._hass.callWS({
        type: "history/history_during_period",
        start_time: new Date(start).toISOString(),
        entity_ids: Object.keys(names),
        include_start_time_state: true,
        significant_changes_only: true,
        minimal_response: true,
        no_attributes: true,
      })
    )
      .then((history) => {
        if (this._movesKey !== key) return;
        // A second of slack: the start-time states come back stamped with the start, as float seconds.
        this._moves = movesFrom(historyEvents(history), names, start + 1000);
        this._update();
      })
      .catch(() => {
        // Tried again at the next unfolding or movement.
        this._movesKey = null;
      });
  }

  _time(ms) {
    const locale = intlLang(this._hass, this._config);
    const hour12 = hour12Of(this._hass);
    const d = new Date(ms);
    const today = new Date().toDateString() === d.toDateString();
    try {
      const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", ...(hour12 === undefined ? {} : { hour12 }) });
      return today ? time : `${d.toLocaleDateString(locale, { weekday: "short" })} ${time}`;
    } catch {
      return d.toISOString().slice(11, 16);
    }
  }

  _movesSection(people) {
    if (this._config.show_moves === false) return "";
    const open = this._movesOpen;
    if (open) this._loadMoves(people);
    const label = this._t("moves");
    let body = "";
    if (open) {
      // Only the last 24 hours, even before the history is read again.
      const since = Date.now() - MOVES_HOURS * 3600000;
      const moves = this._moves?.filter((m) => m.when >= since);
      body = moves?.length
        ? moves
            .map((m) => {
              const text = this._t(m.kind).replace("{name}", m.name).replace("{zone}", m.zone);
              const icon = m.kind === "moved_home" ? ICONS.home : m.kind === "moved_zone" ? ICONS.zone : ICONS.away;
              return `<div class="move ${m.kind}" data-key="move:${esc(m.id)}:${m.when}" role="button" tabindex="0" data-entity="${esc(m.id)}">
                ${svgIcon(icon)}<span class="mtext">${esc(text)}</span><span class="mtime">${esc(this._time(m.when))}</span></div>`;
            })
            .join("")
        : moves
          ? `<div class="move none">${esc(this._t("no_moves"))}</div>`
          : "";
    }
    return `<div class="moves" data-key="moves">
      <button class="moves-toggle" aria-expanded="${open}">${svgIcon(ICONS.chevron, open ? "open" : "")}<span>${esc(label)}</span></button>
      ${body ? `<div class="mlist">${body}</div>` : ""}
    </div>`;
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 1 + (this._hass && this._config ? this._items().length : 2);
  }

  getGridOptions() {
    // 9 columns: under that, the rows get too dense (names, zone chips and durations cut or wrapped on
    // several lines); the header itself still fits narrower.
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const { all, people } = this._people();
    if (!people.length) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._illustrated() ? BANNER_STYLE : ""}</style>
      <ha-card>
        ${this._header(people)}
        <div class="content">${shown.map((p) => this._row(p)).join("")}${this._missing(all)}${this._movesSection(people)}</div>
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
    // Distance from home, behind the direction of travel's icon when the person has Proximity sensors.
    const dist = c.show_distance !== false && p.km !== null ? fmtDistance(p.km, miles, intlLang(this._hass, c)) : "";
    const dir = this._direction(p);
    if (dist || dir) {
      const title = [dir, dist && tr("from_home")].filter(Boolean).join(" · ");
      const icon = dir
        ? `<svg class="icon" viewBox="0 0 24 24" ${dist ? `role="img" aria-label="${esc(dir)}"` : 'aria-hidden="true"'}><path d="${ICONS[p.direction]}"/></svg>`
        : svgIcon(ICONS.distance);
      facts.push(`<span class="${dir ? `dir ${p.direction}` : "dist"}" title="${esc(title)}">${icon}${esc(dist || dir)}</span>`);
    }
    if (c.show_travel !== false && p.travel !== null) {
      const eta = fmtDuration(p.travel * 60, tr).replace(/(\d) /g, "$1\u00a0");
      facts.push(`<span class="eta" title="${esc(tr("travel_home"))}">${svgIcon(ICONS.travel)}${esc(eta)}</span>`);
    }
    if (c.show_battery !== false && p.battery) facts.push(this._battery(p.battery));
    // A number stays with its unit ("23 h") when the duration wraps.
    const sinceText = p.since === null ? "" : p.since < 60 ? tr("just_now") : `${tr("for")} ${fmtDuration(p.since, tr).replace(/(\d) /g, "$1\u00a0")}`;
    const since = c.show_since !== false && p.since !== null ? `<span class="since">${esc(sinceText)}</span>` : "";
    const place = this._place(p);
    return `<div class="person clickable ${p.kind}" data-key="${esc(p.id)}" data-entity="${esc(p.id)}">
      <div class="main" role="button" tabindex="0" data-entity="${esc(p.id)}">
        ${this._avatar(p, 40)}
        <div class="who">
          <div class="pname">${esc(p.name)}</div>
          <div class="where"><span class="chip" title="${esc(place)}"><span class="txt">${esc(place)}</span></span>${since}</div>
        </div>
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }
}
