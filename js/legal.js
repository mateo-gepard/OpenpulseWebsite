// Sprache auf den rechtlichen Seiten: gleiche Wahl wie auf der Startseite (localStorage 'op-lang'), Deutsch ist maßgeblich.
(function () {
  let l; try { l = localStorage.getItem('op-lang'); } catch (e) {}
  if (l !== 'de' && l !== 'en') l = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  const set = v => { document.documentElement.lang = v; document.querySelectorAll('.lg-lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === v)); try { localStorage.setItem('op-lang', v); } catch (e) {} };
  document.querySelectorAll('.lg-lang button').forEach(b => b.addEventListener('click', () => set(b.dataset.lang)));
  set(l);
})();
