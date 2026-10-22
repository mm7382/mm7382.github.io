import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {cast} from '../yijian-web/assets/engine.mjs';
const corpus=JSON.parse(readFileSync(new URL('../yijian-web/assets/data/hexagrams.json',import.meta.url)));
test('Qian with no changes reads its judgment, with six changes reads use nine',()=>{assert.equal(cast([7,7,7,7,7,7],corpus).hexagramNumber,1);assert.equal(cast([7,7,7,7,7,7],corpus).changedHexagramNumber,0);assert.equal(cast([9,9,9,9,9,9],corpus).reading.kind,'useNineOrSix');});
test('invalid casting is rejected without a fabricated answer',()=>{assert.throws(()=>cast([7,7],corpus));assert.throws(()=>cast([7,7,7,7,7,10],corpus));});
