// Inhalte für scripts/build.mjs: Kopfdaten der Startseite, Unterseiten (EN/DE), strukturierte Daten (JSON-LD).
//
// Regeln für alle Texte hier:
// - Nur Aussagen, die auch auf der Startseite stehen (js/i18n.js, js/api.js, js/air.js, js/how.js, js/hero-video.js)
//   oder dort als Auslegung gekennzeichnet sind. Gen 2 ist in Entwicklung: aus dem CAD gerendert, nicht gebaut, nicht
//   getestet. Werte sind Auslegungswerte. Nichts ist bestellbar, daher keine Preise und kein „offers“ im JSON-LD.
// - Keine Aussage „Open Source“, solange kein Repository mit Lizenz veröffentlicht ist.
// - Auszeichnungen nur mit Beleg auf der Seite des Veranstalters (siehe AWARDS).
// - Kein Medizinprodukt, kein zertifizierter Gaswarner oder Dosimeter.

const SITE = 'https://www.openpulse.eu';
export const UPDATED = '2026-11-21';
const OG = '/assets/og/openpulse-gen2.jpg';

export const HOME_META = {
  en: { title: 'OpenPulse Gen 2: Modular Research Wearable with Sensor Pucks', path: '/',
    desc: 'Modular research wearable from Munich: one core, swappable sensor pucks for PPG, temperature, ECG, EDA and air quality. Raw data stays local, no cloud.',
    ogImage: OG },
  de: { title: 'OpenPulse Gen 2: Modulares Forschungs-Wearable mit Sensor-Pucks', path: '/de/',
    desc: 'Modulares Forschungs-Wearable aus München: ein Core, austauschbare Sensor-Pucks für PPG, Temperatur, EKG, EDA und Luftqualität. Rohdaten bleiben lokal.',
    ogImage: OG },
};

export const pageUrl = (slug, lang) => (lang === 'de' ? '/de/' : '/') + slug + '/';

// Auszeichnungen mit Link auf die Ergebnisseite des Veranstalters. Weitere Einträge der Startseite hier ergänzen,
// sobald es eine solche Seite zum Verlinken gibt.
export const AWARDS = [
  { en: 'Blue Ocean Student Entrepreneur Competition 2026: 1st place, Europe region',
    de: 'Blue Ocean Student Entrepreneur Competition 2026: 1. Platz, Region Europa',
    url: 'https://blueoceancompetition.org/2025-2026-winners' },
  { en: 'STARTUP TEENS Business Plan Challenge 2026: 1st place, Health & Lifestyle category',
    de: 'STARTUP TEENS Businessplan-Challenge 2026: 1. Platz, Kategorie Health & Lifestyle',
    url: 'https://www.startupteens.de/challenge-link/gewinner-2026/' },
];

// ---------- gemeinsame Bausteine ----------
const PUCKS = {
  pulse: { name: 'Pulse', img: 'mod-pulse', port: { en: 'Skin side, port A or B', de: 'Hautseite, Port A oder B' },
    what: { en: 'Raw PPG (photoplethysmography)', de: 'Rohes PPG (Photoplethysmographie)' } },
  thermo: { name: 'Thermo+', img: 'mod-thermo', port: { en: 'Skin side, port A or B', de: 'Hautseite, Port A oder B' },
    what: { en: 'Skin temperature and heat-flux trend', de: 'Hauttemperatur und Wärmefluss-Trend' } },
  ekg: { name: 'EKG', img: 'mod-ekg', port: { en: 'Skin side, port A or B', de: 'Hautseite, Port A oder B' },
    what: { en: 'Single-lead ECG and R-peak timing', de: '1-Kanal-EKG und R-Zacken' } },
  'eda-bioz': { name: 'EDA / BioZ', img: 'mod-eda', port: { en: 'Skin side, port A or B', de: 'Hautseite, Port A oder B' },
    what: { en: 'Skin conductance, respiration, bioimpedance', de: 'Hautleitfähigkeit, Atmung, Bioimpedanz' } },
  air: { name: 'Air', img: 'mod-air', port: { en: 'Facing the air, port E', de: 'Zur Luft, Port E' },
    what: { en: 'Temperature, humidity, pressure and gas', de: 'Temperatur, Feuchte, Druck und Gas' } },
};
const IMG_SIZE = { 'mod-pulse': [766, 740], 'mod-thermo': [767, 744], 'mod-ekg': [768, 748], 'mod-eda': [768, 748], 'mod-air': [767, 743] };
const puckImg = (slug, lang) => {
  const p = PUCKS[slug], [w, h] = IMG_SIZE[p.img];
  const alt = lang === 'de' ? `${p.name}-Sensor-Puck für OpenPulse Gen 2` : `${p.name} sensor puck for OpenPulse Gen 2`;
  return `<img src="/assets/pucks/${p.img}.webp" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
};

// Belegungen je Anwendung, wie im Hero der Startseite (js/hero-video.js, SETS)
const USES = [
  { id: 'research', A: 'pulse', B: 'ekg', E: 'air', en: 'Research', de: 'Forschung' },
  { id: 'factory-safety', A: 'thermo', B: 'pulse', E: 'air', en: 'Factory safety', de: 'Arbeitsschutz' },
  { id: 'trading-desks', A: 'eda-bioz', B: 'pulse', E: null, en: 'Trading desks', de: 'Trading-Desks' },
  { id: 'sports-science', A: 'pulse', B: 'ekg', E: null, en: 'Sports science', de: 'Sportwissenschaft' },
  { id: 'clinical-studies', A: 'pulse', B: 'thermo', E: 'air', en: 'Clinical studies', de: 'Klinische Studien' },
  { id: 'outdoor-apps', A: 'pulse', B: null, E: 'air', en: 'Outdoor apps', de: 'Outdoor-Apps' },
];
const cfg = (u, lang) => ['A', 'B', 'E'].map(k => `Port ${k}: ${u[k] ? `<a href="/pucks/${u[k]}/">${PUCKS[u[k]].name}</a>` : (lang === 'de' ? 'frei' : 'free')}`).join(' · ');
const usesWith = (slug, lang) => USES.filter(u => u.A === slug || u.B === slug || u.E === slug)
  .map(u => `<a href="/use-cases/#${u.id}">${u[lang]}</a>`).join(', ');

const STATUS = {
  en: 'In development. Gen 2 and its pucks are designed and rendered from CAD; they have not yet been built or tested. Values on this page are design targets.',
  de: 'In Entwicklung. Gen 2 und seine Pucks sind konstruiert und aus dem CAD gerendert, aber noch nicht gebaut oder getestet. Die Werte auf dieser Seite sind Auslegungswerte.',
};
const NOT_MEDICAL = {
  en: 'OpenPulse is not a medical device. It is built for research and industrial use, not for diagnosis or treatment.',
  de: 'OpenPulse ist kein Medizinprodukt. Es ist für Forschung und industrielle Anwendungen gebaut, nicht für Diagnose oder Behandlung.',
};
const chTable = (rows, lang) => `<table>
<thead><tr><th>${lang === 'de' ? 'Kanal' : 'Channel'}</th><th>${lang === 'de' ? 'Signal' : 'Signal'}</th><th>${lang === 'de' ? 'Rate' : 'Rate'}</th></tr></thead>
<tbody>
${rows.map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1][lang]}</td><td>${r[2][lang] || r[2]}</td></tr>`).join('\n')}
</tbody>
</table>`;
const PPG_ROWS = ['green', 'red', 'ir'].flatMap(c => ['pd1', 'pd2'].map(pd => [`ppg.${c}.${pd}`,
  { en: `${{ green: 'Green', red: 'Red', ir: 'Infrared' }[c]} light, photodiode ${pd.slice(2)}`, de: `${{ green: 'Grünes', red: 'Rotes', ir: 'Infrarotes' }[c]} Licht, Photodiode ${pd.slice(2)}` },
  '100 Hz · 24 bit']));
