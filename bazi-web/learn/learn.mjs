import { createStudyStore } from './study.mjs';

const english = document.body.dataset.language === 'en';
let store;
try { store = createStudyStore(window.localStorage); }
catch { store = createStudyStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}); }
const $ = id => document.getElementById(id);
const say = (zh,en) => english ? en : zh;
const make = (tag, text, className) => {const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
function warning() {
  const el = $('storage-warning');
  el.hidden = store.persistent;
  el.textContent = say(store.warning || '瀏覽器目前無法儲存。', 'This browser cannot save your study changes. They last only until you close the page.');
}
function reviewDateText(iso) {
  return new Intl.DateTimeFormat(english?'en-US':'zh-TW', {dateStyle:'medium'}).format(new Date(iso));
}

function setupIndex() {
  const lessons = [...document.querySelectorAll('.lesson-list li[data-lesson-id]')];
  let read = 0;
  for (const row of lessons) {
    const done = store.entry(row.dataset.lessonId).read;
    row.querySelector('b').hidden = !done;
    if (done) read++;
  }
  $('progress-summary').textContent = say(`已讀 ${read} / ${lessons.length} 堂`, `${read} of ${lessons.length} lessons read`);
}

function setupLesson() {
  const lessonId = document.body.dataset.lessonId;
  const note = $('my-note');
  note.value = store.entry(lessonId).note;
  const sync = () => {
    $('mark-read').textContent = store.entry(lessonId).read ? say('已讀完這一堂 ✓','Marked as read ✓') : say('標記為已讀','Mark as read');
    const date = store.entry(lessonId).reviewDate;
    $('review-status').textContent = date ? say(`下次複習：${reviewDateText(date)}`,`Revisit on ${reviewDateText(date)}`) : '';
  };
  note.addEventListener('input', () => {
    store.saveNote(lessonId, note.value);
    $('note-status').textContent = store.persistent ? say('已保存在這個瀏覽器。','Saved in this browser.') : say('目前無法儲存；關閉頁面後會遺失。','Not saved. This note will be lost when you close the page.');
    warning();
  });
  $('mark-read').addEventListener('click', () => {store.markRead(lessonId);sync();warning();});
  $('review-days').addEventListener('change', event => {
    const value = event.target.value;
    if (!value) return;
    store.schedule(lessonId,value === 'clear' ? null : Number(value));
    event.target.value = '';
    sync();warning();
  });
  for (const quiz of document.querySelectorAll('.quiz-question')) {
    let firstAnswered = false;
    const answer = Number(quiz.dataset.answer);
    const explanation = quiz.querySelector('.quiz-answer');
    for (const button of quiz.querySelectorAll('button[data-option]')) {
      button.addEventListener('click', () => {
        const chosen = Number(button.dataset.option);
        if (!firstAnswered) {
          store.recordFirstAnswer(lessonId,quiz.dataset.questionId,chosen === answer);
          firstAnswered = true;
        }
        quiz.querySelectorAll('button[data-option]').forEach(option => {
          option.classList.toggle('selected', option === button);
          option.classList.toggle('answer', Number(option.dataset.option) === answer);
          option.setAttribute('aria-pressed', String(option === button));
        });
        explanation.hidden = false;
        explanation.dataset.correct = String(chosen === answer);
        warning();
      });
    }
  }
  sync();
}

function lessonLink(lesson, lang = document.body.dataset.language) {
  return `/bazi-web/learn/${lesson.id}/${lang === 'en' ? 'en/' : ''}`;
}
function reviewCard(lesson, question, item) {
  const card = make('article','','due-card');
  const link = make('a',lesson.title[english?'en':'zh']);
  link.href = lessonLink(lesson); card.append(link);
  card.append(make('h3',question.question[english?'en':'zh']));
  const choices = make('div','','quiz-options');
  const result = make('p','', 'quiz-answer'); result.hidden = true;
  let picked = false;
  for (const [index,option] of question.options.entries()) {
    const button = make('button',option[english?'en':'zh']);
    button.type = 'button';
    button.addEventListener('click', () => {
      if (picked) return;
      picked = true;
      const correct = index === question.answer;
      store.recordReview(item.lessonId,item.questionId,correct);
      choices.querySelectorAll('button').forEach((el,i) => {el.disabled = true;el.classList.toggle('answer',i===question.answer);el.classList.toggle('selected',i===index);});
      const suffix = correct ? (item.stage >= 2 ? say('答對了，這題畢業。','Correct. You have mastered this one.') : say('答對了，下次再見。','Correct. See you next time.')) : say('再看一次，明天再考。','Take another look. It returns tomorrow.');
      result.textContent = `${suffix} ${question.explain[english?'en':'zh']}`;
      result.hidden = false;warning();
    });
    choices.append(button);
  }
  card.append(choices,result);
  return card;
}
async function setupReview() {
  const due = $('due-questions'), saved = $('saved-lessons');
  let catalog;
  try {
    const response = await fetch('/bazi-web/learn/course-source.json');
    if (!response.ok) throw Error('missing source');
    catalog = await response.json();
  } catch {
    due.textContent = say('課程資料暫時無法讀取，請重新整理頁面。','Lesson data could not load. Please refresh this page.');
    return;
  }
  const byId = new Map(catalog.lessons.map(lesson => [lesson.id,lesson]));
  const pending = store.dueQuestions();
  for (const item of pending) {
    const lesson = byId.get(item.lessonId);
    const question = lesson?.quiz?.find(q => q.id === item.questionId);
    if (lesson && question) due.append(reviewCard(lesson,question,item));
  }
  if (!due.childElementCount) due.append(make('p',say('今天沒有要複習的題目。','Nothing to review today.')));
  const entries = store.entries().filter(entry => entry.read || entry.note || entry.reviewDate)
    .sort((a,b) => (a.reviewDate || '9999').localeCompare(b.reviewDate || '9999') || a.id.localeCompare(b.id));
  for (const entry of entries) {
    const lesson = byId.get(entry.id); if (!lesson) continue;
    const row = make('article','','saved-lesson');
    const link = make('a',lesson.title[english?'en':'zh']);link.href=lessonLink(lesson);row.append(link);
    if (entry.reviewDate) row.append(make('small',say(`預定複習：${reviewDateText(entry.reviewDate)}`,`Review on ${reviewDateText(entry.reviewDate)}`)));
    if (entry.note) row.append(make('p',entry.note));
    saved.append(row);
  }
  if (!saved.childElementCount) saved.append(make('p',say('標記已讀或寫一則筆記，就會出現在這裡。','Mark a lesson as read or add a note to see it here.')));
  $('export-notes').addEventListener('click', () => {
    const contents = store.exportNotes();
    if (!contents) { $('export-status').textContent = say('目前沒有筆記可匯出。','No notes to export yet.');return; }
    const url = URL.createObjectURL(new Blob([contents],{type:'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download='shilai-bazi-notes.md';link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    $('export-status').textContent = say('筆記已下載到你的裝置。','Notes downloaded to your device.');
  });
}

warning();
if (document.body.dataset.page === 'index') setupIndex();
if (document.body.dataset.page === 'lesson') setupLesson();
if (document.body.dataset.page === 'review') setupReview();
