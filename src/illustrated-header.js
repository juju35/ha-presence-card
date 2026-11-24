// ---------------------------------------------------------------------------
// Illustrated header
// ---------------------------------------------------------------------------

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// Sky positions of the stars (night).
export const STARS = [
  [12, 8],
  [44, 18],
  [96, 6],
  [132, 24],
  [168, 10],
  [188, 30],
  [70, 30],
];

// The banner picture (200 × 80, at the right of the banner, on the 10 px floor strip): the family's living room —
// a window on the sky (sun or moon), a sofa with one seat per person (up to four), everyone at home sitting on it
// and an empty cushion for each one away, a lamp lit at night while someone is home and the cat on the rug.
// No ids: several cards on one page never clash.
export const FAMILY = [
  { h: 1, hair: "#4a3324", skin: "#f2c9a0", shirt: "#2f80ed" },
  { h: 0.96, hair: "#b5651d", skin: "#e8b48c", shirt: "#e5484d", long: true },
  { h: 0.78, hair: "#2b2b2b", skin: "#c68a5e", shirt: "#43a047" },
  { h: 0.66, hair: "#e0b04a", skin: "#f5d3b3", shirt: "#f5a623", long: true },
];
// The shelf on the wall: five books and a plant.
export const SCENE_SHELF = `<g transform="translate(128 24)"><rect class="pr-shelf" width="34" height="2" rx="1"/>${[
  [9, "#e5484d"],
  [11, "#2f80ed"],
  [8, "#f5a623"],
  [10, "#43a047"],
  [7, "#7f77dd"],
]
  .map(([h, c], i) => `<rect x="${2 + i * 4.2}" y="${-h}" width="3.4" height="${h}" rx=".6" fill="${c}"/>`)
  .join("")}<path class="pr-leaf" d="M27 0 C25 -7 29 -9 30 -10 C31 -7 32 -4 30 0Z M30 0 C31 -6 35 -7 36 -7 C35 -4 34 -2 32 0Z"/><rect class="pr-pot" x="26.5" y="-3" width="7" height="3" rx="1"/></g>`;