const THERMO_ROWS = [['skin.temp1', { en: 'Temperature sensor 1', de: 'Temperatursensor 1' }, '1 Hz · 16 bit'],
  ['skin.temp2', { en: 'Temperature sensor 2', de: 'Temperatursensor 2' }, '1 Hz · 16 bit']];
const AIR_ROWS = [['air.temp', { en: 'Air temperature', de: 'Lufttemperatur' }, { en: 'every 3 s · 20 bit', de: 'alle 3 s · 20 bit' }],
  ['air.humidity', { en: 'Relative humidity', de: 'Relative Luftfeuchte' }, { en: 'every 3 s · 20 bit', de: 'alle 3 s · 20 bit' }],
  ['air.pressure', { en: 'Air pressure', de: 'Luftdruck' }, { en: 'every 3 s · 20 bit', de: 'alle 3 s · 20 bit' }],
  ['air.gas', { en: 'Gas sensor (volatile compounds)', de: 'Gassensor (flüchtige Stoffe)' }, { en: 'every 3 s · 20 bit', de: 'alle 3 s · 20 bit' }]];
const IMU_ROWS = [['acc.x, acc.y, acc.z', { en: 'Acceleration, 3 axes (core)', de: 'Beschleunigung, 3 Achsen (Core)' }, '50 Hz · 16 bit'],
  ['gyro.x, gyro.y, gyro.z', { en: 'Rotation rate, 3 axes (core)', de: 'Drehrate, 3 Achsen (Core)' }, '50 Hz · 16 bit']];

const coreSpec = (t, lang) => `<table class="spec">
<caption>${lang === 'de' ? 'Auslegungswerte, noch nicht gemessen' : 'Design targets, not yet measured'}</caption>
<tbody>
${[1, 2, 3, 4, 5].map(i => `<tr><th scope="row">${t[`g2.k.l${i}`]}</th><td>${t[`g2.k.v${i}`]}</td></tr>`).join('\n')}
</tbody>
</table>`;

const CTA = {
  en: { t: 'Tell us what you want to measure', p: 'Tell us what you want to measure, on whom and for how long. You get a proposal in writing.', b: 'Talk to our team' },
  de: { t: 'Sagen Sie uns, was Sie messen wollen', p: 'Sagen Sie uns, was Sie messen wollen, an wem und wie lange. Sie erhalten einen schriftlichen Vorschlag.', b: 'Mit unserem Team sprechen' },
};
export const LABELS = {
  en: { home: 'Home', platform: 'Platform', pucks: 'Sensor pucks', data: 'Data & API', 'use-cases': 'Use cases', faq: 'FAQ', about: 'About',
    contact: 'Contact', imprint: 'Imprint', privacy: 'Privacy', loc: 'Designed in Germany', updated: 'Last updated', menu: 'Pages', lang: 'Deutsch', cta: CTA.en },
  de: { home: 'Start', platform: 'Plattform', pucks: 'Sensor-Pucks', data: 'Daten & API', 'use-cases': 'Anwendungen', faq: 'FAQ', about: 'Über uns',
    contact: 'Kontakt', imprint: 'Impressum', privacy: 'Datenschutz', loc: 'Entwickelt in Deutschland', updated: 'Stand', menu: 'Seiten', lang: 'English', cta: CTA.de },
};

// ---------- Seiten ----------
// Jede Seite: slug, parent (für Brotkrumen), ld (Zusatz-Typ), en/de: { title, desc, h1, lead, body(t) }
// body bekommt die i18n-Texte der Sprache (t) und liefert HTML. Interne Links immer als /seite/ schreiben (EN);
// build.mjs schreibt sie für DE auf /de/seite/ um.
const P = [];

P.push({ slug: 'platform', priority: '0.9',
  en: { title: 'OpenPulse Gen 2 Platform: Core, Ports and Swappable Sensor Pucks',
    desc: 'How the OpenPulse Gen 2 modular wearable is built: one core with radio, IMU, memory and battery, three ports for swappable sensor pucks, titanium case. Design targets.',
    h1: 'The OpenPulse Gen 2 platform',
    lead: 'OpenPulse Gen 2 is a modular research wearable worn on the wrist. A fixed core carries radio, processor, motion sensing, memory and power. Two ports on the skin side and one facing the air take swappable sensor pucks, so one device can be configured for each application.',
    body: t => `
<h2>The core: everything that stays</h2>
<p>${t['g2.k.p']}</p>
${coreSpec(t, 'en')}
<h2>Three ports, five sensor pucks</h2>
<p>${t['g2.p.p']}</p>
<ul>
<li><b>Port A</b> and <b>port B</b> sit on the skin side and take the body pucks: <a href="/pucks/pulse/">Pulse</a>, <a href="/pucks/thermo/">Thermo+</a>, <a href="/pucks/ekg/">EKG</a> and <a href="/pucks/eda-bioz/">EDA / BioZ</a>.</li>
<li><b>Port E</b> faces outward and takes the environment puck your application needs, for example the <a href="/pucks/air/">Air puck</a>. Its readings share one timeline with pulse, skin and motion.</li>
</ul>
<p>${t['pk.sub']}</p>
<h2>Swapping a puck</h2>
<ul>
<li><b>${t['sw.h1']}</b> ${t['sw.p1']}</li>
<li><b>${t['sw.h2']}</b> ${t['sw.p2']}</li>
<li><b>${t['sw.h3']}</b> ${t['sw.p3']}</li>
<li><b>${t['sw.h4']}</b> ${t['sw.p4']}</li>
</ul>
<h2>Case and band</h2>
<p><b>${t['g2.c.t']}</b> ${t['g2.c.p']}</p>
<p><b>${t['g2.b.t']}</b> ${t['g2.b.p']}</p>
<h2>Where the data goes</h2>
<p>${t['raw.sub']} Channels, formats and interfaces are on the <a href="/data/">data and API page</a>.</p>
<h2>Status</h2>
<p>${STATUS.en}</p>
<p>${NOT_MEDICAL.en}</p>` },
  de: { title: 'OpenPulse Gen 2 Plattform: Core, Ports und austauschbare Sensor-Pucks',
    desc: 'So ist das modulare Wearable OpenPulse Gen 2 aufgebaut: Core mit Funk, IMU, Speicher und Akku, drei Ports für Sensor-Pucks, Titangehäuse. Auslegungswerte.',
    h1: 'Die Plattform OpenPulse Gen 2',
    lead: 'OpenPulse Gen 2 ist ein modulares Forschungs-Wearable für das Handgelenk. Ein fester Core trägt Funk, Prozessor, Bewegungssensor, Speicher und Energieversorgung. Zwei Ports auf der Hautseite und einer zur Luft nehmen austauschbare Sensor-Pucks auf, so lässt sich ein Gerät für jede Anwendung konfigurieren.',
    body: t => `
<h2>Der Core: alles, was bleibt</h2>
<p>${t['g2.k.p']}</p>
${coreSpec(t, 'de')}
<h2>Drei Ports, fünf Sensor-Pucks</h2>
<p>${t['g2.p.p']}</p>
<ul>
<li><b>Port A</b> und <b>Port B</b> liegen auf der Hautseite und nehmen die Körper-Pucks auf: <a href="/pucks/pulse/">Pulse</a>, <a href="/pucks/thermo/">Thermo+</a>, <a href="/pucks/ekg/">EKG</a> und <a href="/pucks/eda-bioz/">EDA / BioZ</a>.</li>
<li><b>Port E</b> schaut nach außen und nimmt den Umgebungs-Puck auf, den Ihre Anwendung braucht, zum Beispiel den <a href="/pucks/air/">Air-Puck</a>. Seine Werte teilen eine Zeitachse mit Puls, Haut und Bewegung.</li>
</ul>
<p>${t['pk.sub']}</p>
<h2>Einen Puck tauschen</h2>
<ul>
<li><b>${t['sw.h1']}</b> ${t['sw.p1']}</li>
<li><b>${t['sw.h2']}</b> ${t['sw.p2']}</li>
<li><b>${t['sw.h3']}</b> ${t['sw.p3']}</li>
<li><b>${t['sw.h4']}</b> ${t['sw.p4']}</li>
</ul>
<h2>Gehäuse und Band</h2>
<p><b>${t['g2.c.t']}</b> ${t['g2.c.p']}</p>
<p><b>${t['g2.b.t']}</b> ${t['g2.b.p']}</p>
<h2>Wohin die Daten gehen</h2>
<p>${t['raw.sub']} Kanäle, Formate und Schnittstellen stehen auf der <a href="/data/">Seite zu Daten und API</a>.</p>
<h2>Stand</h2>
<p>${STATUS.de}</p>
<p>${NOT_MEDICAL.de}</p>` },
});

