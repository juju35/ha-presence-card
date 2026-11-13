/*
 * Presence Card for Home Assistant
 * https://github.com/juju35/ha-presence-card
 *
 * Lovelace cards showing the people of the house (person entities) and where they are:
 * at home, in a zone or away, since when, how far from home and their phone battery.
 */

const VERSION = "__VERSION__";

const ICONS = {
  // mdi:home, mdi:map-marker, mdi:walk, mdi:help, mdi:clock-outline, mdi:map-marker-distance
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  zone: "M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z",
  away: "M14.12,10H19V8.2H15.38L13.38,4.87C13.08,4.37 12.54,4.03 11.92,4.03C11.74,4.03 11.58,4.06 11.42,4.11L6,5.8V11H7.8V7.33L9.91,6.67L6,22H7.8L10.67,13.89L13,17V22H14.8V15.59L12.31,11.05L13.04,8.18M14,3.8C15,3.8 15.8,3 15.8,2C15.8,1 15,0.2 14,0.2C13,0.2 12.2,1 12.2,2C12.2,3 13,3.8 14,3.8Z",
  unknown:
    "M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  distance:
    "M6.5,8.11C5.61,8.11 4.89,7.39 4.89,6.5A1.61,1.61 0 0,1 6.5,4.89C7.39,4.89 8.11,5.61 8.11,6.5V6.5A1.61,1.61 0 0,1 6.5,8.11M6.5,2C4,2 2,4 2,6.5C2,9.87 6.5,14.86 6.5,14.86C6.5,14.86 11,9.87 11,6.5C11,4 9,2 6.5,2M17.5,8.11A1.61,1.61 0 0,1 15.89,6.5C15.89,5.61 16.61,4.89 17.5,4.89C18.39,4.89 19.11,5.61 19.11,6.5A1.61,1.61 0 0,1 17.5,8.11M17.5,2C15,2 13,4 13,6.5C13,9.87 17.5,14.86 17.5,14.86C17.5,14.86 22,9.87 22,6.5C22,4 20,2 17.5,2M17.5,16C16.23,16 15.1,16.8 14.68,18H9.32C8.77,16.44 7.05,15.62 5.5,16.17C3.93,16.72 3.11,18.44 3.66,20C4.22,21.56 5.93,22.38 7.5,21.83C8.35,21.53 9,20.85 9.32,20H14.69C15.24,21.56 16.96,22.38 18.5,21.83C20.08,21.27 20.9,19.56 20.35,18C19.92,16.8 18.78,16 17.5,16V16Z",
  // mdi:car-clock, the travel time home.
  travel:
    "M18 13C15.2 13 13 15.2 13 18S15.2 23 18 23 23 20.8 23 18 20.8 13 18 13M20.1 19.9L17.5 18.4V15H18.7V17.7L20.7 18.9L20.1 19.9M11.1 18H5V19C5 19.6 4.6 20 4 20H3C2.4 20 2 19.6 2 19V11L4.1 5C4.3 4.4 4.9 4 5.5 4H16.5C17.1 4 17.7 4.4 17.9 5L19.9 11.1C19.3 11 18.7 11 18 11C17.5 11 17 11 16.5 11.1C16.4 11 16.2 11 16.1 11H3.9L5.4 6.5H16.6L17.8 10.1C14.8 10.6 12.3 12.8 11.4 15.7M3.5 15C3.5 15.8 4.2 16.5 5 16.5S6.5 15.8 6.5 15 5.8 13.5 5 13.5 3.5 14.2 3.5 15Z",
  // mdi:chevron-right, the movements section's fold indicator (turned down when unfolded).
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's zoom button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  // mdi:home-import-outline, mdi:home-export-outline and mdi:pause-circle-outline: the Proximity direction of travel.
  towards: "M15 13L11 17V14H2V12H11V9L15 13M5 20V16H7V18H17V10.19L12 5.69L7.21 10H4.22L12 3L22 12H19V20H5Z",
  away_from: "M24 13L20 17V14H11V12H20V9L24 13M4 20V12H1L11 3L18 9.3V10H15.79L11 5.69L6 10.19V18H16V16H18V20H4Z",
  stationary:
    "M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z",
};

