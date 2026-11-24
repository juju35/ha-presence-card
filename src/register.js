// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { PresenceCard } from "./full-card.js";
import { PresenceMiniCard } from "./mini-card.js";
import { PresenceCardEditor, PresenceMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("presence-card", PresenceCard);
define("presence-mini-card", PresenceMiniCard);
define("presence-card-editor", PresenceCardEditor);
define("presence-mini-card-editor", PresenceMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "presence-card",
    name: "Presence Card",
    description: "People of the house and where they are: home, zone or away, since when, distance and phone battery.",
  },
  {
    type: "presence-mini-card",
    name: "Presence Mini Card",
    description: "Compact presence overview: one avatar per person with a home / zone / away badge.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-presence-card" });
}

console.info(
  `%c PRESENCE-CARD %c v${VERSION} `,
  "color: white; background: #5b6cf0; font-weight: 700;",
  "color: #5b6cf0; background: white; font-weight: 700;"
);