P.push({ slug: 'pucks', priority: '0.9',
  en: { title: 'Sensor Pucks for OpenPulse Gen 2: PPG, Temperature, ECG, EDA, Air',
    desc: 'Five swappable sensor pucks for the OpenPulse Gen 2 modular wearable: Pulse (PPG), Thermo+, EKG, EDA/BioZ and Air. Every port takes any puck. In development.',
    h1: 'Sensor pucks for OpenPulse Gen 2',
    lead: 'A sensor puck is a small, self-contained sensor module that sits in one of the three ports of the OpenPulse Gen 2 core. Each puck stores its type, serial number and calibration, and that information travels with every recording.',
    body: t => `
<p>${t['pk.sub']}</p>
<table>
<thead><tr><th>Puck</th><th>Measures</th><th>Port</th><th>Status</th></tr></thead>
<tbody>
${Object.entries(PUCKS).map(([s, p]) => `<tr><td><a href="/pucks/${s}/">${p.name}</a></td><td>${p.what.en}</td><td>${p.port.en}</td><td>In development</td></tr>`).join('\n')}
</tbody>
</table>
<ul class="cards">
${Object.keys(PUCKS).map(s => `<li><a href="/pucks/${s}/">${puckImg(s, 'en')}<b>${PUCKS[s].name}</b></a><p>${t[{ pulse: 'pk.pulse', thermo: 'pk.thermo', ekg: 'pk.ekg', 'eda-bioz': 'pk.eda', air: 'pk.air' }[s]]}</p></li>`).join('\n')}
</ul>
<h2>${t['pk.q']}</h2>
<p>${t['pk.qp']}</p>
<h2>Status</h2>
<p>${STATUS.en}</p>` },
  de: { title: 'Sensor-Pucks für OpenPulse Gen 2: PPG, Temperatur, EKG, EDA, Luft',
    desc: 'Fünf austauschbare Sensor-Pucks für das modulare Wearable OpenPulse Gen 2: Pulse (PPG), Thermo+, EKG, EDA/BioZ und Air. Jeder Port nimmt jeden Puck. In Entwicklung.',
    h1: 'Sensor-Pucks für OpenPulse Gen 2',
    lead: 'Ein Sensor-Puck ist ein kleines, eigenständiges Sensormodul, das in einem der drei Ports des Cores von OpenPulse Gen 2 sitzt. Jeder Puck speichert Typ, Seriennummer und Kalibrierung, und diese Angaben gehen mit jeder Aufzeichnung mit.',
    body: t => `
<p>${t['pk.sub']}</p>
<table>
<thead><tr><th>Puck</th><th>Misst</th><th>Port</th><th>Stand</th></tr></thead>
<tbody>
${Object.entries(PUCKS).map(([s, p]) => `<tr><td><a href="/pucks/${s}/">${p.name}</a></td><td>${p.what.de}</td><td>${p.port.de}</td><td>In Entwicklung</td></tr>`).join('\n')}
</tbody>
</table>
<ul class="cards">
${Object.keys(PUCKS).map(s => `<li><a href="/pucks/${s}/">${puckImg(s, 'de')}<b>${PUCKS[s].name}</b></a><p>${t[{ pulse: 'pk.pulse', thermo: 'pk.thermo', ekg: 'pk.ekg', 'eda-bioz': 'pk.eda', air: 'pk.air' }[s]]}</p></li>`).join('\n')}
</ul>
<h2>${t['pk.q']}</h2>
<p>${t['pk.qp']}</p>
<h2>Stand</h2>
<p>${STATUS.de}</p>` },
});

// Einzelne Pucks
const puckPage = (slug, o) => ({ slug: `pucks/${slug}`, parent: 'pucks', priority: '0.7', ld: 'puck', puck: slug,
  en: { title: o.en.title, desc: o.en.desc, h1: o.en.h1, lead: t => t[o.key],
    body: t => `
<figure class="puck-fig">${puckImg(slug, 'en')}</figure>
<h2>What it measures</h2>
${o.en.what(t)}
<h2>Port</h2>
<p>${PUCKS[slug].port.en}. ${slug === 'air' ? 'Port E faces outward, so this puck reads the air, not the skin.' : 'Every port takes any puck; a configuration is simply which puck goes where.'}</p>
${o.en.channels ? `<h2>Channels</h2>\n${o.en.channels}` : ''}
<h2>Example configurations</h2>
<p>Used in these example configurations: ${usesWith(slug, 'en')}.</p>
${o.en.extra ? o.en.extra(t) : ''}
<h2>Status</h2>
<p>${STATUS.en}</p>
<p>${slug === 'air' ? 'Not a certified gas detector or dosimeter.' : NOT_MEDICAL.en}</p>
<p><a href="/pucks/">All sensor pucks</a> · <a href="/data/">Data and API</a></p>` },
  de: { title: o.de.title, desc: o.de.desc, h1: o.de.h1, lead: t => t[o.key],
    body: t => `
<figure class="puck-fig">${puckImg(slug, 'de')}</figure>
<h2>Was er misst</h2>
${o.de.what(t)}
<h2>Port</h2>
<p>${PUCKS[slug].port.de}. ${slug === 'air' ? 'Port E schaut nach außen, dieser Puck misst also die Luft, nicht die Haut.' : 'Jeder Port nimmt jeden Puck; eine Konfiguration ist nur die Wahl, welcher Puck wohin kommt.'}</p>
${o.de.channels ? `<h2>Kanäle</h2>\n${o.de.channels}` : ''}
<h2>Beispielkonfigurationen</h2>
<p>Enthalten in diesen Beispielkonfigurationen: ${usesWith(slug, 'de')}.</p>
${o.de.extra ? o.de.extra(t) : ''}
<h2>Stand</h2>
<p>${STATUS.de}</p>
<p>${slug === 'air' ? 'Kein zertifizierter Gaswarner, kein Dosimeter.' : NOT_MEDICAL.de}</p>
<p><a href="/pucks/">Alle Sensor-Pucks</a> · <a href="/data/">Daten und API</a></p>` },
});

