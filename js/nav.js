// Pillen-Menü: Hamburger öffnet/schließt die Liste; Escape und Klick daneben schließen.
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
function setOpen(open) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
  if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
  else { menu.classList.remove('open'); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 220); }
}
burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
document.addEventListener('click', e => { if (!e.target.closest('.nav-wrap')) setOpen(false); });
menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });

// Fußzeile: Höhe als Abstand unter der Seite, damit sie am Ende hinter der Seite hervorkommt
const ft = document.getElementById('footer');
if (ft) { const setH = () => document.documentElement.style.setProperty('--ftH', ft.offsetHeight + 'px'); new ResizeObserver(setH).observe(ft); setH(); }

// Telefon: Kontakt-Knopf unten (Daumenreichweite). Sichtbar nach dem Hero, weg in „So arbeiten wir zusammen“ (dort ist das Formular),
// am Seitenende und solange das Menü offen ist.
const mcta = document.getElementById('m-cta');
if (mcta) {
  const hero = document.getElementById('top'), how = document.getElementById('how'), g2 = document.getElementById('platform');
  let pastHero = false, inHow = false, inG2 = false;
  const sync = () => { const on = pastHero && !inHow && !inG2 && !document.body.classList.contains('menu-open'); mcta.classList.toggle('on', on); mcta.setAttribute('aria-hidden', String(!on)); mcta.tabIndex = on ? 0 : -1; };
  if (hero) new IntersectionObserver(e => { pastHero = !e[0].isIntersecting; sync(); }, { threshold: 0, rootMargin: '-40% 0px 0px 0px' }).observe(hero);
  if (how) new IntersectionObserver(e => { inHow = e[0].isIntersecting; sync(); }, { threshold: 0, rootMargin: '0px 0px -30% 0px' }).observe(how);
  if (g2) new IntersectionObserver(e => { inG2 = e[0].isIntersecting; sync(); }, { threshold: 0, rootMargin: '-50% 0px -50% 0px' }).observe(g2);   // Gen 2: Karte unten braucht den Platz
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
// Menü-Sprachwahl (Telefon) ist dieselbe Wahl wie oben
document.querySelectorAll('.menu-lang button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); window.setLang && window.setLang(b.dataset.lang); }));
