// The status pill in Chromium (skipped without it; CI runs it), in en, fr, de, hu, el and ru, from 190 to 500 px, on
// the full card and the mini card (compact and expanded): the pill sits right after the title only when
// the whole title and the whole label fit there (the title is then not cut), else on its own line under the subtitle
// (only when it could not fit beside the whole title); its label is whole or only its dot shows (always at 190 px);
// nothing of the title block goes over the banner's ground strip or out of the banner.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { states } from "../scripts/mock-states.mjs";

const source0 = readFileSync(new URL("../src/presence-card.js", import.meta.url), "utf8");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch(() => null);

const HA_CARD = `if (!customElements.get("ha-card")) customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });`;
const CARDS = [["presence-card", false, true], ["presence-mini-card", false, true], ["presence-mini-card", true, true], ["presence-card", false, false]];

test("status pill: beside the whole title when both fit, else under the subtitle, label whole or dot only, inside the banner", { skip: !browser && "no Chromium", timeout: 600000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  try {
    await page.setContent('<!doctype html><body style="margin:0;font-family:Roboto,Arial,sans-serif"></body>');
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: source0 });
    const failures = await page.evaluate(
      async ({ base, CARDS }) => {
        const frames = (n) => new Promise((r) => {
          const step = () => (n-- > 0 ? requestAnimationFrame(step) : r());
          step();
        });
        const full = (el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.max(el.scrollWidth, range.getBoundingClientRect().width);
        };
        const out = [];
        for (const lang of ["en", "fr", "de", "hu", "el", "ru"]) {
          const hass = { themes: {}, callService() {}, callWS: async () => ({}), ...base, language: lang, locale: { ...(base.locale || {}), language: lang } };
          for (const width of [190, 245, 300, 400, 460, 500]) {
            for (const [type, zoom, illustration] of CARDS) {
              for (const title of [undefined, "Home", "Everybody who lives in the big house by the river"]) {
                document.body.innerHTML = "";
                const box = document.body.appendChild(document.createElement("div"));
                box.style.width = `${width}px`;
                const card = document.createElement(type);
                card.setConfig({ type: `custom:${type}`, ...{}, ...(title ? { title } : {}), ...(illustration ? {} : { illustration: false }) });
                card.hass = hass;
                box.appendChild(card);
                await frames(2);
                const r = card.shadowRoot;
                if (zoom) r.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
                await frames(4);
                const tag = `${lang} ${type}${zoom ? " zoomed" : ""}${illustration ? "" : " classic"} ${width}px${title ? ` "${title.slice(0, 10)}"` : ""}`;
                const chip = [...r.querySelectorAll(".titles .chip")].find((c) => c.getClientRects().length);
                if (!chip) {
                  if (illustration) out.push(`${tag}: no pill`);
                  continue;
                }
                const text = chip.querySelector(".txt");
                const dotOnly = !text || getComputedStyle(text).display === "none";
                if (!dotOnly && (text.scrollWidth > text.clientWidth + 0.5 || text.clientWidth === 0)) out.push(`${tag}: label cut`);
                if (width <= 200 && !dotOnly) out.push(`${tag}: label shown at ${width}px`);
                const name = chip.closest(".titles").querySelector(".name");
                const nb = name.getBoundingClientRect();
                const cb = chip.getBoundingClientRect();
                const onRow = Math.abs(cb.top + cb.height / 2 - (nb.top + nb.height / 2)) < 3;
                if (onRow && full(name) > name.clientWidth + 1) out.push(`${tag}: title cut beside the pill`);
                if (onRow && cb.left - nb.right > 10.5) out.push(`${tag}: pill ${Math.round(cb.left - nb.right)}px after the title`);
                const room = name.closest(".titles").getBoundingClientRect().width;
                if (!onRow && full(name) + 8 + cb.width <= room - 1) out.push(`${tag}: pill under the subtitle although it fits beside the title`);
                const bannerEl = chip.closest(".banner");
                if (!bannerEl) continue;
                const banner = bannerEl.getBoundingClientRect();
                const ground = banner.bottom - 10;
                for (const el of [chip, name, ...chip.closest(".titles").querySelectorAll(".sub, .state")]) {
                  const b = el.getBoundingClientRect();
                  if (!b.height || getComputedStyle(el).display === "none") continue;
                  if (b.bottom > ground + 0.5 || b.top < banner.top - 0.5 || b.right > banner.right + 0.5 || b.left < banner.left - 0.5)
                    out.push(`${tag}: ${el.className} out of the banner or over the strip`);
                }
              }
            }
          }
        }
        return out;
      },
      { base: { states }, CARDS },
    );
    assert.deepEqual(failures, []);
  } finally {
    await page.close();
  }
});

test.after(() => browser?.close());