P.push(puckPage('pulse', { key: 'pk.pulse',
  en: { title: 'Pulse Puck: Raw PPG Sensor for the OpenPulse Gen 2 Wearable',
    desc: 'The Pulse puck records raw PPG in green, red and infrared with two photodiodes at 100 Hz and 24 bit, for pulse, HRV and oxygen saturation research.',
    h1: 'Pulse puck: raw PPG',
    what: () => `<p>Three light colours (green, red and infrared) and two photodiodes give six raw PPG channels. You get the raw light signal, not a heart-rate score, so pulse, heart-rate variability and oxygen saturation can be derived with your own methods.</p>`,
    channels: chTable(PPG_ROWS, 'en') },
  de: { title: 'Pulse-Puck: rohes PPG für das Wearable OpenPulse Gen 2',
    desc: 'Der Pulse-Puck zeichnet rohes PPG in Grün, Rot und Infrarot mit zwei Photodioden auf, mit 100 Hz und 24 bit, für Puls-, HRV- und Sauerstoffsättigungs-Forschung.',
    h1: 'Pulse-Puck: rohes PPG',
    what: () => `<p>Drei Lichtfarben (Grün, Rot und Infrarot) und zwei Photodioden ergeben sechs rohe PPG-Kanäle. Sie erhalten das rohe Lichtsignal, keinen Puls-Score, und leiten Puls, Herzratenvariabilität und Sauerstoffsättigung mit Ihren eigenen Methoden ab.</p>`,
    channels: chTable(PPG_ROWS, 'de') },
}));
P.push(puckPage('thermo', { key: 'pk.thermo',
  en: { title: 'Thermo+ Puck: Skin Temperature and Heat-Flux Trend | OpenPulse Gen 2',
    desc: 'The Thermo+ puck has two skin temperature sensors, one above a defined insulating layer, for skin temperature and a heat-flux trend towards core temperature.',
    h1: 'Thermo+ puck: skin temperature and heat-flux trend',
    what: () => `<p>Two temperature sensors: one at the skin, one above a defined insulating layer. The difference between them gives a heat-flux trend towards core temperature, next to the skin temperature itself. It is a trend for research, not a clinical thermometer.</p>`,
    channels: chTable(THERMO_ROWS, 'en'),
    extra: () => `<p>Together with the <a href="/pucks/air/">Air puck</a>, air and skin temperature show heat stress before it turns dangerous.</p>` },
  de: { title: 'Thermo+-Puck: Hauttemperatur und Wärmefluss-Trend | OpenPulse Gen 2',
    desc: 'Der Thermo+-Puck hat zwei Hauttemperatursensoren, einen über einer definierten Isolierschicht, für Hauttemperatur und einen Wärmefluss-Trend zur Kerntemperatur.',
    h1: 'Thermo+-Puck: Hauttemperatur und Wärmefluss-Trend',
    what: () => `<p>Zwei Temperatursensoren: einer an der Haut, einer über einer definierten Isolierschicht. Aus dem Unterschied ergibt sich ein Wärmefluss-Trend zur Kerntemperatur, zusätzlich zur Hauttemperatur selbst. Das ist ein Trend für die Forschung, kein klinisches Thermometer.</p>`,
    channels: chTable(THERMO_ROWS, 'de'),
    extra: () => `<p>Zusammen mit dem <a href="/pucks/air/">Air-Puck</a> zeigen Luft- und Hauttemperatur Hitzestress, bevor er gefährlich wird.</p>` },
}));
P.push(puckPage('ekg', { key: 'pk.ekg',
  en: { title: 'EKG Puck: Single-Lead ECG for the OpenPulse Gen 2 Wearable',
    desc: 'The EKG puck is a biopotential front end for single-lead ECG and R-peak timing, used as a timing reference for the pulse wave. Research use, in development.',
    h1: 'EKG puck: single-lead ECG',
    what: () => `<p>A biopotential front end for a single-lead ECG. Its R-peaks give an exact timing reference for the pulse wave measured by the <a href="/pucks/pulse/">Pulse puck</a> in the other skin port. For research use only; it makes no rhythm or diagnostic statements.</p>`,
    channels: '<p>Channel names and sample rates for the EKG puck will be published with the API.</p>' },
  de: { title: 'EKG-Puck: 1-Kanal-EKG für das Wearable OpenPulse Gen 2',
    desc: 'Der EKG-Puck ist ein Biopotential-Frontend für 1-Kanal-EKG und R-Zacken als Zeitreferenz für die Pulswelle. Für die Forschung, in Entwicklung.',
    h1: 'EKG-Puck: 1-Kanal-EKG',
    what: () => `<p>Ein Biopotential-Frontend für ein 1-Kanal-EKG. Seine R-Zacken geben eine genaue Zeitreferenz für die Pulswelle, die der <a href="/pucks/pulse/">Pulse-Puck</a> im anderen Haut-Port misst. Nur für die Forschung; es trifft keine Rhythmus- oder Diagnoseaussagen.</p>`,
    channels: '<p>Kanalnamen und Abtastraten des EKG-Pucks werden mit der API veröffentlicht.</p>' },
}));
P.push(puckPage('eda-bioz', { key: 'pk.eda',
  en: { title: 'EDA / BioZ Puck: Skin Conductance and Bioimpedance | OpenPulse Gen 2',
    desc: 'The EDA / BioZ puck measures skin conductance (electrodermal activity), respiration and bioimpedance from 1 to 806 kHz on one front end. For stress research.',
    h1: 'EDA / BioZ puck: skin conductance and bioimpedance',
    what: () => `<p>Electrodermal activity (skin conductance), respiration and bioimpedance from 1 to 806 kHz, all on one front end. Skin conductance together with pulse is a common signal pair in stress research. Research use only; no health statements about body composition or hydration.</p>`,
    channels: '<p>Channel names and sample rates for the EDA / BioZ puck will be published with the API.</p>',
    extra: () => `<p>Example pilot from our process: a trading desk, 5 traders, 14 days, then a plan for 40 devices with the same configuration.</p>` },
  de: { title: 'EDA/BioZ-Puck: Hautleitfähigkeit und Bioimpedanz | OpenPulse Gen 2',
    desc: 'Der EDA/BioZ-Puck misst Hautleitfähigkeit (elektrodermale Aktivität), Atmung und Bioimpedanz von 1 bis 806 kHz auf einem Frontend. Für die Stressforschung.',
    h1: 'EDA/BioZ-Puck: Hautleitfähigkeit und Bioimpedanz',
    what: () => `<p>Elektrodermale Aktivität (Hautleitfähigkeit), Atmung und Bioimpedanz von 1 bis 806 kHz, alles auf einem Frontend. Hautleitfähigkeit zusammen mit dem Puls ist ein übliches Signalpaar in der Stressforschung. Nur für die Forschung; keine Gesundheitsaussagen zu Körperzusammensetzung oder Hydration.</p>`,
    channels: '<p>Kanalnamen und Abtastraten des EDA/BioZ-Pucks werden mit der API veröffentlicht.</p>',
    extra: () => `<p>Beispielpilot aus unserem Ablauf: eine Handelsabteilung, 5 Händler, 14 Tage, danach ein Plan für 40 Geräte in derselben Konfiguration.</p>` },
}));
P.push(puckPage('air', { key: 'pk.air',
  en: { title: 'Air Puck: Air Quality Sensor on the Wrist | OpenPulse Gen 2',
    desc: 'The Air puck measures temperature, humidity, air pressure and gas right next to the body, on the same timeline as pulse, skin and motion. In development.',
    h1: 'Air puck: the environment next to the body',
    what: t => `<p>${t['air.sub']}</p>
<ul>
<li>${t['fb.air.1']}</li>
<li>${t['fb.air.2']}</li>
<li>${t['fb.air.3']}</li>
</ul>`,
    channels: chTable(AIR_ROWS, 'en'),
    extra: () => `<h2>Other environment pucks</h2>
<p>Port E can take other environment pucks on request, for example for radiation and UV, CO₂, fine dust, ozone, pollen, magnetic field or water contact. We check whether the sensor fits a puck and build it for the same port and the same API.</p>` },
  de: { title: 'Air-Puck: Luftqualität und Klima am Handgelenk | OpenPulse Gen 2',
    desc: 'Der Air-Puck misst Temperatur, Luftfeuchte, Luftdruck und Gas direkt am Körper, auf derselben Zeitachse wie Puls, Haut und Bewegung. In Entwicklung.',
    h1: 'Air-Puck: die Umgebung direkt am Körper',
    what: t => `<p>${t['air.sub']}</p>
<ul>
<li>${t['fb.air.1']}</li>
<li>${t['fb.air.2']}</li>
<li>${t['fb.air.3']}</li>
</ul>`,
    channels: chTable(AIR_ROWS, 'de'),
    extra: () => `<h2>Weitere Umgebungs-Pucks</h2>
<p>Port E nimmt auf Anfrage weitere Umgebungs-Pucks auf, etwa für Strahlung und UV, CO₂, Feinstaub, Ozon, Pollen, Magnetfeld oder Wasserkontakt. Wir prüfen, ob der Sensor in einen Puck passt, und bauen ihn für denselben Port und dieselbe API.</p>` },
}));

