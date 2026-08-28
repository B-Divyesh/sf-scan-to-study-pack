import test from 'node:test';
import assert from 'node:assert/strict';

function citation(title, page) { return `${title}, p. ${page}`; }
function anchor(page) { return `page-${String(page).padStart(3, '0')}`; }

test('citation keeps a human page number', () => assert.equal(citation('Notes on Logic', 7), 'Notes on Logic, p. 7'));
test('page anchors are stable and sortable', () => assert.equal(anchor(7), 'page-007'));
