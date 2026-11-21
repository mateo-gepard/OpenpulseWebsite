// Statische Fassung der Website für Suchmaschinen und KI-Crawler (ohne Abhängigkeiten, Node ≥ 18).
//
//   node scripts/build.mjs
//
// Was es tut:
//   1. liest die Texte aus js/i18n.js (EN/DE) und schreibt sie in home.html (Startseite EN, ausgeliefert unter /)
//      und in de/index.html (Startseite DE, unter /de/). Im Browser setzt i18n.js dieselben Texte noch einmal.
//   2. schreibt den Kopf beider Startseiten (Titel, Beschreibung, canonical, hreflang, Open Graph, JSON-LD).
//   3. baut die Unterseiten aus scripts/pages.mjs (EN unter /<seite>/, DE unter /de/<seite>/), dazu sitemap.xml.
//
// Quelle der Startseite ist home.html: Struktur dort ändern, Texte in js/i18n.js, dann dieses Skript laufen lassen.
// Das Skript ist idempotent (zweimal laufen = gleiches Ergebnis).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.openpulse.eu';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Texte aus js/i18n.js ----------
function loadI18n() {
  const ctx = { window: {}, document: { addEventListener() {}, documentElement: { dataset: {} } },
    localStorage: { getItem: () => null, setItem() {} }, location: { search: '' }, navigator: { language: 'en' },
    URLSearchParams, CustomEvent: class {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n.js'), ctx);
  return ctx.window.I18N;
}
const I18N = loadI18n();

// ---------- Kopf ----------
import { HOME_META, jsonLd, PAGES, LABELS, pageUrl } from './pages.mjs';

function headMeta({ lang, title, desc, path: p, alt, ogImage, ld }) {
  const url = SITE + p;
  const altLinks = Object.entries(alt).map(([l, ap]) => `<link rel="alternate" hreflang="${l}" href="${SITE + ap}">`).join('\n');
  return `<!-- head:meta (geschrieben von scripts/build.mjs: Titel, Beschreibung, canonical, hreflang, Open Graph, JSON-LD) -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${altLinks}
<link rel="alternate" hreflang="x-default" href="${SITE + alt.en}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OpenPulse">
<meta property="og:locale" content="${lang === 'de' ? 'de_DE' : 'en_GB'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE + ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${ld ? `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2).replace(/</g, '\\u003c')}\n</script>\n` : ''}<!-- /head:meta -->`;
}
const replaceBlock = (html, name, body) => {
  const re = new RegExp(`<!-- ${name}[^>]*-->[\\s\\S]*?<!-- /${name} -->`);
  if (!re.test(html)) throw new Error(`Block ${name} fehlt`);
  return html.replace(re, body);
};

// ---------- Startseite: Texte einsetzen ----------
function prerender(html, lang) {
  const t = I18N[lang];
  // <tag … data-i18n="k" …>reiner Text</tag>  (nur Elemente ohne Kind-Elemente)
  html = html.replace(/<([a-z][a-z0-9]*)(\s[^>]*?\bdata-i18n="([^"]+)"[^>]*)>([^<]*)<\/\1>/g, (m, tag, attrs, key, inner) =>
    t[key] != null ? `<${tag}${attrs}>${esc(t[key])}</${tag}>` : m);
  html = html.replace(/<([a-z][a-z0-9]*)(\s[^>]*?\bdata-i18n-aria="([^"]+)"[^>]*)>/g, (m, tag, attrs, key) => {
    if (t[key] == null) return m;
    const a = /\saria-label="[^"]*"/.test(attrs) ? attrs.replace(/\saria-label="[^"]*"/, ` aria-label="${esc(t[key])}"`) : `${attrs} aria-label="${esc(t[key])}"`;
    return `<${tag}${a}>`;
  });
  html = html.replace(/(<section class="hero"[\s\S]*?<h1 aria-label=")[^"]*"/, `$1${esc(t.h1)}"`);
  html = html.replace(/(<span class="typed" id="typed">)[^<]*(<\/span>)/, `$1${esc(t.words[0])}$2`);
  html = html.replace(/<button type="button" data-lang="(en|de)" aria-pressed="(true|false)">/g, (m, l) =>
    `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">`);
  html = html.replace(/<html lang="[a-z]+" data-page-lang="[a-z]+">/, `<html lang="${lang}" data-page-lang="${lang}">`);
  return html;
}
// Interne Links auf die deutsche Fassung umschreiben (/platform/ → /de/platform/, / → /de/)
const PAGE_PATHS = ['platform', 'pucks', 'data', 'use-cases', 'faq', 'about'];
export function localiseLinks(html, lang) {
  if (lang !== 'de') return html;
  return html
    .replace(new RegExp(`href="/(${PAGE_PATHS.join('|')})/`, 'g'), 'href="/de/$1/')
    .replace(/href="\/"/g, 'href="/de/"');
}

