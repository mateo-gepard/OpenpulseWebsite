// Pucktausch: Video spielt nur, solange es sichtbar ist; Pille schaltet Abspielen/Pause (Wahl des Nutzers hat Vorrang).
(function () {
  const v = document.getElementById('sw-vid'); if (!v) return;
  const segs = [...document.querySelectorAll('.sw-seg')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let want = !reduce, seen = false;
  const sync = () => {
    const on = want && seen;
    if (on) v.play().catch(() => {}); else v.pause();
    segs.forEach(b => { const a = (b.dataset.play === '1') === want; b.classList.toggle('on', a); b.setAttribute('aria-pressed', a); });
  };
  segs.forEach(b => b.addEventListener('click', () => { want = b.dataset.play === '1'; sync(); }));
  new IntersectionObserver(e => { seen = e[0].isIntersecting; sync(); }, { threshold: .25 }).observe(v);
  sync();
})();