// One person sitting on the sofa at x (feet hidden by the seat), sized by their height h.
export const sceneSitter = (x, p) => {
  const k = p.h;
  const f = (v) => Math.round(v * 100) / 100;
  const head = f(39 + (1 - k) * 14);
  const r = f(5.6 * (0.8 + 0.2 * k));
  const hair = p.long
    ? `<path class="pr-hair" fill="${p.hair}" d="M${f(x - r - 0.6)} ${f(head + r * 1.3)} V${f(head - 0.5)} a${f(r + 0.6)} ${f(r + 0.8)} 0 0 1 ${f(2 * r + 1.2)} 0 V${f(head + r * 1.3)} Z"/>`
    : `<path class="pr-hair" fill="${p.hair}" d="M${f(x - r)} ${f(head - 0.4)} a${r} ${f(r + 0.4)} 0 0 1 ${f(2 * r)} 0 Z"/>`;
  return `<g class="pr-sit">${hair}<rect x="${f(x - 7.5 * k)}" y="${f(head + r - 0.6)}" width="${f(15 * k)}" height="${f(17 * k + 2)}" rx="${f(5 * k)}" fill="${p.shirt}"/><circle cx="${x}" cy="${head}" r="${r}" fill="${p.skin}"/></g>`;
};
export const presenceScene = (home, total = 4) => {
  const seats = Math.max(1, Math.min(4, total || 1));
  const sitting = Math.min(home, seats);
  const stars = STARS.slice(0, 4).map(([x, y], i) => `<circle class="pr-star${i % 2 ? "" : " tw"}" cx="${18 + (x % 44)}" cy="${12 + (y % 26)}" r=".55"/>`).join("");
  const x0 = 140 - seats * 12;
  const w = seats * 24;
  const seatX = (i) => x0 + 12 + i * 24;
  const cushions = Array.from({ length: seats }, (_, i) =>
    i < sitting ? sceneSitter(seatX(i), FAMILY[i]) : `<rect class="pr-cushion" x="${seatX(i) - 8}" y="49" width="16" height="13" rx="4"/>`,
  ).join("");
  return `<svg class="pr-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <g transform="translate(8 8)">
      <rect class="pr-wframe" x="-3" y="-3" width="52" height="42" rx="2"/>
      <rect class="pr-sky" width="46" height="36"/>
      <g class="pr-day"><circle class="pr-sun halo" cx="34" cy="10" r="7"/><circle class="pr-sun" cx="34" cy="10" r="4.4"/>
        <path class="pr-wcloud" transform="translate(16 10)" d="M-10,4 C-12,4 -13,1 -10.5,0 C-10,-3 -6,-4 -4.5,-2 C-3,-6 3,-6 3.6,-1.5 C6.6,-2 8.6,0 7.2,4 Z"/></g>
      <g class="pr-night">${stars}<circle class="pr-moon" cx="34" cy="10" r="4"/><circle class="pr-moon-cut" cx="36" cy="8.6" r="3.3"/></g>
      <path class="pr-hillw" d="M0 36 C10 29 22 30 46 27 V36Z"/>
      <rect class="pr-bar" x="22" y="0" width="2" height="36"/><rect class="pr-bar" x="0" y="17" width="46" height="2"/>
      <path class="pr-curtain" d="M-6 -4 H6 C3 10 3 26 7 42 H-6Z"/><path class="pr-curtain" d="M52 -4 H40 C43 10 43 26 39 42 H52Z"/>
    </g>
    ${SCENE_SHELF}
    <ellipse class="pr-rug" cx="${x0 + w / 2 - 6}" cy="79" rx="${w / 2 + 26}" ry="3"/>
    <g class="pr-sofa">
      <rect class="back" x="${x0 - 2}" y="40" width="${w + 4}" height="26" rx="7"/>
      ${cushions}
      <rect class="seat" x="${x0}" y="62" width="${w}" height="10" rx="3.5"/>
      <rect class="arm" x="${x0 - 11}" y="51" width="12" height="21" rx="5"/><rect class="arm" x="${x0 + w - 1}" y="51" width="12" height="21" rx="5"/>
      <rect class="leg" x="${x0 - 7}" y="72" width="2.6" height="6"/><rect class="leg" x="${x0 + w + 5}" y="72" width="2.6" height="6"/>
    </g>
    <g class="pr-lampg${sitting ? " on" : ""}" transform="translate(186 0)"><path class="pr-glow" d="M-11 44 L11 44 L20 80 L-20 80Z"/><rect class="pr-pole" x="-.8" y="40" width="1.6" height="38"/><rect class="pr-pole" x="-5" y="77" width="10" height="2" rx="1"/><path class="pr-shade" d="M-6 32 H6 L8.5 43 H-8.5Z"/></g>
    <g class="pr-cat" transform="translate(${sitting ? x0 - 24 : x0 + w / 2} ${sitting ? 79 : 62}) scale(1.15)"><path class="pr-tail" d="M5 -3 C11 -4 12 -10 9 -13"/><ellipse class="pr-catb" cx="0" cy="-3.4" rx="6.4" ry="3.6"/><circle class="pr-catb" cx="-5.4" cy="-7" r="2.8"/><path class="pr-catb" d="M-7.6 -9 l.6 -2.6 l1.6 1.6Z M-4.6 -9.4 l1 -2.4 l1 1.9Z"/></g>
  </svg><div class="pr-ground" aria-hidden="true"></div>`;
};

