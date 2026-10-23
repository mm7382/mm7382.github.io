import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateBaziReading} from '../bazi-web/reading.mjs';

const scope = {console, Date, Intl};
runInNewContext(readFileSync(new URL('../bazi-web/assets/engine.js', import.meta.url), 'utf8'), scope);
const engine = scope.FortuneEngine;
const birth = {birthDate:'2000-08-16',calendar:'solar',leapMonth:false,timeState:'exact',
  time:'03:30',gender:'female',timeZoneIdentifier:'Asia/Taipei'};

test('the native example keeps its plain reading and three source layers', () => {
  const reading = calculateBaziReading(birth, engine, '2026-10-23', 'work');
  assert.equal(reading.dayMasterSentence.zh, '你習慣把想法講出來、讓人看見，熱度高，但來得快去得也快。');
  assert.equal(reading.today.relationLabel, '無六合或六沖');
  assert.deepEqual(Object.values(reading.today.layers).map(x=>x.label), ['曆算結果','古籍來源','時來整理']);
  assert.equal(reading.today.advice.work.text, '把一件做到一半的事推到可以交出去。');
  assert.equal(reading.sevenDays.length, 7);
  assert.deepEqual(reading.sevenDays.slice(0,2).map(x=>x.ganzhi), ['庚午','辛未']);
  assert.equal(reading.luck.pillars.find(x=>x.current)?.ganZhi, '辛巳');
  assert.ok(reading.luck.pillars.length >= 8);
  assert.equal(reading.luck.pillars.find(x=>x.current)?.years.length, 10);
  for (const key of ['personality','love','work']) {
    assert.equal(reading.themes[key].zh.length, 2);
    assert.equal(reading.themes[key].en.length, 2);
  }
  for (const day of reading.sevenDays) {
    assert.deepEqual(day.domains.map(x=>x.id), ['work','love','money']);
    assert.ok(day.layers.calendar.text && day.layers.source.text && day.layers.shilai.text);
  }
  assert.equal(reading.recommendations, undefined);
});

test('birthplace conversion precedes today and seven-day calculation', () => {
  const ny = calculateBaziReading({...birth,birthDate:'2000-08-16',time:'20:30',timeZoneIdentifier:'America/New_York'},engine,'2026-10-23','work');
  const tw = calculateBaziReading({...birth,birthDate:'2000-08-17',time:'08:30'},engine,'2026-10-23','work');
  assert.deepEqual(ny.today, tw.today);
  assert.deepEqual(ny.sevenDays, tw.sevenDays);
});

test('changing date or focus domain updates the source-backed result', () => {
  const first = calculateBaziReading(birth,engine,'2026-10-23','work');
  const next = calculateBaziReading(birth,engine,'2026-10-24','work');
  const love = calculateBaziReading(birth,engine,'2026-10-23','love');
  assert.equal(next.sevenDays[0].date,'2026-10-24');
  assert.notEqual(next.sevenDays[0].ganzhi, first.sevenDays[0].ganzhi);
  assert.equal(love.today.focusDomain,'love');
  assert.equal(love.today.advice.work.text,first.today.advice.work.text);
});

test('unknown hour keeps the reading explicitly provisional', () => {
  const reading = calculateBaziReading({...birth,timeState:'unknown',time:''},engine,'2026-10-23','work');
  assert.match(reading.timeNote,/23:00/);
  assert.equal(reading.hourKnown,false);
  assert.equal(reading.privateAndLater,null);
});
