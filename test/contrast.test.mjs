// Browser test (Chromium through Playwright) of the cards' contrast with Home Assistant's default light and
// dark themes: every text (state chips, the mini card's summary, initials, the warning) reaches the WCAG AA
// 4.5:1 ratio against what is really painted under it, and the state glyph of the avatar badges 3:1.
// Colors are read from the computed styles (color-mix resolved by the browser), translucent backgrounds
// composited up to the page. Skipped when Playwright or Chromium is not installed, except in CI, where it
// must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

const SRC = readFileSync(new URL("../src/presence-card.js", import.meta.url), "utf8");

// Home Assistant's default theme values for the variables the cards read.
const THEMES = {
  light: {
    "--primary-background-color": "#fafafa",
    "--secondary-background-color": "#e5e5e5",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--disabled-text-color": "#bdbdbd",
    "--success-color": "#4caf50",
    "--info-color": "#039be5",
    "--warning-color": "#ffa600",
    "--error-color": "#db4437",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--disabled-text-color": "#6f6f6f",
    "--success-color": "#4caf50",
    "--info-color": "#039be5",
    "--warning-color": "#ffa600",
    "--error-color": "#db4437",
  },
};

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.CI) throw err;
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

// In the page: the contrast of `fg` (its text color, or `bg` itself for a glyph) against what lies under it.
const MEASURE = `
const parse = (s) => {
  const m = s.match(/^rgba?\\(([^)]+)\\)$/) || s.match(/^color\\(srgb ([^)]+)\\)$/);
  if (!m) throw new Error("unparsed color " + s);
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  const rgb = s.startsWith("color(") ? p.slice(0, 3).map((v) => v * 255) : p.slice(0, 3);
  return [...rgb, p.length > 3 ? p[3] : 1];
};
const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3])).concat(1);
const parentOf = (el) => el.parentElement || el.parentNode?.host || null;
// The opaque color painted under (and including) el: its own and its ancestors' backgrounds, composited.
const backdrop = (el) => {
  const layers = [];
  for (let n = el; n; n = parentOf(n)) layers.push(parse(getComputedStyle(n).backgroundColor));
  return layers.reduceRight((acc, c) => over(c, acc), [255, 255, 255, 1]);
};
const lum = (c) => {
  const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
window.ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
window.textContrast = (el) => {
  const bg = backdrop(el);
  const fg = over(parse(getComputedStyle(el).color), bg);
  return ratio(fg, bg);
};
`;

const person = (id, state, name) => ({
  entity_id: `person.${id}`,
  state,
  last_changed: new Date(Date.now() - 3600000).toISOString(),
  attributes: { friendly_name: name, latitude: 48.2, longitude: -1.6 },
});
const STATES = {
  "zone.home": { entity_id: "zone.home", state: "1", attributes: { latitude: 48.1173, longitude: -1.6778 } },
  "zone.work": { entity_id: "zone.work", state: "1", attributes: { friendly_name: "Work", latitude: 48.2, longitude: -1.6 } },
  // Names picked so that the initials avatars cover the whole color palette.
  ...Object.fromEntries(
    [
      ["a", "home", "Ann Lee"],
      ["b", "not_home", "Bob Ray"],
      ["c", "Work", "Cy Dee"],
      ["d", "unknown", "Di Fox"],
      ["e", "home", "Ed Gil"],
      ["f", "home", "Flo Hu"],
      ["g", "home", "Gus Ivy"],
      ["h", "home", "Hal Joe"],
      ["i", "home", "Ida Kim"],
      ["j", "home", "Jo Lu"],
      ["k", "home", "Kai Mo"],
      ["l", "home", "Liv Ng"],
    ].map(([id, st, n]) => [`person.${id}`, person(id, st, n)])
  ),
};