// The illustration's colours and animations, day and night: the living room on its wall and floor.
export const BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --pr-g: 10px; container: pr-banner / inline-size; color: #0d2a45;
            background: linear-gradient(180deg, #eef3f8 0%, #e3ebf3 100%); }
  .banner.night { color: #fff; background: linear-gradient(180deg, #1d2433 0%, #181e2b 100%); }
  .pr-scene { position: absolute; right: 0; bottom: 10px; width: min(200px, 56%); height: 80px; overflow: hidden; }
  /* The 10 px floor strip under the whole banner, edge to edge. */
  .pr-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px;
               background: repeating-linear-gradient(90deg, #d9c3a1 0 46px, #ccb591 46px 47px); }
  .night .pr-ground { background: repeating-linear-gradient(90deg, #3a3346 0 46px, #322c3d 46px 47px); }
  /* The round icon and the title on the sky at the left, up to where the scene starts. */
  .htext { position: absolute; left: 12px; top: 0; bottom: 10px; right: calc(min(200px, 56%) + 4px);
           display: flex; align-items: center; gap: 12px; min-width: 0; }
  .banner .logo { align-self: center; background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(47,125,225,.18); }
  .banner.night .logo { color: color-mix(in srgb, var(--c) 72%, #fff); background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner .titles { display: flex; flex-direction: column; gap: 1px; }
  .banner .name { font-size: 18px; font-weight: 500; }
  /* A long summary ("Nikogo nie ma w domu") wraps between words on a narrow card rather than being cut. */
  .banner .sub { font-size: 13px; line-height: 16px; color: #3b5b78; white-space: normal; }
  .banner.night .sub { color: rgba(255,255,255,.8); }
  .banner .titles { flex: 1 1 0; min-width: 0; }
  .banner .chip.st { color: color-mix(in srgb, var(--c) 45%, #0d2a45); background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); }
  .banner.night .chip.st { color: color-mix(in srgb, var(--c) 35%, #ffffff); background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); }
  .banner .chip.st .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
  @container pr-banner (max-width: 200px) {
    .banner .chip.st { padding: 0; width: 16px; height: 16px; justify-content: center; }
    .banner .chip.st .txt { display: none; }
  }
  /* Detail button (mini card): a small frosted round button in the banner's top right corner. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { color: #33506b; background: rgba(255,255,255,.75); }
  .banner.night .zoom:hover { color: #fff; background: rgba(255,255,255,.22); }
  /* Narrow card: no room for the scene beside the text, the wall and the floor stay. */
  @container pr-banner (max-width: 300px) { .pr-scene { display: none; } .htext { right: 36px; } }
  /* Very narrow (a phone's 6 columns): the icon goes too, like the classic header's, the title keeps its room. */
  @container pr-banner (max-width: 224px) { .htext > .logo { display: none; } }
  /* The card keeps a natural width in a box sized by its content (see the full card's same rule). */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 360px); height: 0; }
  .pr-night, .night .pr-day { display: none; }
  .night .pr-night { display: inline; }
  .pr-sun { fill: #ffd65a; } .pr-sun.halo { opacity: .28; }
  .pr-star { fill: #fff; opacity: .8; } .pr-star.tw { animation: pr-twinkle 3.2s ease-in-out infinite alternate; }
  .pr-moon { fill: #f3eed2; } .pr-moon-cut { fill: #13254a; }
  .pr-scene { -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 10%); mask-image: linear-gradient(90deg, transparent 0, #000 10%); }
  .pr-wframe { fill: #ffffff; } .night .pr-wframe { fill: #3a4458; }
  .pr-wcloud { fill: #fff; opacity: .95; }
  .pr-sky { fill: #a9d6f5; } .night .pr-sky { fill: #13254a; }
  .pr-hillw { fill: #9ccc8f; } .night .pr-hillw { fill: #17303d; }
  .pr-bar { fill: #ffffff; } .night .pr-bar { fill: #3a4458; }
  .pr-curtain { fill: #c9d6e3; } .night .pr-curtain { fill: #33405a; }
  .pr-sofa .back, .pr-sofa .arm { fill: #8a96a6; } .pr-sofa .seat { fill: #77849a; } .pr-sofa .leg { fill: #5a3d28; }
  .night .pr-sofa .back, .night .pr-sofa .arm { fill: #4a5468; } .night .pr-sofa .seat { fill: #3f485a; }
  .pr-cushion { fill: #77849a; opacity: .55; } .night .pr-cushion { fill: #3f485a; }
  .pr-rug { fill: #d98b6a; opacity: .55; } .night .pr-rug { fill: #6a3f3a; }
  .pr-pole { fill: #5f6b7a; } .pr-shade { fill: #f1d9a6; } .night .on .pr-shade { fill: #ffd27a; filter: drop-shadow(0 0 3px #ffb347); } .night .pr-shade { fill: #4a4452; }
  .pr-glow { display: none; } .night .on .pr-glow { display: inline; fill: #ffd27a; opacity: .12; }
  .pr-pic { fill: #8a5a3a; } .pr-picin { fill: #cfe6f7; } .pr-picart { fill: #86c27f; } .pr-picsun { fill: #ffd65a; }
  .night .pr-picin { fill: #3b4b5e; } .night .pr-picart { fill: #2c4a3a; }
  .pr-shelf { fill: #8a5a3a; } .pr-leaf { fill: #4caf50; } .pr-pot { fill: #c0603a; }
  .night .pr-sit { filter: brightness(.82) sepia(.18); }
  .pr-catb { fill: #4a4f57; } .night .pr-catb { fill: #20232a; }
  .pr-tail { fill: none; stroke: #4a4f57; stroke-width: 1.6; stroke-linecap: round; transform-box: fill-box; transform-origin: 0 100%; animation: pr-tail 1.6s ease-in-out infinite alternate; }
  .night .pr-tail { stroke: #20232a; }
  .pr-sit { animation: pr-breathe 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
  .pr-sit:nth-of-type(2n) { animation-delay: -2s; }
  @keyframes pr-tail { from { transform: rotate(-12deg); } to { transform: rotate(14deg); } }
  @keyframes pr-breathe { 50% { transform: scaleY(1.025); } }
  @media (prefers-reduced-motion: reduce) { .pr-tail, .pr-sit { animation: none !important; } }
  @keyframes pr-twinkle { from { opacity: .3; } to { opacity: .9; } }
  @media (prefers-reduced-motion: reduce) { .pr-star.tw { animation: none !important; } }
`;
