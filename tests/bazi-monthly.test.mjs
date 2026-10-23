import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateBaziReading} from '../bazi-web/reading.mjs';
import {buildDailyQuiz, createPracticeLog, buildMonthlyReport} from '../bazi-web/monthly.mjs';
import {MONTH_COPY} from '../bazi-web/month-copy.mjs';

const scope={console,Date,Intl};
runInNewContext(readFileSync(new URL('../bazi-web/assets/engine.js',import.meta.url),'utf8'),scope);
const birth={birthDate:'2000-08-16',calendar:'solar',leapMonth:false,timeState:'exact',time:'03:30',gender:'female',timeZoneIdentifier:'Asia/Taipei'};

test('native monthly copy contains every ten god and each three-practice group',()=>{
  assert.equal(Object.keys(MONTH_COPY.meaning.zh).length,10);
  assert.equal(Object.keys(MONTH_COPY.meaning.en).length,10);
  for(const lang of ['zh','en']) for(const lines of Object.values(MONTH_COPY.practices[lang])) assert.equal(lines.length,3);
});

test('same date yields native fixed quiz options, answer and monthly context',()=>{
  const data=calculateBaziReading(birth,scope.FortuneEngine,'2026-10-23');
  const quiz=buildDailyQuiz(data.today,'2026-10-23');
  assert.equal(data.monthContext.month,10);
  assert.equal(quiz.answer,'indirectWealth');
  assert.equal(quiz.options.length,4);
  assert.deepEqual(quiz.options,buildDailyQuiz(data.today,'2026-10-23').options);
  assert.equal(new Set(quiz.options).size,4);
  assert.ok(quiz.options.includes(quiz.answer));
});

test('practice log stores one answer per date and reviews previous month across year boundary',()=>{
  const data=new Map();
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const log=createPracticeLog(storage);
  log.record('2025-12-31',false);
  log.record('2025-12-31',true);
  assert.deepEqual(log.summary('2025-12'),{answered:1,correct:1});
  const month=buildMonthlyReport('甲',{year:2026,month:1,ganZhi:'己丑',gan:'己'},scope.FortuneEngine,log,2);
  assert.match(month.review.zh,/上個月你答了 1 題、對 1 題，讀了 2 堂課/);
  assert.equal(month.practices.zh.length,3);
  log.clearAll();
  assert.equal(data.size,0);
});

test('broken storage warns and monthly text stays usable',()=>{
  const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
  const log=createPracticeLog(storage);
  assert.ok(log.warning);
  log.record('2026-10-23',true);
  assert.deepEqual(log.summary('2026-10'),{answered:1,correct:1});
  const month=buildMonthlyReport('丙',{year:2026,month:10,ganZhi:'戊戌',gan:'戊'},scope.FortuneEngine,log,0);
  assert.match(month.headline.zh,/10 月的月柱/);
});
