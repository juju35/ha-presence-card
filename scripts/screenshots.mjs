// Renders the cards with mock people and saves the README screenshots.
// Usage: npm run build && npm run screenshots
// Then records the header animations into screenshots/*.gif, light and dark (needs ffmpeg).
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NOW, states } from "./mock-states.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardJs = readFileSync(`${root}dist/presence-card.js`, "utf8");

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-in for Home Assistant's <ha-card>.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

const shots = [
  { file: "card", type: "presence-card", theme: "light", width: 460, config: {} },
  { file: "card-dark", type: "presence-card", theme: "dark", width: 460, config: {} },
  { file: "mini-card", type: "presence-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "presence-mini-card", theme: "dark", width: 380, config: {} },
  { file: "mini-card-zoom", type: "presence-mini-card", theme: "light", width: 460, config: {}, zoom: true },
  { file: "mini-card-zoom-dark", type: "presence-mini-card", theme: "dark", width: 460, config: {}, zoom: true },
  // The movements of the last 24 hours unfolded (history of the mock people).
  { file: "card-moves", type: "presence-card", theme: "light", width: 460, config: {}, moves: true },
  { file: "card-moves-dark", type: "presence-card", theme: "dark", width: 460, config: {}, moves: true },
];

// History behind the movements screenshot (history/history_during_period, compressed): the state of each
// mock person when the 24 h window opens, then their changes, seconds before NOW (oldest first).
const MOVES = Object.fromEntries(
  Object.entries({
    "person.robin": [["not_home", 24 * 3600], ["home", 22 * 3600]],
    "person.sam": [["not_home", 24 * 3600], ["home", 9 * 3600], ["not_home", 4 * 3600 + 1200], ["Work", 245 * 60]],
    "person.alex": [["not_home", 24 * 3600], ["home", 192 * 60]],
    "person.charlie": [["not_home", 24 * 3600], ["home", 6 * 3600], ["not_home", 47 * 60]],
  }).map(([id, rows]) => [id, rows.map(([s, ago]) => ({ s, lu: NOW / 1000 - ago }))])
);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

// Same picture as the file already there? Compared on the decoded pixels (in the browser), not on the
// PNG bytes, which can differ for an identical image (encoder, metadata): an unchanged screenshot is not
// rewritten, so a refresh commits only the images whose rendering really changed.
const samePixels = async (file, png) => {
  if (!existsSync(file)) return false;
  const page = await browser.newPage();
  const same = await page.evaluate(
    async ([a, b]) => {
      const decode = async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return { w: c.width, h: c.height, d: ctx.getImageData(0, 0, c.width, c.height).data };
      };
      const [x, y] = await Promise.all([decode(a), decode(b)]);
      if (x.w !== y.w || x.h !== y.h) return false;
      for (let i = 0; i < x.d.length; i++) if (x.d[i] !== y.d[i]) return false;
      return true;
    },
    [readFileSync(file).toString("base64"), png.toString("base64")]
  );
  await page.close();
  return same;
};
// Opens a fresh page and mounts shot `s` on it, settled; returns the page ready to capture.
const mount = async (s) => {
  // A fresh page for each capture: the card script declares its classes and custom elements once per page.
  // Fixed clock, time zone and locale: the "for 3 h" durations and any date do not depend on when or where it runs.
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 1000, height: 2000 },
    timezoneId: "Europe/Paris",
    locale: "en-US",
  });
  await page.clock.setFixedTime(NOW);
  page.on("pageerror", (err) => console.error(`${s.file}: ${err.message}`));
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, states, dark, zoom, moves }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = {
        states,
        language: "en",
        locale: { language: "en" },
        themes: { darkMode: dark },
        config: { unit_system: { length: "km" } },
        callWS: async () => moves || {},
      };
      document.getElementById("root").appendChild(el);
      if (moves) el.shadowRoot.querySelector(".moves-toggle").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
      // A mouse click (detail 1) on the zoom button: the zoomed-in view, without a keyboard focus ring.
      if (zoom)
        el.shadowRoot
          .querySelector(".zoom")
          .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
    },
    { type: s.type, config: s.config, states: s.states || states, dark: s.theme === "dark", zoom: !!s.zoom, moves: s.moves ? MOVES : null }
  );
  // Deterministic render signal instead of a fixed wait: fonts loaded, then two frame pairs so the
  // mini card's ResizeObserver `_fit` pass (which can re-render once) has settled before the capture.
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return page;
};

