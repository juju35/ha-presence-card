// Browser test (Chromium through Playwright) of the cards on state updates: Home Assistant sends a new hass on every
// state change of the instance, and a card rewritten at each one makes the dashboard jump. Updates of an entity the
// card does not show change nothing in its DOM; updates of its people's phones (battery, position) and distances patch it in place (no
// element added or removed, the avatars and the illustration are the same nodes) and its height holds on every frame,
// on the full card and the mini card (compact and zoomed). Skipped when Playwright or Chromium is not installed,
// except in CI, where it must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { NOW, states } from "../scripts/mock-states.mjs";

const SRC = readFileSync(new URL("../src/presence-card.js", import.meta.url), "utf8");
// Home Assistant's <ha-card> is a Lit element: it renders its slot a few microtasks after it is attached, so that a
// card rewritten from scratch measured its header (the status pill) in an empty frame. A plain stand-in hides that;
// this one renders late, like Lit.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { connectedCallback() { if (this.shadowRoot) return;
  const r = this.attachShadow({ mode: "open" });
  Promise.resolve().then(() => Promise.resolve()).then(() => { r.innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; }); } });`;

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

const trackers = Object.keys(states).filter((i) => i.startsWith("device_tracker."));
const distances = Object.keys(states).filter((i) => i.startsWith("sensor.") && i.endsWith("_distance"));
const unrelated = Array.from({ length: 10 }, (_, i) => ({ "sensor.other": { entity_id: "sensor.other", state: String(i), attributes: {} } }));
// A phone's battery, a distance to home and a position: what changes all day long.
const relevant = Array.from({ length: 10 }, (_, i) => {
  const t = trackers[i % trackers.length];
  const d = distances[i % distances.length];
  const a = states[t].attributes;
  return {
    [t]: { ...states[t], attributes: { ...a, battery_level: a.battery_level - i, latitude: a.latitude + i * 0.001 } },
    [d]: { ...states[d], state: String(Number(states[d].state) + i * 37) },
  };
});

test("state updates patch the cards in place: nothing for others' entities, no node replaced, a steady height", async (t) => {
  if (skip) return t.skip(skip);
  assert.ok(trackers.length && distances.length, "the mock has trackers and distances");
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  await page.clock.setFixedTime(NOW);
  await page.setContent("<!doctype html><meta charset=utf-8><body style='margin:0;font-family:Arial,sans-serif;font-size:14px'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: SRC });
  const failures = await page.evaluate(
    async ({ base, unrelated, relevant }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(r));
      const out = [];
      for (const [type, zoom] of [["presence-card", false], ["presence-mini-card", false], ["presence-mini-card", true]]) {
        const what = `${type}${zoom ? " zoomed" : ""}`;
        const box = document.body.appendChild(document.createElement("div"));
        box.style.width = "400px";
        let states = { ...base, "sensor.other": { entity_id: "sensor.other", state: "x", attributes: {} } };
        const el = document.createElement(type);
        el.setConfig({ type: `custom:${type}` });
        const push = (patch) => {
          states = { ...states, ...patch };
          el.hass = { states, language: "en", locale: { language: "en" }, config: { unit_system: { length: "km" } } };
        };
        push({});
        box.appendChild(el);
        await frame();
        if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
        const mount = new Set();
        for (let i = 0; i < 3; i++) {
          await frame();
          mount.add(Math.round(el.getBoundingClientRect().height * 10) / 10);
        }
        if (mount.size !== 1) out.push(`${what}: height moved after it was shown: ${[...mount].join(" → ")}`);
        const r = el.shadowRoot;
        const nodes = [...r.querySelectorAll("*")];
        const height = el.getBoundingClientRect().height;
        const muts = [];
        new MutationObserver((l) => muts.push(...l)).observe(r, { subtree: true, childList: true, attributes: true, characterData: true });
        for (const p of unrelated) {
          push(p);
          await frame();
        }
        await new Promise((res) => setTimeout(res));
        if (muts.length) out.push(`${what}: ${muts.length} mutations on updates of another entity`);
        const heights = new Set();
        for (const p of relevant) {
          push(p);
          for (let f = 0; f < 3; f++) {
            heights.add(Math.round(el.getBoundingClientRect().height * 10) / 10);
            await frame();
          }
        }
        await new Promise((res) => setTimeout(res));
        const changed = muts.filter((m) => m.type === "childList" && [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1));
        if (changed.length) out.push(`${what}: ${changed.length} element insertions/removals on updates of its people`);
        const gone = nodes.filter((n) => !n.isConnected).map((n) => n.localName);
        if (gone.length) out.push(`${what}: nodes replaced: ${[...new Set(gone)].join(", ")}`);
        if (heights.size !== 1 || !heights.has(Math.round(height * 10) / 10)) out.push(`${what}: height moved: ${height} → ${[...heights].join(", ")}`);
        box.remove();
      }
      return out;
    },
    { base: states, unrelated, relevant },
  );
  await page.close();
  assert.deepEqual(failures, []);
});