P.push({ slug: 'data', priority: '0.8', ld: 'tech',
  en: { title: 'OpenPulse Data and API: Raw Wearable Data as CSV, Parquet, EDF',
    desc: 'Raw, timestamped wearable data from OpenPulse Gen 2: channel names and sample rates, export as CSV, Parquet or EDF/BDF, Python, local HTTP API and MCP. No cloud.',
    h1: 'Data and API: every sample, not a score',
    lead: 'OpenPulse Gen 2 records every raw sample with its timestamp on the device. You copy the data to your own computer through the USB dock and work with it as files, in Python or through a local API. No cloud and no account in between. The API is in development; names and examples on this page show the planned interface.',
    body: t => `
<h2>Channels and sample rates</h2>
<p>${t['raw.sub']}</p>
<table>
<thead><tr><th>Source</th><th>Port</th><th>Channels</th><th>Rate</th></tr></thead>
<tbody>
<tr><td><a href="/pucks/pulse/">Pulse</a></td><td>A or B</td><td><code>ppg.green.pd1</code>, <code>ppg.green.pd2</code>, <code>ppg.red.pd1</code>, <code>ppg.red.pd2</code>, <code>ppg.ir.pd1</code>, <code>ppg.ir.pd2</code></td><td>100 Hz · 24 bit</td></tr>
<tr><td>Motion (IMU)</td><td>Core</td><td><code>acc.x</code>, <code>acc.y</code>, <code>acc.z</code>, <code>gyro.x</code>, <code>gyro.y</code>, <code>gyro.z</code></td><td>50 Hz · 16 bit</td></tr>
<tr><td><a href="/pucks/thermo/">Thermo+</a></td><td>A or B</td><td><code>skin.temp1</code>, <code>skin.temp2</code></td><td>1 Hz · 16 bit</td></tr>
<tr><td><a href="/pucks/air/">Air</a></td><td>E</td><td><code>air.temp</code>, <code>air.humidity</code>, <code>air.pressure</code>, <code>air.gas</code></td><td>every 3 s · 20 bit</td></tr>
</tbody>
</table>
<p>Channel names follow <code>source.signal.detector</code>: <code>ppg.ir.pd1</code> is the infrared PPG signal from photodiode 1. Every recording also carries the type, serial number and calibration stored in each puck. Channels for the EKG and EDA / BioZ pucks will be published with the API.</p>
<h2>File formats</h2>
<ul>
<li><b>CSV</b>: one row per sample, timestamp in microseconds (<code>t_us</code>) plus one column per channel.</li>
<li><b>Parquet</b>: one file per source, for example <code>op-2F41_pulse.parquet</code>, <code>op-2F41_imu.parquet</code>.</li>
<li><b>EDF / BDF</b>: for clinical and physiology tools and EDF viewers.</li>
</ul>
<h2>Interfaces</h2>
<h3>Python</h3>
<pre><code>import openpulse as op
dev = op.Device.usb()                # local, no account, no upload
df = dev.raw(["ppg.green.pd1", "ppg.ir.pd1", "acc.z"],
             start="2026-11-13 22:00", end="2026-11-14 06:00")</code></pre>
<h3>Command line</h3>
<pre><code>op devices
op export op-2F41 --from 2026-11-13 --format parquet,bdf --out ./raw</code></pre>
<h3>Local HTTP API</h3>
<pre><code>curl "localhost:8473/v1/devices/op-2F41/raw?channels=ppg.ir.pd1&amp;format=csv"</code></pre>
<h3>MCP server for AI assistants</h3>
<p>A local MCP server lets an AI assistant on your computer read the raw data, for example: “Show me my raw IR signal from last night around 3 am and mark the motion artefacts.” The assistant calls the tool <code>openpulse.raw</code> with the channels and time range; the data stays on your computer.</p>
<h2>Getting data off the device</h2>
<p>The device stores raw data in its onboard memory (design target: 2 Gbit, about one day of raw data at full rate). Docked over USB, it charges and copies the data to your machine.</p>
<p>${t['raw.note']}</p>` },
  de: { title: 'OpenPulse Daten und API: rohe Wearable-Daten als CSV, Parquet, EDF',
    desc: 'Rohe, zeitgestempelte Wearable-Daten von OpenPulse Gen 2: Kanalnamen und Abtastraten, Export als CSV, Parquet oder EDF/BDF, Python, lokale HTTP-API und MCP. Ohne Cloud.',
    h1: 'Daten und API: jeder Messwert, kein Score',
    lead: 'OpenPulse Gen 2 zeichnet jeden Rohwert mit Zeitstempel im Gerät auf. Über das USB-Dock kopieren Sie die Daten auf Ihren eigenen Rechner und arbeiten damit als Dateien, in Python oder über eine lokale API. Ohne Cloud und ohne Konto dazwischen. Die API ist in Entwicklung; Namen und Beispiele auf dieser Seite zeigen die geplante Schnittstelle.',
    body: t => `
<h2>Kanäle und Abtastraten</h2>
<p>${t['raw.sub']}</p>
<table>
<thead><tr><th>Quelle</th><th>Port</th><th>Kanäle</th><th>Rate</th></tr></thead>
<tbody>
<tr><td><a href="/pucks/pulse/">Pulse</a></td><td>A oder B</td><td><code>ppg.green.pd1</code>, <code>ppg.green.pd2</code>, <code>ppg.red.pd1</code>, <code>ppg.red.pd2</code>, <code>ppg.ir.pd1</code>, <code>ppg.ir.pd2</code></td><td>100 Hz · 24 bit</td></tr>
<tr><td>Bewegung (IMU)</td><td>Core</td><td><code>acc.x</code>, <code>acc.y</code>, <code>acc.z</code>, <code>gyro.x</code>, <code>gyro.y</code>, <code>gyro.z</code></td><td>50 Hz · 16 bit</td></tr>
<tr><td><a href="/pucks/thermo/">Thermo+</a></td><td>A oder B</td><td><code>skin.temp1</code>, <code>skin.temp2</code></td><td>1 Hz · 16 bit</td></tr>
<tr><td><a href="/pucks/air/">Air</a></td><td>E</td><td><code>air.temp</code>, <code>air.humidity</code>, <code>air.pressure</code>, <code>air.gas</code></td><td>alle 3 s · 20 bit</td></tr>
</tbody>
</table>
<p>Kanalnamen folgen dem Muster <code>quelle.signal.detektor</code>: <code>ppg.ir.pd1</code> ist das Infrarot-PPG von Photodiode 1. Jede Aufzeichnung trägt außerdem Typ, Seriennummer und Kalibrierung, die in jedem Puck gespeichert sind. Die Kanäle des EKG- und des EDA/BioZ-Pucks werden mit der API veröffentlicht.</p>
<h2>Dateiformate</h2>
<ul>
<li><b>CSV</b>: eine Zeile pro Messwert, Zeitstempel in Mikrosekunden (<code>t_us</code>) und eine Spalte je Kanal.</li>
<li><b>Parquet</b>: eine Datei je Quelle, etwa <code>op-2F41_pulse.parquet</code>, <code>op-2F41_imu.parquet</code>.</li>
<li><b>EDF / BDF</b>: für klinische und physiologische Werkzeuge und EDF-Viewer.</li>
</ul>
<h2>Schnittstellen</h2>
<h3>Python</h3>
<pre><code>import openpulse as op
dev = op.Device.usb()                # lokal, kein Konto, kein Upload
df = dev.raw(["ppg.green.pd1", "ppg.ir.pd1", "acc.z"],
             start="2026-11-13 22:00", end="2026-11-14 06:00")</code></pre>
<h3>Kommandozeile</h3>
<pre><code>op devices
op export op-2F41 --from 2026-11-13 --format parquet,bdf --out ./raw</code></pre>
<h3>Lokale HTTP-API</h3>
<pre><code>curl "localhost:8473/v1/devices/op-2F41/raw?channels=ppg.ir.pd1&amp;format=csv"</code></pre>
<h3>MCP-Server für KI-Assistenten</h3>
<p>Ein lokaler MCP-Server lässt einen KI-Assistenten auf Ihrem Rechner die Rohdaten lesen, etwa: „Zeig mir mein rohes IR-Signal von letzter Nacht gegen 3 Uhr und markiere die Bewegungsartefakte.“ Der Assistent ruft das Werkzeug <code>openpulse.raw</code> mit Kanälen und Zeitraum auf; die Daten bleiben auf Ihrem Rechner.</p>
<h2>Daten vom Gerät holen</h2>
<p>Das Gerät speichert die Rohdaten im eigenen Speicher (Auslegung: 2 Gbit, rund ein Tag Rohdaten bei voller Rate). Im USB-Dock lädt es und kopiert die Daten auf Ihren Rechner.</p>
<p>${t['raw.note']}</p>` },
});

