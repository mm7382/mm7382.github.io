import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cast} from '../yijian-web/assets/engine.mjs';
const oracle = JSON.parse(readFileSync(new URL('./native-oracle.json', import.meta.url)));
const corpus = JSON.parse(readFileSync(new URL('../yijian-web/data/hexagrams.json', import.meta.url)));
test('all 4096 possible casts reproduce unmodified native Swift engine including reading selection', () => {
 for (const expected of oracle) {
  const actual = cast(expected.lineValues, corpus);
  for (const key of ['hexagramNumber','changedHexagramNumber','movingLineIndices','reading']) {
   assert.deepEqual(actual[key], expected[key], `${expected.lineValues.join(',')}: ${key}`);
  }
 }
});
