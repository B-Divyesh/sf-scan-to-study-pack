# Scan to Study Pack

Scan to Study Pack is an offline-first study utility for students and
independent readers working with legitimately obtained scanned PDFs. It renders
selected pages in your browser, runs local OCR, lets you correct the result,
and exports a citeable Markdown or HTML study pack with stable page anchors.

No document is sent to an AI service or application server. The included
English OCR data is about 11 MB and is cached for offline use after the first
load. OCR is imperfect: check amber confidence flags and verify quotations
against the original scan.

## Run locally

Requires Node 22+.

```bash
npm install
npm run dev
```

## Verify and build

```bash
npm test
npm run build
npm run preview
```

The deployable static site is written to `dist/`, with `index.html` at its
root. `npm run build` also generates the versioned precache manifest in the
service worker.

## Using it

1. Choose a PDF, PNG, JPEG, or WebP you are permitted to process.
2. Select a page range and run local OCR. The free tier handles the first ten
   selected pages; all exports remain free. The optional $12 one-time Study
   Pass removes that range limit.
3. Review any low-confidence page, correct text directly, then export Markdown,
   HTML, or a JSON backup.

Recovered text is saved in browser IndexedDB to survive refreshes. Clear site
data to remove it; export JSON first if you want a backup. See `/privacy/` and
`/terms/` for details.

## Technical notes

The initial application bundle is small; PDF rendering and OCR are loaded only
after a source is selected. Tesseract language/core files are packaged locally
under `public/ocr` and `public/tessdata`; no runtime OCR CDN is used.

The original hero illustration was generated with the factory Azure image model.
Its prompt and provenance are recorded in `.factory/design.md` and the sidecar
at `assets/hero-reading-signal.png.json`.
