// Hero-Überschrift: "The wearable for" bleibt stehen, das Wort wird getippt, gelöscht (wie Rücktaste), neu getippt.
// Wörter je Sprache in js/i18n.js; Farben = die drei Bögen des OpenPulse-Logos (navy, rot, rosé), je Position.
const COLORS = ['#101f3c', '#cf3826', '#b08d83'];   // reihum
const T = { type: [55, 120], del: [28, 55], hold: 5200, gap: 380 };   // ms; lange Pause: Gerät ruht zwischen zwei Sensorwechseln in der Vorderansicht

const el = document.getElementById('typed');
const caret = document.getElementById('caret');
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = ([a, b]) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, ms));
const setColor = c => root.style.setProperty('--word', c);
const words = () => (window.I18N?.[window.OP_LANG] || window.I18N?.en).words;
// Ereignisse für den Sensorwechsel (js/viewer.js): 'wordshow' (Wort steht), 'wordswap' (Löschen beginnt, nächstes Wort folgt)
const emit = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));

let gen = 0;   // Sprachwechsel startet die Schleife neu
async function run(g) {
  for (let i = 0; ; i = (i + 1) % words().length) {
    if (g !== gen) return;
    const w = words()[i]; setColor(COLORS[i % COLORS.length]); emit('wordshow', { index: i });
    if (reduce) { el.textContent = w; await wait(3200); continue; }
    caret.classList.remove('blink');
    for (let k = 1; k <= w.length; k++) {
      if (g !== gen) return;
      el.textContent = w.slice(0, k);
      await wait(rnd(T.type) + (w[k - 1] === ' ' ? 90 : 0));
    }
    caret.classList.add('blink'); await wait(T.hold); caret.classList.remove('blink');
    emit('wordswap', { from: i, to: (i + 1) % words().length });
    for (let k = w.length - 1; k >= 0; k--) { if (g !== gen) return; el.textContent = w.slice(0, k); await wait(rnd(T.del)); }
    caret.classList.add('blink'); await wait(T.gap);
  }
}
window.addEventListener('langchange', () => { gen++; el.textContent = ''; run(gen); });
run(gen);