for (const s of shots) {
  const page = await mount(s);
  const box = await page.locator("#root").boundingBox();
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  await page.close();
  const file = `${root}screenshots/${s.file}.png`;
  if (await samePixels(file, png)) {
    console.log(`screenshots/${s.file}.png unchanged`);
    continue;
  }
  writeFileSync(file, png);
  console.log(`screenshots/${s.file}.png`);
}
// Animated captures: the full card's header, one GIF per state, light and dark. The CSS animations are paused and
// stepped frame by frame over a 6 s loop (one walk); each animation runs a whole number of its cycles in it (there and
// back for the alternating ones), so every GIF loops seamlessly whatever the machine's speed.
const FPS = 15;
const LOOP = 6000;
const away = Object.fromEntries(Object.entries(states).map(([id, st]) => [id, id.startsWith("person.") ? { ...st, state: "not_home" } : st]));
const GIFS = [
  // Somebody home: someone walks in through the door, the cloud drifts.
  { name: "anim-home", config: { illustration_theme: "day" } },
  // Nobody home: someone walks away from the house, the windows dark and no car.
  { name: "anim-away", config: { illustration_theme: "day" }, states: away },
  // Night picture: the stars twinkle.
  { name: "anim-night", config: { illustration_theme: "night" } },
];

// Pauses every CSS animation of the page (shadow trees walked by hand) at `frac` of the loop.
const freeze = (page, frac) =>
  page.evaluate(
    ({ f, loop }) => {
      const walk = (node) => [...node.querySelectorAll("*")].flatMap((el) => [...el.getAnimations(), ...(el.shadowRoot ? walk(el.shadowRoot) : [])]);
      for (const a of walk(document)) {
        const { duration, direction } = a.effect.getTiming();
        const cycle = direction.startsWith("alternate") ? 2 * duration : duration;
        a.pause();
        a.currentTime = (10 + f * Math.max(1, Math.round(loop / cycle))) * cycle;
      }
    },
    { f: frac, loop: LOOP }
  );

// Every decoded frame (RGBA) as ffmpeg's per-frame MD5 list: equal lists, same animation.
const decodedFrames = (file) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-pix_fmt", "rgba", "-f", "framemd5", "-"], { encoding: "utf8" })
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .join("\n");

for (const g of GIFS) {
  for (const theme of ["light", "dark"]) {
    const file = `${g.name}${theme === "dark" ? "-dark" : ""}`;
    const s = { file, type: "presence-card", theme, width: 460, config: g.config, states: g.states };
    const page = await mount(s);
    // The header with the 16 px of theme background around the card.
    const bottom = await page.evaluate(() => document.querySelector("#root > *").shadowRoot.querySelector(".banner").getBoundingClientRect().bottom);
    const clip = { x: 0, y: 0, width: s.width + 32, height: Math.ceil(bottom) };
    const dir = mkdtempSync(join(tmpdir(), "pr-frames-"));
    const frames = Math.round((FPS * LOOP) / 1000);
    for (let i = 0; i < frames; i++) {
      await freeze(page, i / frames);
      await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
    }
    await page.close();
    // A deterministic GIF (palette from the frames only, ordered dithering, bit-exact muxing), replacing the file in
    // place only when its decoded frames differ.
    const gif = join(dir, "out.gif");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
      "-vf", `scale=${s.width + 32}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
      "-fflags", "+bitexact", "-flags", "+bitexact", "-loop", "0", gif,
    ]);
    const target = `${root}screenshots/${file}.gif`;
    const same = existsSync(target) && decodedFrames(target) === decodedFrames(gif);
    if (!same) copyFileSync(gif, target);
    console.log(`screenshots/${file}.gif${same ? " unchanged" : ""}`);
    rmSync(dir, { recursive: true });
  }
}
await browser.close();
