import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

let browserErrors = [];
test.beforeEach(async ({ context }) => {
  await context.clearCookies();
  browserErrors = [];
});
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
});
test.afterEach(() => expect(browserErrors).toEqual([]));

test('@claim:demo-sample demo is one-click, useful, and isolated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /try it with sample data/i })).toBeVisible();
  await page.getByRole('link', { name: /try it with sample data/i }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel('Demo controls')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.getByLabel('Editable recovered text')).toHaveValue(/The library closes at nine/);
  await expect(page.getByText(/Proofread these low-confidence blocks/)).toBeVisible();
  await expect(page.locator('#confidence-blocks')).toContainText('62%');
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name));
  expect(dbs).toContain('scan-study-pack-demo-v1');
});

test('@claim:local-storage recovered real packs restore after refresh', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('scan-study-pack-v1', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => { const request = db.transaction('packs', 'readwrite').objectStore('packs').put({ id: 'real:current', title: 'Regression note', updatedAt: Date.now(), pageCount: 1, pages: [{ page: 1, text: 'This recovered work survives refresh.', confidence: 91, image: '/sample-library-note.svg', blocks: [] }] }); request.onsuccess = resolve; request.onerror = () => reject(request.error); });
  });
  await page.reload();
  await expect(page.getByLabel('Editable recovered text')).toHaveValue('This recovered work survives refresh.');
  await expect(page.locator('#status')).toContainText('restored from this device');
});

test('@claim:exports sample study packs export Markdown, HTML, and JSON', async ({ page }) => {
  await page.goto('/demo');
  for (const [name, expected] of [['Export Markdown', '# History seminar — library note'], ['Export HTML', '<section id="page-001">'], ['Back up JSON', 'History seminar — library note']]) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name }).click();
    const content = await (await download).createReadStream();
    let text = '';
    for await (const chunk of content) text += chunk;
    expect(text).toContain(expected);
  }
});

test('@claim:page-citations exported samples keep a source-page citation', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#citation-line')).toHaveText('History seminar — library note, p. 1');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  const content = await (await download).createReadStream();
  let text = '';
  for await (const chunk of content) text += chunk;
  expect(text).toContain('{#page-001}');
  expect(text).toContain('Cite: History seminar — library note, p. 1');
});

test('@claim:local-processing demo requests stay on this origin', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Sample study pack ready')).toBeVisible();
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBeTruthy();
});

test('@claim:study-pass the optional $12 checkout is correctly identified', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Free includes the first 10 selected pages and every export.')).toBeVisible();
  const checkout = page.getByRole('link', { name: 'Buy Study Pass — $12' });
  await expect(checkout).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/scan-to-study-pack/checkout');
});

test('@claim:offline-demo a visited demo reloads offline', async ({ browser }) => {
  const isolatedContext = await browser.newContext();
  const isolatedPage = await isolatedContext.newPage();
  try {
    await isolatedPage.goto('http://127.0.0.1:4173/demo');
    await expect(isolatedPage.getByLabel('Editable recovered text')).toHaveValue(/The library closes at nine/);
    await isolatedPage.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    await isolatedPage.waitForFunction(async () => Boolean(await caches.match('/demo')) && Boolean(await caches.match('/index.html')));
    await isolatedContext.setOffline(true);
    await isolatedPage.reload();
    await expect(isolatedPage.getByRole('heading', { level: 1 })).toHaveText(/Turn scans into/);
    await expect(isolatedPage.getByLabel('Editable recovered text')).toHaveValue(/The library closes at nine/);
  } finally {
    await isolatedContext.close();
  }
});

test('the production service worker has a content-versioned demo precache and update path', async ({ page }) => {
  const source = await (await page.request.get('/sw.js')).text();
  expect(source).toMatch(/const CACHE='scan-study-pack-[a-f0-9]{12}'/);
  expect(source).toContain("'SKIP_WAITING'");
  expect(source).toContain('"/demo"');
  expect(source).toContain("caches.delete(key)");
});

test('desktop and mobile a11y, keyboard, policy and 404 regressions', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/demo');
    expect(await new AxeBuilder({ page }).analyze()).toEqual(expect.objectContaining({ violations: [] }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /skip to workspace/i })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.goto('/missing-route');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not in the pack.');
  await expect(page).toHaveTitle('Page not found — Scan to Study Pack');
});
