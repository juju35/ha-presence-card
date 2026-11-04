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
const inPage = async ({ type, width, lang = "en", theme = "light", config = {}, states = MOCK, rootStyle = "" }, fn) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.setFixedTime(NOW);
  const vars = Object.entries(THEMES[theme])
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>:root{${vars}} body{margin:0;padding:16px;font-family:Arial,sans-serif;font-size:14px;color:var(--primary-text-color)} #root{width:${width === "auto" ? "auto" : `${width}px`};${rootStyle}}</style><div id=root></div>`
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
      return globalThis.eval(`(${fn})`)(el);
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
    // The header logo keeps the full card's size in the mini card too (0 when a narrow mini card drops it).
    logo: Math.round(root.querySelector(".header > .logo").getBoundingClientRect().width),
    // The mini card's zoom button stays on the logo's row, it never wraps onto a line of its own.
    // (Measured against the title when a narrow mini card drops its logo.)
    zoomOnRow: zoom ? zoom.getBoundingClientRect().top < (root.querySelector(".logo").offsetWidth ? root.querySelector(".logo") : name).getBoundingClientRect().bottom : true,
  };
};

for (const type of ["presence-card", "presence-mini-card"])
  for (const lang of ["en", "pl", "sr-Latn", "uk", "hu", "el"])
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
          if (r.logo) assert.equal(r.logo, 40, "header logo resized");
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

// Phone widths of the Sections view (9 of 12 columns, the full card's minimum, is about 234-273 px; a normal
// column is wider): the header chip has room for its "2/4" next to a readable title, it must show it whole.
for (const lang of ["en", "pl", "sr-Latn", "uk", "hu", "el"])
  for (const width of [234, 245, 273, 320, 500]) {
    test(`full card ${lang} at ${width}px: the header chip shows its whole count`, async (t) => {
      if (skip) return t.skip(skip);
      const r = await inPage({ type: "presence-card", width, lang }, (el) => {
        const txt = el.shadowRoot.querySelector(".header > .chip .txt");
        return { shown: txt.getBoundingClientRect().width > 0, cut: txt.scrollWidth > txt.clientWidth + 1 };
      });
      assert.deepEqual(r, { shown: true, cut: false });
    });
  }

test("mini card: the focus given back to the zoom button after a keyboard zoom does not scroll the page", async (t) => {
  if (skip) return t.skip(skip);
  const r = await inPage({ type: "presence-mini-card", width: 300 }, (el) => {
    const calls = [];
    const focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (opts) {
      calls.push(opts ?? null);
      return focus.call(this, opts);
    };
    // Enter / Space on a button: a click with no click count.
    el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 0 }));
    HTMLElement.prototype.focus = focus;
    return { calls, focused: el.shadowRoot.activeElement?.className ?? null };
  });
  assert.deepEqual(r, { calls: [{ preventScroll: true }], focused: "zoom" });
});

// A card in a box sized by its content (layout-card, button-card, a grid column `auto`, an inline-block) keeps
// a usable width: no container query context on an element whose width would come from its content.
for (const type of ["presence-card", "presence-mini-card"])
  for (const wrap of ["display:inline-block", "display:grid;grid-template-columns:auto"]) {
    test(`${type} in a content-sized box (${wrap}) keeps a usable width`, async (t) => {
      if (skip) return t.skip(skip);
      const r = await inPage({ type, width: "auto", rootStyle: wrap }, (el) => Math.round(el.getBoundingClientRect().width));
      assert.ok(r >= 200, `${r}px`);
    });
  }

// Phone widths at the declared minimum (Sections view, a ~320-364 px section): the full card asks for 9 of 12
// columns (234-273 px), the mini card for 6 (156-178 px), and ~245 px. Nothing leaves the card, the title keeps
// at least four characters, and no value is cut: the zone / state chips, distance and battery of the rows, the
// header's summary. Normal and unavailable people, light and dark themes.
const unavailable = () => {
  const s = structuredClone(MOCK);
  for (const k of Object.keys(s)) if (/^(person|device_tracker)\./.test(k)) s[k] = { ...s[k], state: "unavailable" };
  return s;
};
const fit = (el) => {
  const root = el.shadowRoot;
  const card = root.querySelector("ha-card").getBoundingClientRect();
  const visible = (n) => {
    // A box clipped by an ancestor that cuts its text (overflow hidden) is not outside the card, it is cut:
    // that case is reported by `cut` below.
    for (let p = n.parentElement; p; p = p.parentElement) if (getComputedStyle(p).overflow === "hidden") return p.getBoundingClientRect();
    return n.getBoundingClientRect();
  };
  const out = [];
  for (const n of root.querySelectorAll("ha-card *")) {
    const b = n.getBoundingClientRect();
    const v = visible(n);
    if (b.width && (Math.min(b.right, v.right) > card.right + 0.5 || Math.max(b.left, v.left) < card.left - 0.5))
      out.push(n.getAttribute("class") || n.localName);
  }
  const isCut = (n) => n.scrollWidth > n.clientWidth + 1;
  const name = root.querySelector(".header .name");
  const tn = (name.querySelector("span") ?? name).firstChild;
  const range = document.createRange();
  range.setStart(tn, 0);
  range.setEnd(tn, Math.min(4, tn.length));
  const values = [
    ...root.querySelectorAll(".person .where .chip .txt, .person .facts > span, .header .sub"),
  ].filter((n) => n.textContent.trim());
  return {
    out,
    title: name.clientWidth >= Math.ceil(range.getBoundingClientRect().width),
    cut: values.filter(isCut).map((n) => n.textContent.trim()),
  };
};
for (const [type, widths] of [
  ["presence-card", [234, 245, 273]],
  ["presence-mini-card", [156, 178, 245]],
])
  for (const width of widths)
    for (const lang of ["en", "pl", "sr-Latn", "uk", "hu", "el"])
      for (const theme of ["light", "dark"])
        for (const state of ["normal", "unavailable"]) {
          test(`${type} ${lang} ${theme} ${state} at ${width}px: nothing out of the card, no value cut`, async (t) => {
            if (skip) return t.skip(skip);
            const states = state === "normal" ? MOCK : unavailable();
            const r = await inPage({ type, width, lang, theme, states }, fit);
            assert.deepEqual(r, { out: [], title: true, cut: [] });
          });
        }

