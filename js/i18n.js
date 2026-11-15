// Sprachen EN/DE: Texte mit data-i18n, Wörter der Überschrift (für hero.js), Wahl wird im Browser gemerkt.
window.I18N = {
  en: {
    'nav.cta': 'Talk to us',
    'menu.platform': 'Platform', 'menu.pucks': 'Sensor pucks', 'menu.data': 'Data & integration',
    'menu.env': 'Environment', 'menu.how': 'How we work together', 'menu.contact': 'Contact',
    'hero.lead': 'The wearable for',
    'hero.sub': 'One core, swappable sensor pucks and a configuration built around your application. You receive the raw data, and it stays with you.',
    'hero.cta': 'Talk to our team', 'hero.how': 'How it works',
    'h1': 'The wearable for research, factory safety, trading desks, sports science, clinical studies and outdoor apps.',
    words: ['research', 'factory safety', 'trading desks', 'sports science', 'clinical studies', 'outdoor apps'],
    'awards.aria': 'Recognition', 'awards.bo': '1st in Europe', 'awards.st': '1st nationally',
    'awards.jg': 'Pitch Event', 'awards.ms': 'Innovator Scholarship',
    'g2.c.k': 'Case', 'g2.c.t': 'Titanium and resin, made to last.',
    'g2.c.p': 'A printed titanium shell takes the knocks and gives the device its look. Underneath, a precision SLA resin carrier seals the electronics on its own. Strong where it matters, light everywhere else.',
    'g2.b.k': 'Band', 'g2.b.t': 'A fine weave from Japan.',
    'g2.b.p': 'The 25 mm band is woven from ultra-fine yarn by a Japanese textile maker. Soft and light on the wrist, made to be worn around the clock.',
    'g2.k.k': 'Core', 'g2.k.t': 'Everything that stays.',
    'g2.k.p': 'One rigid board with radio, processor, motion sensing, memory and power. It is the same in every configuration.',
    'g2.k.l1': 'Radio', 'g2.k.v1': 'Bluetooth 5 LE, Arm Cortex-M4F (nRF52840)',
    'g2.k.l2': 'Motion', 'g2.k.v2': '6-axis IMU, recorded at 50 Hz',
    'g2.k.l3': 'Memory', 'g2.k.v3': '512 MB onboard, about 3 days of raw data',
    'g2.k.l4': 'Battery', 'g2.k.v4': '50 mAh lithium cell, at least one day in study use',
    'g2.k.l5': 'Charging & data', 'g2.k.v5': 'Dock with USB, about 650 MB in 11 minutes',
    'g2.k.n': 'Design targets, not yet measured.',
    'g2.p.k': 'Pucks', 'g2.p.t': 'Sensors you can swap.',
    'g2.p.p': 'Two ports on the skin side and one facing the air take the sensor pucks: Pulse, Thermo+, EKG, EDA/BioZ and Air. A configuration is simply which puck goes where, changed in the lab with a screwdriver, no soldering.',
    'g2.p.b': 'Explore the pucks',
    'pk.title': 'Five pucks. One core.',
    'pk.sub': 'Every port takes any puck. They are swapped in the lab with standard tools, without soldering. And if your application needs a signal we do not cover yet, we build the puck for it.',
    'pk.hint': 'Drag to explore',
    'pk.pulse': 'Raw PPG in green, red and infrared with two photodiodes. For pulse, HRV and oxygen saturation research.',
    'pk.thermo': 'Two skin temperature sensors, one above a defined insulating layer, for a heat-flux trend towards core temperature.',
    'pk.air': 'Temperature, humidity, pressure and gas right next to the body. Faces the air, not the skin.',
    'pk.ekg': 'Biopotential front end for single-lead ECG and R-peak timing as a reference for the pulse wave.',
    'pk.eda': 'Skin conductance, respiration and bioimpedance from 1 to 806 kHz on one front end.',
    'pk.skin': 'Skin · port A or B', 'pk.airport': 'Air · port E',
    'pk.q': 'Your sensor', 'pk.qp': 'Need a signal we do not cover yet? Tell us. We design the puck around it, on the same port and the same API.', 'pk.qc': 'Talk to us',
    'air.eye': 'Environment port · Port E', 'air.t1': 'Measure the body and the world around it.', 'air.t2': 'With the environment puck.',
    'air.sub': 'The top port faces outward and takes the environment puck your application needs. Its readings share one timeline with pulse, skin and motion: you see how the body reacts, and to what.',
    'air.tabsaria': 'Examples',
    'foot.contact': 'Contact', 'foot.imprint': 'Imprint', 'foot.privacy': 'Privacy', 'foot.loc': 'Made in Germany',
    'air.note': 'Examples. Air puck available today, other environment pucks on request. Not a certified gas detector or dosimeter.',
    'sw.title': 'Change the sensor, not the device.', 'sw.vid': 'A hand swaps two sensor pucks in an open OpenPulse', 'sw.play': 'Playing', 'sw.pause': 'Paused',
    'sw.h1': 'Four screws. Standard tools.', 'sw.p1': 'Open the clear cover, lift the puck out, press the new one in. No soldering, no glue.',
    'sw.h2': 'It only fits the right way.', 'sw.p2': 'Every port is mechanically keyed, so a puck cannot go in rotated or reversed.',
    'sw.h3': 'Every puck knows what it is.', 'sw.p3': 'Type, serial number and calibration are stored in the puck and travel with every recording.',
    'sw.h4': 'Set up in your lab, not by the wearer.', 'sw.p4': 'One configuration per application, fitted by your team before the study or rollout starts.',
    'sw.note': 'Video generated from our 3D model of Gen 2. Gen 2 is in development; the points above are its design specification.',
    'raw.title': 'Every signal. Raw. Yours.',
    'raw.sub': 'No cloud in between and no scores laid on top. The API hands you every sample the sensors capture, in the format you work with, whenever you ask.',
    'raw.note': 'Example interfaces. The API is in development; channels and rates as specified for Gen 2.',
    'api.t1': 'Live', 'api.t2': 'Python', 'api.t3': 'Spreadsheet', 'api.t4': 'Terminal', 'api.t5': 'EDF viewer', 'api.t6': 'MCP',
    'api.l1': 'Live · over USB-C, no cloud', 'api.l2': 'Python · every sample in a DataFrame', 'api.l3': 'Spreadsheet · one row per sample',
    'api.l4': 'Terminal · export straight from the device', 'api.l5': 'EDF viewer · BDF for clinical tools', 'api.l6': 'MCP · your assistant reads the raw data',
    'api.q6': 'Show me my raw IR signal from last night around 3 am and mark the motion artefacts.',
    'api.a6': 'Here is the raw ppg.ir.pd1 from 02:55 to 03:05, 60 000 samples at 100 Hz. I marked three stretches where acc.* shows movement and the signal clips; the rest is clean.',
    'g2.note': 'Design state, rendered from CAD. Not yet built or tested.',
  },
  de: {
    'nav.cta': 'Kontakt',
    'menu.platform': 'Plattform', 'menu.pucks': 'Sensor-Pucks', 'menu.data': 'Daten & Integration',
    'menu.env': 'Umgebung', 'menu.how': 'So arbeiten wir zusammen', 'menu.contact': 'Kontakt',
    'hero.lead': 'Das Wearable für',
    'hero.sub': 'Ein Core, austauschbare Sensor-Pucks und eine Konfiguration, die auf Ihre Anwendung zugeschnitten ist. Sie erhalten die Rohdaten, und sie bleiben bei Ihnen.',
    'hero.cta': 'Mit unserem Team sprechen', 'hero.how': 'So funktioniert es',
    'h1': 'Das Wearable für Forschung, Arbeitsschutz, Trading-Desks, Sportwissenschaft, klinische Studien und Outdoor-Apps.',
    words: ['Forschung', 'Arbeitsschutz', 'Trading-Desks', 'Sportwissenschaft', 'klinische Studien', 'Outdoor-Apps'],
    'awards.aria': 'Auszeichnungen', 'awards.bo': '1. Platz Europa', 'awards.st': '1. Platz bundesweit',
    'awards.jg': 'Pitch-Event', 'awards.ms': 'Innovator-Stipendium',
    'g2.c.k': 'Gehäuse', 'g2.c.t': 'Titan und Harz, gebaut für lange.',
    'g2.c.p': 'Eine gedruckte Titanschale steckt die Stöße weg und gibt dem Gerät sein Gesicht. Darunter dichtet ein präziser SLA-Harzträger die Elektronik allein ab. Fest, wo es zählt, leicht überall sonst.',
    'g2.b.k': 'Band', 'g2.b.t': 'Ein feines Gewebe aus Japan.',
    'g2.b.p': 'Das 25-mm-Band ist aus hauchfeinem Garn gewebt, von einem japanischen Textilhersteller. Weich und leicht am Handgelenk, gemacht, um es rund um die Uhr zu tragen.',
    'g2.k.k': 'Core', 'g2.k.t': 'Alles, was bleibt.',
    'g2.k.p': 'Eine starre Platine mit Funk, Prozessor, Bewegungssensor, Speicher und Energieversorgung. Sie ist in jeder Konfiguration dieselbe.',
    'g2.k.l1': 'Funk', 'g2.k.v1': 'Bluetooth 5 LE, Arm Cortex-M4F (nRF52840)',
    'g2.k.l2': 'Bewegung', 'g2.k.v2': '6-Achsen-IMU, aufgezeichnet mit 50 Hz',
    'g2.k.l3': 'Speicher', 'g2.k.v3': '512 MB im Gerät, rund 3 Tage Rohdaten',
    'g2.k.l4': 'Akku', 'g2.k.v4': '50-mAh-Lithiumzelle, mindestens ein Tag im Studienbetrieb',
    'g2.k.l5': 'Laden & Daten', 'g2.k.v5': 'Dock mit USB, rund 650 MB in 11 Minuten',
    'g2.k.n': 'Auslegungswerte, noch nicht gemessen.',
    'g2.p.k': 'Pucks', 'g2.p.t': 'Sensoren zum Tauschen.',
    'g2.p.p': 'Zwei Ports auf der Hautseite und einer zur Luft nehmen die Sensor-Pucks auf: Pulse, Thermo+, EKG, EDA/BioZ und Air. Eine Konfiguration ist nur die Wahl, welcher Puck wohin kommt, im Labor mit dem Schraubendreher getauscht, ohne Löten.',
    'g2.p.b': 'Zu den Pucks',
    'pk.title': 'Fünf Pucks. Ein Core.',
    'pk.sub': 'Jeder Port nimmt jeden Puck. Getauscht wird im Labor mit Standardwerkzeug, ohne Löten. Und braucht Ihre Anwendung ein Signal, das wir noch nicht abdecken, bauen wir den Puck dafür.',
    'pk.hint': 'Ziehen zum Erkunden',
    'pk.pulse': 'Rohes PPG in Grün, Rot und Infrarot mit zwei Photodioden. Für Puls-, HRV- und Sauerstoffsättigungs-Forschung.',
    'pk.thermo': 'Zwei Hauttemperatursensoren, einer über einer definierten Isolierschicht, für einen Wärmefluss-Trend zur Kerntemperatur.',
    'pk.air': 'Temperatur, Feuchte, Druck und Gas direkt am Körper. Zeigt zur Luft, nicht zur Haut.',
    'pk.ekg': 'Biopotential-Frontend für 1-Kanal-EKG und R-Zacken als Zeitreferenz für die Pulswelle.',
    'pk.eda': 'Hautleitfähigkeit, Atmung und Bioimpedanz von 1 bis 806 kHz auf einem Frontend.',
    'pk.skin': 'Haut · Port A oder B', 'pk.airport': 'Luft · Port E',
    'pk.q': 'Ihr Sensor', 'pk.qp': 'Sie brauchen ein Signal, das wir noch nicht abdecken? Sagen Sie es uns. Wir bauen den Puck darum, am selben Port und mit derselben API.', 'pk.qc': 'Mit uns sprechen',
    'air.eye': 'Umgebungs-Port · Port E', 'air.t1': 'Den Körper messen und die Welt um ihn herum.', 'air.t2': 'Mit dem Umgebungs-Puck.',
    'air.sub': 'Der obere Port schaut nach außen und nimmt den Umgebungs-Puck, den Ihre Anwendung braucht. Seine Werte teilen eine Zeitachse mit Puls, Haut und Bewegung: Sie sehen, wie der Körper reagiert, und worauf.',
    'air.tabsaria': 'Beispiele',
    'foot.contact': 'Kontakt', 'foot.imprint': 'Impressum', 'foot.privacy': 'Datenschutz', 'foot.loc': 'Entwickelt in Deutschland',
    'air.note': 'Beispiele. Air-Puck heute verfügbar, weitere Umgebungs-Pucks auf Anfrage. Kein zertifizierter Gaswarner, kein Dosimeter.',
    'sw.title': 'Den Sensor tauschen, nicht das Gerät.', 'sw.vid': 'Eine Hand tauscht zwei Sensor-Pucks in einem geöffneten OpenPulse', 'sw.play': 'Läuft', 'sw.pause': 'Pause',
    'sw.h1': 'Vier Schrauben. Standardwerkzeug.', 'sw.p1': 'Klaren Deckel öffnen, Puck herausheben, neuen hineindrücken. Ohne Löten, ohne Kleber.',
    'sw.h2': 'Passt nur richtig herum.', 'sw.p2': 'Jeder Port ist mechanisch kodiert, ein Puck lässt sich weder verdreht noch falsch herum einsetzen.',
    'sw.h3': 'Jeder Puck weiß, was er ist.', 'sw.p3': 'Typ, Seriennummer und Kalibrierung liegen im Puck und gehen mit jeder Aufzeichnung mit.',
    'sw.h4': 'Eingerichtet im Labor, nicht vom Träger.', 'sw.p4': 'Eine Konfiguration je Anwendung, von Ihrem Team bestückt, bevor Studie oder Einsatz beginnt.',
    'sw.note': 'Video aus unserem 3D-Modell von Gen 2 generiert. Gen 2 ist in Entwicklung; die Punkte oben sind die Auslegung.',
    'raw.title': 'Jedes Signal. Roh. Ihres.',
    'raw.sub': 'Keine Cloud dazwischen und keine Scores obendrauf. Die API gibt Ihnen jeden Messwert, den die Sensoren erfassen, im Format, mit dem Sie arbeiten, wann immer Sie ihn brauchen.',
    'raw.note': 'Beispielansichten. Die API ist in Entwicklung; Kanäle und Raten wie für Gen 2 festgelegt.',
    'api.t1': 'Live', 'api.t2': 'Python', 'api.t3': 'Tabelle', 'api.t4': 'Terminal', 'api.t5': 'EDF-Viewer', 'api.t6': 'MCP',
    'api.l1': 'Live · per USB-C, ohne Cloud', 'api.l2': 'Python · jeder Messwert im DataFrame', 'api.l3': 'Tabelle · eine Zeile pro Messwert',
    'api.l4': 'Terminal · Export direkt vom Gerät', 'api.l5': 'EDF-Viewer · BDF für klinische Werkzeuge', 'api.l6': 'MCP · Ihr Assistent liest die Rohdaten',
    'api.q6': 'Zeig mir mein rohes IR-Signal von letzter Nacht gegen 3 Uhr und markiere die Bewegungsartefakte.',
    'api.a6': 'Hier ist das rohe ppg.ir.pd1 von 02:55 bis 03:05, 60 000 Messwerte bei 100 Hz. Drei Abschnitte, in denen acc.* Bewegung zeigt und das Signal anschlägt, sind markiert; der Rest ist sauber.',
    'g2.note': 'Konstruktionsstand, aus dem CAD gerendert. Noch nicht gebaut oder getestet.',
  },
};
(function () {
  let saved = null;
  try { saved = localStorage.getItem('op-lang'); } catch (e) {}
  const q = new URLSearchParams(location.search).get('lang'); if (q === 'de' || q === 'en') saved = q;   // /de/ leitet auf ?lang=de um
  window.OP_LANG = saved === 'de' || saved === 'en' ? saved : (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  function apply(lang) {
    const t = window.I18N[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (v) el.textContent = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { const v = t[el.dataset.i18nAria]; if (v) el.setAttribute('aria-label', v); });
    const h1 = document.querySelector('h1'); if (h1) h1.setAttribute('aria-label', t.h1);
    const box = document.querySelector('.lang');
    if (box) { box.dataset.active = lang; box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang))); }
  }
  window.setLang = function (lang) {
    if (!window.I18N[lang] || lang === window.OP_LANG && document.documentElement.lang === lang) return;
    window.OP_LANG = lang; apply(lang);
    try { localStorage.setItem('op-lang', lang); } catch (e) {}
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  };
  document.addEventListener('DOMContentLoaded', () => {
    apply(window.OP_LANG);
    document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => window.setLang(b.dataset.lang)));
  });
})();
