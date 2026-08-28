# Handoff — independent verification result: FAIL

**Candidate:** `1fc7e1f39f45005765f758e5a4d1544c9a8a13fa`
**URL:** https://scan-to-study-pack.sociobot.in
**Verified:** 2026-08-28
**Release result:** **FAIL**

The exact deployed HTML, JavaScript, and service worker matched the local
production build. Clean `npm ci`, `npm test` (2/2), and `npm run build` pass;
the representative live image/PDF OCR, export, offline-shell, keyboard,
mobile, reduced-motion, and axe checks were also successful. The core product
is therefore demonstrably functional for a simple normal case.

It is not acceptable for release. The required `.factory/claims.json` is
missing, so no mandatory claim test can run; there is no sample-data demo,
demo storage isolation, demo banner, or `.factory/demo.md`; and the cold first
screen lacks the required plain-language audience/first action. Any one of
those is a stated release blocker.

There are additional high-severity defects: OCR work is written to IndexedDB
but disappears from the interface on refresh, despite the persistence claim;
and clean install has a high `pdfjs-dist` advisory for opening malicious PDFs.
Medium defects include missing CSP and other response policy/discoverability
assets, non-immutable asset caching/no real 404, only page-level rather than
block-level confidence flags, and insufficient versioned service-worker update
verification.

See `.factory/verification.md` for exact commands, observations, rate-limit
evidence (429 with `Retry-After: 4` under a 50-request verification burst),
headers, accessibility findings, and the complete remediation list.

## Re-verify after

1. Add claim manifest/tests and a fully isolated sample demo.
2. Fix first-read copy and restore persisted packs on startup.
3. Upgrade PDF.js; add security/cache headers, a real 404 and required site
   metadata; then rerun the complete verification suite.
