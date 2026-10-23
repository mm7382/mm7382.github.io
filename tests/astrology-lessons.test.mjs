import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const fromRoot=p=>readFileSync(fileURLToPath(new URL(`../${p}`,import.meta.url)),'utf8');
const data=JSON.parse(fromRoot('astrology-web/lessons-data.json'));
const clean=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

test('all approved native lessons and the full bilingual content are exported',()=>{
  assert.equal(data.schemaVersion,2);
  assert.equal(data.lessons.length,36);
  assert.deepEqual(data.lessons.map(x=>x.number),Array.from({length:36},(_,i)=>i+1));
  assert.equal(data.lessons.filter(x=>x.track==='core').length,24);
  assert.equal(data.lessons.filter(x=>x.track==='practice').length,12);
  assert.equal(new Set(data.lessons.map(x=>x.id)).size,36);
  for(const lesson of data.lessons){
    assert.equal(lesson.sourceGaps.length,0,lesson.id);
    assert.ok(lesson.sources.length>0,lesson.id);
    assert.ok(lesson.concepts.length>0,lesson.id);
    assert.ok(lesson.diagram?.alt.zh && lesson.diagram.alt.en,lesson.id);
    assert.ok(lesson.quiz.length>0,lesson.id);
    for(const block of lesson.concepts){
      assert.ok(block.paragraphs.length>0,`${lesson.id} ${block.id}`);
      for(const paragraph of block.paragraphs)assert.ok(paragraph.text.zh && paragraph.text.en && paragraph.supports.length);
    }
  }
});

test('each lesson has public-path preview pages in both languages with exact source copy',()=>{
  for(const lesson of data.lessons){
    for(const language of ['zh','en']){
      const suffix=language==='en'?'/en':'';
      const page=fromRoot(`astrology-web/learn/${lesson.id}${suffix}/index.html`);
      assert.match(page,/noindex, nofollow/);
      assert.ok(page.includes(clean(lesson.title[language])),`${lesson.id} title ${language}`);
      assert.ok(page.includes(clean(lesson.objective[language])),`${lesson.id} objective ${language}`);
      assert.ok(page.includes(clean(lesson.diagram.caption[language])),`${lesson.id} diagram ${language}`);
      assert.ok(page.includes(clean(lesson.example.caveat[language])),`${lesson.id} example ${language}`);
      for(const block of lesson.concepts){
        assert.ok(page.includes(clean(block.heading[language])),`${lesson.id} concept ${block.id} ${language}`);
        for(const paragraph of block.paragraphs)assert.ok(page.includes(clean(paragraph.text[language].split('\n')[0])),`${lesson.id} paragraph ${block.id} ${language}`);
      }
      for(const source of lesson.sources)assert.ok(page.includes(clean(source.title[language])),`${lesson.id} source ${language}`);
      for(const quiz of lesson.quiz)assert.ok(page.includes(clean(quiz.prompt[language])),`${lesson.id} quiz ${language}`);
      assert.ok(page.includes('data-observation='));
    }
  }
});

test('the lesson entrance and progress page are present',()=>{
  const index=fromRoot('astrology-web/index.html');
  assert.match(index,/走進課程展廳/);
  assert.match(fromRoot('astrology-web/learn/index.html'),/三十六堂課/);
  assert.match(fromRoot('astrology-web/learn/en/index.html'),/Thirty-six lessons/);
  assert.match(fromRoot('astrology-web/learn/review/index.html'),/我的筆記與進度/);
});
