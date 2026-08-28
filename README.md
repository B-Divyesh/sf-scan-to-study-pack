# Scan to Study Pack

Turn scanned pages into editable study packs with source-page citations. It is
for students and independent readers working with material they may process.

Start at `/demo` or use **Try it with sample data**. The demo immediately
loads a short history-seminar note with an amber block to proofread. It uses
the separate `scan-study-pack-demo-v1` IndexedDB database and never reads or
writes real packs. See `.factory/demo.md` for reset and storage details.

## Run, test, and build

Requires Node 22+.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

The static deployment artifact is `dist/`, with `index.html` at its root.
Preview it locally with `npm run preview`.

## Use with your own material

1. Choose a PDF, PNG, JPEG, or WebP you have the right to process.
2. Pick pages and run the bundled English OCR engine in the browser.
3. Review amber confidence blocks, correct text, and export Markdown, HTML, or
   a JSON backup.

The free tier processes up to ten selected pages at once. A $12 one-time Study
Pass removes that limit; exports remain free. The optional license check calls
Sociobot only after you paste or return with a license.

The app keeps the current real pack in browser IndexedDB and restores it after
a refresh. Source files are not retained after the tab session, but rendered
page previews included in a recovered pack can remain in its local record.
Clear site data to remove local records; export JSON first if you want a copy.

## Privacy and offline use

OCR code, language data, PDF worker, and the app shell ship with the site. A
visited demo can reload offline. There are no analytics or third-party OCR
scripts. See `/privacy/` and `/terms/` for the full policies.

## Claims and provenance

Every public, testable promise is listed in `.factory/claims.json` with its
exact browser regression command. The original illustration and the derived
social card are documented in `.factory/design.md`.
