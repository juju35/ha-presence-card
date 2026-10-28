// Test loader: evaluates the card source (a plain script, as shipped in dist/) in an isolated context
// with minimal browser stubs, and returns the requested top-level bindings. The bundle is unchanged.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const load = (file, names) => {
  const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = { addEventListener() {}, innerHTML: "" };
      return this.shadowRoot;
    }
    dispatchEvent() {}
    appendChild() {}
  }
  const registry = new Map();
  const context = {
    HTMLElement,
    customElements: { get: (n) => registry.get(n), define: (n, c) => registry.set(n, c) },
    window: {},
    document: {
      addEventListener() {},
      removeEventListener() {},
      createElement: (tag) => ({
        tag,
        listeners: {},
        addEventListener(type, fn) {
          this.listeners[type] = fn;
        },
      }),
    },
    console: { info() {}, error() {}, log() {} },
    CustomEvent: class {
      constructor(type, opts = {}) {
        this.type = type;
        this.detail = opts.detail;
      }
    },
    Intl,
    Date,
  };
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
};
