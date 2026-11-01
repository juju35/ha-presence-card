// Browser test (Chromium through Playwright) of the cards' layout at narrow widths and of their keyboard /
// assistive structure: long zone names stay inside their chip, the header keeps a readable title and every
// button inside the card, interactive elements are never nested. Skipped when Playwright or Chromium is not
// installed, except in CI, where it must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { NOW, states as MOCK } from "../scripts/mock-states.mjs";

const SRC = readFileSync(new URL("../src/presence-card.js", import.meta.url), "utf8");

const THEMES = {
  light: { "--card-background-color": "#ffffff", "--primary-text-color": "#212121", "--secondary-text-color": "#727272" },
  dark: { "--card-background-color": "#1c1c1c", "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b" },
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

const LONG_ZONE = "Université de Rennes – Campus de Beaulieu";
const longStates = () => {
  const s = structuredClone(MOCK);
  s["person.sam"].state = LONG_ZONE;
  s["person.sam"].attributes = { ...s["person.sam"].attributes };
  return s;
};

// One card of `type` at `width` px, rendered and measured in the page by `fn` (a function source, run with the
// card element as `el`).
const inPage = async ({ type, width, lang = "en", theme = "light", config = {}, states = MOCK }, fn) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.setFixedTime(NOW);
  const vars = Object.entries(THEMES[theme])
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>:root{${vars}} body{margin:0;padding:16px;font-family:Arial,sans-serif;font-size:14px;color:var(--primary-text-color)} #root{width:${width}px}</style><div id=root></div>`
  );
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
      this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden;background:var(--card-background-color)}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: SRC });
  const r = await page.evaluate(
    async ({ type, lang, config, states, fn }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      document.getElementById("root").append(el);
      el.hass = { states, language: lang, locale: { language: lang }, config: { unit_system: { length: "km" } } };
      for (let i = 0; i < 3; i++) await new Promise((res) => requestAnimationFrame(res));
      // biome-ignore lint/security/noGlobalEval: test-only measuring function passed as source
      return (0, eval)(`(${fn})`)(el);
    },
    { type, lang, config, states, fn: fn.toString() }
  );
  await page.close();
  assert.deepEqual(errors, []);
  return r;
};

// Each chip of the rows: its box must stay left of the facts column (distance, battery) and its text must not
// spill out of it (cut with an ellipsis, the full name in its title).
const chips = (el) =>
  [...el.shadowRoot.querySelectorAll(".person")].map((row) => {
    const chip = row.querySelector(".where .chip");
    const facts = row.querySelector(".facts");
    const cb = chip.getBoundingClientRect();
    const fb = facts?.getBoundingClientRect();
    const cs = getComputedStyle(chip);
    const spills = cs.overflow !== "hidden" && chip.scrollWidth > chip.clientWidth + 1;
    return {
      text: chip.textContent.trim(),
      title: chip.getAttribute("title"),
      overlap: !!fb && cb.right > fb.left + 0.5 && cb.top < fb.bottom && cb.bottom > fb.top,
      spills,
    };
  });

for (const [lang, width] of [
  ["en", 240],
  ["en", 330],
  ["pl", 200],
  ["sr-Latn", 200],
  ["nl", 200],
]) {
  test(`full card ${lang} at ${width}px: a zone name stays inside its chip, clear of the distance and battery`, async (t) => {
    if (skip) return t.skip(skip);
    const rows = await inPage({ type: "presence-card", width, lang, states: longStates() }, chips);
    assert.equal(rows.length, 4);
    for (const r of rows) {
      assert.equal(r.overlap, false, `"${r.text}" overlaps the facts column`);
      assert.equal(r.spills, false, `"${r.text}" spills out of its chip`);
    }
    const sam = rows.find((r) => r.text === LONG_ZONE);
    assert.equal(sam.title, LONG_ZONE);
  });
}

