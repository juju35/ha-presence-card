# Changelog

## 1.5.1
### Fixed
- A photo path with spaces, parentheses or an apostrophe (e.g. `/local/people/Jean Pierre.jpg`, `/local/photo (2).jpg`) now loads: these characters are percent-encoded instead of being stripped, which broke the image.
- A numeric `name` in YAML (e.g. `name: 2024`) no longer breaks the card when sorting by name.
- Visual editor: a Home Assistant state update no longer re-renders the whole form while editing.
- German: the day unit reads "Tg." instead of "T"; Spanish: the distance tooltip reads "de casa".

### Maintenance
- CI: fork-safe Screenshots checkout, time-boxed and retried Chromium install in every workflow, Playwright range aligned with the tested version; the Screenshots workflow re-runs Lint, Validate and HACS on its own screenshot commit.

## 1.5.0
### Added
- German and Spanish translations (`de`, `es`), also selectable in the visual editor's language option.

## 1.4.1
### Fixed
- Visual editor: editing a card no longer drops the per-person `name` / `picture` set in YAML (the entity list was flattened to plain ids on the first change).
- Mini card: the avatar fitting no longer goes negative with no one to show, and accounts for the zoom button's real footprint.
- The battery button has an accessible label.

### Changed
- Performance: the list of people is computed once per state update instead of re-scanning and sorting all entities on every refresh, and the minute timer no longer runs when `show_since` is off.

### Maintenance
- README: Lint badge and a note on the zoomed card's size in sections views.
- CI: release gated on tests, Screenshots workflow added, deterministic screenshot capture, unused ruff tooling removed.

## 1.4.0
### Security
- Escape the photo URL for the CSS `url()` context. `_avatar()` injected a person's photo URL (`entity_picture`, or a configured `picture`) into `url('…')` inside a `style` attribute using HTML escaping only. The browser decodes HTML entities in a `style` attribute before parsing CSS, so an escaped quote reverted to `'` at CSS-parse time, closed the `url('…')` string and allowed extra CSS declarations to be injected (e.g. a `background-image` to a third-party server usable as a tracking beacon). A new `cssUrl()` helper strips quotes, parentheses, backslashes and spaces before HTML-escaping, keeping the `url('…')` string closed. Low practical impact (the URL comes from a trusted source in most installs), but a valid, no-cost defense in depth.

## 1.3.0
### Changed
- Header logo on a round tinted badge (40 px, 32 px on the mini card) in the card's accent color, like the other ha-* cards.
- Header spacing like the other cards: the mini card's icon sits 12 px from the top edge (was 13.5 px), and the people list starts 8 px under the header box (the header no longer carries a 4 px bottom padding; same spacing on screen).

### Maintenance
- Screenshots: English everywhere (no more French dark shots), on the shared 16 px frame and theme tokens.

## 1.2.1

### Changed
- **Presence Mini Card**: the avatars leave the title row as soon as the title and the summary would no longer fit there in full, measured on the card's actual width (and again when it is resized), instead of an estimated width that could cut the summary.

## 1.2.0

### Changed
- **Presence Mini Card**: same layout as the Alarm mini card, on a single row centered vertically: the logo, the title with the summary in color under it ("● Everyone is home"), the round avatars with their badge (name and place on hover) and the detail button. On a narrow card the avatars wrap under the title.

### Removed
- `show_names` (mini card): the names are in the avatars' tooltip.

## 1.1.0

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
