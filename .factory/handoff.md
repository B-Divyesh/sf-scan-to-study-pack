# Handoff — Scan to Study Pack

## Delivered

- Local-first Vite/TypeScript PWA in `dist/`, with PDF page rendering, local
  Tesseract WASM OCR, page range selection, visible confidence indicators,
  editable text, source-page image alignment, citation copying, and Markdown /
  HTML / JSON exports with stable page anchors.
- IndexedDB persistence of recovered text, explicit JSON ownership backup, and
  a static offline fallback. The generated service worker precaches the app
  shell, OCR core, English language pack, PDF worker, and illustration.
- One-time $12 Study Pass UI using Sociobot checkout and license verification;
  it unlocks unlimited page ranges. The free tier remains useful (10 pages and
  all exports), with no accessibility or export gate.
- `/privacy/` and `/terms/`, README, MIT license, original generated image,
  and a product-specific pixel/demoscene design thesis.

## Verification

Run from a clean dependency install:

```bash
npm install
npm test
npm run build
```

Completed locally on 2026-08-28:

- `npm test` — 2/2 page-anchor/citation tests pass.
- `npm run build` — passes and produces `dist/index.html`.
- Playwright Chromium smoke test — title, exactly one h1, main landmark and
  source picker found; no console/page errors on initial load.
- Playwright offline test — after SW activation, `context.setOffline(true)` and
  reload served the cached app (one h1, one main, no console errors).
- Playwright end-to-end OCR test — a generated page image reading “Study note /
  Page linked text” was processed by the packaged local worker and returned the
  expected recovered text and page citation.
- `@axe-core/playwright` — zero accessibility violations on the initial screen.
- Built initial JS is ~14 KB gzip (the PDF module is deferred at ~123 KB gzip);
  CSS is ~3 KB gzip; original hero WebP is 88 KB. The large OCR language/core
  assets are deferred and intentionally precached for offline processing.

## Accessibility and privacy

- Semantic header/nav/main/footer, one h1, labelled inputs, live status,
  visible keyboard focus, 44px controls, responsive 390px stacking, high
  contrast tokens, and reduced-motion handling are included.
- There are no tracking scripts, remote fonts, or remote OCR scripts. PDFs and
  OCR output stay in the browser. License verification is the sole optional
  network request after a purchase restore.

## Known gaps / next steps

- English is the bundled language. Additional offline language packs should be
  selected and shipped deliberately; complex columns, handwriting, and poor
  scans need manual proofreading.
- OCR execution is WASM-heavy, especially on a first run. It is intentionally
  loaded only after user action and shows progress/error guidance.
- A production release should run a full Lighthouse mobile audit against the
  deployed host and replace the checkout endpoint with staging if factory
  staging is used.