// Renders `type` with the given theme and returns [label, ratio] for every measured element.
const measure = async (theme, type, config = {}) => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const vars = Object.entries(THEMES[theme])
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  await page.setContent(
    `<!doctype html><style>:root{${vars}} body{margin:0;padding:16px;width:460px;background:var(--primary-background-color);color:var(--primary-text-color)}</style><body><div id=root></div></body>`
  );
  // Minimal stand-in for <ha-card>, painted as Home Assistant does.
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
      this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;background:var(--ha-card-background,var(--card-background-color,white))}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: SRC });
  await page.addScriptTag({ content: MEASURE });
  const out = await page.evaluate(
    ({ type, config, states }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = { states, language: "en", config: { unit_system: { length: "km" } } };
      document.getElementById("root").append(el);
      const root = el.shadowRoot;
      const res = [];
      const label = (n) => `${n.className} "${n.textContent.trim()}"`;
      for (const n of root.querySelectorAll(".chip, .sub .st, .warning")) res.push(["text", label(n), textContrast(n)]);
      for (const n of root.querySelectorAll(".avatar .pic"))
        if (n.textContent.trim())
          // An opacity filter fades the initials into the card: not measurable here, so counted as a failure.
          res.push(["text", `initials ${label(n)}`, /opacity/.test(getComputedStyle(n).filter) ? 0 : textContrast(n)]);
      // The badge glyph is drawn in the badge's text color (fill: currentColor) on the badge's state color.
      for (const n of root.querySelectorAll(".avatar .badge")) res.push(["glyph", `badge ${n.parentElement.className}`, textContrast(n)]);
      return res;
    },
    { type, config, states: STATES }
  );
  await page.close();
  assert.deepEqual(errors, []);
  return out;
};

const check = (rows) => {
  assert.ok(rows.length > 0);
  const low = rows.filter(([kind, , r]) => r < (kind === "text" ? 4.5 : 3)).map(([k, l, r]) => `${k} ${l}: ${r.toFixed(2)}`);
  assert.deepEqual(low, []);
};

for (const theme of ["light", "dark"]) {
  test(`${theme} theme: full card texts reach 4.5:1 and badge glyphs 3:1`, async (t) => {
    if (skip) return t.skip(skip);
    check(await measure(theme, "presence-card"));
  });

  test(`${theme} theme: mini card summary, initials and badges reach their contrast`, async (t) => {
    if (skip) return t.skip(skip);
    check(await measure(theme, "presence-mini-card"));
  });

  test(`${theme} theme: the warning for a missing person is readable`, async (t) => {
    if (skip) return t.skip(skip);
    const rows = await measure(theme, "presence-card", { entities: ["person.nobody"] });
    assert.equal(rows.length, 1);
    check(rows);
  });
}

// One card on a page with `css` added to the page style; `opts` are Playwright page options.
const render = async (type, css, opts = {}) => {
  const page = await browser.newPage(opts);
  await page.setContent(`<!doctype html><style>${css}</style><body><div id=root></div></body>`);
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
      this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;background:var(--ha-card-background,var(--card-background-color,white))}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: SRC });
  await page.evaluate(
    ({ type, states }) => {
      window.card = document.createElement(type);
      card.setConfig({ type: `custom:${type}` });
      card.hass = { states, language: "en", config: { unit_system: { length: "km" } } };
      document.getElementById("root").append(card);
    },
    { type, states: STATES }
  );
  return page;
};

test("the avatar badge ring takes the card's own background when a theme sets --ha-card-background", async (t) => {
  if (skip) return t.skip(skip);
  for (const type of ["presence-card", "presence-mini-card"]) {
    const page = await render(type, ":root{--card-background-color:#ffffff;--ha-card-background:#203040}");
    const [ring, card] = await page.evaluate(() => [
      getComputedStyle(card.shadowRoot.querySelector(".avatar .badge")).boxShadow,
      getComputedStyle(card.shadowRoot.querySelector("ha-card")).backgroundColor,
    ]);
    await page.close();
    assert.equal(card, "rgb(32, 48, 64)");
    assert.ok(ring.startsWith(card), `${type}: ring ${ring}, card ${card}`);
  }
});

test("prefers-reduced-motion: the avatars change state without a transition", async (t) => {
  if (skip) return t.skip(skip);
  const durations = async (reducedMotion) => {
    const page = await render("presence-card", "", { reducedMotion });
    const d = await page.evaluate(() => getComputedStyle(card.shadowRoot.querySelector(".avatar .pic")).transitionDuration);
    await page.close();
    return d;
  };
  assert.equal(await durations("reduce"), "0s");
  // Without the preference, the state change stays animated.
  assert.notEqual(await durations("no-preference"), "0s");
});