const useSection = {
  research: { en: 'Raw PPG next to a single-lead ECG: the ECG R-peaks give a timing reference for the pulse wave. The Air puck records the conditions around each participant on the same timeline.',
    de: 'Rohes PPG neben einem 1-Kanal-EKG: Die R-Zacken des EKG geben eine Zeitreferenz für die Pulswelle. Der Air-Puck zeichnet die Bedingungen um jede Person auf derselben Zeitachse auf.' },
  'factory-safety': { en: 'Air temperature, humidity and skin temperature together show heat stress before it turns dangerous. The Air puck notices volatile gases rising, for example from a solvent leak, before anyone smells them. Not a certified gas detector.',
    de: 'Luft-, Feuchte- und Hauttemperatur zusammen zeigen Hitzestress, bevor er gefährlich wird. Der Air-Puck bemerkt aufsteigende flüchtige Gase, etwa aus einem Lösungsmittel-Leck, bevor jemand sie riecht. Kein zertifizierter Gaswarner.' },
  'trading-desks': { en: 'Skin conductance and pulse for stress research at the desk. Example pilot from our process: 5 traders, 14 days, then a plan for 40 devices with the same configuration.',
    de: 'Hautleitfähigkeit und Puls für Stressforschung am Arbeitsplatz. Beispielpilot aus unserem Ablauf: 5 Händler, 14 Tage, danach ein Plan für 40 Geräte in derselben Konfiguration.' },
  'sports-science': { en: 'Raw PPG and single-lead ECG side by side, with motion from the core IMU at 50 Hz, so pulse-wave and heart-rate methods can be compared on the same recording.',
    de: 'Rohes PPG und 1-Kanal-EKG nebeneinander, dazu Bewegung aus der IMU im Core mit 50 Hz, damit sich Pulswellen- und Herzfrequenz-Methoden an derselben Aufzeichnung vergleichen lassen.' },
  'clinical-studies': { en: 'Raw pulse, skin temperature with a heat-flux trend, and the surrounding air. For research studies only: OpenPulse is not a medical device and makes no diagnostic statements.',
    de: 'Roher Puls, Hauttemperatur mit Wärmefluss-Trend und die umgebende Luft. Nur für Forschungsstudien: OpenPulse ist kein Medizinprodukt und trifft keine Diagnoseaussagen.' },
  'outdoor-apps': { en: 'Air pressure falling by 4 hPa in three hours means the weather is turning. The same sensor knows the altitude, and the pulse shows how the body copes with both.',
    de: 'Fällt der Luftdruck um 4 hPa in drei Stunden, kommt ein Wetterumschwung. Derselbe Sensor kennt die Höhe, und der Puls zeigt, wie der Körper mit beidem zurechtkommt.' },
};
P.push({ slug: 'use-cases', priority: '0.8',
  en: { title: 'Use Cases for a Modular Research Wearable | OpenPulse Gen 2',
    desc: 'Example OpenPulse Gen 2 configurations for research, factory safety, trading desks, sports science, clinical studies and outdoor apps: which puck goes where.',
    h1: 'Use cases: one configuration per application',
    lead: 'With OpenPulse Gen 2, a configuration is simply which sensor puck goes in which port. Your team fits the pucks in the lab before the study or rollout starts. These are the example configurations shown on our homepage.',
    body: () => `
${USES.map(u => `<h2 id="${u.id}">${u.en}</h2>
<p class="cfg">${cfg(u, 'en')}</p>
<p>${useSection[u.id].en}</p>`).join('\n')}
<h2>How we work together</h2>
<ol>
<li><b>Talk.</b> Tell us what you want to measure, on whom and for how long. You get a proposal in writing.</li>
<li><b>Configure.</b> Pick a puck for each port. Any port can change, any time.</li>
<li><b>Pilot.</b> A few devices on real people first. We do the work; your team hands out devices and docks them.</li>
</ol>
<p>All configurations are examples. ${STATUS.en}</p>` },
  de: { title: 'Anwendungen für ein modulares Forschungs-Wearable | OpenPulse Gen 2',
    desc: 'Beispielkonfigurationen von OpenPulse Gen 2 für Forschung, Arbeitsschutz, Trading-Desks, Sport, klinische Studien und Outdoor: welcher Puck wohin kommt.',
    h1: 'Anwendungen: eine Konfiguration je Anwendung',
    lead: 'Bei OpenPulse Gen 2 ist eine Konfiguration nur die Wahl, welcher Sensor-Puck in welchen Port kommt. Ihr Team setzt die Pucks im Labor ein, bevor Studie oder Einsatz beginnt. Dies sind die Beispielkonfigurationen von unserer Startseite.',
    body: () => `
${USES.map(u => `<h2 id="${u.id}">${u.de}</h2>
<p class="cfg">${cfg(u, 'de')}</p>
<p>${useSection[u.id].de}</p>`).join('\n')}
<h2>So arbeiten wir zusammen</h2>
<ol>
<li><b>Gespräch.</b> Sagen Sie uns, was Sie messen wollen, an wem und wie lange. Sie erhalten einen schriftlichen Vorschlag.</li>
<li><b>Konfiguration.</b> Wählen Sie für jeden Port einen Puck. Jeder Port lässt sich ändern, jederzeit.</li>
<li><b>Pilot.</b> Zuerst wenige Geräte an echten Menschen. Wir erledigen die Arbeit; Ihr Team verteilt die Geräte und legt sie ins Dock.</li>
</ol>
<p>Alle Konfigurationen sind Beispiele. ${STATUS.de}</p>` },
});

