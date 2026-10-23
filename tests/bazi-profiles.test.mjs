import test from 'node:test';
import assert from 'node:assert/strict';
import {createBaziProfileBook} from '../bazi-web/profiles.mjs';
import {compareBaziCharts} from '../bazi-web/synastry.mjs';
import {createStudyStore} from '../bazi-web/learn/study.mjs';

const memory = () => {
  const values = new Map();
  return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
};
const birth = (date,time='03:30') => ({birthDate:date,calendar:'solar',leapMonth:false,
  timeState:time?'exact':'unknown',time,gender:'female',timeZoneIdentifier:'Asia/Taipei'});

test('two named profiles save, switch, reload and delete without sharing other-app data', () => {
  const storage = memory(); storage.setItem('shilai.ziwei.profiles.v1','keep');
  const book = createBaziProfileBook(storage);
  const first=book.save('我',birth('2000-08-16'));
  const friend=book.save('朋友',birth('1990-06-15',''));
  assert.equal(book.list().length,2);
  assert.equal(book.active().id,friend.id);
  book.select(first.id);
  assert.equal(createBaziProfileBook(storage).active().name,'我');
  book.remove(first.id);
  assert.equal(book.active().name,'朋友');
  book.clear();
  assert.equal(createBaziProfileBook(storage).list().length,0);
  assert.equal(storage.getItem('shilai.ziwei.profiles.v1'),'keep');
});

test('blocked and damaged storage preserve session work and do not overwrite damaged data', () => {
  const damaged=memory(); damaged.setItem('shilai.bazi.profiles.v1','broken{');
  const book=createBaziProfileBook(damaged);
  book.save('臨時',birth('2000-08-16'));
  assert.equal(book.list().length,1);
  assert.equal(book.persistent,false);
  assert.equal(damaged.getItem('shilai.bazi.profiles.v1'),'broken{');
  const blocked={getItem(){throw Error('disabled')},setItem(){throw Error('disabled')},removeItem(){throw Error('disabled')}};
  const privateBook=createBaziProfileBook(blocked);
  privateBook.save('臨時',birth('1990-06-15'));
  assert.equal(privateBook.list().length,1);
  assert.match(privateBook.warning,/儲存|保存/);
});

test('native synastry keeps direction and branch relationship, with no verdict or birthday in share text', () => {
  const engine={tenGod:(a,b)=>a==='甲'&&b==='庚'?'sevenKillings':a==='庚'&&b==='甲'?'indirectWealth':null};
  const result=compareBaziCharts({dayMaster:'甲',pillars:[{name:'日柱',branch:'子'}]},
    {dayMaster:'庚',pillars:[{name:'日柱',branch:'午'}]},engine);
  assert.equal(result.tie,'clash');
  assert.equal(result.readings.length,3);
  assert.equal(result.readings[0].zh,'你在他面前會繃著，想做好、怕被看扁。');
  assert.equal(result.readings[1].zh,'你把他看成能一起去闖的人，相處熱絡但不一定深。');
  assert.notEqual(result.readings[0].zh,result.readings[1].zh);
  assert.match(result.readings[2].zh,/日支相沖/);
  assert.doesNotMatch(result.share.zh,/2000|1990|吉|凶|分數/);
});

test('clearing all study data removes notes and review from this app only', () => {
  const storage=memory(); storage.setItem('shilai.ziwei.study.v1','keep');
  const study=createStudyStore(storage);
  study.saveNote('F01','我的筆記');
  study.recordFirstAnswer('F01','q1',false);
  study.clearAll();
  assert.equal(study.exportNotes(),'');
  assert.equal(study.dueQuestions(new Date('2100-01-01')).length,0);
  assert.equal(storage.getItem('shilai.ziwei.study.v1'),'keep');
});