// The mini card zoomed in keeps the compact card's cell (6 of 12 columns on a phone, about 156-178 px): the
// full card's rows must stay readable there too. Nothing leaves the card, the title keeps four characters, no
// name, zone / state chip, distance, battery or summary is cut, and a duration is never broken inside a word
// (at most two lines).
const zoomedFit = async (el) => {
  const raf = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  el.shadowRoot.querySelector(".zoom").click();
  await raf();
  const root = el.shadowRoot;
  const r = globalThis.__fit(el);
  const cut = (n) => n.scrollWidth > n.clientWidth + 1;
  const names = [...root.querySelectorAll(".person .pname")].filter(cut).map((n) => n.textContent.trim());
  const since = [...root.querySelectorAll(".person .since")]
    .filter((n) => n.getBoundingClientRect().height > 2 * parseFloat(getComputedStyle(n).lineHeight || 16) + 1 || n.getBoundingClientRect().height > 34)
    .map((n) => n.textContent.trim());
  // The header's buttons and chip, which the card's overflow would hide rather than show outside it.
  const card = root.querySelector("ha-card").getBoundingClientRect();
  const header = [...root.querySelectorAll(".header > *")]
    .filter((n) => n.getBoundingClientRect().width && n.getBoundingClientRect().right > card.right + 0.5)
    .map((n) => n.getAttribute("class"));
  // Each row's content stays in its row (the card's overflow would hide a battery past its edge).
  const rows = [];
  for (const row of root.querySelectorAll(".person")) {
    const rb = row.getBoundingClientRect();
    for (const n of row.querySelectorAll(".facts > span, .where > *, .pname"))
      if (n.getBoundingClientRect().right > rb.right + 0.5) rows.push(n.textContent.trim());
  }
  return { ...r, zoomed: !!root.querySelector(".content"), names, since, header, rows };
};
for (const width of [156, 178, 245])
  for (const lang of ["en", "pl", "sr-Latn", "uk", "hu", "el"])
    for (const theme of ["light", "dark"])
      for (const state of ["normal", "unavailable"]) {
        test(`presence-mini-card zoomed in, ${lang} ${theme} ${state} at ${width}px: rows readable, nothing out of the card`, async (t) => {
          if (skip) return t.skip(skip);
          const states = state === "normal" ? MOCK : unavailable();
          const r = await inPage(
            { type: "presence-mini-card", width, lang, theme, states },
            `(el) => { globalThis.__fit = ${fit.toString()}; return (${zoomedFit.toString()})(el); }`
          );
          assert.deepEqual(r, { out: [], title: true, cut: [], zoomed: true, names: [], since: [], header: [], rows: [] });
        });
      }

// Two cards in a grid of two equal columns (layout-card, grid or horizontal stack) at a phone's width, each
// card directly in the grid or wrapped in a div: each card shrinks to its column, nothing overflows the grid.
// And in a box sized by its content, wrapped in a div, the card keeps a usable width.
for (const [type, zoom] of [
  ["presence-card", false],
  ["presence-mini-card", false],
  ["presence-mini-card", true],
])
  for (const wrapped of [false, true]) {
    for (const width of [320, 360, 500])
      test(`${type}${zoom ? " zoomed in" : ""} in a 1fr 1fr grid of ${width}px${wrapped ? " (in a div)" : ""}: shrinks to its column`, async (t) => {
        if (skip) return t.skip(skip);
        const r = await inPage(
          { type, width, rootStyle: "display:grid;grid-template-columns:1fr 1fr;gap:8px" },
          `async (el) => {
            const root = document.getElementById("root");
            const second = document.createElement(el.localName);
            second.setConfig(el._config);
            root.append(second);
            second.hass = el.hass;
            if (${wrapped}) for (const c of [el, second]) { const d = document.createElement("div"); c.replaceWith(d); d.append(c); }
            const raf = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
            await raf();
            if (${zoom}) for (const c of [el, second]) c.shadowRoot.querySelector(".zoom").click();
            await raf();
            const rb = root.getBoundingClientRect();
            return { widths: [el, second].map((c) => Math.round(c.getBoundingClientRect().width)), over: Math.round(Math.max(0, ...[el, second].map((c) => c.getBoundingClientRect().right - rb.right))), scroll: root.scrollWidth - root.clientWidth };
          }`
        );
        const col = Math.round((width - 8) / 2);
        assert.deepEqual(r, { widths: [col, col], over: 0, scroll: 0 });
      });
    if (wrapped)
      for (const wrap of ["display:inline-block", "display:grid;grid-template-columns:auto"])
        test(`${type}${zoom ? " zoomed in" : ""} in a div in a content-sized box (${wrap}) keeps a usable width`, async (t) => {
          if (skip) return t.skip(skip);
          const r = await inPage(
            { type, width: "auto", rootStyle: wrap },
            `async (el) => {
              const d = document.createElement("div"); el.replaceWith(d); d.append(el);
              const raf = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
              await raf();
              if (${zoom}) el.shadowRoot.querySelector(".zoom").click();
              await raf();
              return Math.round(el.getBoundingClientRect().width);
            }`
          );
          assert.ok(r >= 200, `${r}px`);
        });
  }
