// Browser test (Chromium through Playwright) of morph(), the in-place DOM patch shared by the cards:
// rows carrying a data-key are matched by key, so a reordered list keeps each focused row with its own
// data, and the patched DOM always matches a fresh render. Skipped when Playwright or Chromium is not
// installed, except in CI, where it must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { source } from "./source.mjs";

const src = source;
const start = src.indexOf("// Patch the shadow DOM in place");
const end = src.indexOf("patchChildren(root, tpl.content);\n};\n", start);
const MORPH = `${src.slice(start, end)}patchChildren(root, tpl.content);\n};\nwindow.morph = morph;`;

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

const open = async ({ noMoveBefore = false } = {}) => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent("<!doctype html><body><div id=host></div></body>");
  // Older browsers: no moveBefore, a moved node loses the focus. The shadow root inherits it from DocumentFragment.
  if (noMoveBefore) {
    await page.addScriptTag({
      content: "for (const c of [Element, DocumentFragment, Document]) delete c.prototype.moveBefore;",
    });
  }
  await page.addScriptTag({ content: MORPH });
  await page.evaluate(() => {
    window.root = document.getElementById("host").attachShadow({ mode: "open" });
    window.row = (k, extra = "") =>
      `<div class="item" data-key="${k}"><span>${k}</span>${extra}<button data-entity="switch.${k}" data-key="toggle">x</button></div>`;
    window.list = (keys, extra) => `<style>p{}</style><div class="list">${keys.map((k) => row(k, extra?.[k])).join("")}</div>`;
    window.fresh = (html) => {
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      const d = document.createElement("div");
      d.append(tpl.content.cloneNode(true));
      return d.innerHTML;
    };
  });
  return { page, errors };
};

test("morph matches keyed rows by key: the focused row keeps its data after a reorder", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const r = await page.evaluate(() => {
    morph(root, list(["a", "b", "c", "d"]));
    const btn = root.querySelector('[data-entity="switch.b"]');
    btn.focus();
    const html = list(["d", "c", "b", "a"], { c: "<em>new</em>" });
    morph(root, html);
    return {
      same: root.querySelector('[data-entity="switch.b"]') === btn,
      focused: root.activeElement?.dataset.entity ?? null,
      faithful: root.innerHTML === fresh(html),
    };
  });
  await page.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(r, { same: true, focused: "switch.b", faithful: true });
});

test("without moveBefore the focus never lands on another row", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open({ noMoveBefore: true });
  const r = await page.evaluate(() => {
    morph(root, list(["a", "b", "c", "d"]));
    root.querySelector('[data-entity="switch.b"]').focus();
    const html = list(["b", "a", "c", "d"].reverse());
    morph(root, html);
    return {
      focused: root.activeElement?.dataset.entity ?? null,
      faithful: root.innerHTML === fresh(html),
      moveBefore: "moveBefore" in root || "moveBefore" in document.createElement("div"),
    };
  });
  await page.close();
  assert.deepEqual(errors, []);
  assert.equal(r.moveBefore, false, "moveBefore still reachable");
  assert.ok(r.focused === null || r.focused === "switch.b", `focus moved to ${r.focused}`);
  assert.equal(r.faithful, true);
});

test("morph output matches a fresh render over random keyed and unkeyed updates", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const r = await page.evaluate(() => {
    let seed = 7;
    const rnd = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const pool = ["a", "b", "c", "d", "e", "f", "g"];
    let mismatches = 0;
    let badNs = 0;
    for (let i = 0; i < 300; i++) {
      const keys = pool.filter(() => rnd(3) > 0).sort(() => rnd(3) - 1);
      const extra = Object.fromEntries(keys.filter(() => rnd(4) === 0).map((k) => [k, `<b>${i}</b>`]));
      const unkeyed = rnd(2) ? `<p class="u${rnd(3)}">${i}</p>` : "<span>x</span><span>y</span>";
      const svg = `<svg viewBox="0 0 24 24"><path d="M${rnd(9)} 0"/></svg>`;
      const html = `${rnd(2) ? svg : ""}${list(keys, extra)}${unkeyed}${rnd(2) ? row("z") : ""}`;
      morph(root, html);
      if (root.innerHTML !== fresh(html)) mismatches++;
      badNs += [...root.querySelectorAll("svg *")].filter((n) => n.namespaceURI !== "http://www.w3.org/2000/svg").length;
    }
    return { mismatches, badNs };
  });
  await page.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(r, { mismatches: 0, badNs: 0 });
});
