import './style.css';
import './accessibility-fixes.css';

type Page = { page: number; text: string; confidence: number; image?: string };
type StoredPack = { id: string; title: string; updatedAt: number; pages: Page[] };
type RuntimeDoc = { title: string; file: File; kind: 'pdf' | 'image'; pageCount: number; pdf?: any };

const DB = 'scan-study-pack-v1';
const STORE = 'packs';
const FREE_PAGE_LIMIT = 10;
let runtime: RuntimeDoc | undefined;
let pages: Page[] = [];
let activePage = 1;
let db: IDBDatabase;

const $ = <T extends Element>(s: string) => document.querySelector<T>(s)!;
const app = $('#app');

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!)); }
function pageAnchor(page: number) { return `page-${String(page).padStart(3, '0')}`; }
function cite(title: string, page: number) { return `${title.replace(/\.[^.]+$/, '')}, p. ${page}`; }
function status(message: string, tone = 'normal') { const el = $<HTMLElement>('#status'); el.textContent = message; el.dataset.tone = tone; }
function isPro() { return localStorage.getItem('sb_license:scan-to-study-pack') !== null && localStorage.getItem('sb_license_state:scan-to-study-pack') !== 'invalid'; }

function render() {
  app.innerHTML = `
    <header class="topbar"><a class="brand" href="/" aria-label="Scan to Study Pack home"><span aria-hidden="true" class="brand-mark">▣</span>SCAN//STUDY</a>
      <nav aria-label="Utility"><button class="quiet theme-toggle" aria-label="Switch color theme">◐ theme</button><a href="/privacy/">privacy</a><a href="/terms/">terms</a></nav></header>
    <main id="main">
      <section class="intro" aria-labelledby="product-title">
        <div><p class="eyebrow">LOCAL OCR / PAGE PROVENANCE</p><h1 id="product-title">Make scans<br><em>answerable.</em></h1><p class="lede">Recover searchable text from your own PDFs without sending the document to an AI service. Every quotation stays tied to its source page.</p>
        <div class="trust"><span>▦ runs in this browser</span><span>◎ stored on this device</span><span>↗ cite by page</span></div></div>
        <figure class="hero-art"><img src="/hero-reading-signal.webp" width="768" height="512" fetchpriority="high" decoding="async" alt="Abstract paper page aligned with phosphor-green signals and red crop guides." /><figcaption>signal recovered / source retained</figcaption></figure>
      </section>
      <section class="workspace" aria-label="Study pack workspace">
        <aside class="control-panel"><p class="panel-kicker">01 / SOURCE</p><h2>Your scan</h2>
          <label class="drop-zone" for="file-input"><input id="file-input" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" />
            <span class="drop-icon" aria-hidden="true">⇪</span><strong>Choose a PDF or page image</strong><small>Nothing is uploaded. PDF pages stay in this browser.</small></label>
          <div id="file-summary" class="file-summary">No source selected yet.</div>
          <div class="control-row"><label for="from-page">From page</label><input id="from-page" type="number" value="1" min="1" inputmode="numeric" /></div>
          <div class="control-row"><label for="to-page">To page</label><input id="to-page" type="number" value="1" min="1" inputmode="numeric" /></div>
          <p class="disclosure">English OCR data (~11 MB) is bundled for offline use. Other languages and complex layouts can need correction.</p>
          <button id="scan-button" class="primary" disabled>Run local OCR <span aria-hidden="true">→</span></button>
          <div class="meter" aria-hidden="true"><i id="meter-fill"></i></div><p id="status" role="status" aria-live="polite">Waiting for a source.</p>
        </aside>
        <section class="reader" aria-label="Page and extracted text">
          <div class="reader-head"><div><p class="panel-kicker">02 / ALIGNMENT</p><h2 id="reader-title">Source / recovered text</h2></div><span id="page-stat">0 pages recovered</span></div>
          <nav class="page-tabs" id="page-tabs" aria-label="Recovered pages"></nav>
          <div class="reader-grid">
            <section class="page-view" aria-labelledby="source-heading"><h3 id="source-heading">Source page</h3><div id="page-canvas" class="page-canvas"><span>SELECT A SOURCE<br>TO SEE A PAGE</span></div></section>
            <section class="transcript" aria-labelledby="transcript-heading"><div class="transcript-title"><h3 id="transcript-heading">Recovered text</h3><span id="confidence-badge">—</span></div><textarea id="text-editor" aria-label="Editable recovered text" placeholder="OCR text will appear here. You can correct it before exporting." disabled></textarea><p id="citation-line" class="citation">Citation will appear here.</p><button id="copy-citation" class="quiet mini" disabled>Copy citation</button></section>
          </div>
        </section>
      </section>
      <section class="export-panel" aria-labelledby="export-heading"><div><p class="panel-kicker">03 / STUDY PACK</p><h2 id="export-heading">Export a traceable reading copy.</h2><p>Markdown and HTML include page anchors, source-page citations, and a copyright reminder. Export is always free.</p></div><div class="export-actions"><button id="export-md" class="secondary" disabled>Export Markdown</button><button id="export-html" class="secondary" disabled>Export HTML</button><button id="export-json" class="quiet" disabled>Back up JSON</button></div></section>
      <section class="pro-panel" aria-labelledby="pro-heading"><div><p class="panel-kicker">OPTIONAL / ONE-TIME</p><h2 id="pro-heading">Need a longer reading?</h2><p id="pro-copy">Free includes the first 10 selected pages and every export. A $12 Study Pass unlocks unlimited local OCR on this device.</p></div><div id="license-zone"><a class="primary buy" href="https://api.sociobot.in/api/v1/products/scan-to-study-pack/checkout">Buy Study Pass — $12</a><button id="show-license" class="quiet">Restore a license</button></div></section>
      <section class="guide" aria-labelledby="guide-heading"><p class="panel-kicker">HOW IT HOLDS UP</p><h2 id="guide-heading">A study pack, not a black box.</h2><ol><li><b>Pick pages.</b> Use a legitimate copy you already have.</li><li><b>Inspect confidence.</b> Low-confidence pages are clearly marked so you know where to proofread.</li><li><b>Quote with context.</b> Page anchors and citation snippets point back to the scan.</li></ol></section>
    </main>
    <footer><span>Made for legitimate personal study.</span><span>OCR happens locally; this site has no analytics.</span><span>Generated illustration · <a href="/privacy/">privacy</a></span></footer>
    <dialog id="license-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="panel-kicker">RESTORE PURCHASE</p><h2>Paste your license</h2><label for="license-input">License token</label><input id="license-input" autocomplete="off" /><p id="license-help">A saved license works offline while its previous verification is current.</p><div class="dialog-actions"><button id="save-license" class="primary" value="default">Save & verify</button><button class="quiet" value="cancel">Cancel</button></div></form></dialog>
    <div id="update-toast" class="toast" hidden>New version ready. <button id="refresh-app">Refresh</button></div>`;
  bind();
}