const STRINGS = {
  en: {
    title: "Presence",
    home: "Home",
    away: "Away",
    unknown: "Unknown",
    at_home: "{n} of {total} at home",
    all_home: "Everyone is home",
    nobody_home: "Nobody home",
    for: "for",
    just_now: "just now",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Battery",
    from_home: "from home",
    no_person: "No person found. Add people in Settings → People.",
    unknown_person: "Person not found",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    moves: "Last 24 hours",
    moved_home: "{name} arrived home",
    moved_away: "{name} left home",
    moved_zone: "{name} arrived at {zone}",
    left_zone: "{name} left {zone}",
    no_moves: "No movement in the last 24 hours",
    show_moves: "Show the movements of the last 24 hours",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    dir_towards: "Arriving",
    dir_away_from: "Leaving",
    dir_stationary: "Stationary",
    // Editor
    entities: "People (all by default)",
    title_option: "Title (optional)",
    sort: "Order",
    sort_presence: "At home first",
    sort_name: "By name",
    sort_config: "As listed",
    show_since: "Show since when",
    show_distance: "Show distance from home",
    show_direction: "Show direction of travel (Proximity)",
    show_battery: "Show phone battery",
    show_travel: "Show travel time home (travel_time option)",
    travel_home: "Travel time home",
    show_away: "Show people away",
    zoom: "Zoom button",
    zoom_helper: "Switches the mini card to the full card and back",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    title: "Présence",
    home: "Maison",
    away: "Absent",
    unknown: "Inconnu",
    at_home: "{n} sur {total} à la maison",
    all_home: "Tout le monde est là",
    nobody_home: "Personne à la maison",
    for: "depuis",
    just_now: "à l'instant",
    days: "j",
    hours: "h",
    minutes: "min",
    battery: "Batterie",
    from_home: "de la maison",
    no_person: "Aucune personne trouvée. Ajoutez des personnes dans Paramètres → Personnes.",
    unknown_person: "Personne introuvable",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    moves: "Dernières 24 heures",
    moved_home: "{name} est rentré·e",
    moved_away: "{name} est parti·e",
    moved_zone: "{name} est arrivé·e à {zone}",
    left_zone: "{name} a quitté {zone}",
    no_moves: "Aucun mouvement ces dernières 24 heures",
    show_moves: "Afficher les mouvements des dernières 24 heures",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    dir_towards: "En approche",
    dir_away_from: "S'éloigne",
    dir_stationary: "Immobile",
    entities: "Personnes (toutes par défaut)",
    title_option: "Titre (facultatif)",
    sort: "Ordre",
    sort_presence: "Présents d'abord",
    sort_name: "Par nom",
    sort_config: "Dans l'ordre de la liste",
    show_since: "Afficher depuis quand",
    show_distance: "Afficher la distance de la maison",
    show_direction: "Afficher le sens de déplacement (Proximité)",
    show_battery: "Afficher la batterie du téléphone",
    show_travel: "Afficher le temps de trajet jusqu'à la maison (option travel_time)",
    travel_home: "Temps de trajet jusqu'à la maison",
    show_away: "Afficher les absents",
    zoom: "Bouton zoom",
    zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    title: "Anwesenheit",
    home: "Zuhause",
    away: "Abwesend",
    unknown: "Unbekannt",
    at_home: "{n} von {total} zu Hause",
    all_home: "Alle sind zu Hause",
    nobody_home: "Niemand zu Hause",
    for: "seit",
    just_now: "gerade eben",
    days: "Tg.",
    hours: "Std.",
    minutes: "Min.",
    battery: "Akku",
    from_home: "von zu Hause",
    no_person: "Keine Person gefunden. Füge Personen unter Einstellungen → Personen hinzu.",
    unknown_person: "Person nicht gefunden",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    moves: "Letzte 24 Stunden",
    moved_home: "{name} ist nach Hause gekommen",
    moved_away: "{name} hat das Zuhause verlassen",
    moved_zone: "{name} ist bei {zone} angekommen",
    left_zone: "{name} hat {zone} verlassen",
    no_moves: "Keine Bewegung in den letzten 24 Stunden",
    show_moves: "Bewegungen der letzten 24 Stunden anzeigen",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    dir_towards: "Nähert sich",
    dir_away_from: "Entfernt sich",
    dir_stationary: "Stillstehend",
    entities: "Personen (standardmäßig alle)",
    title_option: "Titel (optional)",
    sort: "Reihenfolge",
    sort_presence: "Anwesende zuerst",
    sort_name: "Nach Name",
    sort_config: "Wie aufgelistet",
    show_since: "Seit wann anzeigen",
    show_distance: "Entfernung von zu Hause anzeigen",
    show_direction: "Bewegungsrichtung anzeigen (Nähe)",
    show_battery: "Handy-Akku anzeigen",
    show_travel: "Fahrzeit nach Hause anzeigen (Option travel_time)",
    travel_home: "Fahrzeit nach Hause",
    show_away: "Abwesende Personen anzeigen",
    zoom: "Zoom-Schaltfläche",
    zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    title: "Presencia",
    home: "En casa",
    away: "Fuera",
    unknown: "Desconocido",
    at_home: "{n} de {total} en casa",
    all_home: "Todos están en casa",
    nobody_home: "No hay nadie en casa",
    for: "desde hace",
    just_now: "ahora mismo",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Batería",
    from_home: "de casa",
    no_person: "No se encontró ninguna persona. Añade personas en Ajustes → Personas.",
    unknown_person: "Persona no encontrada",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    moves: "Últimas 24 horas",
    moved_home: "{name} llegó a casa",
    moved_away: "{name} salió de casa",
    moved_zone: "{name} llegó a {zone}",
    left_zone: "{name} salió de {zone}",
    no_moves: "Ningún movimiento en las últimas 24 horas",
    show_moves: "Mostrar los movimientos de las últimas 24 horas",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    dir_towards: "Acercándose",
    dir_away_from: "Alejándose",
    dir_stationary: "Sin moverse",
    entities: "Personas (todas por defecto)",
    title_option: "Título (opcional)",
    sort: "Orden",
    sort_presence: "Primero los que están en casa",
    sort_name: "Por nombre",
    sort_config: "Según la lista",
    show_since: "Mostrar desde cuándo",
    show_distance: "Mostrar la distancia desde casa",
    show_direction: "Mostrar la dirección de desplazamiento (Proximidad)",
    show_battery: "Mostrar la batería del teléfono",
    show_travel: "Mostrar el tiempo de viaje a casa (opción travel_time)",
    travel_home: "Tiempo de viaje a casa",
    show_away: "Mostrar a las personas ausentes",
    zoom: "Botón de zoom",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    title: "Присутност",
    home: "Код куће",
    away: "Одсутан",
    unknown: "Непознато",
    at_home: "{n} од {total} код куће",
    all_home: "Сви су код куће",
    nobody_home: "Нико није код куће",
    for: "већ",
    just_now: "управо сада",
    days: "д",
    hours: "ч",
    minutes: "мин",
    battery: "Батерија",
    from_home: "од куће",
    no_person: "Није пронађена ниједна особа. Додајте особе у Подешавања → Особе.",
    unknown_person: "Особа није пронађена",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    moves: "Последња 24 сата",
    moved_home: "{name}: долазак кући",
    moved_away: "{name}: одлазак од куће",
    moved_zone: "{name}: долазак у {zone}",
    left_zone: "{name}: одлазак из {zone}",
    no_moves: "Нема кретања у последња 24 сата",
    show_moves: "Прикажи кретања у последња 24 сата",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    dir_towards: "Приближава се",
    dir_away_from: "Удаљава се",
    dir_stationary: "Мирује",
    // Editor
    entities: "Особе (подразумевано све)",
    title_option: "Наслов (опционо)",
    sort: "Редослед",
    sort_presence: "Прво они који су код куће",
    sort_name: "По имену",
    sort_config: "Како је наведено",
    show_since: "Прикажи од када",
    show_distance: "Прикажи удаљеност од куће",
    show_direction: "Прикажи смер кретања (Близина)",
    show_battery: "Прикажи батерију телефона",
    show_travel: "Прикажи време пута до куће",
    travel_home: "Време пута до куће",
    show_away: "Прикажи одсутне особе",
    zoom: "Дугме за увећање",
    zoom_helper: "Пребацује мини картицу на пун приказ и назад",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    title: "Prisutnost",
    home: "Kod kuće",
    away: "Odsutan",
    unknown: "Nepoznato",
    at_home: "{n} od {total} kod kuće",
    all_home: "Svi su kod kuće",
    nobody_home: "Niko nije kod kuće",
    for: "već",
    just_now: "upravo sada",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Baterija",
    from_home: "od kuće",
    no_person: "Nije pronađena nijedna osoba. Dodajte osobe u Podešavanja → Osobe.",
    unknown_person: "Osoba nije pronađena",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    moves: "Poslednja 24 sata",
    moved_home: "{name}: dolazak kući",
    moved_away: "{name}: odlazak od kuće",
    moved_zone: "{name}: dolazak u {zone}",
    left_zone: "{name}: odlazak iz {zone}",
    no_moves: "Nema kretanja u poslednja 24 sata",
    show_moves: "Prikaži kretanja u poslednja 24 sata",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    dir_towards: "Približava se",
    dir_away_from: "Udaljava se",
    dir_stationary: "Miruje",
    // Editor
    entities: "Osobe (podrazumevano sve)",
    title_option: "Naslov (opciono)",
    sort: "Redosled",
    sort_presence: "Prvo oni koji su kod kuće",
    sort_name: "Po imenu",
    sort_config: "Kako je navedeno",
    show_since: "Prikaži od kada",
    show_distance: "Prikaži udaljenost od kuće",
    show_direction: "Prikaži smer kretanja (Blizina)",
    show_battery: "Prikaži bateriju telefona",
    show_travel: "Prikaži vreme puta do kuće (opcija travel_time)",
    travel_home: "Vreme puta do kuće",
    show_away: "Prikaži odsutne osobe",
    zoom: "Dugme za uvećanje",
    zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    title: "Presenza",
    home: "A casa",
    away: "Fuori",
    unknown: "Sconosciuto",
    at_home: "{n} su {total} a casa",
    all_home: "Sono tutti a casa",
    nobody_home: "Nessuno in casa",
    for: "da",
    just_now: "proprio ora",
    days: "g",
    hours: "h",
    minutes: "min",
    battery: "Batteria",
    from_home: "da casa",
    no_person: "Nessuna persona trovata. Aggiungi persone in Impostazioni → Persone.",
    unknown_person: "Persona non trovata",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    moves: "Ultime 24 ore",
    moved_home: "{name} è arrivato/a a casa",
    moved_away: "{name} è uscito/a di casa",
    moved_zone: "{name} è arrivato/a a {zone}",
    left_zone: "{name} ha lasciato {zone}",
    no_moves: "Nessun movimento nelle ultime 24 ore",
    show_moves: "Mostra i movimenti delle ultime 24 ore",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    dir_towards: "In avvicinamento",
    dir_away_from: "In allontanamento",
    dir_stationary: "Fermo",
    // Editor
    entities: "Persone (tutte per impostazione predefinita)",
    title_option: "Titolo (facoltativo)",
    sort: "Ordine",
    sort_presence: "Prima chi è a casa",
    sort_name: "Per nome",
    sort_config: "Come nell'elenco",
    show_since: "Mostra da quando",
    show_distance: "Mostra la distanza da casa",
    show_direction: "Mostra la direzione di spostamento (Prossimità)",
    show_battery: "Mostra la batteria del telefono",
    show_travel: "Mostra il tempo di viaggio verso casa (opzione travel_time)",
    travel_home: "Tempo di viaggio verso casa",
    show_away: "Mostra le persone fuori casa",
    zoom: "Pulsante zoom",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    title: "Aanwezigheid",
    home: "Thuis",
    away: "Afwezig",
    unknown: "Onbekend",
    at_home: "{n} van {total} thuis",
    all_home: "Iedereen is thuis",
    nobody_home: "Niemand thuis",
    for: "al",
    just_now: "zojuist",
    days: "d",
    hours: "u",
    minutes: "min",
    battery: "Batterij",
    from_home: "vanaf huis",
    no_person: "Geen personen gevonden. Voeg personen toe via Instellingen → Personen.",
    unknown_person: "Persoon niet gevonden",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    moves: "Laatste 24 uur",
    moved_home: "{name} is thuisgekomen",
    moved_away: "{name} is van huis vertrokken",
    moved_zone: "{name} is aangekomen bij {zone}",
    left_zone: "{name} heeft {zone} verlaten",
    no_moves: "Geen beweging in de laatste 24 uur",
    show_moves: "Bewegingen van de laatste 24 uur tonen",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    dir_towards: "Komt dichterbij",
    dir_away_from: "Gaat verder weg",
    dir_stationary: "Stilstaand",
    // Editor
    entities: "Personen (standaard allemaal)",
    title_option: "Titel (optioneel)",
    sort: "Volgorde",
    sort_presence: "Aanwezigen eerst",
    sort_name: "Op naam",
    sort_config: "Zoals opgegeven",
    show_since: "Sinds wanneer tonen",
    show_distance: "Afstand tot huis tonen",
    show_direction: "Reisrichting tonen (Nabijheid)",
    show_battery: "Batterij van de telefoon tonen",
    show_travel: "Reistijd naar huis tonen (optie travel_time)",
    travel_home: "Reistijd naar huis",
    show_away: "Afwezige personen tonen",
    zoom: "Zoomknop",
    zoom_helper: "Schakelt tussen de minikaart en de volledige kaart",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    title: "Presença",
    home: "Em casa",
    away: "Fora",
    unknown: "Desconhecido",
    at_home: "{n} de {total} em casa",
    all_home: "Estão todos em casa",
    nobody_home: "Ninguém em casa",
    for: "há",
    just_now: "agora mesmo",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Bateria",
    from_home: "de casa",
    no_person: "Nenhuma pessoa encontrada. Adicione pessoas em Definições → Pessoas.",
    unknown_person: "Pessoa não encontrada",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    moves: "Últimas 24 horas",
    moved_home: "{name} chegou a casa",
    moved_away: "{name} saiu de casa",
    moved_zone: "{name} chegou a {zone}",
    left_zone: "{name} saiu de {zone}",
    no_moves: "Nenhum movimento nas últimas 24 horas",
    show_moves: "Mostrar os movimentos das últimas 24 horas",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    dir_towards: "A aproximar-se",
    dir_away_from: "A afastar-se",
    dir_stationary: "Parado",
    // Editor
    entities: "Pessoas (todas por predefinição)",
    title_option: "Título (opcional)",
    sort: "Ordem",
    sort_presence: "Primeiro quem está em casa",
    sort_name: "Por nome",
    sort_config: "Pela ordem da lista",
    show_since: "Mostrar desde quando",
    show_distance: "Mostrar a distância a casa",
    show_direction: "Mostrar o sentido de deslocação (Proximidade)",
    show_battery: "Mostrar a bateria do telemóvel",
    show_travel: "Mostrar o tempo de viagem até casa (opção travel_time)",
    travel_home: "Tempo de viagem até casa",
    show_away: "Mostrar as pessoas ausentes",
    zoom: "Botão de zoom",
    zoom_helper: "Alterna entre o minicartão e o cartão completo",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    title: "Obecność",
    home: "W domu",
    away: "Poza domem",
    unknown: "Nieznany",
    at_home: "W domu: {n} z {total}",
    all_home: "Wszyscy są w domu",
    nobody_home: "Nikogo nie ma w domu",
    for: "od",
    just_now: "przed chwilą",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Bateria",
    from_home: "od domu",
    no_person: "Nie znaleziono żadnej osoby. Dodaj osoby w Ustawienia → Osoby.",
    unknown_person: "Nie znaleziono osoby",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    moves: "Ostatnie 24 godziny",
    moved_home: "{name}: powrót do domu",
    moved_away: "{name}: wyjście z domu",
    moved_zone: "{name}: przybycie do {zone}",
    left_zone: "{name}: wyjście z {zone}",
    no_moves: "Brak ruchu w ostatnich 24 godzinach",
    show_moves: "Pokaż ruchy z ostatnich 24 godzin",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    dir_towards: "Zbliża się",
    dir_away_from: "Oddala się",
    dir_stationary: "Bez ruchu",
    // Editor
    entities: "Osoby (domyślnie wszystkie)",
    title_option: "Tytuł (opcjonalnie)",
    sort: "Kolejność",
    sort_presence: "Najpierw obecni w domu",
    sort_name: "Według nazwy",
    sort_config: "Jak na liście",
    show_since: "Pokaż od kiedy",
    show_distance: "Pokaż odległość od domu",
    show_direction: "Pokaż kierunek ruchu (Bliskość)",
    show_battery: "Pokaż baterię telefonu",
    show_travel: "Pokaż czas dojazdu do domu (opcja travel_time)",
    travel_home: "Czas dojazdu do domu",
    show_away: "Pokaż osoby poza domem",
    zoom: "Przycisk powiększenia",
    zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
    language: "Język",
    lang_auto: "Automatycznie",
  },
  ro: {
    title: "Prezență",
    home: "Acasă",
    away: "Plecat",
    unknown: "Necunoscut",
    at_home: "{n} din {total} acasă",
    all_home: "Toți sunt acasă",
    nobody_home: "Nimeni acasă",
    for: "de",
    just_now: "chiar acum",
    days: "z",
    hours: "h",
    minutes: "min",
    battery: "Baterie",
    from_home: "de acasă",
    no_person: "Nicio persoană găsită. Adăugați persoane în Setări → Persoane.",
    unknown_person: "Persoana nu a fost găsită",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    moves: "Ultimele 24 de ore",
    moved_home: "{name} a ajuns acasă",
    moved_away: "{name} a plecat de acasă",
    moved_zone: "{name} a ajuns la {zone}",
    left_zone: "{name} a plecat de la {zone}",
    no_moves: "Nicio mișcare în ultimele 24 de ore",
    show_moves: "Afișează mișcările din ultimele 24 de ore",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    dir_towards: "Se apropie",
    dir_away_from: "Se îndepărtează",
    dir_stationary: "Staționar",
    // Editor
    entities: "Persoane (implicit toate)",
    title_option: "Titlu (opțional)",
    sort: "Ordine",
    sort_presence: "Mai întâi cei de acasă",
    sort_name: "După nume",
    sort_config: "Ca în listă",
    show_since: "Afișează de când",
    show_distance: "Afișează distanța față de casă",
    show_direction: "Afișează direcția de deplasare (Proximitate)",
    show_battery: "Afișează bateria telefonului",
    show_travel: "Afișează timpul de drum până acasă (opțiunea travel_time)",
    travel_home: "Timp de drum până acasă",
    show_away: "Afișează persoanele plecate",
    zoom: "Buton de zoom",
    zoom_helper: "Comută mini-cardul la cardul complet și înapoi",
    language: "Limbă",
    lang_auto: "Automat",
  },
  da: {
    title: "Til stede",
    home: "Hjemme",
    away: "Ude",
    unknown: "Ukendt",
    at_home: "{n} af {total} hjemme",
    all_home: "Alle er hjemme",
    nobody_home: "Ingen hjemme",
    for: "i",
    just_now: "lige nu",
    days: "d",
    hours: "t",
    minutes: "min",
    battery: "Batteri",
    from_home: "fra hjemmet",
    no_person: "Ingen personer fundet. Tilføj personer under Indstillinger → Personer.",
    unknown_person: "Personen blev ikke fundet",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    moves: "Seneste 24 timer",
    moved_home: "{name} kom hjem",
    moved_away: "{name} tog hjemmefra",
    moved_zone: "{name} ankom til {zone}",
    left_zone: "{name} forlod {zone}",
    no_moves: "Ingen bevægelse de seneste 24 timer",
    show_moves: "Vis bevægelserne de seneste 24 timer",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    dir_towards: "Nærmer sig",
    dir_away_from: "Fjerner sig",
    dir_stationary: "Stillestående",
    // Editor
    entities: "Personer (alle som standard)",
    title_option: "Titel (valgfri)",
    sort: "Rækkefølge",
    sort_presence: "Hjemme først",
    sort_name: "Efter navn",
    sort_config: "Som angivet",
    show_since: "Vis siden hvornår",
    show_distance: "Vis afstand fra hjemmet",
    show_direction: "Vis bevægelsesretning (Nærhed)",
    show_battery: "Vis telefonens batteri",
    show_travel: "Vis rejsetid hjem (indstillingen travel_time)",
    travel_home: "Rejsetid hjem",
    show_away: "Vis personer, der er ude",
    zoom: "Zoomknap",
    zoom_helper: "Skifter mellem minikortet og hele kortet",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    title: "Närvaro",
    home: "Hemma",
    away: "Borta",
    unknown: "Okänd",
    at_home: "{n} av {total} hemma",
    all_home: "Alla är hemma",
    nobody_home: "Ingen hemma",
    for: "i",
    just_now: "nyss",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Batteri",
    from_home: "från hemmet",
    no_person: "Inga personer hittades. Lägg till personer under Inställningar → Personer.",
    unknown_person: "Personen hittades inte",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    moves: "Senaste 24 timmarna",
    moved_home: "{name} kom hem",
    moved_away: "{name} lämnade hemmet",
    moved_zone: "{name} kom till {zone}",
    left_zone: "{name} lämnade {zone}",
    no_moves: "Ingen rörelse de senaste 24 timmarna",
    show_moves: "Visa rörelserna de senaste 24 timmarna",
    show_title: "Visa rubrik",
    show_subtitle: "Visa underrubrik",
    dir_towards: "Närmar sig",
    dir_away_from: "Avlägsnar sig",
    dir_stationary: "Stillastående",
    // Editor
    entities: "Personer (alla som standard)",
    title_option: "Rubrik (valfri)",
    sort: "Ordning",
    sort_presence: "Hemma först",
    sort_name: "Efter namn",
    sort_config: "Som i listan",
    show_since: "Visa sedan när",
    show_distance: "Visa avstånd hemifrån",
    show_direction: "Visa färdriktning (Närhet)",
    show_battery: "Visa telefonens batteri",
    show_travel: "Visa restid hem (alternativet travel_time)",
    travel_home: "Restid hem",
    show_away: "Visa personer som är borta",
    zoom: "Zoomknapp",
    zoom_helper: "Växlar mellan minikortet och hela kortet",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    title: "Присъствие",
    home: "Вкъщи",
    away: "Отсъства",
    unknown: "Неизвестно",
    at_home: "{n} от {total} вкъщи",
    all_home: "Всички са вкъщи",
    nobody_home: "Никой вкъщи",
    for: "от",
    just_now: "току-що",
    days: "д",
    hours: "ч",
    minutes: "мин",
    battery: "Батерия",
    from_home: "от дома",
    no_person: "Не са намерени хора. Добавете хора от Настройки → Хора.",
    unknown_person: "Лицето не е намерено",
    zoom_in: "Покажи цялата карта",
    zoom_out: "Обратно към компактния изглед",
    moves: "Последните 24 часа",
    moved_home: "{name}: прибиране у дома",
    moved_away: "{name}: излизане от дома",
    moved_zone: "{name}: пристигане в {zone}",
    left_zone: "{name}: напускане на {zone}",
    no_moves: "Няма движение през последните 24 часа",
    show_moves: "Покажи движенията от последните 24 часа",
    show_title: "Показване на заглавието",
    show_subtitle: "Показване на подзаглавието",
    dir_towards: "Приближава се",
    dir_away_from: "Отдалечава се",
    dir_stationary: "Неподвижен",
    // Editor
    entities: "Хора (по подразбиране всички)",
    title_option: "Заглавие (по избор)",
    sort: "Подредба",
    sort_presence: "Първо тези вкъщи",
    sort_name: "По име",
    sort_config: "Както са изброени",
    show_since: "Показвай от кога",
    show_distance: "Показвай разстоянието от дома",
    show_direction: "Показвай посоката на движение (Близост)",
    show_battery: "Показвай батерията на телефона",
    show_travel: "Показване на времето за път до вкъщи (опция travel_time)",
    travel_home: "Време за път до вкъщи",
    show_away: "Показвай отсъстващите",
    zoom: "Бутон за мащабиране",
    zoom_helper: "Превключва мини картата към пълната карта и обратно",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    title: "Присутствие",
    home: "Дома",
    away: "Не дома",
    unknown: "Неизвестно",
    at_home: "Дома: {n} из {total}",
    all_home: "Все дома",
    nobody_home: "Никого дома",
    for: "уже",
    just_now: "только что",
    days: "д",
    hours: "ч",
    minutes: "мин",
    battery: "Батарея",
    from_home: "от дома",
    no_person: "Люди не найдены. Добавьте людей в разделе Настройки → Люди.",
    unknown_person: "Человек не найден",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    moves: "Последние 24 часа",
    moved_home: "{name}: возвращение домой",
    moved_away: "{name}: уход из дома",
    moved_zone: "{name}: прибытие в {zone}",
    left_zone: "{name}: уход из {zone}",
    no_moves: "Нет перемещений за последние 24 часа",
    show_moves: "Показать перемещения за последние 24 часа",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    dir_towards: "Приближается",
    dir_away_from: "Удаляется",
    dir_stationary: "На месте",
    // Editor
    entities: "Люди (по умолчанию все)",
    title_option: "Заголовок (необязательно)",
    sort: "Порядок",
    sort_presence: "Сначала те, кто дома",
    sort_name: "По имени",
    sort_config: "Как в списке",
    show_since: "Показывать, с какого времени",
    show_distance: "Показывать расстояние от дома",
    show_direction: "Показывать направление движения (Близость)",
    show_battery: "Показывать заряд телефона",
    show_travel: "Показывать время в пути домой (параметр travel_time)",
    travel_home: "Время в пути домой",
    show_away: "Показывать отсутствующих",
    zoom: "Кнопка масштаба",
    zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    title: "Присутність",
    home: "Вдома",
    away: "Не вдома",
    unknown: "Невідомо",
    at_home: "Вдома: {n} з {total}",
    all_home: "Усі вдома",
    nobody_home: "Нікого вдома",
    for: "уже",
    just_now: "щойно",
    days: "д",
    hours: "год",
    minutes: "хв",
    battery: "Батарея",
    from_home: "від дому",
    no_person: "Людей не знайдено. Додайте людей у розділі Налаштування → Люди.",
    unknown_person: "Особу не знайдено",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    moves: "Останні 24 години",
    moved_home: "{name}: повернення додому",
    moved_away: "{name}: вихід з дому",
    moved_zone: "{name}: прибуття до {zone}",
    left_zone: "{name}: вихід з {zone}",
    no_moves: "Немає переміщень за останні 24 години",
    show_moves: "Показати переміщення за останні 24 години",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    dir_towards: "Наближається",
    dir_away_from: "Віддаляється",
    dir_stationary: "На місці",
    // Editor
    entities: "Люди (за замовчуванням усі)",
    title_option: "Заголовок (необовʼязково)",
    sort: "Порядок",
    sort_presence: "Спочатку ті, хто вдома",
    sort_name: "За іменем",
    sort_config: "Як у списку",
    show_since: "Показувати, відколи",
    show_distance: "Показувати відстань від дому",
    show_direction: "Показувати напрямок руху (Близькість)",
    show_battery: "Показувати заряд телефону",
    show_travel: "Показувати час у дорозі додому (параметр travel_time)",
    travel_home: "Час у дорозі додому",
    show_away: "Показувати відсутніх",
    zoom: "Кнопка масштабу",
    zoom_helper: "Перемикає міні-картку на повну картку й назад",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    title: "Jelenlét",
    home: "Otthon",
    away: "Távol",
    unknown: "Ismeretlen",
    at_home: "{total} közül {n} otthon",
    all_home: "Mindenki otthon",
    nobody_home: "Senki otthon",
    for: "már",
    just_now: "épp most",
    days: "n",
    hours: "ó",
    minutes: "p",
    battery: "Akkumulátor",
    from_home: "otthontól",
    no_person: "Nem található személy. Adjon hozzá személyeket a Beállítások → Személyek menüpontban.",
    unknown_person: "A személy nem található",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    moves: "Elmúlt 24 óra",
    moved_home: "{name} hazaért",
    moved_away: "{name} elment otthonról",
    moved_zone: "{name} megérkezett ide: {zone}",
    left_zone: "{name} elhagyta: {zone}",
    no_moves: "Nem volt mozgás az elmúlt 24 órában",
    show_moves: "Az elmúlt 24 óra mozgásainak megjelenítése",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    dir_towards: "Közeledik",
    dir_away_from: "Távolodik",
    dir_stationary: "Egy helyben",
    // Editor
    entities: "Személyek (alapértelmezés szerint mind)",
    title_option: "Cím (opcionális)",
    sort: "Sorrend",
    sort_presence: "Az otthon lévők elöl",
    sort_name: "Név szerint",
    sort_config: "A lista sorrendjében",
    show_since: "Mióta megjelenítése",
    show_distance: "Otthontól való távolság megjelenítése",
    show_direction: "Haladási irány megjelenítése (Közelség)",
    show_battery: "Telefon akkumulátorának megjelenítése",
    show_travel: "Utazási idő megjelenítése hazáig (travel_time beállítás)",
    travel_home: "Utazási idő hazáig",
    show_away: "Távol lévők megjelenítése",
    zoom: "Nagyítás gomb",
    zoom_helper: "Vált a mini kártya és a teljes kártya között",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    title: "Prítomnosť",
    home: "Doma",
    away: "Preč",
    unknown: "Neznámy",
    at_home: "Doma: {n} z {total}",
    all_home: "Všetci sú doma",
    nobody_home: "Nikto doma",
    for: "už",
    just_now: "práve teraz",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Batéria",
    from_home: "od domu",
    no_person: "Nenašli sa žiadne osoby. Pridajte osoby v Nastavenia → Osoby.",
    unknown_person: "Osoba sa nenašla",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    moves: "Posledných 24 hodín",
    moved_home: "{name}: príchod domov",
    moved_away: "{name}: odchod z domu",
    moved_zone: "{name}: príchod do {zone}",
    left_zone: "{name}: odchod z {zone}",
    no_moves: "Žiadny pohyb za posledných 24 hodín",
    show_moves: "Zobraziť pohyby za posledných 24 hodín",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnázov",
    dir_towards: "Približuje sa",
    dir_away_from: "Vzďaľuje sa",
    dir_stationary: "Stojí",
    // Editor
    entities: "Osoby (predvolene všetky)",
    title_option: "Názov (voliteľné)",
    sort: "Poradie",
    sort_presence: "Najprv tí, čo sú doma",
    sort_name: "Podľa mena",
    sort_config: "Podľa zoznamu",
    show_since: "Zobraziť od kedy",
    show_distance: "Zobraziť vzdialenosť od domu",
    show_direction: "Zobraziť smer pohybu (Blízkosť)",
    show_battery: "Zobraziť batériu telefónu",
    show_travel: "Zobraziť čas cesty domov (možnosť travel_time)",
    travel_home: "Čas cesty domov",
    show_away: "Zobraziť osoby mimo domu",
    zoom: "Tlačidlo priblíženia",
    zoom_helper: "Prepína mini kartu na celú kartu a späť",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    title: "Přítomnost",
    home: "Doma",
    away: "Pryč",
    unknown: "Neznámý",
    at_home: "Doma: {n} z {total}",
    all_home: "Všichni jsou doma",
    nobody_home: "Nikdo doma",
    for: "už",
    just_now: "právě teď",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Baterie",
    from_home: "od domova",
    no_person: "Nebyly nalezeny žádné osoby. Přidejte osoby v Nastavení → Lidé.",
    unknown_person: "Osoba nebyla nalezena",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    moves: "Posledních 24 hodin",
    moved_home: "{name}: příchod domů",
    moved_away: "{name}: odchod z domu",
    moved_zone: "{name}: příchod do {zone}",
    left_zone: "{name}: odchod z {zone}",
    no_moves: "Žádný pohyb za posledních 24 hodin",
    show_moves: "Zobrazit pohyby za posledních 24 hodin",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podnázev",
    dir_towards: "Přibližuje se",
    dir_away_from: "Vzdaluje se",
    dir_stationary: "Stojí",
    // Editor
    entities: "Lidé (ve výchozím stavu všichni)",
    title_option: "Název (volitelné)",
    sort: "Pořadí",
    sort_presence: "Nejdřív ti, kdo jsou doma",
    sort_name: "Podle jména",
    sort_config: "Podle seznamu",
    show_since: "Zobrazit od kdy",
    show_distance: "Zobrazit vzdálenost od domova",
    show_direction: "Zobrazit směr pohybu (Blízkost)",
    show_battery: "Zobrazit baterii telefonu",
    show_travel: "Zobrazit dobu cesty domů (volba travel_time)",
    travel_home: "Doba cesty domů",
    show_away: "Zobrazit nepřítomné osoby",
    zoom: "Tlačítko přiblížení",
    zoom_helper: "Přepíná mini kartu na celou kartu a zpět",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    title: "Prisotnost",
    home: "Doma",
    away: "Odsoten",
    unknown: "Neznano",
    at_home: "Doma: {n} od {total}",
    all_home: "Vsi so doma",
    nobody_home: "Nikogar doma",
    for: "že",
    just_now: "pravkar",
    days: "d",
    hours: "h",
    minutes: "min",
    battery: "Baterija",
    from_home: "od doma",
    no_person: "Ni najdenih oseb. Dodajte osebe v Nastavitve → Osebe.",
    unknown_person: "Oseba ni najdena",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    moves: "Zadnjih 24 ur",
    moved_home: "{name}: prihod domov",
    moved_away: "{name}: odhod od doma",
    moved_zone: "{name}: prihod v {zone}",
    left_zone: "{name}: odhod iz {zone}",
    no_moves: "V zadnjih 24 urah ni bilo gibanja",
    show_moves: "Prikaži gibanja zadnjih 24 ur",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    dir_towards: "Se približuje",
    dir_away_from: "Se oddaljuje",
    dir_stationary: "Miruje",
    // Editor
    entities: "Osebe (privzeto vse)",
    title_option: "Naslov (neobvezno)",
    sort: "Vrstni red",
    sort_presence: "Najprej tisti, ki so doma",
    sort_name: "Po imenu",
    sort_config: "Kot na seznamu",
    show_since: "Prikaži od kdaj",
    show_distance: "Prikaži oddaljenost od doma",
    show_direction: "Prikaži smer gibanja (Bližina)",
    show_battery: "Prikaži baterijo telefona",
    show_travel: "Prikaži čas poti domov (možnost travel_time)",
    travel_home: "Čas poti domov",
    show_away: "Prikaži odsotne osebe",
    zoom: "Gumb za povečavo",
    zoom_helper: "Preklaplja med mini kartico in celotno kartico",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    title: "Klātbūtne",
    home: "Mājās",
    away: "Prom",
    unknown: "Nezināms",
    at_home: "Mājās: {n} no {total}",
    all_home: "Visi ir mājās",
    nobody_home: "Neviena mājās",
    for: "jau",
    just_now: "tikko",
    days: "d",
    hours: "st",
    minutes: "min",
    battery: "Akumulators",
    from_home: "no mājām",
    no_person: "Neviena persona nav atrasta. Pievienojiet personas sadaļā Iestatījumi → Personas.",
    unknown_person: "Persona nav atrasta",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    moves: "Pēdējās 24 stundas",
    moved_home: "{name}: atgriešanās mājās",
    moved_away: "{name}: aiziešana no mājām",
    moved_zone: "{name}: ierašanās {zone}",
    left_zone: "{name}: aiziešana no {zone}",
    no_moves: "Pēdējās 24 stundās nav kustību",
    show_moves: "Rādīt pēdējo 24 stundu kustības",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    dir_towards: "Tuvojas",
    dir_away_from: "Attālinās",
    dir_stationary: "Nekustas",
    // Editor
    entities: "Personas (pēc noklusējuma visas)",
    title_option: "Virsraksts (neobligāts)",
    sort: "Secība",
    sort_presence: "Vispirms tie, kas ir mājās",
    sort_name: "Pēc vārda",
    sort_config: "Kā sarakstā",
    show_since: "Rādīt, kopš kura laika",
    show_distance: "Rādīt attālumu no mājām",
    show_direction: "Rādīt kustības virzienu (Tuvums)",
    show_battery: "Rādīt tālruņa akumulatoru",
    show_travel: "Rādīt ceļa laiku līdz mājām (opcija travel_time)",
    travel_home: "Ceļa laiks līdz mājām",
    show_away: "Rādīt prombūtnē esošos",
    zoom: "Tālummaiņas poga",
    zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    title: "Παρουσία",
    home: "Σπίτι",
    away: "Εκτός",
    unknown: "Άγνωστο",
    at_home: "{n} από {total} στο σπίτι",
    all_home: "Όλοι στο σπίτι",
    nobody_home: "Κανείς στο σπίτι",
    for: "εδώ και",
    just_now: "μόλις τώρα",
    days: "ημ.",
    hours: "ώ.",
    minutes: "λ.",
    battery: "Μπαταρία",
    from_home: "από το σπίτι",
    no_person: "Δεν βρέθηκαν άτομα. Προσθέστε άτομα από Ρυθμίσεις → Άτομα.",
    unknown_person: "Το άτομο δεν βρέθηκε",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπτυγμένη προβολή",
    moves: "Τελευταίες 24 ώρες",
    moved_home: "{name}: επιστροφή στο σπίτι",
    moved_away: "{name}: αναχώρηση από το σπίτι",
    moved_zone: "{name}: άφιξη σε {zone}",
    left_zone: "{name}: αναχώρηση από {zone}",
    no_moves: "Καμία κίνηση τις τελευταίες 24 ώρες",
    show_moves: "Εμφάνιση των κινήσεων των τελευταίων 24 ωρών",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    dir_towards: "Πλησιάζει",
    dir_away_from: "Απομακρύνεται",
    dir_stationary: "Σε στάση",
    // Editor
    entities: "Άτομα (όλα από προεπιλογή)",
    title_option: "Τίτλος (προαιρετικό)",
    sort: "Σειρά",
    sort_presence: "Πρώτα όσοι είναι στο σπίτι",
    sort_name: "Κατά όνομα",
    sort_config: "Όπως στη λίστα",
    show_since: "Εμφάνιση από πότε",
    show_distance: "Εμφάνιση απόστασης από το σπίτι",
    show_direction: "Εμφάνιση κατεύθυνσης κίνησης (Εγγύτητα)",
    show_battery: "Εμφάνιση μπαταρίας τηλεφώνου",
    show_travel: "Εμφάνιση χρόνου διαδρομής προς το σπίτι (επιλογή travel_time)",
    travel_home: "Χρόνος διαδρομής προς το σπίτι",
    show_away: "Εμφάνιση ατόμων εκτός σπιτιού",
    zoom: "Κουμπί μεγέθυνσης",
    zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A URL for a CSS url('…') inside a style attribute: esc() alone is not enough, as the browser decodes the
// attribute's HTML entities before parsing the CSS, so an escaped quote would come back and close the string.
// Keep it a plain CSS string: percent-encode the quotes, backslashes, parentheses and whitespace that could break
// out of url('…'), so the URL stays valid (a "/local/Jean Pierre.jpg" or "photo (2).jpg" still loads).
const pct = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
const cssUrl = (v) =>
  esc(
    String(v ?? "")
      .replace(/["'()\\]/g, pct)
      .replace(/\s/g, (c) => (c.charCodeAt(0) < 0x80 ? pct(c) : encodeURIComponent(c)))
  );

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: Home Assistant's full locale when it is the card's language (pt-BR keeps Brazilian formats)
// or a language the card does not translate (ja, ko…: its formats, English texts), else the card's language.
// A bare "pt" is Home Assistant's European Portuguese: Intl reads it as Brazilian.
const intlLang = (hass, config) => {
  const l = lang(hass, config);
  const full = config?.language ? "" : (hass && (hass.locale?.language || hass.language)) || "";
  const base = l.split("-")[0];
  const untranslated = full && !STRINGS[full] && !STRINGS[full.split("-")[0]];
  let out = l;
  if (untranslated || (full && full.split("-")[0] === base && !(l === "sr" && /-Latn\b/.test(full)))) out = full;
  return out === "pt" ? "pt-PT" : out;
};

// 12 / 24 h clock from the Home Assistant profile (time_format): "12", "24", "system" (the browser's own
// locale) or "language" (the locale's default: undefined).
const hour12Of = (hass) => {
  const tf = hass?.locale?.time_format;
  if (tf === "12") return true;
  if (tf === "24") return false;
  if (tf === "system") return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  return undefined;
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Elapsed time, short: "12 min", "3 h 5 min", "2 d 4 h".
const fmtDuration = (sec, tr) => {
  if (sec < 60) return tr("just_now");
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return h ? `${d} ${tr("days")} ${h} ${tr("hours")}` : `${d} ${tr("days")}`;
  if (h > 0) return m ? `${h} ${tr("hours")} ${m} ${tr("minutes")}` : `${h} ${tr("hours")}`;
  return `${m} ${tr("minutes")}`;
};

// Great-circle distance in km.
const haversine = (lat1, lon1, lat2, lon2) => {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Distance in the locale's number format: meters under 1 km, one decimal under 10, none above.
const fmtDistance = (km, miles, locale) => {
  const v = miles ? km / 1.609344 : km;
  const meters = !miles && v < 1;
  const [value, unit] = meters ? [Math.round(v * 1000), "meter"] : [v, miles ? "mile" : "kilometer"];
  const digits = !meters && v < 10 ? 1 : 0;
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits }).format(value);
  } catch {
    return `${digits ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value)} ${meters ? "m" : miles ? "mi" : "km"}`;
  }
};

const level = (v, warn, crit) => (v === null ? "" : v <= crit ? "crit" : v <= warn ? "warn" : "ok");

const initials = (name) =>
  String(name || "?")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// A stable color per person, for the initials avatar.
// Dark enough for the white initials to reach the WCAG AA 4.5:1 contrast.
const AVATAR_COLORS = ["#5768e6", "#00827d", "#b35c2e", "#c0449c", "#3378b4", "#6a7c29", "#9656c9", "#cb4646"];
const avatarColor = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// Card logo: a house sheltering two people, drawn in the accent color on a round tinted badge like the other
// ha-* cards.
const logo = (label) => `<div class="logo"><svg class="icon" viewBox="6 6 36 36" role="img" aria-label="${esc(label)}">
  <path d="M24 9 8 22.5h4.5V38h23V22.5H40Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="19.5" cy="25" r="3.2"/><path d="M13.5 37c0-4 2.7-6.6 6-6.6s6 2.6 6 6.6Z"/>
  <circle cx="29" cy="26.5" r="2.7" opacity=".85"/><path d="M24.6 37c0-3.3 2-5.4 4.4-5.4s4.4 2.1 4.4 5.4Z" opacity=".85"/>
</svg></div>`;

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

// `entities` items: "person.x" or { entity: "person.x", name: "…", picture: "…", travel_time: "sensor.…" }.
const normalize = (items) =>
  (Array.isArray(items) ? items : [])
    .map((e) => (typeof e === "string" ? { entity: e } : e))
    .filter((e) => e?.entity);

// People found automatically, cached on the states object (replaced by Home Assistant on every state
// change): `_signature()` and `_render()` both walk the list on every `set hass`, compute it once.
let _people = { states: null, ids: [] };
const listPeople = (hass) => {
  if (_people.states !== hass.states) {
    const ids = Object.keys(hass.states)
      .filter((id) => id.startsWith("person."))
      .sort((a, b) =>
        String(hass.states[a].attributes?.friendly_name || a).localeCompare(String(hass.states[b].attributes?.friendly_name || b))
      );
    _people = { states: hass.states, ids };
  }
  return _people.ids;
};

// Battery sensors by device id, cached on the entity registry object (replaced only when it changes).
let _batteries = { entities: null, byDevice: new Map() };
const RE_BATTERY = /^sensor\..*battery(?:_level)?(?:_\d+)?$/;
const batteriesByDevice = (hass) => {
  if (_batteries.entities !== hass.entities) {
    const byDevice = new Map();
    for (const [id, e] of Object.entries(hass.entities || {})) {
      if (!e?.device_id || !RE_BATTERY.test(id) || byDevice.has(e.device_id)) continue;
      byDevice.set(e.device_id, id);
    }
    _batteries = { entities: hass.entities, byDevice };
  }
  return _batteries.byDevice;
};

// Device trackers of a person: the one in use first (`source`), then the others.
const trackersOf = (st) => [...new Set([st.attributes?.source, ...(st.attributes?.device_trackers || [])].filter(Boolean))];

// Phone battery: the battery sensor of the tracker's device, or the tracker's own battery attribute.
const batteryOf = (hass, st) => {
  for (const tr of trackersOf(st)) {
    const dev = hass.entities?.[tr]?.device_id;
    const id = dev && batteriesByDevice(hass).get(dev);
    const v = id ? parseFloat(hass.states[id]?.state) : NaN;
    if (Number.isFinite(v)) return { value: v, entity: id };
    const a = hass.states[tr]?.attributes;
    const attr = parseFloat(a?.battery_level ?? a?.battery);
    if (Number.isFinite(attr)) return { value: attr, entity: tr };
  }
  return null;
};

// Proximity integration (core): for each tracked person, a direction of travel sensor and a distance sensor,
// named "<proximity> <person> Direction of travel" / "… Distance" (sensor.home_alex_direction_of_travel in
// English, translated in other languages). Found in the entity registry by platform and translation key, a
// pair per proximity entry (its device); without registry, by the English entity ids.
const DIRECTIONS = ["towards", "away_from", "stationary"];
const PROX_KEYS = { dir_of_travel: "direction", dist_to_zone: "distance" };
const RE_PROX = /^sensor\.(.+)_(direction_of_travel|distance)$/;
let _prox = { entities: null, states: null, list: [] };
const proximitySensors = (hass) => {
  if (_prox.entities === hass.entities && (_prox.registry || _prox.states === hass.states)) return _prox.list;
  let list = Object.entries(hass.entities || {})
    .filter(([, e]) => e?.platform === "proximity" && PROX_KEYS[e.translation_key])
    .map(([id, e]) => ({ id, key: PROX_KEYS[e.translation_key], group: e.device_id || "" }));
  // A registry without Proximity sensors has none to find in the states either: its empty result is kept
  // until the registry changes, instead of scanning the states at each update.
  const registry = list.length > 0 || Object.keys(hass.entities || {}).length > 0;
  if (!registry)
    list = Object.keys(hass.states).flatMap((id) => {
      const m = RE_PROX.exec(id);
      // Only a distance sensor next to a direction of travel sensor: any other "_distance" sensor is not one.
      if (!m || (m[2] === "distance" && !hass.states[`sensor.${m[1]}_direction_of_travel`])) return [];
      return [{ id, key: m[2] === "distance" ? "distance" : "direction", group: m[1] }];
    });
  _prox = { entities: hass.entities, states: hass.states, registry, list };
  return list;
};

// Entity id form of a name, as Home Assistant builds it ("Jean-Pierre" → "jean_pierre").
const slugify = (v) =>
  String(v ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// The Proximity sensors of a person: { direction, distance } entity ids, set in the configuration
// (`proximity_direction`, `proximity_distance`) or found by the person's id or name in the sensors' ids.
const proximityOf = (hass, item) => {
  if (item.proximity_direction || item.proximity_distance)
    return { direction: item.proximity_direction || null, distance: item.proximity_distance || null };
  const names = [item.entity.split(".")[1], slugify(hass.states[item.entity]?.attributes?.friendly_name)].filter(Boolean);
  // The person's part comes after the proximity's name: of two sensors matching in one entry (a proximity
  // named after a person), the one with the name furthest in its id.
  const groups = new Map();
  for (const s of proximitySensors(hass)) {
    const id = `_${s.id.slice(7)}_`;
    const at = Math.max(...names.map((n) => id.lastIndexOf(`_${n}_`)));
    if (at < 0) continue;
    const g = groups.get(s.group) ?? { direction: null, distance: null, at: {} };
    if (!(g.at[s.key] >= at)) {
      g[s.key] = s.id;
      g.at[s.key] = at;
    }
    groups.set(s.group, g);
  }
  const found = [...groups.values()].find((g) => g.direction) ?? [...groups.values()][0];
  return found ? { direction: found.direction, distance: found.distance } : null;
};

// A distance sensor's value in km, from its unit (meters by default, or the unit chosen for it).
const TO_KM = { mm: 1e-6, cm: 1e-5, m: 1e-3, km: 1, in: 2.54e-5, ft: 3.048e-4, yd: 9.144e-4, mi: 1.609344 };
const distanceKm = (st) => {
  const v = parseFloat(st?.state);
  const k = TO_KM[st?.attributes?.unit_of_measurement ?? "m"];
  return Number.isFinite(v) && k ? Math.max(0, v * k) : null;
};

const ORDER = { home: 0, zone: 1, away: 2, unknown: 3 };

/** What the card shows for one person. */
const personInfo = (hass, item, now = Date.now()) => {
  const st = hass.states[item.entity];
  if (!st) return null;
  const state = String(st.state);
  const kind =
    state === "home" ? "home" : state === "not_home" ? "away" : /^(unknown|unavailable)$/.test(state) ? "unknown" : "zone";
  const a = st.attributes || {};
  const homeZone = hass.states["zone.home"]?.attributes;
  let km = null;
  // Unknown / unavailable: the last GPS fix and the Proximity sensors are stale, no distance or direction.
  const located = kind === "away" || kind === "zone";
  if (located && Number.isFinite(a.latitude) && Number.isFinite(a.longitude) && homeZone) {
    km = haversine(a.latitude, a.longitude, homeZone.latitude, homeZone.longitude);
  }
  // Proximity sensors, when the person has some: their direction of travel, and their distance first.
  const prox = located ? proximityOf(hass, item) : null;
  const dir = prox?.direction ? hass.states[prox.direction]?.state : null;
  const proxKm = prox?.distance ? distanceKm(hass.states[prox.distance]) : null;
  if (proxKm !== null) km = proxKm;
  const changed = Date.parse(st.last_changed);
  return {
    id: item.entity,
    name: String(item.name || a.friendly_name || item.entity.split(".")[1]),
    picture: item.picture || a.entity_picture || null,
    kind,
    zone: kind === "zone" ? state : null,
    since: Number.isFinite(changed) ? Math.max(0, Math.floor((now - changed) / 1000)) : null,
    km,
    direction: DIRECTIONS.includes(dir) ? dir : null,
    battery: batteryOf(hass, st),
    travel: located ? travelMinutes(hass.states[item.travel_time]) : null,
  };
};

// Travel time home, in minutes, from a travel time sensor (Waze, Google Maps…: `travel_time` of a person), whatever
// its unit; null when unknown.
const TRAVEL_FACTORS = { s: 1 / 60, min: 1, h: 60, d: 1440 };
const travelMinutes = (st) => {
  const v = st ? Number.parseFloat(st.state) : Number.NaN;
  if (!Number.isFinite(v) || v < 0) return null;
  return Math.round(v * (TRAVEL_FACTORS[st.attributes?.unit_of_measurement] ?? 1));
};

// Movements of the people from their state changes (any order): arrivals at home or in a zone, departures. A
// person going from a zone straight to "away" left that zone; unknown / unavailable states are skipped.
// Events at or before `start` (the state each person was in when the window opened) are not movements
// themselves, only what the first movement is read against: leaving Work early in the window is "left Work".
const MOVES_MAX = 8;
const MOVES_HOURS = 24;
const movesFrom = (events, names, start = Number.NEGATIVE_INFINITY) => {
  const prev = {};
  const out = [];
  const whenOf = (ev) => (typeof ev?.when === "number" ? ev.when * 1000 : Date.parse(ev?.when));
  // Oldest first, whatever order the events came in: each movement is read against the state before it.
  const sorted = [...(events || [])].sort((a, b) => whenOf(a) - whenOf(b));
  for (const ev of sorted) {
    const id = ev?.entity_id;
    const state = ev?.state;
    if (!id || !(id in names) || !state || state === "unknown" || state === "unavailable") continue;
    const when = whenOf(ev);
    if (!Number.isFinite(when)) continue;
    const before = prev[id];
    prev[id] = state;
    if (before === state || when <= start) continue;
    let kind;
    let zone = "";
    if (state === "home") kind = "moved_home";
    else if (state === "not_home") {
      if (before && before !== "home") {
        kind = "left_zone";
        zone = before;
      } else kind = "moved_away";
    } else {
      kind = "moved_zone";
      zone = state;
    }
    out.push({ id, name: names[id], kind, zone, when });
  }
  return out.reverse().slice(0, MOVES_MAX);
};

// The answer of history/history_during_period (compressed: {entity: [{s, lu, lc?}]}, times in seconds) as
// the events movesFrom reads.
const historyEvents = (history) =>
  Object.entries(history || {}).flatMap(([entity_id, rows]) =>
    (Array.isArray(rows) ? rows : []).map((r) => ({ entity_id, state: r?.s, when: r?.lc ?? r?.lu }))
  );

const sortPeople = (people, sort) => {
  const pos = new Map(people.map((p, i) => [p.id, i]));
  if (sort === "config") return people;
  if (sort === "name") return [...people].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return [...people].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || pos.get(a.id) - pos.get(b.id));
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { display: block; --pr-accent: #5b6cf0; --pr-home: var(--success-color, #43a047); --pr-zone: var(--info-color, #039be5);
          --pr-away: var(--secondary-text-color, #727272); --pr-unknown: var(--warning-color, #ffa600);
          --pr-ok: var(--success-color, #43a047); --pr-warn: var(--warning-color, #ffa600); --pr-crit: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  /* A state color is kept for backgrounds, dots, borders and icons; a text in that color is mixed with the
     primary text color (darker in a light theme, lighter in a dark one) to stay readable (WCAG AA 4.5:1). */
  .home { --c: var(--pr-home); } .zone { --c: var(--pr-zone); } .away { --c: var(--pr-away); } .unknown { --c: var(--pr-unknown); }
  .ok { --b: var(--pr-ok); } .warn { --b: var(--pr-warn); } .crit { --b: var(--pr-crit); }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--pr-home)) 15%, transparent);
          color: color-mix(in srgb, var(--c, var(--pr-home)) 40%, var(--primary-text-color, #212121)); white-space: nowrap; }
  .chip .icon { width: 12px; height: 12px; }
  .chip .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  /* The title block takes the room left and cuts its texts, but always keeps a few characters of the title.
     A zero basis (not auto): in the mini card's wrapping header, a basis at the text's width would push the
     zoom button onto a second line at narrow widths. */
  .titles { flex: 1 1 0%; min-width: 6ch; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .logo { --c: var(--pr-accent); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; align-self: flex-start;
          background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .logo .icon { width: 24px; height: 24px; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* The count chip shrinks before the title (never past half the header) and cuts its text. */
  .header > .chip { align-self: flex-start; margin-top: 2px; flex: 0 1 auto; min-width: 0; max-width: 50%; box-sizing: border-box; overflow: hidden; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--pr-warn) 40%, var(--primary-text-color, #212121)); overflow-wrap: anywhere; }
  .warning + .warning { padding-top: 0; }
  .avatar { position: relative; flex: none; width: var(--size, 40px); height: var(--size, 40px); }
  .avatar .pic { width: 100%; height: 100%; border-radius: 50%; box-sizing: border-box; border: 2px solid var(--c);
                 background: var(--bg, var(--pr-accent)) center / cover no-repeat; display: grid; place-items: center;
                 color: #fff; font-weight: 600; font-size: calc(var(--size, 40px) * .36); transition: border-color .4s ease, filter .4s ease; }
  /* Away or unknown: a faded photo; initials are only desaturated, so that they stay readable. */
  .avatar.away .pic, .avatar.unknown .pic { filter: grayscale(.85); }
  .avatar.away .pic.photo, .avatar.unknown .pic.photo { filter: grayscale(.85) opacity(.75); }
  .avatar .badge { position: absolute; right: -3px; bottom: -3px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
                   background: var(--c); color: #212121;
                   box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color, #fff)); }
  .avatar .badge .icon { width: 12px; height: 12px; }
  .zoom { all: unset; flex: none; align-self: flex-start; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px 0 -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  @media (prefers-reduced-motion: reduce) { .avatar .pic { transition: none; } }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

const BADGE = { home: ICONS.home, zone: ICONS.zone, away: ICONS.away, unknown: ICONS.unknown };

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count, and a scroll cancels the pointer); keyboard clicks (no click count) still go through the click
// event. The handler keeps its own checks (dialogs opened from the card…). `tap(ev)` is for the tests.
const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

class PresenceBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => {
      const el = ev.composedPath().find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  connectedCallback() {
    this._startTimer();
  }

  // "Since" durations move on with the clock: a render check every minute, no state change needed.
  // No timer when `show_since: false` — the signature then ignores the minute, the tick would do nothing.
  _startTimer() {
    clearInterval(this._timer);
    if (!this.isConnected || this._config?.show_since === false) return;
    this._timer = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.entities !== undefined && !Array.isArray(config.entities)) throw new Error("entities must be a list");
    this._config = { ...config };
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
    this._startTimer();
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _items() {
    const items = normalize(this._config.entities);
    return items.length ? items : listPeople(this._hass).map((entity) => ({ entity }));
  }

  // What the render depends on: language, theme, unit system, the minute, and the states of the
  // people, their trackers, their battery sensors and the home zone.
  _signature() {
    const h = this._hass;
    const sig = [h.language, h.locale?.language, h.locale?.time_format, h.themes?.darkMode, h.config?.unit_system?.length, h.entities, h.states["zone.home"]];
    if (this._config.show_since !== false) sig.push(Math.floor(Date.now() / 60000));
    // Unfolded movements: dropped once older than 24 hours, read again each hour.
    if (this._movesOpen) sig.push(Math.floor(Date.now() / 60000));
    for (const item of this._items()) {
      const st = h.states[item.entity];
      sig.push(item.entity, st);
      if (!st) continue;
      const prox = proximityOf(h, item);
      if (prox) sig.push(h.states[prox.direction], h.states[prox.distance]);
      if (item.travel_time) sig.push(h.states[item.travel_time]);
      for (const tr of trackersOf(st)) {
        sig.push(h.states[tr]);
        const dev = h.entities?.[tr]?.device_id;
        if (dev) sig.push(h.states[batteriesByDevice(h).get(dev)]);
      }
    }
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  _people() {
    const now = Date.now();
    const all = this._items().map((item) => personInfo(this._hass, item, now) ?? { missing: item.entity });
    return { all, people: sortPeople(all.filter((p) => !p.missing), this._config.sort) };
  }

  _summary(people) {
    const n = people.filter((p) => p.kind === "home").length;
    if (people.length > 1 && n === people.length) return { n, text: this._t("all_home") };
    if (n === 0) return { n, text: this._t("nobody_home") };
    return { n, text: this._t("at_home").replace("{n}", n).replace("{total}", people.length) };
  }

  _header(people) {
    const { n, text } = this._summary(people);
    return `
      <div class="header">
        ${logo(this._t("title"))}
        <div class="titles">
          <div class="name">${esc(this._config.title || this._t("title"))}</div>
          <div class="sub">${esc(text)}</div>
        </div>
        <span class="chip ${n ? "home" : "away"}" role="img" title="${esc(text)}" aria-label="${esc(text)}">${svgIcon(ICONS.home)}<span class="txt">${n}/${people.length}</span></span>
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  _avatar(p, size) {
    const bg = p.picture ? `--bg:url('${cssUrl(p.picture)}');` : `--bg:${avatarColor(p.id)};`;
    return `<div class="avatar ${p.kind}" style="--size:${size}px" aria-hidden="true">
      <div class="pic${p.picture ? " photo" : ""}" style="${bg}">${p.picture ? "" : esc(initials(p.name))}</div>
      <span class="badge">${svgIcon(BADGE[p.kind])}</span>
    </div>`;
  }

  _place(p) {
    return p.kind === "zone" ? p.zone : this._t(p.kind);
  }

  // Direction of travel from the Proximity sensors ("Arriving"), or "" when unknown or hidden.
  _direction(p) {
    return this._config.show_direction !== false && p.direction ? this._t(`dir_${p.direction}`) : "";
  }

  // One warning line per configured person that does not exist (deleted or renamed), shown with the others.
  _missing(all) {
    return all
      .filter((p) => p.missing)
      .map((p) => `<div class="warning" data-key="missing:${esc(p.missing)}">${esc(`${this._t("unknown_person")}: ${p.missing}`)}</div>`)
      .join("");
  }

  // Nobody to show: every configured person missing, or no person at all in Home Assistant.
  _noPeople(all) {
    const body = this._missing(all) || `<div class="warning">${esc(this._t("no_person"))}</div>`;
    return `<style>${BASE_STYLE}</style><ha-card>${body}</ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
  .content .warning { padding: 2px 10px; font-size: 12px; }
  /* Narrow header (a card under about 205 px, narrower than its 9 columns on a phone): the count chip keeps
     only its icon, the count stays in its title and label. At phone widths it shows its whole "2/4". */
  .header { container: pr-head / inline-size; }
  /* The summary ("Nikogo nie ma w domu") wraps between words rather than being cut next to the chip. */
  .header .sub { white-space: normal; }
  @container pr-head (max-width: 180px) { .header > .chip .txt { display: none; } .header > .chip { padding: 1px 4px; } }
  /* A small gap before the facts column: the name and place already stretch up to it, and at a phone's 9
     columns (about 234 px) every pixel goes to the zone or state chip ("Poza domem"). */
  .person { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 12px;
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  /* The person's button (avatar, name, place) and the battery's are side by side, never one inside the other. */
  .person .main { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; border-radius: 8px; }
  @supports selector(:has(*)) {
    .person:has(> .main:focus-visible) { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
    .person > .main:focus-visible { outline: none; }
  }
  .person .who { flex: 1; min-width: 0; }
  .person .pname { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .person .where { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  /* A long zone name is cut in its chip (full name in its title), never over the distance and battery. */
  .person .where .chip { flex: 0 1 auto; min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; }
  /* The duration goes under the chip when it does not fit next to it, and wraps between words if still too long. */
  .person .where .since { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
  .person .facts { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12px; flex: none; }
  .person .facts span { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .person .facts .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .person .facts .towards .icon { color: var(--pr-home); }
  /* Movements of the last 24 hours: folded under the people, chevron right folded and down unfolded. */
  .moves { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
  .moves-toggle { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 4px 2px;
                  font-size: 12px; font-weight: 500; color: var(--secondary-text-color); border-radius: 6px; }
  .moves-toggle:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .moves-toggle .icon { width: 16px; height: 16px; transition: transform .2s ease; }
  .moves-toggle .icon.open { transform: rotate(90deg); }
  .mlist { display: flex; flex-direction: column; gap: 2px; }
  .move { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; font-size: 12px; cursor: pointer; }
  .move:hover { background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .move .icon { width: 16px; height: 16px; flex: none; color: var(--secondary-text-color); }
  .move.moved_home .icon { color: var(--pr-home); }
  .move.moved_zone .icon { color: var(--pr-zone); }
  .move .mtext { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .move .mtime { flex: none; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .move.none { cursor: default; color: var(--secondary-text-color); }
  @media (prefers-reduced-motion: reduce) { .moves-toggle .icon { transition: none; } }
  .batt { display: inline-flex; align-items: center; gap: 4px; }
  .batt .cell { position: relative; width: 18px; height: 9px; border: 1.5px solid var(--secondary-text-color); border-radius: 2.5px; box-sizing: border-box; }
  .batt .cell::after { content: ""; position: absolute; right: -4px; top: 1.5px; width: 2px; height: 3px; border-radius: 0 1px 1px 0; background: var(--secondary-text-color); }
  .batt .cell > i { position: absolute; left: 1px; top: 1px; bottom: 1px; border-radius: 1px; background: var(--b, var(--pr-ok)); }
  /* Very narrow card (under 225 px: the mini card zoomed in keeps its 6-column cell, about 156-178 px on a
     phone). The card is a size container for that; a size container has no width of its own content, so in a
     parent sized by its content (an inline-block, a grid "auto" column) the card would fall to a few pixels.
     The empty, zero-height grid before it gives a natural width (max-content 360 px) with no minimum
     (min-content 0): in a "1fr 1fr" grid, wrapped in a div or not, the card still shrinks to its track. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 360px); height: 0; }
  ha-card { container: pr-card / inline-size; }
  /* There the header drops its logo, and each row puts its distance and battery on a line under the name,
     with a smaller avatar: the name, the place chip and the duration keep their whole text. */
  @container pr-card (max-width: 224px) {
    .header > .logo { display: none; }
    .content { padding: 8px 8px 8px; }
    .person { flex-wrap: wrap; row-gap: 4px; padding: 6px 8px; }
    .person .main { flex: 1 1 100%; gap: 8px; }
    .person .main .avatar { width: 32px; height: 32px; }
    .person .main .avatar .pic { font-size: 12px; }
    .person .main .avatar .badge { width: 14px; height: 14px; right: -2px; bottom: -2px; }
    .person .main .avatar .badge .icon { width: 10px; height: 10px; }
    .person .facts { flex: 1 1 100%; min-width: 0; box-sizing: border-box; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 2px 10px; padding-left: 40px; }
    .person .where .since { overflow-wrap: normal; }
  }
`;

class PresenceCard extends PresenceBase {
  constructor() {
    super();
    this._movesOpen = false;
    this._moves = null;
    this.shadowRoot.addEventListener("click", (ev) => {
      if (!ev.composedPath().some((n) => n.classList?.contains("moves-toggle"))) return;
      this._movesOpen = !this._movesOpen;
      this._update();
    });
    // A click elsewhere folds the movements back, like the other sections of the ha-* cards.
    this._foldMoves = (ev) => {
      if (!this._movesOpen || ev.composedPath().includes(this) || inDialog(ev)) return;
      this._movesOpen = false;
      this._update();
    };
  }

  static getConfigElement() {
    return document.createElement("presence-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._foldMovesWatch ??= watchOutside(this, (ev) => this._foldMoves(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._foldMovesWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._movesOpen = false;
  }

  // Reads the history of the people when the section is unfolded, and again once one of them has moved since:
  // their state changes of the window plus the state each was in when it opened (one call for all of them).
  _loadMoves(people) {
    if (!this._hass?.callWS) return;
    // Read again each hour too, so the window keeps sliding when nobody moves.
    const hour = Math.floor(Date.now() / 3600000);
    const key = `${hour}|${people.map((p) => `${p.id}:${this._hass.states[p.id]?.last_changed}`).join("|")}`;
    if (key === this._movesKey) return;
    this._movesKey = key;
    const names = Object.fromEntries(people.map((p) => [p.id, p.name]));
    const start = Date.now() - MOVES_HOURS * 3600000;
    Promise.resolve(
      this._hass.callWS({
        type: "history/history_during_period",
        start_time: new Date(start).toISOString(),
        entity_ids: Object.keys(names),
        include_start_time_state: true,
        significant_changes_only: true,
        minimal_response: true,
        no_attributes: true,
      })
    )
      .then((history) => {
        if (this._movesKey !== key) return;
        // A second of slack: the start-time states come back stamped with the start, as float seconds.
        this._moves = movesFrom(historyEvents(history), names, start + 1000);
        this._update();
      })
      .catch(() => {
        // Tried again at the next unfolding or movement.
        this._movesKey = null;
      });
  }

  _time(ms) {
    const locale = intlLang(this._hass, this._config);
    const hour12 = hour12Of(this._hass);
    const d = new Date(ms);
    const today = new Date().toDateString() === d.toDateString();
    try {
      const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", ...(hour12 === undefined ? {} : { hour12 }) });
      return today ? time : `${d.toLocaleDateString(locale, { weekday: "short" })} ${time}`;
    } catch {
      return d.toISOString().slice(11, 16);
    }
  }

  _movesSection(people) {
    if (this._config.show_moves === false) return "";
    const open = this._movesOpen;
    if (open) this._loadMoves(people);
    const label = this._t("moves");
    let body = "";
    if (open) {
      // Only the last 24 hours, even before the history is read again.
      const since = Date.now() - MOVES_HOURS * 3600000;
      const moves = this._moves?.filter((m) => m.when >= since);
      body = moves?.length
        ? moves
            .map((m) => {
              const text = this._t(m.kind).replace("{name}", m.name).replace("{zone}", m.zone);
              const icon = m.kind === "moved_home" ? ICONS.home : m.kind === "moved_zone" ? ICONS.zone : ICONS.away;
              return `<div class="move ${m.kind}" data-key="move:${esc(m.id)}:${m.when}" role="button" tabindex="0" data-entity="${esc(m.id)}">
                ${svgIcon(icon)}<span class="mtext">${esc(text)}</span><span class="mtime">${esc(this._time(m.when))}</span></div>`;
            })
            .join("")
        : moves
          ? `<div class="move none">${esc(this._t("no_moves"))}</div>`
          : "";
    }
    return `<div class="moves" data-key="moves">
      <button class="moves-toggle" aria-expanded="${open}">${svgIcon(ICONS.chevron, open ? "open" : "")}<span>${esc(label)}</span></button>
      ${body ? `<div class="mlist">${body}</div>` : ""}
    </div>`;
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 1 + (this._hass && this._config ? this._items().length : 2);
  }

  getGridOptions() {
    // 9 columns: under that, the rows get too dense (names, zone chips and durations cut or wrapped on
    // several lines); the header itself still fits narrower.
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const { all, people } = this._people();
    if (!people.length) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(people)}
        <div class="content">${shown.map((p) => this._row(p)).join("")}${this._missing(all)}${this._movesSection(people)}</div>
      </ha-card>`;
  }

  _battery(b) {
    const v = Math.max(0, Math.min(100, b.value));
    return `<span class="batt ${level(v, 40, 20)} clickable" role="button" tabindex="0" data-entity="${esc(b.entity)}" title="${esc(
      this._t("battery")
    )}" aria-label="${esc(this._t("battery"))} ${Math.round(v)}%"><span class="cell"><i style="width:calc((100% - 2px) * ${(v / 100).toFixed(2)})"></i></span>${Math.round(v)}%</span>`;
  }

  _row(p) {
    const c = this._config;
    const miles = this._hass.config?.unit_system?.length === "mi";
    const tr = (k) => this._t(k);
    const facts = [];
    // Distance from home, behind the direction of travel's icon when the person has Proximity sensors.
    const dist = c.show_distance !== false && p.km !== null ? fmtDistance(p.km, miles, intlLang(this._hass, c)) : "";
    const dir = this._direction(p);
    if (dist || dir) {
      const title = [dir, dist && tr("from_home")].filter(Boolean).join(" · ");
      const icon = dir
        ? `<svg class="icon" viewBox="0 0 24 24" ${dist ? `role="img" aria-label="${esc(dir)}"` : 'aria-hidden="true"'}><path d="${ICONS[p.direction]}"/></svg>`
        : svgIcon(ICONS.distance);
      facts.push(`<span class="${dir ? `dir ${p.direction}` : "dist"}" title="${esc(title)}">${icon}${esc(dist || dir)}</span>`);
    }
    if (c.show_travel !== false && p.travel !== null) {
      const eta = fmtDuration(p.travel * 60, tr).replace(/(\d) /g, "$1\u00a0");
      facts.push(`<span class="eta" title="${esc(tr("travel_home"))}">${svgIcon(ICONS.travel)}${esc(eta)}</span>`);
    }
    if (c.show_battery !== false && p.battery) facts.push(this._battery(p.battery));
    // A number stays with its unit ("23 h") when the duration wraps.
    const sinceText = p.since === null ? "" : p.since < 60 ? tr("just_now") : `${tr("for")} ${fmtDuration(p.since, tr).replace(/(\d) /g, "$1\u00a0")}`;
    const since = c.show_since !== false && p.since !== null ? `<span class="since">${esc(sinceText)}</span>` : "";
    const place = this._place(p);
    return `<div class="person clickable ${p.kind}" data-key="${esc(p.id)}" data-entity="${esc(p.id)}">
      <div class="main" role="button" tabindex="0" data-entity="${esc(p.id)}">
        ${this._avatar(p, 40)}
        <div class="who">
          <div class="pname">${esc(p.name)}</div>
          <div class="where"><span class="chip" title="${esc(place)}"><span class="txt">${esc(place)}</span></span>${since}</div>
        </div>
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

// Same layout as the alarm mini card: one row with the logo, the title, the summary in color under it,
// the round avatars and the detail button, all centered vertically. The avatars stay on that row only while
// the title and the summary fit there in full next to them (measured on every render and resize of the
// card, see `_fit`); otherwise they wrap onto their own line under the title.
const FACE = 32;
const FACE_GAP = 8;
// The header logo, the same size as the full card's.
const LOGO = 40;

const MINI_STYLE = `
  .mini .header { padding: 12px; flex-wrap: wrap; row-gap: 10px; }
  .mini .header > .logo, .mini .zoom { align-self: center; }
  .mini .header > .titles { margin-block: -2px; }
  .mini .zoom { margin: -4px -4px -4px 0; }
  /* Too narrow for the logo next to the title (a phone's 6 columns, ~156-178 px): the logo goes, the summary
     wraps between words instead of being cut. */
  .mini.tight .header > .logo { display: none; }
  .mini.tight .sub { white-space: normal; }
  .mini > .warning { padding: 0 12px 12px; font-size: 12px; }
  .sub .st { color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); font-weight: 500; }
  .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--c); margin-right: 4px; vertical-align: 1px; }
  .faces { order: 9; flex: 1 0 100%; display: flex; flex-wrap: wrap; gap: ${FACE_GAP}px; }
  .mini.row .faces { order: 0; flex: none; }
  .faces .avatar .badge { width: 14px; height: 14px; right: -2px; bottom: -2px; }
  .faces .avatar .badge .icon { width: 10px; height: 10px; }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class PresenceMiniCard extends PresenceCard {
  static getConfigElement() {
    return document.createElement("presence-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this._inline = true;
    this._tight = false;
    this._resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => this._fit()) : null;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    (this._onOutsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
    this._resize?.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._onOutsideWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._zoomed = false;
    this._resize?.disconnect();
  }

  _update(sig) {
    super._update(sig);
    this._fit();
  }

  // Avatars on the title row, or under it: on the row when the logo, the whole title or summary (the
  // wider of the two, not cut), the avatars and the detail button fit in the card's width.
  _fit() {
    if (this._zoomed) return;
    const root = this.shadowRoot;
    const header = root.querySelector?.(".mini .header");
    if (!header) return;
    const width = header.clientWidth - 24;
    if (width <= 0) return; // not laid out (hidden tab, card being created)
    // The text's own width (the inline spans), not the title block's: that one stretches with the flex row
    // and would make a card that has once wrapped its avatars never fit them back on the row. Read as a
    // layout width (offsetWidth), like clientWidth above: getBoundingClientRect() follows an ancestor's
    // zoom or transform and would under-estimate the title under a scaled dashboard.
    // A summary wrapped by the tight layout is read unwrapped (its nowrap restored for the measure), so that
    // its width does not depend on the layout it decides.
    const sub = root.querySelector(".mini .sub");
    if (sub) sub.style.whiteSpace = "nowrap";
    const titles = Math.max(...[...root.querySelectorAll(".mini .titles > div > span")].map((n) => n.offsetWidth));
    if (sub) sub.style.whiteSpace = "";
    const n = root.querySelectorAll(".mini .face").length;
    const faces = n ? 10 + n * FACE + (n - 1) * FACE_GAP : 0; // header gap + avatars, nothing with zero faces
    const zoomEl = root.querySelector(".mini .zoom");
    // Header gap + the button's measured footprint (its width plus its negative margins).
    const zs = zoomEl && getComputedStyle(zoomEl);
    const zoom = zoomEl ? 10 + zoomEl.offsetWidth + (parseFloat(zs.marginLeft) || 0) + (parseFloat(zs.marginRight) || 0) : 0;
    const row = LOGO + 10 + titles + faces + zoom <= width;
    // No room for the logo and the whole title and summary: the logo is dropped and the summary wraps.
    // Measured on the unwrapped texts (the logo's presence changes none of these widths), so it never flips
    // back and forth.
    const tight = !row && LOGO + 10 + titles + zoom > width;
    if (row === this._inline && tight === this._tight) return;
    this._inline = row;
    this._tight = tight;
    this._update(this._sig);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update(this._sig);
  }

  // A click on the zoom button: never a tap on anything else of the card.
  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { all, people } = this._people();
    if (!people.length) return this._noPeople(all);
    const c = this._config;
    const shown = c.show_away === false ? people.filter((p) => p.kind === "home" || p.kind === "zone") : people;
    const { n, text } = this._summary(people);
    const faces = shown.map(
      (p) => `<div class="face clickable" role="button" tabindex="0" data-key="${esc(p.id)}" data-entity="${esc(p.id)}" title="${esc(
        [p.name, this._place(p), this._direction(p)].filter(Boolean).join(" · ")
      )}">${this._avatar(p, FACE)}</div>`
    );
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        <div class="mini${this._inline ? " row" : ""}${this._tight ? " tight" : ""}">
          <div class="header">
            ${logo(this._t("title"))}
            <div class="titles">
              <div class="name"><span>${esc(c.title || this._t("title"))}</span></div>
              <div class="sub"><span class="st ${n ? "home" : "away"}"><span class="dot"></span>${esc(text)}</span></div>
            </div>
            <div class="faces">${faces.join("")}</div>
            ${this._zoomButton()}
          </div>
          ${this._missing(all)}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class PresenceEditorBase extends HTMLElement {
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
          if (empty || (k === "sort" && v === "presence") || (this.constructor.toggles.includes(k) && v === true)) delete config[k];
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
    const data = { sort: "presence", ...this._config, entities: normalize(this._config.entities).map((e) => e.entity) };
    for (const name of this.constructor.toggles) if (data[name] === undefined) data[name] = true;
    this._schemas ??= {};
    this._schemas[l] ??= this._schema();
    this._form.data = data;
    this._form.schema = this._schemas[l];
  }
}

class PresenceCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["show_title", "show_subtitle", "show_since", "show_distance", "show_direction", "show_travel", "show_battery", "show_away", "show_moves"];
  }
}

class PresenceMiniCardEditor extends PresenceEditorBase {
  static get toggles() {
    return ["show_title", "show_subtitle", "show_away", "show_since", "show_distance", "show_direction", "show_travel", "show_battery", "show_moves", "zoom"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
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
