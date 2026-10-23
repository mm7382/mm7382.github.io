import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {lessonsData} from '../ziwei-web/lessons-data.mjs';

test('all thirty-six original lessons have complete source text and independent web pages',()=>{
  const {lessons}=lessonsData;
  assert.equal(lessons.length,36);
  assert.deepEqual(lessons.map(x=>x.order),Array.from({length:36},(_,i)=>i+1));
  for(const lesson of lessons){
    assert.ok(lesson.sections.length>=3,lesson.id);
    assert.equal(lesson.questions.length,2,lesson.id);
    assert.ok(lesson.citations.length>=1,lesson.id);
    assert.ok(lesson.sections.every(s=>s.heading.zh&&s.body.zh&&s.heading.en&&s.body.en),lesson.id);
    for(const language of ['zh','en']){
      const path=new URL(`../ziwei-web/learn/${lesson.id}/${language==='en'?'en/':''}index.html`,import.meta.url);
      assert.ok(existsSync(path),`${lesson.id} ${language}`);
      const html=readFileSync(path,'utf8');
      assert.ok(html.includes(lesson.title[language]),`${lesson.id} title ${language}`);
      assert.ok(html.includes(lesson.sections[0].heading[language]),`${lesson.id} section ${language}`);
      assert.ok(html.includes(lesson.questions[0].prompt[language]),`${lesson.id} quiz ${language}`);
    }
  }
});
