# Independent verification — FAIL

**Candidate:** `1fc7e1f39f45005765f758e5a4d1544c9a8a13fa`
**Verified URL:** https://scan-to-study-pack.sociobot.in
**Date:** 2026-08-28
**Verdict:** **FAIL — release blocking acceptance requirements are not met.**

## Release blockers

1. **Missing mandatory claims manifest and claim tests.** `.factory/claims.json`
   is absent in the clean candidate. Per the work order, this is itself
   release-blocking and meant there were zero claim tests that could be run
   through the demo entry point. The landing page and README nevertheless make
   material claims including local processing, local storage, no analytics,
   offline use, exports, page-linked citations, page limits, and price. None
   has the required observable sandbox test.

2. **No one-click, isolated sample-data demo.** The cold live landing page has
   no “Try it with sample data” action (Playwright count: 0). Both `/demo` and
   `/?demo=1` return the ordinary blank source-picker UI: status 200, source
   input present, no sample action, and no `Demo — sample data, nothing is
   saved` banner/reset/start-for-real controls. `.factory/demo.md` is also
   absent. This fails the mandatory demo-sandbox contract.

3. **Cold first-read requirement fails.** On a fresh live browser the headline
   is “Make scans answerable.” The following sentence does explain local OCR
   and page citations, but the screen does not plainly name the intended
   students/independent readers and provides no obvious first action or demo.
   A visitor must infer that they should scroll to “Choose a PDF or page
   image.” The work order states that either this failure or the absent sample
   demo fails the candidate.

## High severity defects

1. **Recovered work does not survive refresh.** A local one-page PDF completed
   OCR and wrote `{ title: "ocr-page.pdf", pages: 1 }` to
   `scan-study-pack-v1/packs` in IndexedDB. Immediately reloading showed
   `0 pages recovered`, a disabled editor, and “Waiting for a source.” The app
   never reads the stored record during bootstrap. This violates the PWA/local
   first contract and contradicts README wording that recovered text “is saved
   in browser IndexedDB to survive a refresh.”

2. **High-severity vulnerable PDF dependency.** Clean `npm ci` installs
   `pdfjs-dist@5.7.284`. `npm audit --omit=dev` reports one high vulnerability:
   GHSA-hq66-cqwq-w95j, “PDF.js: Arbitrary JavaScript execution upon opening a
   malicious PDF,” with a fix available. The product opens user-selected PDFs,
   so this is directly exposed functionality.

## Medium severity defects

1. **Response policy and routing are incomplete.** The live host sends HSTS,
   Referrer-Policy, and `X-Content-Type-Options`, but no
   `Content-Security-Policy`, `Permissions-Policy`, or `X-Frame-Options`.
   Hashed JS assets use `Cache-Control: public, must-revalidate, max-age=30`,
   not long-lived immutable caching. `/missing-route` responds 200 with the
   landing page rather than a designed 404. The repository has no
   `staticwebapp.config.json`, `robots.txt`, `sitemap.xml`, canonical URL, or
   Open Graph/Twitter metadata.

2. **Brief feature is weakened without disclosure.** The researched minimum
   calls for low-confidence *blocks*. The implementation only presents one
   confidence value per page and labels a whole page “proofread”; it does not
   expose uncertain text blocks for targeted correction.

3. **PWA update/cache versioning is not demonstrably robust.** The generated
   service worker uses the fixed cache name `scan-study-pack-v1` rather than a
   versioned cache name. It contains update-toast code, but there is no
   automated update test, and the cache strategy does not meet the stated
   versioned-cache policy.

## Evidence and checks

### Mandatory claim check — performed first

```
git rev-parse HEAD
# 1fc7e1f39f45005765f758e5a4d1544c9a8a13fa
test -f .factory/claims.json
# false
```

No claim command could be executed because the required manifest is missing.

### Clean repository checks

```
npm ci                 # success; 40 packages audited
npm test               # success; 2/2 Node tests passed
npm run build          # success; generated dist/
```

There is no lint script or separate type-check script. The production build
runs `tsc -b`, Vite, and the service-worker generator. `git diff --check`
passed before documentation was written.

### End-to-end browser checks

- Chromium on the live deployment uploaded a generated representative image
  containing “The library closes at nine. Cite this sentence.” Local OCR
  recovered that exact text at 95% confidence and exported a 662-byte HTML
  study pack with `#page-001` and `Cite: ocr-page, p. 1`.
- The same representative content packaged as a PDF loaded, rendered, and
  recovered correctly locally. An invalid range (`from=2`, `to=1` on a
  one-page source) announced “Choose a valid page range between 1 and 1.”
- During the live normal OCR/export flow all observed browser requests were
  same-origin `https://scan-to-study-pack.sociobot.in`; there were no console
  errors or page errors. The optional license flow was not invoked because it
  intentionally calls the disclosed Sociobot verification endpoint.
- Local PWA offline test: after service-worker activation and a reload,
  `context.setOffline(true)` followed by reload served the application shell,
  its ordinary title, and its `h1`, with no console errors.
- Keyboard smoke test: the first Tab focused the skip link with a designed
  `rgb(188, 156, 255) solid 3px` outline; Enter reached `#main`; the restore
  dialog opened with focus on Close, tabbed to the license field, and Escape
  closed it. 390 px viewport had no horizontal overflow. Reduced-motion CSS
  removes transitions and animations.
- `@axe-core/playwright` found zero violations on both 1440×900 and 390×844
  initial pages (therefore zero serious/critical findings). The live cold page
  also produced no console/page errors.

### Deployment identity, links, API limit, and headers

- SHA-256 matched for local `dist/index.html` and live `/`; local and live
  `/assets/index-BcdfYpAW.js`; and local and live `/sw.js`. The deployed files
  are the tested candidate build.
- `/privacy/` and `/terms/` return 200. The checkout link returns 303 to the
  Sociobot/Dodo hosted checkout, as intended.
- A 50-request concurrent burst to
  `GET https://api.sociobot.in/api/v1/products/scan-to-study-pack/verify?license=qa-invalid-token`
  produced 429 responses with `Retry-After: 4`. A 429 appeared as early as
  request 2 in the concurrently scheduled collection (the ordering is not a
  deterministic threshold); the remaining requests were mixed 200/429. Thus
  rate limiting is present, with an observed four-second retry interval.
- Live root response: 200 HTML, `max-age=30`, HSTS, strict-origin-when-
  cross-origin referrer policy, and nosniff. Header omissions are recorded
  above. Built direct entry JS is 6.99 KB gzip, CSS 2.97 KB gzip, and the
  deferred PDF chunk is 123.13 KB gzip; all are under the stated JS/CSS
  budgets. OCR language/core assets are intentionally much larger and
  downloaded/precached for local OCR.

## What must change before re-verification

1. Add `.factory/claims.json`; add one clean-demo observable test for every
   user-facing claim; run all of them in CI and locally.
2. Build `/demo` or `?demo=1` with a realistic bundled sample, isolated
   `demo:` storage, persistent demo banner, Reset demo, and Start for real;
   add `.factory/demo.md`.
3. Rewrite the first screen with a plain job headline, explicit target user,
   and visible “Try it with sample data” primary action.
4. Restore IndexedDB records on bootstrap (or stop claiming persistence), then
   test reload/tab-close and offline in the sample demo.
5. Upgrade PDF.js to a non-vulnerable release and rerun audit/tests.
6. Add the missing security/cache headers, 404 and discoverability metadata;
   test service-worker update behavior and versioned caches.
