// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { lang, t } from "./helpers.js";
import { normalize } from "./people.js";
import { STRINGS } from "./i18n/strings.js";

export class PresenceEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "entities", selector: { entity: { domain: "person", multiple: true } } },
      { name: "title", selector: { text: {} } },
      {
        name: "sort",
        selector: {
          select: {
            mode: "dropdown",
            options: ["presence", "name", "config"].map((v) => ({ value: v, label: tr(`sort_${v}`) })),
          },
        },
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })) },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name === "title" ? "title_option" : s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // The entity selector works on plain ids: restore the original entries (objects carrying
        // name/picture, configured in YAML) for the entities that were kept; new ones stay strings.
        if (Array.isArray(config.entities)) {
          const byId = new Map(
            (Array.isArray(this._config.entities) ? this._config.entities : []).map((e) => [typeof e === "string" ? e : e?.entity, e])
          );
          config.entities = config.entities.map((id) => byId.get(id) ?? id);
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values, defaults and toggles left on (their default).
          const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
          if (empty || (k === "sort" && v === "presence") || (k === "illustration_theme" && v === "auto") || (this.constructor.toggles.includes(k) && v === true)) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    // A state update only needs the new hass: rebuilding data and a fresh schema (new option arrays) on every one
    // would re-render the whole ha-form while editing. Reassign them only when the config or the language changed.
    const l = lang(this._hass, this._config);
    if (this._formConfig === this._config && this._formLang === l) return;
    this._formConfig = this._config;
    this._formLang = l;
    const data = { sort: "presence", illustration_theme: "auto", ...this._config, entities: normalize(this._config.entities).map((e) => e.entity) };
    for (const name of this.constructor.toggles) if (data[name] === undefined) data[name] = true;
    this._schemas ??= {};
    this._schemas[l] ??= this._schema();
    this._form.data = data;
    this._form.schema = this._schemas[l];
  }
}

export class PresenceCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["illustration", "show_title", "show_subtitle", "show_since", "show_distance", "show_direction", "show_travel", "show_battery", "show_away", "show_moves"];
  }
}

export class PresenceMiniCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["illustration", "show_title", "show_subtitle", "show_away", "show_since", "show_distance", "show_direction", "show_travel", "show_battery", "show_moves", "zoom"];
  }
}
