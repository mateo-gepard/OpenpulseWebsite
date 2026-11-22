# SEO / AI visibility: how the site is built now

Since 21.11.2026 the crawlable text is generated, not typed by scripts at runtime.

```
node scripts/build.mjs        # after any change to home.html, js/i18n.js or scripts/pages.mjs
```

It writes:

| Output | From |
|---|---|
| `home.html` (served at `/`), `de/index.html` (`/de/`) | `home.html` as template + texts in `js/i18n.js` |
| `platform/`, `pucks/…`, `data/`, `use-cases/`, `faq/`, `about/` and the same under `de/` | `scripts/pages.mjs` (content), `scripts/template.mjs` (layout), `css/pages.css` |
| `<head>` of every page: title, description, canonical, hreflang, Open Graph, JSON-LD | `HOME_META`, page `title`/`desc`, `jsonLd()` in `scripts/pages.mjs` |
| `sitemap.xml` (with `lastmod`, hreflang) | all of the above; set `LASTMOD=YYYY-MM-DD` to pin the date |

The script is idempotent. Commit its output together with the source change.

Rules (also at the top of `scripts/pages.mjs`):
- Gen 2 is in development. Every spec is a design target. No prices, no `offers` and no `Product` node in JSON-LD until
  something can be ordered at a fixed price (Google's product snippets require `offers.price`; the configurator's ≈ figure
  is an estimate, not an offer price). Pages may still point to `#gen2` via `about`.
- No "open source" wording until a repository with a licence is public.
- Awards only with a link to the organiser's results page.
- Keep "not a medical device" and "not a certified gas detector or dosimeter".

Static text inside script-drawn sections (`.fb` blocks in `home.html`) is hidden when JavaScript runs and replaced by the
scripts. Keep it equivalent to what the scripts show.

`/llms.txt` is hand-written. Update it when the status, specs or pages change.

Outside the code (not done here): Google Search Console and Bing Webmaster Tools verification and sitemap submission,
apex → www redirect as 308 instead of 307 (Vercel → Domains), Impressum placeholders.
