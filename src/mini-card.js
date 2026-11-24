// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, logo, svgIcon } from "./helpers.js";
import { BANNER_STYLE } from "./illustrated-header.js";
import { BASE_STYLE, inDialog, watchOutside } from "./shared-styles.js";
import { PresenceCard } from "./full-card.js";

// Same layout as the alarm mini card: one row with the logo, the title, the summary in color under it,
// the round avatars and the detail button, all centered vertically. The avatars stay on that row only while
// the title and the summary fit there in full next to them (measured on every render and resize of the
// card, see `_fit`); otherwise they wrap onto their own line under the title.
export const FACE = 32;
export const FACE_GAP = 8;
// The header logo, the same size as the full card's.
export const LOGO = 40;

export const MINI_STYLE = `
  .mini .header { padding: 12px; flex-wrap: wrap; row-gap: 10px; }
  .mini .header > .logo, .mini .zoom { align-self: center; }
  .mini .header > .titles { margin-block: -2px; }
  .mini .zoom { margin: -4px -4px -4px 0; }
  /* Too narrow for the logo next to the title (a phone's 6 columns, ~156-178 px): the logo goes, the summary
     wraps between words instead of being cut. */
  .mini.tight .header > .logo { display: none; }
  .mini.tight .sub { white-space: normal; }
  .mini > .warning { padding: 0 12px 12px; font-size: 12px; }
  .sub .st { color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); font-weight: 500; }
  .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--c); margin-right: 4px; vertical-align: 1px; }
  .faces { order: 9; flex: 1 0 100%; display: flex; flex-wrap: wrap; gap: ${FACE_GAP}px; }
  .mini.row .faces { order: 0; flex: none; }
  /* Under the illustrated header, the avatars on their own row. */
  .mini.illustrated > .faces { padding: 10px 12px 12px; }
  .mini.illustrated > .warning { padding-top: 10px; }
  .faces .avatar .badge { width: 14px; height: 14px; right: -2px; bottom: -2px; }
  .faces .avatar .badge .icon { width: 10px; height: 10px; }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
export class PresenceMiniCard extends PresenceCard {
  static getConfigElement() {
    return document.createElement("presence-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this._inline = true;
    this._tight = false;
    this._resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => this._fit()) : null;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    (this._onOutsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
    this._resize?.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._onOutsideWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._zoomed = false;
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
    // The text's own width (the inline spans), not the title block's: that one stretches with the flex row
    // and would make a card that has once wrapped its avatars never fit them back on the row. Read as a
    // layout width (offsetWidth), like clientWidth above: getBoundingClientRect() follows an ancestor's
    // zoom or transform and would under-estimate the title under a scaled dashboard.
    // A summary wrapped by the tight layout is read unwrapped (its nowrap restored for the measure), so that
    // its width does not depend on the layout it decides.
    const sub = root.querySelector(".mini .sub");
    if (sub) sub.style.whiteSpace = "nowrap";
    const titles = Math.max(...[...root.querySelectorAll(".mini .titles > div > span")].map((n) => n.offsetWidth));
    if (sub) sub.style.whiteSpace = "";
    const n = root.querySelectorAll(".mini .face").length;
    const faces = n ? 10 + n * FACE + (n - 1) * FACE_GAP : 0; // header gap + avatars, nothing with zero faces
    const zoomEl = root.querySelector(".mini .zoom");
    // Header gap + the button's measured footprint (its width plus its negative margins).
    const zs = zoomEl && getComputedStyle(zoomEl);
    const zoom = zoomEl ? 10 + zoomEl.offsetWidth + (parseFloat(zs.marginLeft) || 0) + (parseFloat(zs.marginRight) || 0) : 0;
    const row = LOGO + 10 + titles + faces + zoom <= width;
    // No room for the logo and the whole title and summary: the logo is dropped and the summary wraps.
    // Measured on the unwrapped texts (the logo's presence changes none of these widths), so it never flips
    // back and forth.
    const tight = !row && LOGO + 10 + titles + zoom > width;
    if (row === this._inline && tight === this._tight) return;
    this._inline = row;
    this._tight = tight;
    this._update(this._sig);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
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
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { all, people } = this._people();
    if (!people.length) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    const { n, text } = this._summary(people);
    const faces = shown.map(
      (p) => `<div class="face clickable" role="button" tabindex="0" data-key="${esc(p.id)}" data-entity="${esc(p.id)}" title="${esc(
        [p.name, this._place(p), this._direction(p)].filter(Boolean).join(" · ")
      )}">${this._avatar(p, FACE)}</div>`
    );
    if (this._illustrated())
      return `<style>${BASE_STYLE}${MINI_STYLE}${BANNER_STYLE}</style>
      <ha-card>
        <div class="mini illustrated">
          ${this._banner(people)}
          ${faces.length ? `<div class="faces">${faces.join("")}</div>` : ""}
          ${this._missing(all)}
        </div>
      </ha-card>`;
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        <div class="mini${this._inline ? " row" : ""}${this._tight ? " tight" : ""}">
          <div class="header">
            ${logo(this._t("title"), this._status(people))}
            <div class="titles">
              <div class="name"><span>${esc(c.title || this._t("title"))}</span></div>
              <div class="sub"><span class="st ${n ? "home" : "away"}"><span class="dot"></span>${esc(text)}</span></div>
            </div>
            <div class="faces">${faces.join("")}</div>
            ${this._zoomButton()}
          </div>
          ${this._missing(all)}
        </div>
      </ha-card>`;
  }
}
