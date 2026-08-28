# Handoff — release-blocking QA repair

**Base candidate:** `1fc7e1f39f45005765f758e5a4d1544c9a8a13fa`
**Verifier report repaired:** `.factory/verification.md`
**Artifact:** static Vite TypeScript PWA (`dist/`)

## What changed

- Added a one-click `/demo` with a realistic history-seminar source note,
  editable recovered text, an amber low-confidence block, persistent demo
  banner, **Reset demo**, and **Start for real**. Demo storage is isolated in
  IndexedDB `scan-study-pack-demo-v1` at `demo:current`; real packs use
  `scan-study-pack-v1` at `real:current`.
- Rewrote the first screen for the stated job and audience, with the required
  visible sample action. Added demo, claim, and copy-audit documentation.
- Restored the latest real recovered pack on bootstrap. It keeps source-page
  previews and text; the user must reselect the original file to run OCR again.
- Added low-confidence OCR block presentation when Tesseract returns block
  data, while retaining the existing page-level confidence summary.
- Updated `pdfjs-dist` to `6.2.108` and synchronized `public/pdf.worker.mjs`.
  `npm audit --omit=dev --audit-level=high` now reports **0 vulnerabilities**.
- Added versioned service-worker cache names, old-cache cleanup, cache-first
  app-shell assets, `/demo` pre-caching, and an update toast path.
- Added `staticwebapp.config.json` with CSP, frame/permissions/referrer policy,
  immutable cache rules for hashed/static runtime assets, and an explicit 404.
  Added robots, sitemap, canonical and social metadata, a 1200×630 original-art
  derived social card, and `public/404.html`.

## Verification evidence

Run from a clean checkout with Node 22+:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
npm audit --omit=dev --audit-level=high
```

Completed locally on 2026-08-28:

- `npm ci` — clean install; 0 vulnerabilities.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 2/2 Node tests passed.
- `npm run build` — passed; created `dist/index.html`.
- `npm run test:browser` — 9/9 Chromium tests passed, including every exact
  command in `.factory/claims.json` plus desktop and 390px mobile axe scans,
  visible keyboard skip-link/focus behavior, no horizontal mobile overflow,
  404 routing, real-pack IndexedDB restoration, same-origin demo requests,
  and offline demo reload after service-worker activation.
- `npm audit --omit=dev --audit-level=high` — `found 0 vulnerabilities`.
- `git diff --check` — passed.

The repository does not contain the requested worker `verify-url.sh`; the
Playwright browser suite performs its title/lang/main/alt/console-equivalent
checks and uses `@axe-core/playwright` with zero violations at both sizes.
Initial application JS is 6.87 KB gzip, CSS is 3.29 KB gzip, deferred PDF JS
is 128.91 KB gzip, and the social/hero assets are below the stated budgets.

## Deployment

Push `main`; this static product deploys the committed `dist` build through the
factory's configured static deployment. `staticwebapp.config.json` is included
at the repository root for that deployment provider.

## Known limits

- English is the bundled OCR language. Handwriting, complex columns, and poor
  scans still require proofreading.
- The free range limit and optional Sociobot purchase behavior are unchanged.
  The optional checkout/verification endpoints require their live billing
  service and were not invoked during the local privacy demo tests.
