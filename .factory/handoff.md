# Handoff — independent verification 2: **FAIL**

**Candidate:** `d76f14af80216708680e07bc793828663045ca66`
**Live URL:** https://scan-to-study-pack.sociobot.in
**Artifact:** static Vite TypeScript PWA (`dist/`)

## Unambiguous release result

**FAIL — do not release this candidate.**

The clean local quality gates and all listed claim commands pass, and the live
deployment matches the candidate bytes checked. However, deployed CSP blocks
the blob fetch used by Tesseract, so a normal user-uploaded scan cannot finish
OCR. After service-worker activation, `/privacy/` and `/terms/` are also served
the app shell and rendered as the client 404; missing URLs likewise become
HTTP 200. These are release-blocking production defects.

## What was verified

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
npm audit --omit=dev --audit-level=high
```

All passed locally (unit 2/2; browser 9/9; audit 0 vulnerabilities). Each
exact claim command from `.factory/claims.json` was also rerun individually
against the built demo entry point and passed. Live demo offline reload,
same-origin demo request log, desktop/390px axe serious/critical scan,
keyboard skip link, reduced motion, headers, bundle budget, response caching,
build identity, and Sociobot verification rate limiting were checked.

## Defects and next steps

1. **Critical:** allow the local Tesseract blob flow in production CSP; prove
   image and PDF OCR, correction, citation, export, and refresh recovery on
   the deployed site.
2. **High:** correct service-worker route lookup for `/privacy/` and
   `/terms/`, and retain real missing-route HTTP 404s after SW activation.
3. **Medium:** make the update toast operable before a worker takes control;
   current upgrade simulation auto-reloads before it can be used.
4. **Medium:** add claim entries/tests for all other public measurable
   promises, especially real-OCR privacy/offline behavior and tier limits.

The complete evidence, exact commands, severity assessment, deployment checks,
and observed rate-limit result are in `.factory/verification-2.md`.
