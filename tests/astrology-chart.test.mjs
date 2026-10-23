import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';
import {calculateChart} from '../astrology-web/chart.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const context=vm.createContext({});
vm.runInContext(readFileSync(join(root,'astrology-web/assets/astronomy.browser.min.js'),'utf8'),context);
const nativeAstronomy=context.Astronomy,RealmDate=vm.runInContext('Date',context);
const astronomy={...nativeAstronomy,AstroTime:class{constructor(date){return new nativeAstronomy.AstroTime(new RealmDate(date.toISOString()));}}};
const golden=JSON.parse(readFileSync(join(root,'tests/fixtures/astrology-benchmark-100.json'),'utf8'));
const zones=['Asia/Taipei','America/New_York','Europe/London','Australia/Sydney','America/Sao_Paulo','Africa/Cairo','Asia/Kolkata','Europe/Oslo','Pacific/Auckland','UTC'];
const latitudes=[25.03,40.71,51.51,-33.87,-23.55,30.04,22.57,69.65,-36.85,0];
const longitudes=[121.56,-74.01,-0.13,151.21,-46.63,31.24,88.36,18.96,174.76,0];
function benchmarkInput(index){
  const n=index%10,year=1900+(index*13)%125,month=1+(index*7)%12,day=1+(index*11)%28;
  return {date:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
    time:index%5===4?null:`${String((index*3)%24).padStart(2,'0')}:${String((index*17)%60).padStart(2,'0')}`,
    latitude:latitudes[n],longitude:longitudes[n],timeZone:zones[n]};
}
const delta=(a,b)=>Math.abs(((a-b+540)%360)-180);
test('all 100 native golden charts retain positions, houses and completeness',()=>{
  assert.equal(golden.length,100);
  let worst=0;
  for(const expected of golden){
    const actual=calculateChart(benchmarkInput(expected.id),astronomy);
    assert.equal(actual.completeness,expected.completeness,`#${expected.id} completeness`);
    assert.equal(actual.houseSystem,expected.houseSystem??null,`#${expected.id} house system`);
    for(const body of Object.keys(expected.bodies)){
      const value=actual.placements.find(x=>x.body===body).longitude;
      const error=delta(value,expected.bodies[body]);worst=Math.max(worst,error);
      assert.ok(error<0.00015,`#${expected.id} ${body} longitude error ${error}`);
    }
    if(expected.cusps){
      assert.equal(actual.cusps.length,12);
      expected.cusps.forEach((value,index)=>assert.ok(delta(actual.cusps[index],value)<0.00015,`#${expected.id} cusp ${index+1}: ${actual.cusps[index]} vs ${value}`));
      assert.ok(delta(actual.ascendant,expected.ascendant)<0.00015,`#${expected.id} ascendant`);
      assert.ok(delta(actual.midheaven,expected.midheaven)<0.00015,`#${expected.id} midheaven`);
    }else{assert.equal(actual.cusps,null);assert.equal(actual.ascendant,null);assert.equal(actual.midheaven,null);}
  }
  assert.ok(worst<0.00015);
});
test('unknown time never creates an ascendant, MC or houses',()=>{
  const chart=calculateChart({...benchmarkInput(0),time:null},astronomy);
  assert.equal(chart.completeness,'validPartial');
  assert.equal(chart.cusps,null);assert.equal(chart.midheaven,null);
  assert.ok(chart.placements.every(p=>p.house===null));
});
test('historical timezone rules match Foundation for spring gap and repeated hour',()=>{
  const place={latitude:40.713,longitude:-74.006,timeZone:'America/New_York'};
  const gap=calculateChart({...place,date:'2024-03-10',time:'02:30'},astronomy);
  assert.equal(gap.metadata.utcInstant,'2024-03-10T07:30:00.000Z');
  assert.equal(gap.metadata.adjustedBirthTime,true);
  const repeated=calculateChart({...place,date:'2024-11-03',time:'01:30'},astronomy);
  assert.equal(repeated.metadata.utcInstant,'2024-11-03T05:30:00.000Z');
  assert.equal(repeated.metadata.ambiguousBirthTime,true);
});
test('Mercury retrograde matches the original app station examples',()=>{
  const place={latitude:0,longitude:0,timeZone:'UTC',time:'00:00'};
  const mercury=date=>calculateChart({...place,date},astronomy).placements.find(x=>x.body==='mercury').retrograde;
  assert.equal(mercury('2019-03-15'),true);
  assert.equal(mercury('2019-02-20'),false);
  assert.equal(mercury('2019-04-10'),false);
});
test('unknown-time cusp day keeps two Sun signs and a DST day stays partial',()=>{
  const taipei={latitude:25.033,longitude:121.565,timeZone:'Asia/Taipei',time:null};
  const cusp=[18,19,20,21,22].map(day=>calculateChart({...taipei,date:`2000-03-${day}`},astronomy))
    .find(chart=>chart.placements.find(p=>p.body==='sun').signIsUnconfirmed);
  assert.ok(cusp);
  assert.deepEqual(cusp.placements.find(p=>p.body==='sun').candidateSigns,['pisces','aries']);
  const dst=calculateChart({...taipei,date:'1975-04-01'},astronomy);
  assert.equal(dst.completeness,'validPartial');
  assert.equal(dst.placements.length,10);
  assert.equal(dst.cusps,null);
});
test('Washington angles also match the independent Swiss Ephemeris reference pinned by the app',()=>{
  const chart=calculateChart({date:'1987-04-10',time:'19:21',latitude:38.921,longitude:-77.066,timeZone:'UTC'},astronomy);
  assert.ok(delta(chart.ascendant,149.215)<0.02);
  assert.ok(delta(chart.midheaven,54.046)<0.02);
  [149.215,172.644,201.042,234.046,268.625,300.835,329.215,352.644,21.042,54.046,88.625,120.835].forEach((v,i)=>assert.ok(delta(chart.cusps[i],v)<0.02,`cusp ${i+1}`));
});