export const FAQ = {
  en: [
    ['What is OpenPulse Gen 2?', 'OpenPulse Gen 2 is a modular research wearable from Munich, Germany. One core with two skin-side ports and one air-facing port takes swappable sensor pucks for PPG, skin temperature, ECG, EDA/bioimpedance and air quality. It records raw, timestamped data on the device and hands it to you locally as CSV, Parquet or EDF/BDF.'],
    ['Can I buy OpenPulse Gen 2 today?', 'Not yet. Gen 2 is in development: it is designed and rendered from CAD, but not yet built or tested. If you are planning a study or pilot, tell us what you want to measure, on whom and for how long, and you get a proposal in writing.'],
    ['Is OpenPulse a medical device?', 'No. OpenPulse is built for research and industrial use, not for diagnosis or treatment. The Air puck is not a certified gas detector or dosimeter.'],
    ['Where is my data stored?', 'On the device first, then on your own computer: docked over USB, the device copies its raw data to your machine. There is no cloud and no account in between, and the raw data stays with you.'],
    ['Which data formats and interfaces are there?', 'CSV, Parquet and EDF/BDF files, a Python library, a command-line tool, a local HTTP API and a local MCP server for AI assistants. The API is in development; see <a href="/data/">Data and API</a>.'],
    ['Which sensors are available?', 'Five sensor pucks: Pulse (raw PPG in green, red and infrared), Thermo+ (skin temperature and heat-flux trend), EKG (single-lead ECG), EDA / BioZ (skin conductance, respiration, bioimpedance) and Air (temperature, humidity, pressure, gas). All are in development with Gen 2. See <a href="/pucks/">Sensor pucks</a>.'],
    ['Can the pucks be swapped?', 'Yes, in the lab and by your team, not by the wearer. Four screws and standard tools: open the clear cover, lift the puck out, press the new one in. No soldering, no glue. Every port is mechanically keyed, so a puck cannot go in rotated or reversed.'],
    ['Can you build a puck for a signal you do not cover?', 'Tell us what you need to measure. We check whether it fits a puck and build it for the same port and the same API.'],
    ['What sample rates does OpenPulse record?', 'As specified for Gen 2: PPG at 100 Hz and 24 bit, motion at 50 Hz, skin temperature at 1 Hz and the Air puck every 3 seconds, each sample with its timestamp.'],
    ['How long does the battery last and how much data fits on the device?', 'Design targets: a 50 mAh lithium cell for at least one day in study use, and 2 Gbit (256 MB) of onboard memory, about one day of raw data at full rate. These values are not yet measured.'],
    ['Who is behind OpenPulse?', 'A student founding team based in Munich, Germany. See <a href="/about/">About</a>.'],
    ['Is OpenPulse related to OpenQASM OpenPulse or openpulse.org?', 'No. OpenPulse (openpulse.eu) is a modular research wearable. It is not related to the OpenQASM "OpenPulse" pulse grammar, to openpulse.org or to other projects with the same name.'],
  ],
  de: [
    ['Was ist OpenPulse Gen 2?', 'OpenPulse Gen 2 ist ein modulares Forschungs-Wearable aus München. Ein Core mit zwei Ports auf der Hautseite und einem zur Luft nimmt austauschbare Sensor-Pucks für PPG, Hauttemperatur, EKG, EDA/Bioimpedanz und Luftqualität auf. Es zeichnet rohe, zeitgestempelte Daten im Gerät auf und übergibt sie Ihnen lokal als CSV, Parquet oder EDF/BDF.'],
    ['Kann ich OpenPulse Gen 2 heute kaufen?', 'Noch nicht. Gen 2 ist in Entwicklung: konstruiert und aus dem CAD gerendert, aber noch nicht gebaut oder getestet. Wenn Sie eine Studie oder einen Pilot planen, sagen Sie uns, was Sie messen wollen, an wem und wie lange, und Sie erhalten einen schriftlichen Vorschlag.'],
    ['Ist OpenPulse ein Medizinprodukt?', 'Nein. OpenPulse ist für Forschung und industrielle Anwendungen gebaut, nicht für Diagnose oder Behandlung. Der Air-Puck ist kein zertifizierter Gaswarner und kein Dosimeter.'],
    ['Wo werden meine Daten gespeichert?', 'Zuerst im Gerät, dann auf Ihrem eigenen Rechner: Im USB-Dock kopiert das Gerät seine Rohdaten auf Ihren Rechner. Ohne Cloud und ohne Konto dazwischen, die Rohdaten bleiben bei Ihnen.'],
    ['Welche Datenformate und Schnittstellen gibt es?', 'CSV-, Parquet- und EDF/BDF-Dateien, eine Python-Bibliothek, ein Kommandozeilenwerkzeug, eine lokale HTTP-API und einen lokalen MCP-Server für KI-Assistenten. Die API ist in Entwicklung; siehe <a href="/data/">Daten und API</a>.'],
    ['Welche Sensoren gibt es?', 'Fünf Sensor-Pucks: Pulse (rohes PPG in Grün, Rot und Infrarot), Thermo+ (Hauttemperatur und Wärmefluss-Trend), EKG (1-Kanal-EKG), EDA/BioZ (Hautleitfähigkeit, Atmung, Bioimpedanz) und Air (Temperatur, Feuchte, Druck, Gas). Alle sind mit Gen 2 in Entwicklung. Siehe <a href="/pucks/">Sensor-Pucks</a>.'],
    ['Lassen sich die Pucks tauschen?', 'Ja, im Labor und durch Ihr Team, nicht durch den Träger. Vier Schrauben und Standardwerkzeug: klaren Deckel öffnen, Puck herausheben, neuen hineindrücken. Ohne Löten, ohne Kleber. Jeder Port ist mechanisch kodiert, ein Puck lässt sich weder verdreht noch falsch herum einsetzen.'],
    ['Bauen Sie einen Puck für ein Signal, das Sie noch nicht abdecken?', 'Sagen Sie uns, was Sie messen müssen. Wir prüfen, ob es in einen Puck passt, und bauen ihn für denselben Port und dieselbe API.'],
    ['Mit welchen Abtastraten zeichnet OpenPulse auf?', 'Wie für Gen 2 festgelegt: PPG mit 100 Hz und 24 bit, Bewegung mit 50 Hz, Hauttemperatur mit 1 Hz und der Air-Puck alle 3 Sekunden, jeder Wert mit Zeitstempel.'],
    ['Wie lange hält der Akku, und wie viele Daten passen ins Gerät?', 'Auslegungswerte: eine 50-mAh-Lithiumzelle für mindestens einen Tag im Studienbetrieb und 2 Gbit (256 MB) Speicher im Gerät, rund ein Tag Rohdaten bei voller Rate. Die Werte sind noch nicht gemessen.'],
    ['Wer steht hinter OpenPulse?', 'Ein Gründungsteam von Schülern aus München. Siehe <a href="/about/">Über uns</a>.'],
    ['Hat OpenPulse etwas mit OpenQASM OpenPulse oder openpulse.org zu tun?', 'Nein. OpenPulse (openpulse.eu) ist ein modulares Forschungs-Wearable. Es hat nichts mit der OpenQASM-Pulsgrammatik „OpenPulse“, mit openpulse.org oder anderen gleichnamigen Projekten zu tun.'],
  ],
};
P.push({ slug: 'faq', priority: '0.7', ld: 'faq',
  en: { title: 'OpenPulse FAQ: Status, Data, Sensors and Medical Use',
    desc: 'Answers about the OpenPulse Gen 2 modular research wearable: availability, medical device status, where data is stored, formats, sensor pucks, sample rates, battery.',
    h1: 'Frequently asked questions',
    lead: 'Short answers about OpenPulse Gen 2, the modular research wearable with swappable sensor pucks.',
    body: () => FAQ.en.map(([q, a]) => `<h2>${q}</h2>\n<p>${a}</p>`).join('\n') },
  de: { title: 'OpenPulse FAQ: Stand, Daten, Sensoren und Medizin',
    desc: 'Antworten zum modularen Forschungs-Wearable OpenPulse Gen 2: Verfügbarkeit, Medizinprodukt, Speicherort der Daten, Formate, Sensor-Pucks, Abtastraten, Akku.',
    h1: 'Häufige Fragen',
    lead: 'Kurze Antworten zu OpenPulse Gen 2, dem modularen Forschungs-Wearable mit austauschbaren Sensor-Pucks.',
    body: () => FAQ.de.map(([q, a]) => `<h2>${q}</h2>\n<p>${a}</p>`).join('\n') },
});

