import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { calculateBaziChart } from '../bazi-web/chart.mjs';

const scope = { console, Date, Intl, setTimeout, clearTimeout };
runInNewContext(readFileSync(new URL('../bazi-web/assets/engine.js', import.meta.url), 'utf8'), scope);
const engine = scope.FortuneEngine;
const base = { birthDate: '2000-08-16', calendar: 'solar', leapMonth: false,
  timeState: 'exact', time: '03:30', gender: 'female', timeZoneIdentifier: 'Asia/Taipei' };

test('published example yields the native four pillars and day-master ten gods', () => {
  const chart = calculateBaziChart(base, engine, '2026-10-23');
  assert.deepEqual(chart.pillars.map(p => p.value), ['庚辰', '甲申', '丙午', '庚寅']);
  assert.equal(chart.dayMaster, '丙');
  assert.equal(chart.pillars[0].tenGod, 'indirectWealth');
  assert.equal(chart.pillars[0].element, '金');
  assert.equal(chart.pillars[0].branchElement, '土');
  assert.deepEqual(chart.phaseCounts, {木:2, 火:2, 土:1, 金:3, 水:0});
});

test('lunar input resolves to the same chart and impossible leap month is rejected', () => {
  const solar = calculateBaziChart(base, engine, '2026-10-23');
  const lunar = calculateBaziChart({ ...base, calendar: 'lunar', birthDate: '2000-07-17' }, engine, '2026-10-23');
  assert.deepEqual(lunar.pillars, solar.pillars);
  assert.equal(lunar.birthSolar, '2000-08-16');
  assert.throws(() => calculateBaziChart({ ...base, calendar: 'lunar', birthDate: '2000-07-17', leapMonth: true }, engine), /閏月/);
});

test('unknown time has no hour pillar and tells the reader the day pillar can shift', () => {
  const chart = calculateBaziChart({ ...base, timeState: 'unknown', time: '' }, engine);
  assert.equal(chart.pillars.length, 3);
  assert.equal(chart.timeUncertain, true);
  assert.match(chart.timeNote, /23:00/);
});

test('late Zi advances the day and earthly-branch input matches the native midpoint', () => {
  const late = calculateBaziChart({ ...base, time: '23:30' }, engine);
  const next = calculateBaziChart({ ...base, birthDate: '2000-08-17', time: '00:30' }, engine);
  assert.equal(late.pillars[2].value, next.pillars[2].value);
  const branch = calculateBaziChart({ ...base, timeState: 'earthlyBranch', time: '寅時' }, engine);
  assert.deepEqual(branch.pillars, calculateBaziChart(base, engine).pillars);
});

test('exact Bangkok civil time is converted to the native UTC+8 calendar', () => {
  const bangkok = calculateBaziChart({ ...base, birthDate: '2000-08-16', time: '23:30', timeZoneIdentifier: 'Asia/Bangkok' }, engine);
  const taipei = calculateBaziChart({ ...base, birthDate: '2000-08-17', time: '00:30' }, engine);
  assert.deepEqual(bangkok.pillars, taipei.pillars);
  assert.equal(bangkok.birthSolar, '2000-08-17');
});

test('native Swift birth-input fixtures agree on cross-date and lunar conversion', () => {
  const newYork = calculateBaziChart({ ...base, birthDate:'2000-08-16', time:'20:30', timeZoneIdentifier:'America/New_York' }, engine);
  const taipei = calculateBaziChart({ ...base, birthDate:'2000-08-17', time:'08:30' }, engine);
  assert.deepEqual(newYork.pillars, taipei.pillars);
  const lunarNewYork = calculateBaziChart({ ...base, calendar:'lunar', birthDate:'2020-04-15', time:'20:30', timeZoneIdentifier:'America/New_York' }, engine);
  const solarTaipei = calculateBaziChart({ ...base, birthDate:'2020-05-08', time:'08:30' }, engine);
  assert.deepEqual(lunarNewYork.pillars, solarTaipei.pillars);
});

test('DST gap and invalid zone fail with a reason instead of yielding a guessed chart', () => {
  assert.throws(() => calculateBaziChart({ ...base, birthDate: '2020-03-08', time: '02:30', timeZoneIdentifier: 'America/New_York' }, engine), /夏令時間|不存在/);
  assert.throws(() => calculateBaziChart({ ...base, birthDate: '2020-11-01', time: '01:30', timeZoneIdentifier: 'America/New_York' }, engine), /回撥|兩次/);
  assert.throws(() => calculateBaziChart({ ...base, timeZoneIdentifier: 'Mars/Olympus' }, engine), /時區/);
});
