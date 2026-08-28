import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
async function files(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => entry.isDirectory()
    ? files(join(dir, entry.name), `${prefix}${entry.name}/`)
    : [`/${prefix}${entry.name}`]));
  return nested.flat();
}
const shell = [...new Set(['/', '/demo', ...(await files(root)).filter(file => file !== '/sw.js')])];
const versionHasher = createHash('sha256');
for (const file of shell.filter(file => !['/', '/demo'].includes(file))) {
  versionHasher.update(file).update(await readFile(join(root, file)));
}
const version = versionHasher.digest('hex').slice(0, 12);
const source = `const CACHE='scan-study-pack-${version}';
const SHELL=${JSON.stringify(shell)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('scan-study-pack-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const path = new URL(event.request.url).pathname;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.match(path).then(hit => hit || caches.match('/index.html')).then(hit => hit || fetch(event.request)).catch(() => caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(path).then(hit => hit || fetch(event.request).then(response => {
    if (response.ok) event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, response.clone())));
    return response;
  }).catch(() => caches.match('/offline.html'))));
});`;
await writeFile(join(root, 'sw.js'), source);
