import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateZiweiChart} from '../ziwei-web/chart.mjs';
import {compareZiweiCharts,createZiweiPeopleStore,shareZiweiComparison} from '../ziwei-web/people.mjs';

const scope={Date,Intl,console};runInNewContext(readFileSync(new URL('../ziwei-web/assets/engine.js',import.meta.url),'utf8'),scope);
const a={birthDate:'2000-08-16',calendar:'solar',leapMonth:false,timeState:'exact',time:'03:30',gender:'female'};
const b={birthDate:'1983-08-08',calendar:'solar',leapMonth:false,timeState:'exact',time:'04:30',gender:'male'};
const first=calculateZiweiChart(a,scope.FortuneEngine,'2026-10-23');
const second=calculateZiweiChart(b,scope.FortuneEngine,'2026-10-23');

test('person switching uses stable ids and never mixes another app storage',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const book=createZiweiPeopleStore(storage);
  const one=book.save('自己',a),two=book.save('朋友',b);
  assert.equal(book.active().id,two.id);
  book.select(one.id);assert.equal(book.active().profile.birthDate,a.birthDate);
  const restored=createZiweiPeopleStore(storage);assert.equal(restored.active().id,one.id);
  restored.remove(one.id);assert.equal(restored.active().id,two.id);
  assert.deepEqual([...data.keys()],['ziwei-web-people-v1']);
  restored.clear();assert.equal(restored.list().length,0);assert.equal(data.size,0);
});

test('native-style comparison reports two directions without a compatibility verdict',()=>{
  const result=compareZiweiCharts(first,second);
  const original=JSON.parse(readFileSync(new URL('./fixtures/ziwei-synastry-oracle.json',import.meta.url),'utf8'));
  assert.deepEqual(result,original);
  assert.ok(result);
  assert.equal(result.firstToSecond.life.sourceBranch,first.soulBranch);
  assert.equal(result.firstToSecond.life.targetPalace,second.palaces.find(p=>p.branch===first.soulBranch).name);
  assert.equal(result.secondToFirst.body.sourceBranch,second.bodyBranch);
  assert.equal(result.firstToSecond.lifeStars.length,first.palaces.find(p=>p.name==='命宮').stars.length);
  assert.equal(compareZiweiCharts({...first,palaces:first.palaces.slice(1)},second),null);
  assert.ok(!JSON.stringify(result).includes('score'));
});

test('sharing previews names and palace facts only, never birth data',()=>{
  const comparison=compareZiweiCharts(first,second);
  const share=shareZiweiComparison({first,second,comparison,firstName:'自己',secondName:'朋友',firstProfile:a,secondProfile:b});
  assert.ok(share.includes('自己'));assert.ok(share.includes('朋友'));
  assert.ok(!share.includes(a.birthDate));assert.ok(!share.includes(b.birthDate));
  assert.ok(!share.includes(a.time));assert.ok(!share.includes(b.time));
  const unsafe=shareZiweiComparison({first,second,comparison,firstName:'2000年8月16日',secondName:'朋友',firstProfile:a,secondProfile:b});
  assert.ok(!unsafe.includes('2000年8月16日'));
});

test('corrupt storage is retained until explicit clear and writes fail safely',()=>{
  let raw='broken';const storage={getItem:()=>raw,setItem:(_,v)=>{raw=v;},removeItem:()=>{raw=null;}};
  const book=createZiweiPeopleStore(storage);
  assert.equal(book.corrupted,true);assert.throws(()=>book.save('自己',a));assert.equal(raw,'broken');
  book.clear();assert.equal(book.corrupted,false);
});

test('blocked browser storage keeps the current chart in memory and reports it',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw Error('quota');},removeItem:()=>{}};
  const book=createZiweiPeopleStore(storage);
  book.save('自己',a);
  assert.equal(book.list().length,1);
  assert.equal(book.persistent,false);
  assert.match(book.warning,/儲存不可用/);
});