const LANG_REDIRECT = `<!-- head:lang (nur Startseite EN: wer Deutsch gewählt hat oder einen deutschen Browser ohne Wahl nutzt, landet auf /de/) -->
<script>(function(){try{var q=new URLSearchParams(location.search).get('lang'),s=localStorage.getItem('op-lang');if(q==='de'||(!q&&s==='de')||(!q&&!s&&/^de/i.test(navigator.language||'')))location.replace('/de/'+location.hash)}catch(e){}})()</script>
<!-- /head:lang -->`;
const NO_LANG_REDIRECT = `<!-- head:lang (nur Startseite EN: wer Deutsch gewählt hat oder einen deutschen Browser ohne Wahl nutzt, landet auf /de/) -->
<!-- /head:lang -->`;

const template = read('home.html');
for (const lang of ['en', 'de']) {
  const m = HOME_META[lang];
  let html = prerender(template, lang);
  html = replaceBlock(html, 'head:meta', headMeta({ lang, ...m, alt: { en: '/', de: '/de/' }, ld: jsonLd('home', lang) }));
  html = replaceBlock(html, 'head:lang', lang === 'en' ? LANG_REDIRECT : NO_LANG_REDIRECT);
  html = localiseLinks(html, lang);
  write(lang === 'en' ? 'home.html' : 'de/index.html', html);
}

// ---------- Unterseiten ----------
import { renderPage } from './template.mjs';
const urls = [{ en: '/', de: '/de/', pri: '1.0' }];
for (const page of PAGES) {
  for (const lang of ['en', 'de']) {
    const html = renderPage(page, lang, { I18N, headMeta, localiseLinks, esc, SITE });
    write(pageUrl(page.slug, lang).replace(/^\//, '') + 'index.html', html);
  }
  urls.push({ en: pageUrl(page.slug, 'en'), de: pageUrl(page.slug, 'de'), pri: page.priority || '0.8' });
}

// ---------- sitemap.xml ----------
const today = new Date().toISOString().slice(0, 10);
const lastmod = process.env.LASTMOD || today;
const entry = (loc, u) => `  <url>
    <loc>${SITE + loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE + u.en}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE + u.de}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + u.en}"/>
    <priority>${u.pri}</priority>
  </url>`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.flatMap(u => [entry(u.en, u), entry(u.de, u)]).join('\n')}
  <url><loc>${SITE}/impressum.html</loc><lastmod>${lastmod}</lastmod><priority>0.2</priority></url>
  <url><loc>${SITE}/datenschutz.html</loc><lastmod>${lastmod}</lastmod><priority>0.2</priority></url>
</urlset>
`;
write('sitemap.xml', sitemap);
console.log(`Gebaut: home.html, de/index.html, ${PAGES.length * 2} Unterseiten, sitemap.xml (${urls.length * 2 + 2} URLs, lastmod ${lastmod})`);