P.push({ slug: 'about', priority: '0.6',
  en: { title: 'About OpenPulse: the Team Behind the Modular Research Wearable',
    desc: 'OpenPulse is a student founding team from Munich, Germany, developing OpenPulse Gen 2, a modular research wearable with swappable sensor pucks. Awards and contact.',
    h1: 'About OpenPulse',
    lead: 'OpenPulse is a student founding team based in Munich, Germany. We are developing OpenPulse Gen 2, a modular research wearable with swappable sensor pucks that gives research and industry teams the raw data, on their own computers.',
    body: () => `
<h2>What we build</h2>
<p>One core, swappable sensor pucks and a configuration built around each application: <a href="/platform/">the platform</a>, <a href="/pucks/">the sensor pucks</a> and <a href="/data/">the data path</a>. ${STATUS.en}</p>
<h2>Recognition</h2>
<ul>
${AWARDS.map(a => `<li><a href="${a.url}" rel="noopener">${a.en}</a></li>`).join('\n')}
</ul>
<h2>Name</h2>
<p>OpenPulse (openpulse.eu) is a modular research wearable. It is not related to the OpenQASM "OpenPulse" pulse grammar, to openpulse.org or to other projects with the same name.</p>
<h2>Contact</h2>
<p><a href="mailto:contact@openpulse.eu">contact@openpulse.eu</a> · <a href="/impressum.html">Imprint</a></p>` },
  de: { title: 'Über OpenPulse: das Team hinter dem modularen Forschungs-Wearable',
    desc: 'OpenPulse ist ein Gründungsteam von Schülern aus München und entwickelt OpenPulse Gen 2, ein modulares Forschungs-Wearable mit Sensor-Pucks. Auszeichnungen, Kontakt.',
    h1: 'Über OpenPulse',
    lead: 'OpenPulse ist ein Gründungsteam von Schülern aus München. Wir entwickeln OpenPulse Gen 2, ein modulares Forschungs-Wearable mit austauschbaren Sensor-Pucks, das Forschungs- und Industrieteams die Rohdaten gibt, auf ihren eigenen Rechnern.',
    body: () => `
<h2>Was wir bauen</h2>
<p>Ein Core, austauschbare Sensor-Pucks und eine Konfiguration je Anwendung: <a href="/platform/">die Plattform</a>, <a href="/pucks/">die Sensor-Pucks</a> und <a href="/data/">der Datenweg</a>. ${STATUS.de}</p>
<h2>Auszeichnungen</h2>
<ul>
${AWARDS.map(a => `<li><a href="${a.url}" rel="noopener">${a.de}</a></li>`).join('\n')}
</ul>
<h2>Name</h2>
<p>OpenPulse (openpulse.eu) ist ein modulares Forschungs-Wearable. Es hat nichts mit der OpenQASM-Pulsgrammatik „OpenPulse“, mit openpulse.org oder anderen gleichnamigen Projekten zu tun.</p>
<h2>Kontakt</h2>
<p><a href="mailto:contact@openpulse.eu">contact@openpulse.eu</a> · <a href="/impressum.html">Impressum</a></p>` },
});

export const PAGES = P;

// ---------- strukturierte Daten ----------
const ORG_ID = `${SITE}/#org`, SITE_ID = `${SITE}/#website`, PRODUCT_ID = `${SITE}/#gen2`;
const org = () => ({
  '@type': 'Organization', '@id': ORG_ID, name: 'OpenPulse', alternateName: 'OpenPulse modular wearable',
  url: `${SITE}/`, logo: `${SITE}/assets/logo-512.png`, email: 'contact@openpulse.eu',
  description: 'Munich-based student team developing OpenPulse Gen 2, a modular research wearable with swappable sensor pucks that keeps raw data local.',
  address: { '@type': 'PostalAddress', addressLocality: 'München', addressCountry: 'DE' },
  award: AWARDS.map(a => a.en),
  knowsAbout: ['wearable sensors', 'photoplethysmography', 'electrodermal activity', 'bioimpedance', 'raw physiological data'],
});
const product = lang => ({
  '@type': 'Product', '@id': PRODUCT_ID, name: 'OpenPulse Gen 2', brand: { '@id': ORG_ID }, manufacturer: { '@id': ORG_ID },
  category: 'Research wearable / modular wearable sensor platform',
  description: lang === 'de'
    ? 'Modulares Forschungs-Wearable für das Handgelenk, in Entwicklung. Ein Core mit zwei Ports auf der Hautseite und einem zur Luft für austauschbare Sensor-Pucks: Pulse (PPG), Thermo+, EKG, EDA/BioZ und Air. Rohdaten bleiben lokal; Export als CSV, Parquet oder EDF/BDF. Kein Medizinprodukt.'
    : 'Modular wrist-worn research wearable, in development. One core with two skin-side ports and one air-facing port for swappable sensor pucks: Pulse (PPG), Thermo+, EKG, EDA/BioZ and Air. Raw data stays local and exports as CSV, Parquet or EDF/BDF. Not a medical device.',
  image: `${SITE}/assets/video/rest_0.jpg`,
  additionalProperty: [
    ['Status', 'In development; specifications are design targets, not yet built or tested'],
    ['Radio and processor', 'Bluetooth 5 LE, Arm Cortex-M4F (nRF52840)'],
    ['Motion', '6-axis IMU, 50 Hz'],
    ['PPG sample rate', '100 Hz, 24 bit'],
    ['On-device memory', '2 Gbit (256 MB), about one day of raw data at full rate'],
    ['Battery', '50 mAh lithium cell, at least one day in study use'],
    ['Ports', 'Two skin-side ports (A, B), one air-facing port (E)'],
    ['Data formats', 'CSV, Parquet, EDF/BDF, Python, local HTTP API, local MCP server'],
  ].map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
});
const crumbs = (page, lang, L) => {
  const items = [[L.home, lang === 'de' ? '/de/' : '/']];
  if (page.parent) items.push([L[page.parent], pageUrl(page.parent, lang)]);
  items.push([page[lang].h1, pageUrl(page.slug, lang)]);
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + p })) };
};

export function jsonLd(kind, lang, page) {
  const inLanguage = lang === 'de' ? 'de-DE' : 'en';
  if (kind === 'home') return { '@context': 'https://schema.org', '@graph': [
    org(),
    { '@type': 'WebSite', '@id': SITE_ID, url: `${SITE}/`, name: 'OpenPulse', inLanguage: ['en', 'de-DE'], publisher: { '@id': ORG_ID } },
    { '@type': 'WebPage', '@id': SITE + HOME_META[lang].path + '#page', url: SITE + HOME_META[lang].path, name: HOME_META[lang].title,
      description: HOME_META[lang].desc, inLanguage, isPartOf: { '@id': SITE_ID }, about: { '@id': PRODUCT_ID }, dateModified: UPDATED },
    product(lang),
  ] };
  const L = LABELS[lang], url = SITE + pageUrl(page.slug, lang);
  const graph = [crumbs(page, lang, L)];
  const base = { '@id': url + '#page', url, name: page[lang].title, description: page[lang].desc, inLanguage,
    isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID }, dateModified: UPDATED };
  if (page.ld === 'faq') graph.push({ '@type': 'FAQPage', ...base,
    mainEntity: FAQ[lang].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
  else if (page.ld === 'tech') graph.push({ '@type': 'TechArticle', ...base, headline: page[lang].h1, about: { '@id': PRODUCT_ID }, author: { '@id': ORG_ID } });
  else if (page.slug === 'about') graph.push({ '@type': 'AboutPage', ...base, about: { '@id': ORG_ID } }, org());
  else graph.push({ '@type': 'WebPage', ...base, about: { '@id': PRODUCT_ID } });
  return { '@context': 'https://schema.org', '@graph': graph };
}
