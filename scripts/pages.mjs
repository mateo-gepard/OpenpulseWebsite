// Inhalte für scripts/build.mjs: Kopfdaten der Startseite, Unterseiten (EN/DE), strukturierte Daten.
// Regel: nur Aussagen, die auch auf der Startseite stehen oder dort als Auslegung gekennzeichnet sind.
// Gen 2 ist in Entwicklung (nicht gebaut, nicht getestet): Werte sind Auslegungswerte, nichts ist bestellbar.

export const HOME_META = {
  en: { title: 'OpenPulse Gen 2: Modular Research Wearable with Sensor Pucks', path: '/',
    desc: 'Modular research wearable from Munich: one core, swappable sensor pucks for PPG, temperature, ECG, EDA and air quality. Raw data stays local, no cloud.',
    ogImage: '/assets/video/air.jpg' },
  de: { title: 'OpenPulse Gen 2: Modulares Forschungs-Wearable mit Sensor-Pucks', path: '/de/',
    desc: 'Modulares Forschungs-Wearable aus München: ein Core, austauschbare Sensor-Pucks für PPG, Temperatur, EKG, EDA und Luftqualität. Rohdaten bleiben lokal.',
    ogImage: '/assets/video/air.jpg' },
};

export const pageUrl = (slug, lang) => (lang === 'de' ? '/de/' : '/') + slug + '/';
export const LABELS = {};
export const PAGES = [];
export function jsonLd() { return null; }
