// Mock Home Assistant states (people, trackers, zones), used to render the screenshots.
// Neutral names and drawn avatars only: no real people in the published screenshots.
// A fixed "now", also set as the page clock by the screenshot script: the same images on every run.
export const NOW = Date.parse("2026-10-25T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();

// A drawn avatar (head and shoulders on a colored disc), as a data URL like an uploaded picture.
const avatar = (bg, skin, hair) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><path d="M12 64c0-12 9-19 20-19s20 7 20 19Z" fill="#fff" opacity=".9"/><circle cx="32" cy="28" r="12" fill="${skin}"/><path d="M20 27c0-9 6-14 12-14s12 5 12 14c-3-5-8-7-12-7s-9 2-12 7Z" fill="${hair}"/></svg>`
  )}`;

const HOME = { latitude: 48.1173, longitude: -1.6778 };

const people = [
  { id: "alex", name: "Alex", state: "home", since: 192, picture: avatar("#8fa2ff", "#f1c7a3", "#4a3426"), battery: 78 },
  { id: "sam", name: "Sam", state: "Work", since: 245, at: [48.0856, -1.6458], picture: avatar("#7fd3c8", "#c98b62", "#1f1a17"), battery: 34 },
  { id: "charlie", name: "Charlie", state: "not_home", since: 47, at: [48.2154, -1.5622], battery: 15 },
  { id: "robin", name: "Robin", state: "home", since: 1510, battery: 92 },
];

export const states = {
  "zone.home": { entity_id: "zone.home", state: "2", attributes: { friendly_name: "Home", ...HOME, radius: 100 } },
  "zone.work": {
    entity_id: "zone.work",
    state: "1",
    attributes: { friendly_name: "Work", latitude: 48.0856, longitude: -1.6458, radius: 150 },
  },
};

for (const p of people) {
  const tracker = `device_tracker.${p.id}_phone`;
  const [latitude, longitude] = p.at ?? [HOME.latitude, HOME.longitude];
  states[tracker] = {
    entity_id: tracker,
    state: p.state,
    last_changed: ago(p.since),
    attributes: { source_type: "gps", latitude, longitude, battery_level: p.battery },
  };
  states[`person.${p.id}`] = {
    entity_id: `person.${p.id}`,
    state: p.state,
    last_changed: ago(p.since),
    attributes: {
      friendly_name: p.name,
      latitude,
      longitude,
      source: tracker,
      device_trackers: [tracker],
      ...(p.picture ? { entity_picture: p.picture } : {}),
    },
  };
}
