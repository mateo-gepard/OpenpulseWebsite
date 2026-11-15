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