function bind() {
  $('.theme-toggle').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem('sst-theme', next); });
  $('#file-input').addEventListener('change', e => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) selectFile(file); });
  $('#scan-button').addEventListener('click', runOcr);
  $('#text-editor').addEventListener('input', e => { const p = pages.find(x => x.page === activePage); if (p) { p.text = (e.target as HTMLTextAreaElement).value; saveCurrent(); } });
  $('#copy-citation').addEventListener('click', async () => { await navigator.clipboard?.writeText(cite(runtime?.title || 'Untitled scan', activePage)); status('Citation copied to your clipboard.', 'good'); });
  $('#export-md').addEventListener('click', () => download('study-pack.md', markdown(), 'text/markdown'));
  $('#export-html').addEventListener('click', () => download('study-pack.html', studyHtml(), 'text/html'));
  $('#export-json').addEventListener('click', () => download('study-pack-backup.json', JSON.stringify({ title: runtime?.title, pages }, null, 2), 'application/json'));
  $('#show-license').addEventListener('click', () => ($('#license-dialog') as HTMLDialogElement).showModal());
  $('#save-license').addEventListener('click', e => { e.preventDefault(); const token = ($('#license-input') as HTMLInputElement).value.trim(); if (token) setLicense(token); });
}

async function selectFile(file: File) {
  if (!file.type.includes('pdf') && !file.type.startsWith('image/')) { status('Choose a PDF, PNG, JPEG, or WebP image.', 'bad'); return; }
  runtime = { title: file.name, file, kind: file.type.includes('pdf') ? 'pdf' : 'image', pageCount: 1 };
  pages = []; activePage = 1;
  if (runtime.kind === 'pdf') { try { const lib = await import('pdfjs-dist'); lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'; const task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }); runtime.pdf = await task.promise; runtime.pageCount = runtime.pdf.numPages; } catch { status('This PDF could not be opened. Try a standard, unprotected PDF.', 'bad'); return; } }
  $('#from-page').setAttribute('max', String(runtime.pageCount)); $('#to-page').setAttribute('max', String(runtime.pageCount)); ($('#to-page') as HTMLInputElement).value = String(runtime.pageCount);
  $('#file-summary').textContent = `${file.name} · ${runtime.pageCount} ${runtime.pageCount === 1 ? 'page' : 'pages'} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
  ($('#scan-button') as HTMLButtonElement).disabled = false; status(`Source ready. Choose 1–${runtime.pageCount} and run OCR.`, 'good'); drawSourcePlaceholder('READY TO SCAN');
}

async function pageImage(pageNumber: number) {
  if (!runtime) throw new Error('No source');
  if (runtime.kind === 'image') return URL.createObjectURL(runtime.file);
  const page = await runtime.pdf.getPage(pageNumber); const viewport = page.getViewport({ scale: 1.6 }); const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const ctx = canvas.getContext('2d')!; await page.render({ canvasContext: ctx, viewport }).promise; return canvas.toDataURL('image/jpeg', .85);
}

async function runOcr() {
  if (!runtime) return;
  const start = Number(($('#from-page') as HTMLInputElement).value); const end = Number(($('#to-page') as HTMLInputElement).value);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > runtime.pageCount) { status(`Choose a valid page range between 1 and ${runtime.pageCount}.`, 'bad'); return; }
  if (end - start + 1 > FREE_PAGE_LIMIT && !isPro()) { status(`Free processing covers ${FREE_PAGE_LIMIT} pages at a time. Restore or buy a Study Pass for this range.`, 'warn'); $('#pro-heading').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const button = $('#scan-button') as HTMLButtonElement; button.disabled = true; const total = end - start + 1;
  try {
    status('Starting local OCR engine…');
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, { workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/tessdata', logger: m => { if (m.status === 'recognizing text') { const pct = Math.round((m.progress || 0) * 100); ($('#meter-fill') as HTMLElement).style.width = `${pct}%`; status(`Reading page ${pages.length + 1} of ${total} · ${pct}%`); } } });
    for (let n = start; n <= end; n++) { const image = await pageImage(n); const result = await worker.recognize(image); pages = pages.filter(p => p.page !== n).concat({ page: n, text: result.data.text.trim(), confidence: Math.round(result.data.confidence), image }).sort((a,b) => a.page-b.page); renderReader(); await saveCurrent(); }
    await worker.terminate(); status(`Recovered ${total} page${total === 1 ? '' : 's'} locally. Review any amber confidence flags.`, 'good');
  } catch (error) { console.error(error); status('OCR could not finish. Keep this tab open, check storage space, then try one page.', 'bad'); }
  finally { button.disabled = false; ($('#meter-fill') as HTMLElement).style.width = '0%'; }
}

function renderReader() {
  const active = pages.find(p => p.page === activePage) || pages[0]; if (!active) return; activePage = active.page;
  $('#page-tabs').innerHTML = pages.map(p => `<button class="page-tab ${p.page === activePage ? 'active' : ''}" data-page="${p.page}">p.${p.page}<span>${p.confidence}%</span></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('.page-tab').forEach(b => b.addEventListener('click', () => { activePage = Number(b.dataset.page); renderReader(); }));
  $('#page-stat').textContent = `${pages.length} ${pages.length === 1 ? 'page' : 'pages'} recovered`; const canvas = $('#page-canvas'); canvas.innerHTML = active.image ? `<img alt="Source scan, page ${active.page}" src="${active.image}">` : '<span>PAGE IMAGE UNAVAILABLE</span>';
  const editor = $('#text-editor') as HTMLTextAreaElement; editor.disabled = false; editor.value = active.text; const low = active.confidence < 80; $('#confidence-badge').textContent = `${low ? '⚠ proofread' : '✓ clear'} · ${active.confidence}%`; $('#confidence-badge').className = low ? 'low' : 'high'; $('#citation-line').textContent = cite(runtime?.title || 'Untitled scan', active.page); ($('#copy-citation') as HTMLButtonElement).disabled = false; ['export-md','export-html','export-json'].forEach(id => (($(`#${id}`) as HTMLButtonElement).disabled = false));
}

function drawSourcePlaceholder(message: string) { $('#page-canvas').innerHTML = `<span>${message.replace(' ', '<br>')}</span>`; }
function markdown() { const title = runtime?.title.replace(/\.[^.]+$/, '') || 'Study pack'; return `# ${title}\n\n> Created locally with Scan to Study Pack. Verify quotes against the source scan.\n\n${pages.map(p => `## Page ${p.page} {#${pageAnchor(p.page)}}\n\n${p.text || '*No text recovered.*'}\n\n_Cite: ${cite(title, p.page)}_`).join('\n\n')}`; }
function studyHtml() { const title = runtime?.title.replace(/\.[^.]+$/, '') || 'Study pack'; return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)} — Study pack</title><style>body{max-width:46rem;margin:3rem auto;padding:0 1rem;font:18px/1.55 Georgia,serif;color:#102027}small{font-family:monospace;color:#46555a}h1,h2{font-family:system-ui,sans-serif}section{border-top:2px solid #e95835;padding-top:1rem;margin-top:2rem;white-space:pre-wrap}</style></head><body><h1>${escapeHtml(title)}</h1><p>Created locally with Scan to Study Pack. Verify quotations against the source scan.</p>${pages.map(p => `<section id="${pageAnchor(p.page)}"><h2>Page ${p.page}</h2><div>${escapeHtml(p.text || 'No text recovered.')}</div><p><small>Cite: ${escapeHtml(cite(title, p.page))}</small></p></section>`).join('')}</body></html>`; }
function download(name: string, content: string, type: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); status(`${name} downloaded. Your study pack stays yours.`, 'good'); }

function openDb() { return new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open(DB, 1); req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' }); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
async function saveCurrent() { if (!runtime || !db) return; const pack: StoredPack = { id: `${runtime.title}:${runtime.file.size}`, title: runtime.title, updatedAt: Date.now(), pages }; db.transaction(STORE, 'readwrite').objectStore(STORE).put(pack); }
async function setLicense(token: string) { localStorage.setItem('sb_license:scan-to-study-pack', token); ($('#license-dialog') as HTMLDialogElement).close(); status('License saved. Verifying in the background…', 'good'); try { const res = await fetch(`https://api.sociobot.in/api/v1/products/scan-to-study-pack/verify?license=${encodeURIComponent(token)}`); const verdict = await res.json(); localStorage.setItem('sb_license_state:scan-to-study-pack', verdict.valid ? 'valid' : 'invalid'); localStorage.setItem('sb_license_checked:scan-to-study-pack', String(Date.now())); if (!verdict.valid) { localStorage.removeItem('sb_license:scan-to-study-pack'); status('That license is no longer active. You can continue with the free tier.', 'warn'); } else status('Study Pass active: unlimited local OCR is unlocked.', 'good'); } catch { localStorage.setItem('sb_license_state:scan-to-study-pack', 'pending'); status('License saved for offline use. It will verify when you are online.', 'warn'); } }
async function bootstrap() {
  render(); document.documentElement.dataset.theme = localStorage.getItem('sst-theme') || 'dark';
  const queryLicense = new URLSearchParams(location.search).get('license'); if (queryLicense) { history.replaceState({}, '', location.pathname); await setLicense(queryLicense); }
  else { const savedLicense = localStorage.getItem('sb_license:scan-to-study-pack'); const checkedAt = Number(localStorage.getItem('sb_license_checked:scan-to-study-pack') || 0); if (savedLicense && Date.now() - checkedAt > 86_400_000) void setLicense(savedLicense); }
  try { db = await openDb(); } catch { status('Private storage is unavailable. Export before closing this tab.', 'warn'); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then(reg => { let updateReady = false; reg.addEventListener('updatefound', () => { const worker = reg.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) { updateReady = true; ($('#update-toast') as HTMLElement).hidden = false; $('#refresh-app').addEventListener('click', () => worker.postMessage({ type: 'SKIP_WAITING' })); } }); }); navigator.serviceWorker.addEventListener('controllerchange', () => { if (updateReady) location.reload(); }); }).catch(() => undefined);
}
bootstrap();

export { pageAnchor, cite };
