# OpenPulse marketing site

Static site. No build step, no dependencies. Open `index.html` or serve the folder.

```
python3 -m http.server 5178 --directory site
```

## Structure

```
site/
  index.html          all markup, one page, six sections
  css/styles.css      one stylesheet, design tokens at the top under :root
  js/main.js          menu, configurator, scroll reveal, form
  assets/img/*.webp   web-optimised imagery (~790 KB total)
  assets/favicon.svg
```

Source PNGs stay in the parent folder. Everything in `assets/img/` was resized and
converted to WebP from them. Re-run the prep if you replace a source image.

House style: no em dashes anywhere in the copy.

## The configurator

The three sensor panels each have a **Load into core** button. Loading a puck fills
the matching slot indicator in the header and the *Your configuration* readout above
the contact form, and writes into the form's hidden `configuration` field, so a
message arrives with the configuration the visitor actually built.

Slot mapping lives in the markup, not the script: each `.puck-panel` carries
`data-slot` (`body1` / `body2` / `env`) and `data-label`. Adding a fourth puck means
adding a panel with those two attributes, with no JS change.

## The signal path

The four-stage diagram in `#flow` is pure CSS. One continuous rail is drawn by
bleeding each stage's `.path-rail::before` half a column gap either side, clipped
back to the node centre on the first and last stage. The travelling pulse is a
`background-position` animation on `.path::after`, sized against the container so it
spans any width. Below 940px the rail drops out and the `01..04` numbering carries
the sequence.

## Wiring up the form

`js/main.js` line 10:

```js
var ENDPOINT = '';
```

Empty means the form validates and confirms locally **without sending anything**.
Drop in a Formspree / Basin / your-own-API URL and it POSTs `FormData` there. The
error path tells people to email `hello@openpulse.dev`, so change that address to a
real one before launch.

## Before launch

- Set `og:image` to an absolute URL (`https://yourdomain.com/assets/img/hero-band.webp`).
  Relative paths do not resolve on most social scrapers.
- Point `ENDPOINT` at a real form handler, and fix the fallback email address.
- The founders in the team section are not named. Add names and roles if you want them.
- Sensor statuses (`Working` / `Planned` / `In design`) are plain text in each
  `.puck-kicker`. Keep them honest as things ship.

## Notes

- Fonts load from Google Fonts (Newsreader + Inter) with a system serif/sans fallback.
  Self-host them if you need the site to work offline.
- `prefers-reduced-motion` is respected. Reveals, the hero float and the signal
  pulse are all disabled.
- `--shell` is only safe as a `width` on a full-bleed element, because it resolves
  `100%` against the element's own containing block. Use `--edge` to align inner
  content with the shell (see `.team-copy`).
- The three puck cutouts were re-matted: the supplied transparent PNG was cut
  against black, leaving a dark fringe that showed badly on the cream and blue
  panels. `assets/img/puck-*.webp` are un-premultiplied and eroded 1px.