// Header at a narrow width: the title keeps at least four characters, nothing goes past the card's right
// edge, the icon buttons keep their size.
const header = (el) => {
  const root = el.shadowRoot;
  const card = root.querySelector("ha-card").getBoundingClientRect();
  const out = [];
  for (const n of root.querySelectorAll(".header *")) {
    const b = n.getBoundingClientRect();
    if (b.width && b.right > card.right + 0.5) out.push(`${n.getAttribute("class") || n.localName} +${Math.round(b.right - card.right)}`);
  }
  const name = root.querySelector(".header .name");
  const span = name.querySelector("span") ?? name;
  const range = document.createRange();
  range.setStart(span.firstChild, 0);
  range.setEnd(span.firstChild, Math.min(4, span.firstChild.length));
  const four = range.getBoundingClientRect().width;
  const chip = root.querySelector(".header > .chip");
  const zoom = root.querySelector(".zoom");
  return {
    out,
    title: name.clientWidth,
    four: Math.ceil(four),
    chipLabel: chip?.getAttribute("aria-label") ?? null,
    summary: root.querySelector(".header .sub").textContent.trim(),
    chipInside: chip ? chip.getBoundingClientRect().right <= card.right + 0.5 : true,
    zoom: zoom ? Math.round(zoom.getBoundingClientRect().width) : null,
    // The mini card's zoom button stays on the logo's row, it never wraps onto a line of its own.
    zoomOnRow: zoom ? zoom.getBoundingClientRect().top < root.querySelector(".logo").getBoundingClientRect().bottom : true,
  };
};

for (const type of ["presence-card", "presence-mini-card"])
  for (const lang of ["en", "pl", "sr-Latn"])
    for (const theme of ["light", "dark"])
      for (const width of [160, 200, 250]) {
        test(`${type} ${lang} ${theme} at ${width}px: the header keeps its title readable and its buttons inside`, async (t) => {
          if (skip) return t.skip(skip);
          const r = await inPage({ type, width, lang, theme }, header);
          assert.deepEqual(r.out, []);
          assert.ok(r.title >= r.four, `title ${r.title}px < 4 characters (${r.four}px)`);
          assert.ok(r.chipInside);
          if (type === "presence-card") assert.equal(r.chipLabel, r.summary); // "2 of 4 at home", translated
          if (type === "presence-mini-card") assert.equal(r.zoom, 24);
          assert.ok(r.zoomOnRow, "zoom button wrapped under the title row");
        });
      }

test("full card at a narrow width: the header chip keeps only its icon, its count stays in its label", async (t) => {
  if (skip) return t.skip(skip);
  const read = (el) => {
    const chip = el.shadowRoot.querySelector(".header > .chip");
    const txt = chip.querySelector(".txt");
    return { shown: txt.getBoundingClientRect().width > 0, title: chip.getAttribute("title") };
  };
  const narrow = await inPage({ type: "presence-card", width: 200 }, read);
  const wide = await inPage({ type: "presence-card", width: 480 }, read);
  assert.deepEqual(narrow, { shown: false, title: "2 of 4 at home" });
  assert.deepEqual(wide, { shown: true, title: "2 of 4 at home" });
});

test("no interactive element nested in another (axe nested-interactive), each one keeps its target", async (t) => {
  if (skip) return t.skip(skip);
  const r = await inPage({ type: "presence-card", width: 480 }, (el) => {
    const root = el.shadowRoot;
    const sel = '[role="button"], button, [tabindex]';
    const nested = [...root.querySelectorAll(sel)].filter((n) => n.parentElement?.closest(sel)).map((n) => n.className);
    const opened = [];
    el.addEventListener("hass-more-info", (ev) => opened.push(ev.detail.entityId));
    const row = root.querySelector('.person[data-key="person.sam"]');
    row.querySelector('[role="button"][data-entity="person.sam"]').dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true })
    );
    row.querySelector(".batt").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true }));
    row.querySelector(".facts span").click(); // the distance, a plain text: the row's person
    return { nested, opened, battName: row.querySelector(".batt").getAttribute("aria-label") };
  });
  assert.deepEqual(r.nested, []);
  assert.deepEqual(r.opened, ["person.sam", "device_tracker.sam_phone", "person.sam"]);
  assert.equal(r.battName, "Battery 34%");
});
