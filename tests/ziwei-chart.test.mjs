import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateZiweiChart} from '../ziwei-web/chart.mjs';

const scope={console,Date,Intl};
runInNewContext(readFileSync(new URL('../ziwei-web/assets/engine.js',import.meta.url),'utf8'),scope);
const engine=scope.FortuneEngine;
const birth={birthDate:'2000-08-16',calendar:'solar',leapMonth:false,timeState:'exact',time:'03:30',gender:'female'};

test('native public example has twelve palaces and fixed Soul/Body locations',()=>{
  const chart=calculateZiweiChart(birth,engine,'2026-10-23');
  assert.equal(chart.soulBranch,'午');assert.equal(chart.bodyBranch,'戌');
  assert.equal(chart.palaces.length,12);
  assert.equal(new Set(chart.palaces.map(p=>p.branch)).size,12);
  assert.equal(chart.chartEngine,'iztro');assert.equal(chart.chartEngineVersion,'2.6.1');
  assert.equal(chart.interpretationStatus,'unsupported');
});

test('full native palace contract retains empty major stars, minor stars, transformations and age range',()=>{
  const chart=calculateZiweiChart({...birth,birthDate:'1983-08-08',time:'04:30',gender:'male'},engine,'2026-10-13');
  const soul=chart.palaces.find(p=>p.name==='命宮');
  assert.deepEqual(soul.stars,[]);
  assert.deepEqual(soul.starDetails.map(s=>s.name),['右弼','天鉞','天馬','天福','天虛']);
  const fortune=chart.palaces.find(p=>p.name==='福德');
  assert.deepEqual(fortune.stars,['紫微','破軍化祿']);
  assert.deepEqual(fortune.starDetails.find(s=>s.name==='破軍'),{name:'破軍',group:'major',brightness:'旺',mutagen:'祿'});
  assert.equal(chart.palaces.flatMap(p=>p.starDetails).filter(s=>s.group==='major').length,14);
  assert.deepEqual(chart.palaces.find(p=>p.name==='子女').decadalAges,[35,44]);
});

test('lunar conversion and late Zi follow the pinned native engine',()=>{
  const solar=calculateZiweiChart(birth,engine,'2026-10-23');
  const lunar=calculateZiweiChart({...birth,calendar:'lunar',birthDate:'2000-07-17'},engine,'2026-10-23');
  assert.equal(lunar.birthSolar,'2000-08-16');
  assert.deepEqual(lunar.palaces,solar.palaces);
  const late=calculateZiweiChart({...birth,time:'23:30'},engine,'2026-10-23');
  const next=calculateZiweiChart({...birth,birthDate:'2000-08-17',time:'00:30'},engine,'2026-10-23');
  assert.deepEqual(late.palaces,next.palaces);
  assert.throws(()=>calculateZiweiChart({...birth,calendar:'lunar',birthDate:'2000-07-17',leapMonth:true},engine,'2026-10-23'),/閏月|日期/);
});

test('unknown time produces an explicitly provisional noon chart, preserving original input',()=>{
  const unknown={...birth,timeState:'unknown',time:''};
  const chart=calculateZiweiChart(unknown,engine,'2026-10-23');
  const noon=calculateZiweiChart({...birth,time:'12:00'},engine,'2026-10-23');
  assert.equal(chart.hourAssumed,true);
  assert.deepEqual(chart.palaces,noon.palaces);
  assert.equal(unknown.time,'');assert.equal(unknown.timeState,'unknown');
  assert.match(chart.timeNote,/午時暫定/);
});

test('all native two-hour birth choices retain their Soul and Body palaces',()=>{
  const expected=[['子時','申','申'],['丑時','未','酉'],['寅時','午','戌'],['卯時','巳','亥'],
    ['辰時','辰','子'],['巳時','卯','丑'],['午時','寅','寅'],['未時','丑','卯'],
    ['申時','子','辰'],['酉時','亥','巳'],['戌時','戌','午'],['亥時','酉','未'],['子時(晚)','申','申']];
  for(const [time,soul,body] of expected){
    const chart=calculateZiweiChart({...birth,timeState:'earthlyBranch',time},engine,'2026-10-23');
    assert.equal(chart.soulBranch,soul,time);assert.equal(chart.bodyBranch,body,time);
    assert.equal(chart.palaces.flatMap(p=>p.starDetails).filter(s=>s.group==='major').length,14,time);
  }
});

test('unsupported inputs fail with native reasons, not a guessed chart',()=>{
  assert.throws(()=>calculateZiweiChart({...birth,birthDate:'2000-02-30'},engine,'2026-10-23'),/不存在|日期/);
  assert.throws(()=>calculateZiweiChart({...birth,time:'24:00'},engine,'2026-10-23'),/時間/);
  assert.throws(()=>calculateZiweiChart({...birth,birthDate:'1899-01-01'},engine,'2026-10-23'),/範圍/);
});
