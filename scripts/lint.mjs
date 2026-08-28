import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
if (source.includes('TODO') || source.includes('console.log(')) throw new Error('Remove TODOs and console.log calls before release.');
console.log('Source hygiene passed.');
