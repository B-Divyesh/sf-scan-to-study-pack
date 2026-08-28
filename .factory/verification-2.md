# Independent verification 2 — FAIL

**Candidate:** `d76f14af80216708680e07bc793828663045ca66`
**Verified URL:** https://scan-to-study-pack.sociobot.in
**Date:** 2026-08-28
**Verdict:** **FAIL — do not release.**

The static deployment is the tested candidate, but its core live OCR flow is
broken by the deployed Content Security Policy. A service-worker navigation
defect also makes the required legal pages unavailable after normal app use.

## First-read result

Cold desktop load, fresh browser context: **pass**. The first screen plainly
says it turns scans into study packs, names students and independent readers,
and puts **Try it with sample data** beside “See an editable study pack right
away.” The visible facts are that it runs in the browser, is stored on the
device, and supports page citations. The one-click demo opened `/demo` and
showed the sample pack and persistent “Demo — sample data, nothing is saved”
controls.

Evidence: `/work/evidence/scan-to-study-pack-verify-2/live-cold-desktop.png`
and `/work/evidence/scan-to-study-pack-verify-2/live-cold-mobile.png`.

## Release blockers

### Critical — live OCR cannot process a normal uploaded scan

On the live root page, I uploaded a representative 1600×420 PNG containing
“The library closes at nine. Cite this sentence.”, selected its only page, and
pressed **Run local OCR**. The app ended at:

```
OCR could not finish. Keep this tab open, check storage space, then try one page.
```

Browser console evidence identifies the deployment-only cause:

```
Connecting to 'blob:https://scan-to-study-pack.sociobot.in/…' violates the
following Content Security Policy directive: "connect-src 'self'
https://api.sociobot.in". The action has been blocked.
Fetch API cannot load blob:https://scan-to-study-pack.sociobot.in/…. Refused
to connect because it violates the document's Content Security Policy.
TypeError: Failed to fetch
```

The normal image path creates a blob URL and Tesseract fetches it, so the
product cannot perform its central job on this supported input in production.
The local browser suite did not expose this because the local preview lacks the
production CSP. This alone fails the brief's smallest useful product.

### High — after service-worker activation, Privacy and Terms become client 404s

In a fresh live context, `/privacy/` and `/terms/` return their correct static
pages. After visiting `/`, waiting until `navigator.serviceWorker.controller`
was present, then navigating in the same browser context, the observed results
were:

| URL | HTTP status | title / h1 |
| --- | ---: | --- |
| `/privacy/` | 200 | `Page not found — Scan to Study Pack` / `This page is not in the pack.` |
| `/terms/` | 200 | `Page not found — Scan to Study Pack` / `This page is not in the pack.` |
| `/not-real` | 200 | `Page not found — Scan to Study Pack` / `This page is not in the pack.` |

`sw.js` precaches `/privacy/index.html` and `/terms/index.html`, but its
navigation lookup uses `/privacy/` and `/terms/`, misses both, and falls back
to cached `/index.html`. The app then renders its client not-found screen.
This makes legally required pages unavailable in the installed/normal PWA and
masks an HTTP 404 as a 200.

### Medium — several public claims are not represented by observable sandbox tests

All seven listed claim commands pass, but the page and README make additional
testable promises that have no corresponding `.factory/claims.json` entry.
Examples include the bundled English OCR data working offline, the free
ten-page limit, unlimited OCR after a valid Study Pass, source-file retention
boundaries, and “OCR happens locally; this site has no analytics” during a real
OCR flow. The `local-processing` claim only visits the already-populated demo;
it never starts OCR. The claims contract requires these promises to have a
clean-demo observable test or be removed.

### Medium — update notification is not usable

The generated worker has a content-versioned cache and the code contains an
update toast, but a local production-artifact upgrade simulation (worker cache
name changed, `registration.update()` called) auto-activated the new worker
and navigated/reloaded the page before the toast could become visible. The
test waited 60 seconds for `#update-toast` to be visible; it remained hidden
after the automatic navigation. This does not meet the required in-app
“update available” action, even though `skipWaiting` and `clientsClaim` exist.

## Required claims — run first from the clean checkout

`.factory/claims.json` exists. After `npm ci` and the required production build
(the configured browser test entry point is `vite preview`, which needs
`dist/`), I ran every listed command individually:

| claim | exact command | result |
| --- | --- | --- |
| `demo-sample` | `npm run test:browser -- --grep @claim:demo-sample` | pass, 1 test |
| `local-storage` | `npm run test:browser -- --grep @claim:local-storage` | pass, 1 test |
| `exports` | `npm run test:browser -- --grep @claim:exports` | pass, 1 test |
| `page-citations` | `npm run test:browser -- --grep @claim:page-citations` | pass, 1 test |
| `local-processing` | `npm run test:browser -- --grep @claim:local-processing` | pass, 1 test |
| `study-pass` | `npm run test:browser -- --grep @claim:study-pass` | pass, 1 test |
| `offline-demo` | `npm run test:browser -- --grep @claim:offline-demo` | pass, 1 test |

The first attempted browser command before the build could not start its
preview server because `dist/` had not yet been produced; that is a test-entry
prerequisite issue, not counted as a passing claim run. Each command above was
rerun after the exact production build and passed.

## Clean local quality gates

All commands below ran from this clean candidate checkout:

```
npm ci                                      # pass; 0 vulnerabilities
npm run typecheck                           # pass
npm run lint                                # pass
npm test                                    # pass; 2/2
npm run build                               # pass; dist/ produced
npm run test:browser                        # pass; 9/9
npm audit --omit=dev --audit-level=high     # pass; 0 vulnerabilities
git diff --check                            # pass before QA-doc edits
```

The direct initial bundle is 6.87 KB gzip JavaScript and 3.29 KB gzip CSS;
the deferred PDF chunk is 128.91 KB gzip. The local build contains larger OCR
language/core assets by design. The checked `LICENSE` is present.

## End-to-end, privacy, accessibility, and PWA evidence

- Invalid type recovery passes: a `text/plain` file announced “Choose a PDF,
  PNG, JPEG, or WebP image.” An invalid one-page range of 2–1 announced
  “Choose a valid page range between 1 and 1.”
- The real normal OCR path fails as documented in the Critical finding; its
  export and real-pack restoration could therefore not be accepted live.
- Fresh live `/demo` made only same-origin requests (document, local JS/CSS,
  hero and sample SVG) and had no page or console errors. The production root
  CSP allows only same-origin plus the disclosed Sociobot API for connections.
- After service-worker control, a visited `/demo` reloaded with browser offline
  enabled. It retained `Demo — Scan to Study Pack`, its h1, and the sample
  editable text. This offline demo check passes.
- A real generated-worker upgrade simulation found the update-toast defect
  above. Static inspection confirms content-versioned cache naming and old
  cache cleanup in the production `sw.js`.
- `@axe-core/playwright` found **zero serious or critical violations** on live
  desktop (1440×900) and mobile (390×844) demo screens. At 390px, document
  width equalled viewport width. Keyboard-only testing: first Tab focused the
  visible skip link and Enter moved focus to `#main`. Reduced-motion emulation
  reported no active animations and `0s` primary-control transition.
- Live root headers include CSP, `Permissions-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, Referrer-Policy and HSTS. Hashed main JS has
  `Cache-Control: public, max-age=31536000, immutable`; HTML is short cached.
- Candidate/deployment identity passes: SHA-256 values match local `dist/` and
  live content for `index.html`, `sw.js`, and
  `assets/index-BA2rC8wk.js`.

## Server endpoint / allowance result

The product has no application backend or sign-in. Its optional license
verification calls the disclosed Sociobot endpoint. A fresh serial sequence of
25 invalid-license verification requests returned 200. I then sent a
60-request concurrent single-client burst with the same invalid token: **5
returned 200 and 55 returned 429**, each sampled 429 including
`Retry-After: 1`. Thus rate limiting is enforced; the observed allowance under
that concurrent burst was five accepted requests before/remainder-limited (no
fixed allowance is documented by the product).

## Remediation before another verification

1. Amend the production CSP so the Tesseract blob fetch is allowed, then test
   actual live OCR and exports for image and PDF input under the deployed
   headers.
2. Fix service-worker navigation matching for directory routes and preserve
   real 404 responses; retest Privacy, Terms, and missing URLs after SW
   control and offline.
3. Make update activation wait for the visible, operable update notification
   (or change the promised behaviour), then add a behavioral upgrade test.
4. Add clean-demo claim tests for every remaining measurable public promise.
