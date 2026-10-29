// Browser test (Chromium through Playwright) of the mini card's avatar fitting (`_fit`): the avatars go
// under the title when the card is too narrow and come back onto the title row when it widens again.
// Skipped when Playwright or Chromium is not installed, except in CI, where it must run. CHROMIUM_PATH
// points to a local Chromium if needed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

const SRC = readFileSync(new URL("../src/presence-card.js", import.meta.url), "utf8");

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

// One mini card in a resizable wrapper; `hostCss` styles the card element from outside (as a dashboard may).
const open = async (hostCss = "") => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    `<!doctype html><style>body{margin:0} presence-mini-card{${hostCss}}</style><body><div id=wrap style="width:300px"></div></body>`
  );
  await page.addScriptTag({ content: SRC });
  await page.evaluate(() => {
    const person = (id, state) => ({
      entity_id: `person.${id}`,
      state,
      last_changed: new Date().toISOString(),
      attributes: { friendly_name: id },
    });
    window.card = document.createElement("presence-mini-card");
    card.setConfig({ title: "Family" });
    card.hass = { states: { "person.ann": person("ann", "home"), "person.bob": person("bob", "not_home") }, language: "en" };
    document.getElementById("wrap").append(card);
  });
  // Width change, then two frames so the ResizeObserver callback and its re-render have run.
  const resize = (w) =>
    page.evaluate(async (px) => {
      document.getElementById("wrap").style.width = `${px}px`;
      for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
      return card._inline;
    }, w);
  return { page, errors, resize };
};

const widths = [300, 1000, 200, 1000, 300];

test("mini card: the avatars come back onto the title row when the card widens again", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors, resize } = await open("display:block");
  const seen = [];
  for (const w of widths) seen.push(await resize(w));
  await page.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(seen, [true, true, false, true, true]);
});

test("mini card: the fitting follows resizes without any outside styling of the card element", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors, resize } = await open();
  const seen = [];
  for (const w of widths) seen.push(await resize(w));
  const display = await page.evaluate(() => getComputedStyle(card).display);
  await page.close();
  assert.deepEqual(errors, []);
  assert.equal(display, "block");
  assert.deepEqual(seen, [true, true, false, true, true]);
});

test("mini card: no flip-flop on a width where the avatars only fit under the title", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors, resize } = await open("display:block");
  await resize(200);
  const r = await page.evaluate(async () => {
    let renders = 0;
    const orig = card._update.bind(card);
    card._update = (sig) => {
      renders++;
      return orig(sig);
    };
    card._fit();
    for (let i = 0; i < 3; i++) await new Promise((res) => requestAnimationFrame(res));
    return { renders, inline: card._inline };
  });
  await page.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(r, { renders: 0, inline: false });
});

test("mini card: a title too long for the row still sends the avatars under it, a shorter one brings them back", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors, resize } = await open("display:block");
  await resize(600);
  const r = await page.evaluate(async () => {
    const frames = async () => {
      for (let i = 0; i < 3; i++) await new Promise((res) => requestAnimationFrame(res));
    };
    card.setConfig({ title: "A very long dashboard title that cannot share its row with the avatars at all" });
    await frames();
    const long = card._inline;
    card.setConfig({ title: "Family" });
    await frames();
    return { long, short: card._inline };
  });
  await page.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(r, { long: false, short: true });
});
