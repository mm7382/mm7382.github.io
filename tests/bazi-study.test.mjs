import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyStore } from '../bazi-web/learn/study.mjs';

function memoryStorage() {
  const values = new Map();
  return {getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value), removeItem:key=>values.delete(key), values};
}
const clock = () => new Date('2026-10-23T10:00:00+08:00');

test('a stable lesson ID keeps its original note and read state after reopening', () => {
  const storage = memoryStorage();
  const first = createStudyStore(storage, clock);
  first.saveNote('F01', '這是我的筆記，不翻譯');
  first.markRead('F01');
  first.schedule('F01', 7);
  const reopened = createStudyStore(storage, clock);
  assert.equal(reopened.entry('F01').note, '這是我的筆記，不翻譯');
  assert.equal(reopened.entry('F01').read, true);
  assert.ok(reopened.entry('F01').reviewDate);
  assert.match(reopened.exportNotes(), /## F01\n\n這是我的筆記，不翻譯/);
  assert.equal(reopened.entry('P01').read, false);
});

test('first wrong answer enters the native 1, 3, 7 day review sequence', () => {
  const storage = memoryStorage();
  const store = createStudyStore(storage, clock);
  store.recordFirstAnswer('F01','F01-Q1',false);
  assert.equal(store.dueQuestions(clock()).length, 0);
  const nextDay = new Date('2026-10-24T10:00:00+08:00');
  assert.equal(store.dueQuestions(nextDay).length, 1);
  store.recordReview('F01','F01-Q1',true,nextDay);
  assert.equal(store.reviewEntry('F01','F01-Q1').stage, 1);
  const dayFour = new Date('2026-10-27T10:00:00+08:00');
  assert.equal(store.dueQuestions(dayFour).length, 1);
  store.recordReview('F01','F01-Q1',true,dayFour);
  assert.equal(store.reviewEntry('F01','F01-Q1').stage, 2);
  store.recordReview('F01','F01-Q1',true,new Date('2026-11-03T10:00:00+08:00'));
  assert.equal(store.reviewEntry('F01','F01-Q1'), null);
});

test('correct first answer does not enter review and a later wrong answer restarts at 1 day', () => {
  const store = createStudyStore(memoryStorage(), clock);
  store.recordFirstAnswer('F01','F01-Q1',true);
  assert.equal(store.reviewEntry('F01','F01-Q1'), null);
  store.recordFirstAnswer('F01','F01-Q1',false);
  store.recordReview('F01','F01-Q1',true,new Date('2026-10-24T10:00:00+08:00'));
  store.recordReview('F01','F01-Q1',false,new Date('2026-10-27T10:00:00+08:00'));
  assert.equal(store.reviewEntry('F01','F01-Q1').stage, 0);
});

test('private browsing storage failures keep session use possible and report unsaved status', () => {
  const broken = {getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  const store = createStudyStore(broken, clock);
  store.saveNote('F01','session only');
  assert.equal(store.entry('F01').note,'session only');
  assert.equal(store.persistent,false);
  assert.ok(store.warning);
});

test('damaged saved data is not silently overwritten', () => {
  const storage = memoryStorage();
  storage.setItem('shilai.bazi.study.v1','{broken');
  const store = createStudyStore(storage,clock);
  store.saveNote('F01','still usable this session');
  assert.equal(store.entry('F01').note,'still usable this session');
  assert.equal(store.persistent,false);
  assert.equal(storage.getItem('shilai.bazi.study.v1'),'{broken');
});
