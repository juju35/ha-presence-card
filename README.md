# ha-presence-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-presence-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-presence-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-presence-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-presence-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-presence-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-presence-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-presence-card)](https://github.com/juju35/ha-presence-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-presence-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

Lovelace cards for Home Assistant showing the people of the house and where they are: at home, in a zone or away, since when, how far from home and their phone battery.

The cards read the [`person`](https://www.home-assistant.io/integrations/person/) entities: no integration to install, every person is **found automatically**.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-presence-card&category=plugin)

| Presence Card | Presence Mini Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card.png" alt="presence-card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card.png" alt="presence-mini-card" width="400"> |

## Features

- Two cards: a full **Presence Card** and a compact **Presence Mini Card**
- Mini card on a single row, like the Alarm mini card: logo, title, summary in color and round avatars (name and place on hover); the avatars go under the title as soon as the title and summary would no longer fit in full next to them
- Zoom button at the top right of the mini card: it switches to the full card and back; a click anywhere outside the card brings the compact view back
- All `person` entities by default, or a chosen list, with an optional name or picture per person
- Person picture, or colored initials when the person has none
- Badge and color per state: home (green), zone (blue, with the zone name), away (grey), unknown (orange)
- How long each person has been there ("for 3 h 12 min"), refreshed every minute
- Distance from home for people away, in km or miles following the Home Assistant unit system
- Phone battery, found automatically: battery sensor of the tracker's device (Companion app) or the tracker's battery attribute; orange at 40 %, red at 20 %
- Header summary: "2 of 4 at home", "Everyone is home", "Nobody home"
- People at home first, by name, or as listed
- **Last 24 hours**: a folded section under the people with their movements of the day — arrivals home, departures, arrivals in and departures from a zone, with the time — read from the history when unfolded; it folds back on a click elsewhere
- Click a person or a battery to open its more-info dialog
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency

## Prerequisites

Home Assistant 2024.8 or later, with people set up in **Settings → People** (each with a device tracker for the location).

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-presence-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-presence-card` — Type: **Dashboard**
3. Open **Presence Card** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `presence-card.js` from the [latest release](https://github.com/juju35/ha-presence-card/releases/latest)
2. Copy it to `/config/www/presence-card.js`
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/presence-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Visual editor

Edit a dashboard, click **Add card** and search for **Presence Card** or **Presence Mini Card**. Every person is shown by default; pick some in the list to restrict it, set an optional title, the order, what to display and the language. Options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:presence-card
```

```yaml
type: custom:presence-mini-card
```

### Full options

```yaml
type: custom:presence-card
entities:
  - person.alex
  - entity: person.sam
    name: Sam
    picture: /local/sam.jpg
title: Family
sort: presence
show_since: true
show_distance: true
show_battery: true
show_away: true
language: fr
```

```yaml
type: custom:presence-mini-card
entities:
  - person.alex
  - person.sam
title: Family
sort: presence
show_away: true
zoom: true
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `entities` | both | All people | People to show: `person` entity ids, or objects with `entity` and an optional `name` and `picture` |
| `title` | both | Presence | Card title |
| `sort` | both | `presence` | Order: `presence` (at home, then in a zone, then away), `name`, or `config` (as listed) |
| `show_since` | both | `true` | How long each person has been in their current state |
| `show_distance` | both | `true` | Distance from home for people away |
| `show_battery` | both | `true` | Phone battery |
| `show_away` | both | `true` | Show the people away (`false` keeps only people at home or in a zone) |
| `show_moves` | both | `true` | Folded **Last 24 hours** section with the arrivals and departures from the history (`false` removes it) |
| `zoom` | mini | `true` | Zoom button at the top right: switches to the full card and back (`false` removes it) |
| `language` | both | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings; `pt-BR` uses `pt`) |

`show_since`, `show_distance`, `show_battery` and `show_moves` apply to the mini card once zoomed in.

Note for the sections view: Lovelace sizes the cell when the dashboard loads and offers no way for a card to ask for a resize afterwards, so the zoomed-in mini card keeps the compact card's cell and simply grows taller inside it.

## Screenshots

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card.png" alt="card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card-dark.png" alt="card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card.png" alt="mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card-zoom.png" alt="mini card zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card zoomed in dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card-moves.png" alt="card with the last 24 hours unfolded" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-presence-card/main/screenshots/card-moves-dark.png" alt="card with the last 24 hours unfolded, dark" width="400"> |

## How it works

- **State**: `home` is at home, `not_home` is away, `unknown` / `unavailable` is unknown, any other state is the name of the zone the person is in.
- **Since**: the `last_changed` time of the person entity.
- **Distance**: great-circle distance between the person's `latitude` / `longitude` and `zone.home`.
- **Battery**: for each tracker of the person (the one in use first), the battery sensor of the same device (`sensor.*_battery_level` or `sensor.*_battery`, as created by the Companion app), else the tracker's `battery_level` / `battery` attribute.

## Development

```bash
npm install
npm run build        # bundles src/presence-card.js into dist/presence-card.js
npm run check        # builds and checks the card (run in CI)
npm test             # unit and browser tests
npm run screenshots  # renders the cards with mock data (scripts/mock-states.mjs) into screenshots/
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-presence-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `presence-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-presence-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
