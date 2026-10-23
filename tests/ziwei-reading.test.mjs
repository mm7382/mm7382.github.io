import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateZiweiChart} from '../ziwei-web/chart.mjs';
import {buildZiweiReading,buildZiweiWeek} from '../ziwei-web/reading.mjs';

const scope={console,Date,Intl};
runInNewContext(readFileSync(new URL('../ziwei-web/assets/engine.js',import.meta.url),'utf8'),scope);
const profile={birthDate:'2000-08-16',calendar:'solar',leapMonth:false,timeState:'exact',time:'03:30',gender:'female'};
const chart=calculateZiweiChart(profile,scope.FortuneEngine,'2026-10-23');
const oracle=JSON.parse(readFileSync(new URL('./fixtures/ziwei-reading-oracle.json',import.meta.url),'utf8'));

test('all six readings and seven daily guides match the compiled original App presenter',()=>{
  for(const original of oracle.kinds){
    const web=buildZiweiReading(chart,original.kind);
    assert.equal(web.unavailable,original.unavailable,original.kind);
    assert.equal(web.title,original.title,original.kind);
    assert.deepEqual(web.sections.map(s=>({heading:s.heading,lines:s.lines.map(l=>l.text)})),original.sections,original.kind);
  }
  const week=buildZiweiWeek(chart);
  for(let i=0;i<7;i++){
    assert.equal(week[i].date,oracle.days[i].date);
    assert.deepEqual(week[i].topicLines,oracle.days[i].topicLines);
    assert.equal(week[i].dayLine,oracle.days[i].dayLine);
    assert.deepEqual(week[i].guides.map(g=>g.action),oracle.days[i].guides);
  }
});

test('six original reading entries use the correct natal and time-layer palaces',()=>{
  const expected={natal:['命宮'],love:['夫妻'],career:['官祿'],wealth:['財帛'],yearly:['夫妻','官祿','財帛'],monthly:['福德','財帛','命宮']};
  for(const [kind,names] of Object.entries(expected)){
    const reading=buildZiweiReading(chart,kind);
    assert.equal(reading.unavailable,false,kind);
    assert.deepEqual(reading.palaces.map(x=>x.name),names,kind);
    assert.ok(reading.sections.length>2,kind);
    assert.ok(reading.sections.some(s=>s.heading==='來源與限制'),kind);
  }
});

test('seven dates use their own native day layer and do not mutate birth chart',()=>{
  const before=JSON.stringify(chart.palaces);
  const week=buildZiweiWeek(chart);
  assert.equal(week.length,7);
  assert.equal(new Set(week.map(x=>x.date)).size,7);
  assert.ok(week.every(x=>x.guides.length===3));
  assert.ok(week.every(x=>x.methodNote.includes('iztro 2.6.1')));
  assert.equal(JSON.stringify(chart.palaces),before);
});

test('missing month and unverified transit fail closed',()=>{
  assert.equal(buildZiweiReading({...chart,timeLayers:{...chart.timeLayers,monthly:null}},'monthly').unavailable,true);
  const wrong={...chart,dailyTransits:chart.dailyTransits.map(t=>({...t,method:'unknown'}))};
  assert.ok(buildZiweiWeek(wrong).every(x=>x.guides.length===0));
});
