// Laufband Auszeichnungen: Reihe so oft kopieren, dass sie die Breite doppelt füllt; CSS verschiebt um eine Hälfte.
(function () {
  const track = document.querySelector('.awards .track'); if (!track) return;
  const group = track.querySelector('.award-group');
  function fill() {
    track.querySelectorAll('.award-group.copy').forEach(g => g.remove());
    const need = Math.ceil((track.parentElement.offsetWidth * 2) / Math.max(1, group.offsetWidth));
    const half = [group];
    for (let i = 1; i < need; i++) { const c = group.cloneNode(true); c.classList.add('copy'); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); half.push(c); }
    // zweite Hälfte = exakte Kopie der ersten, damit -50 % nahtlos anschließt
    half.forEach(g => { const c = g.cloneNode(true); c.classList.add('copy'); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    track.style.setProperty('--dur', (track.scrollWidth / 2 / 38) + 's');   // ~38 px/s, ruhig
  }
  addEventListener('load', fill); addEventListener('resize', () => { clearTimeout(fill.t); fill.t = setTimeout(fill, 150); });
  addEventListener('langchange', () => setTimeout(fill, 50));
})();
