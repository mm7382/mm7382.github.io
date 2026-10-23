import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';
import {calculateChart} from '../astrology-web/chart.mjs';
import {compareCharts} from '../astrology-web/synastry.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const context=vm.createContext({});
vm.runInContext(readFileSync(join(root,'astrology-web/assets/astronomy.browser.min.js'),'utf8'),context);
const engine=context.Astronomy,RealmDate=vm.runInContext('Date',context);
const astronomy={...engine,AstroTime:class{constructor(date){return new engine.AstroTime(new RealmDate(date.toISOString()));}}};
const oracle=JSON.parse(readFileSync(join(root,'tests/fixtures/astrology-synastry-oracle.json'),'utf8'));
const a={date:'1988-05-20',time:'08:30',latitude:25.033,longitude:121.565,timeZone:'Asia/Taipei'};
const b={date:'1991-09-14',time:'14:05',latitude:51.507,longitude:-0.128,timeZone:'Europe/London'};
const charts={a:calculateChart(a,astronomy),b:calculateChart(b,astronomy),pa:calculateChart({...a,time:null},astronomy),pb:calculateChart({...b,time:null},astronomy)};

test('full, mixed and partial friend comparisons match the compiled native app',()=>{
  const pairs={complete:[charts.a,charts.b],mixed:[charts.a,charts.pb],partial:[charts.pa,charts.pb]};
  for(const [mode,[first,second]] of Object.entries(pairs)){
    const result=compareCharts(first,second),expected=oracle[mode];
    assert.equal(result.orbVersion,expected.orbVersion,mode);
    assert.equal(result.hasUnknownTime,expected.hasUnknownTime,mode);
    assert.deepEqual(result.comparisons,expected.comparisons,mode);
    assert.deepEqual(result.basicAspects.map(x=>x.id),expected.basicAspects,mode);
    assert.deepEqual(result.houseOverlays,expected.houseOverlays,mode);
    assert.equal(result.aspects.length,expected.aspects.length,mode);
    for(let i=0;i<expected.aspects.length;i++){
      const actual=result.aspects[i],reference=expected.aspects[i];
      for(const key of ['id','first','second','kind','unconfirmed'])assert.equal(actual[key],reference[key],`${mode} #${i} ${key}`);
      assert.ok(Math.abs(actual.minimumOrb-reference.minimumOrb)<0.00015,`${mode} #${i} minimumOrb`);
      assert.ok(Math.abs(actual.maximumOrb-reference.maximumOrb)<0.00015,`${mode} #${i} maximumOrb`);
    }
    if(mode!=='complete'){
      assert.equal(result.houseOverlays.length,0);
      assert.ok(result.aspects.every(x=>x.unconfirmed));
      assert.equal(result.comparisons.some(x=>x.point==='ascendant'),false);
    }
  }
});

test('partial charts retain all 25 independent local-day samples for each body',()=>{
  for(const chart of [charts.pa,charts.pb]){
    assert.equal(chart.cusps,null);
    for(const values of Object.values(chart.uncertaintySamples))assert.equal(values.length,25);
  }
});
