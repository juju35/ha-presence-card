# Changelog

## Unreleased

### Changed
- **Presence Mini Card**: the avatars move up onto the header line when the card is wide enough for them (a wide card no longer leaves its header line half empty); on a narrow card they stay under the header.

## 1.0.0

First release of the Presence cards for Home Assistant.

| Presence Card | Presence Mini Card |
|---|---|
| ![presence-card](https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card.png) | ![presence-mini-card](https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card.png) |

### What's new
- **Presence Card** (`custom:presence-card`): one row per person with their picture (or initials), a home / zone / away badge, the place, how long they have been there, the distance from home and the phone battery.
- **Presence Mini Card** (`custom:presence-mini-card`): one avatar per person with the same badge, the name and the place; zoom button at the top right to switch to the full card and back.
- All `person` entities by default, or a chosen list (with an optional name or picture per person); people at home first, by name, or as listed.
- Summary in the header: "2 of 4 at home", "Everyone is home", "Nobody home".
- Phone battery found automatically: the battery sensor of the tracker's device (Companion app), or the tracker's own battery attribute.
- Click a person or a battery to open its more-info dialog.
- Visual editor for both cards, light and dark mode, English and French.
- Single file with no external dependency.

### Installation
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-presence-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-presence-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `presence-card.js` from the assets below to `/config/www/` and add `/local/presence-card.js` as a JavaScript Module resource.

### Quick start
```yaml
type: custom:presence-card
```

```yaml
type: custom:presence-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-presence-card#configuration).
