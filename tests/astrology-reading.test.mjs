import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';
import {calculateChart} from '../astrology-web/chart.mjs';
import {transitReport,adviceForDate,sevenDayAdvice} from '../astrology-web/reading.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const context=vm.createContext({});
vm.runInContext(readFileSync(join(root,'astrology-web/assets/astronomy.browser.min.js'),'utf8'),context);
const engine=context.Astronomy,RealmDate=vm.runInContext('Date',context);
const astronomy={...engine,AstroTime:class{constructor(date){return new engine.AstroTime(new RealmDate(date.toISOString()));}}};
const bundle=JSON.parse(readFileSync(join(root,'astrology-web/assets/rules-v1.json'),'utf8'));
const oracle=JSON.parse(readFileSync(join(root,'tests/fixtures/astrology-reading-oracle.json'),'utf8'));
const birth={date:'1988-05-20',time:'08:30',latitude:25.033,longitude:121.565,timeZone:'Asia/Taipei'};
const full=calculateChart(birth,astronomy),partial=calculateChart({...birth,time:null},astronomy);

test('only approved bilingual original rules reach the browser',()=>{
  assert.equal(bundle.bundleVersion,'rules-v1.0');
  assert.equal(bundle.orbPolicy,'orb-v1');
  assert.equal(bundle.rules.length,103);
  assert.ok(bundle.rules.every(r=>r.status==='approved'&&r.source.url.startsWith('https://archive.org/')&&r.source.rightsEvidence));
  assert.ok(bundle.rules.every(r=>r.copy['zh-Hant']?.body&&r.copy.en?.body));
  assert.deepEqual(bundle.fallbacks.entries.map(e=>e.domain),['theme','work','love','money']);
});
test('transit reports use original orb limits, order and partial-chart angle guard',()=>{
  const date=new Date('2026-10-23T04:00:00Z');
  const complete=transitReport(date,full,astronomy),incomplete=transitReport(date,partial,astronomy);
  assert.equal(complete.ruleVersion,'orb-v1');
  assert.equal(complete.angleTargetsExcluded,false);
  assert.equal(incomplete.angleTargetsExcluded,true);
  assert.ok(incomplete.candidates.every(x=>!['ascendant','midheaven'].includes(x.target)));
  assert.ok(complete.candidates.every(x=>x.orb<=(['sun','moon'].includes(x.transiting)?2:1)));
  for(let i=1;i<complete.candidates.length;i++){
    const a=complete.candidates[i-1].sortKey,b=complete.candidates[i].sortKey;
    assert.ok(a.findIndex((x,j)=>x!==b[j])<0||a[a.findIndex((x,j)=>x!==b[j])]<b[a.findIndex((x,j)=>x!==b[j])]);
  }
});
test('daily and seven-day advice are source-traced or honest quiet-day fallbacks',()=>{
  const today=adviceForDate('2026-10-23','Asia/Taipei',full,bundle,'zh-Hant',astronomy);
  assert.deepEqual(today.items.map(x=>x.domain),['theme','work','love','money']);
  assert.equal(today.ruleBundleVersion,'rules-v1.0');
  for(const item of today.items){
    assert.ok(item.copy.title&&item.copy.body);
    if(item.trace){assert.ok(today.report.candidates.includes(item.trace));assert.ok(item.ruleId&&item.source);}
    else assert.equal(item.ruleId,null);
  }
  const week=sevenDayAdvice('2026-10-23','Asia/Taipei',full,bundle,'en',astronomy);
  assert.equal(week.length,7);assert.equal(week[0].day,'2026-10-24');assert.equal(week.at(-1).day,'2026-10-30');
  assert.ok(week.every(day=>day.items.length===4&&day.items.every(item=>item.copy.title&&item.copy.body)));
});
test('unsupported dates fail rather than looking like a quiet day',()=>{
  assert.throws(()=>transitReport('1699-12-31T12:00:00Z',full,astronomy),/1700–2200/);
});
test('eight days of full and partial readings match the compiled original App',()=>{
  for(const [mode,chart] of [['complete',full],['partial',partial]]){
    for(let day=0;day<8;day++){
      const date=new Date(Date.UTC(2026,9,23+day)).toISOString().slice(0,10);
      const actual=adviceForDate(date,'Asia/Taipei',chart,bundle,'zh-Hant',astronomy),expected=oracle[mode][day];
      assert.equal(Date.parse(actual.report.instant),Date.parse(expected.instant),`${mode} ${date} instant`);
      assert.equal(actual.report.angleTargetsExcluded,expected.angleTargetsExcluded);
      assert.equal(actual.report.candidates.length,expected.candidates.length,`${mode} ${date} candidate count`);
      for(let i=0;i<expected.candidates.length;i++){
        const a=actual.report.candidates[i],e=expected.candidates[i];
        for(const key of ['transiting','target','kind','phase'])assert.equal(a[key],e[key],`${mode} ${date} #${i} ${key}`);
        assert.ok(Math.abs(a.orb-e.orb)<1e-6,`${mode} ${date} #${i} orb`);
      }
      for(let i=0;i<4;i++){
        const a=actual.items[i],e=expected.items[i];
        assert.equal(a.domain,e.domain);assert.equal(a.ruleId,e.ruleId,`${mode} ${date} ${a.domain} rule`);
        assert.equal(a.copy.title,e.title,`${mode} ${date} ${a.domain} title`);
        assert.equal(a.copy.body,e.body,`${mode} ${date} ${a.domain} body`);
        if(e.trace){assert.ok(a.trace);assert.equal(a.trace.transiting,e.trace.transiting);assert.equal(a.trace.target,e.trace.target);}
        else assert.equal(a.trace,null);
      }
    }
  }
});
