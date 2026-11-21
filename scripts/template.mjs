// Seitengerüst der Unterseiten (EN/DE). Eigenes, leichtes Stylesheet css/pages.css; kein JavaScript nötig.
import { LABELS, pageUrl, jsonLd, UPDATED } from './pages.mjs';

const MARK = `<svg class="mark" viewBox="10 10 80 80" aria-hidden="true"><path d="M 18.8 39.26 A 33 33 0 0 1 64.98 20.6" stroke="#101f3c"/><circle cx="64.98" cy="20.6" r="6.48" fill="#101f3c"/><path d="M 74.91 28.35 A 33 33 0 0 1 67.97 77.68" stroke="#b08d83"/><circle cx="67.97" cy="77.68" r="6.48" fill="#b08d83"/><path d="M 56.3 82.39 A 33 33 0 0 1 17.05 51.73" stroke="#cf3826"/><circle cx="17.05" cy="51.73" r="6.48" fill="#cf3826"/></svg>`;
const NAV = ['platform', 'pucks', 'data', 'use-cases', 'faq', 'about'];

export function renderPage(page, lang, { I18N, headMeta, localiseLinks, esc }) {
  const t = I18N[lang], L = LABELS[lang], c = page[lang], other = lang === 'de' ? 'en' : 'de';
  const lead = typeof c.lead === 'function' ? c.lead(t) : c.lead;
  const self = pageUrl(page.slug, lang), home = '/';
  const crumbs = [[L.home, home]];
  if (page.parent) crumbs.push([L[page.parent], `/${page.parent}/`]);
  crumbs.push([c.h1, null]);
  const top = page.slug.split('/')[0];
  const html = `<!doctype html>
<html lang="${lang}" data-page-lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${headMeta({ lang, title: c.title, desc: c.desc, path: self, alt: { en: pageUrl(page.slug, 'en'), de: pageUrl(page.slug, 'de') },
    ogImage: '/assets/og/openpulse-gen2.jpg', ld: jsonLd(page.ld === 'puck' ? 'page' : page.ld || 'page', lang, page) })}
<meta name="theme-color" content="#f8f6f2">
<link rel="stylesheet" href="/css/pages.css">
</head>
<body>
<header class="pg-head">
  <a class="pg-brand" href="${home}">${MARK}<span>OpenPulse</span></a>
  <nav class="pg-nav" aria-label="${L.menu}">
${NAV.map(n => `    <a href="/${n}/"${n === top ? ' aria-current="page"' : ''}>${L[n]}</a>`).join('\n')}
  </nav>
  <div class="pg-end">
    <a class="pg-lang" href="__LANG_SWITCH__" hreflang="${other}" lang="${other}" data-lang-switch="${other}">${L.lang}</a>
    <a class="pg-cta" href="${home}#contact">${L.cta.b}</a>
  </div>
</header>
<main class="pg">
  <nav class="pg-crumbs" aria-label="Breadcrumb"><ol>
${crumbs.map(([n, h]) => `    <li>${h ? `<a href="${h}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}</li>`).join('\n')}
  </ol></nav>
  <article class="pg-body">
    <p class="pg-kicker">OpenPulse Gen 2</p>
    <h1>${esc(c.h1)}</h1>
    <p class="pg-lead">${esc(lead)}</p>
${c.body(t).trim()}
  </article>
  <aside class="pg-cta-box">
    <h2>${L.cta.t}</h2>
    <p>${L.cta.p}</p>
    <p><a class="pg-btn" href="${home}#contact">${L.cta.b}</a> <a href="mailto:contact@openpulse.eu">contact@openpulse.eu</a></p>
  </aside>
  <p class="pg-updated">${L.updated}: <time datetime="${UPDATED}">${new Date(UPDATED).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
</main>
<footer class="pg-foot">
  <a class="pg-brand" href="${home}">${MARK}<span>OpenPulse</span></a>
  <nav aria-label="Footer">
${NAV.map(n => `    <a href="/${n}/">${L[n]}</a>`).join('\n')}
    <a href="/impressum.html">${L.imprint}</a>
    <a href="/datenschutz.html">${L.privacy}</a>
  </nav>
  <p>© 2026 OpenPulse · ${L.loc}</p>
</footer>
<script>document.querySelectorAll('[data-lang-switch]').forEach(a=>a.addEventListener('click',()=>{try{localStorage.setItem('op-lang',a.dataset.langSwitch)}catch(e){}}))</script>
</body>
</html>
`;
  // Sprachwechsel erst nach dem Umschreiben einsetzen, sonst würde der EN-Link auf der DE-Seite wieder zu /de/…
  return localiseLinks(html, lang).replace('__LANG_SWITCH__', pageUrl(page.slug, other));
}
