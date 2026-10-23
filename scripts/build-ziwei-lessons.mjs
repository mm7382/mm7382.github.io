import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {lessonsData} from '../ziwei-web/lessons-data.mjs';

const root=fileURLToPath(new URL('../ziwei-web/learn/',import.meta.url));
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const paras=s=>String(s??'').split(/\n\n+/).map(x=>`<p>${escape(x).replaceAll('\n','<br>')}</p>`).join('');
const link=(id,language)=>`/ziwei-web/learn/${id}/${language==='en'?'en/':''}`;
const display=(v,language)=>escape(v?.[language]??'');
const nav=language=>`<nav aria-label="${language==='zh'?'主要導覽':'Main navigation'}"><a href="/ziwei-web/">${language==='zh'?'我的命盤':'My chart'}</a><a href="${language==='zh'?'/ziwei-web/learn/':'/ziwei-web/learn/en/'}">${language==='zh'?'全部課程':'All lessons'}</a><a href="/ziwei-web/learn/review/">${language==='zh'?'我的筆記':'My notes'}</a></nav>`;
const shell=(title,description,language,canonical,alternate,body,page,id='')=>`<!doctype html>
<html lang="${language==='zh'?'zh-Hant':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index, follow"><title>${escape(title)}｜時來紫微</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://mm7382.github.io${canonical}"><link rel="alternate" hreflang="${language==='zh'?'en':'zh-Hant'}" href="https://mm7382.github.io${alternate}"><link rel="icon" href="/ziwei/icon.png"><link rel="stylesheet" href="/ziwei-web/learn/style.css"><script type="module" src="/ziwei-web/learn/learn.mjs"></script></head>
<body data-page="${page}" data-language="${language}" data-lesson-id="${id}"><a class="skip" href="#main">${language==='zh'?'跳到主要內容':'Skip to content'}</a><div class="topline">MICHAEL · SHILAI ZI WEI <span>THE LEARNING GALLERY · 36 LESSONS</span></div><header class="masthead wrap"><a class="brand" href="/ziwei-web/learn/">時來 · 紫微<small>THE PURPLE STAR</small></a>${nav(language)}<a class="language" href="${alternate}" hreflang="${language==='zh'?'en':'zh-Hant'}">${language==='zh'?'English':'繁體中文'} ↗</a></header><main id="main">${body}</main><footer><div class="wrap">MICHAEL · ${language==='zh'?'免費學習 · 筆記只留在這個瀏覽器':'Free to learn · Your notes stay in this browser'} <a href="/">${language==='zh'?'回作品總覽':'Back to gallery'} ↗</a></div></footer><p id="storage-warning" class="storage-warning" role="alert" hidden></p></body></html>`;

function lessonPage(lesson,language,index){
  const zh=language==='zh',url=link(lesson.id,language),alternate=link(lesson.id,zh?'en':'zh');
  const sections=lesson.sections.map((s,i)=>`<section class="lesson-section" data-source-layer="${s.layer}" id="${escape(s.id)}"><span class="section-number">${String(i+1).padStart(2,'0')} · ${escape(s.layer)}</span><div><h2>${display(s.heading,language)}</h2>${paras(s.body[language])}</div></section>`).join('');
  const citations=lesson.citations.map(c=>`<li><blockquote>${escape(c.original)}</blockquote>${zh?'':`<p>${escape(c.translation)}</p>`}<cite>${display(c.book,language)}</cite></li>`).join('');
  const questions=lesson.questions.map((q,i)=>`<fieldset class="quiz-question" data-question-id="${escape(q.id)}" data-answer="${q.correctIndex}"><legend>${i+1}. ${display(q.prompt,language)}</legend><div class="quiz-options">${q.options.map((o,n)=>`<button type="button" data-option="${n}">${display(o,language)}</button>`).join('')}</div><p class="quiz-answer" hidden>${display(q.explanation,language)}</p></fieldset>`).join('');
  const chart=lessonsData.teachingExample.chart;
  const figure=lesson.diagram?`<figure class="course-figure" data-diagram="${lesson.diagram.kind}"><figcaption>${display(lesson.diagramCaption,language)}</figcaption><p class="figure-note">${display(lessonsData.teachingExample.label,language)} · ${lessonsData.teachingExample.referenceDate}</p><div class="palace-mini-grid">${chart.palaces.map(p=>`<div class="palace-mini" data-branch="${p.branch}"><small>${p.branch}</small><strong>${escape(p.name)}</strong><span>${escape(p.stars.join(' · ')||'無正曜')}</span></div>`).join('')}</div></figure>`:'';
  const preceding=index?`<a href="${link(lessonsData.lessons[index-1].id,language)}">← ${zh?'上一堂':'Previous lesson'}</a>`:'';
  const following=index<35?`<a href="${link(lessonsData.lessons[index+1].id,language)}">${zh?'下一堂':'Next lesson'} →</a>`:'';
  const body=`<article class="lesson wrap"><div class="lesson-hero"><p class="eyebrow">LESSON ${escape(lesson.id)} / ${String(lesson.order).padStart(2,'0')} OF 36</p><h1>${display(lesson.title,language)}</h1><p class="lead">${display(lesson.objective,language)}</p><p class="micro">${zh?'原 App 教材 · 網頁版免費開放':'Original app lesson · free on the web'}</p><p class="review-notice">${zh?'這一堂已自審，尚未整批簽核。古籍原句已逐字核對，白話與練習由本專案自撰。':'This lesson has been self-reviewed and is awaiting final sign-off. The classical passages have been checked word by word; the plain-language text and the exercises are written by this project.'}</p></div><div class="reader"><div class="content">${lesson.lifeQuestion?`<blockquote class="life-question">${display(lesson.lifeQuestion,language)}</blockquote>`:''}${figure}${sections}${lesson.example?`<aside class="example"><span class="eyebrow">${zh?'教學示例':'TEACHING EXAMPLE'}</span>${paras(lesson.example[language])}</aside>`:''}
  <section class="quiz"><p class="eyebrow">CHECK YOURSELF</p><h2>${zh?'讀完，練習看看。':'Now, try it yourself.'}</h2><p>${zh?'兩題都答對後可標記完成；答錯時會顯示原課的解說。':'Answer both questions correctly to complete the lesson. The original explanation appears after each answer.'}</p>${questions}</section>
  <section class="chart-task"><p class="eyebrow">${zh?'找盤練習':'FIND IT IN THE CHART'}</p><h2>${zh?'回到盤上看一眼。':'Find it on a chart.'}</h2><p>${display(lesson.chartTask.prompt,language)}</p><p id="chart-task-answer" class="chart-task-answer" aria-live="polite"></p><button type="button" id="chart-task-done">${zh?'我已對照盤面':'I checked the chart'}</button> <a href="/ziwei-web/#birth-form">${zh?'開啟我的命盤':'Open my chart'} ↗</a></section>
  <details class="sources"><summary>${zh?'古籍來源與出處':'Classical sources'}</summary><ol>${citations}</ol><p>${zh?'古籍只提供文化與歷史脈絡；生活例子與練習由本專案編寫。':'Classical texts provide cultural context. Everyday examples and exercises are written by this project.'}</p></details>
  <section class="study-panel"><p class="eyebrow">YOUR STUDY / ${escape(lesson.id)}</p><h2>${zh?'把這堂課，寫成自己的話。':'Write what you learned in your own words.'}</h2><label for="my-note">${zh?'我的閱讀筆記':'My note'}</label><textarea id="my-note" rows="7" placeholder="${zh?'這堂課讓你想到什麼？':'What stood out to you?'}"></textarea><p id="note-status" class="micro" aria-live="polite"></p><button type="button" id="bookmark">${zh?'收藏這堂':'Bookmark lesson'}</button> <button type="button" id="mark-read">${zh?'標記為完成':'Mark complete'}</button><p id="completion-status" class="micro" aria-live="polite"></p></section><nav class="adjacent" aria-label="${zh?'相鄰課程':'Adjacent lessons'}">${preceding}${following}</nav></div><aside class="reader-aside"><span>STUDY THE DETAILS</span><p>${zh?'圖解預設使用虛構教學例盤，不是你的個人命盤。':'Diagrams use a fictional teaching chart by default.'}</p><a href="${zh?'/ziwei-web/learn/':'/ziwei-web/learn/en/'}">${zh?'課程總覽':'All lessons'} ↗</a></aside></div></article>`;
  return shell(lesson.title[language],lesson.objective[language],language,url,alternate,body,'lesson',lesson.id);
}

function indexPage(language){
  const zh=language==='zh',url=zh?'/ziwei-web/learn/':'/ziwei-web/learn/en/',alternate=zh?'/ziwei-web/learn/en/':'/ziwei-web/learn/';
  const list=lessonsData.lessons.map(lesson=>`<li data-lesson-id="${lesson.id}"><a href="${link(lesson.id,language)}"><small>${String(lesson.order).padStart(2,'0')} · ${lesson.id}</small><strong>${display(lesson.title,language)}</strong><span>${display(lesson.objective,language)}</span></a><b aria-label="${zh?'已完成':'Completed'}" hidden>✓</b></li>`).join('');
  const body=`<section class="index-hero wrap"><p class="eyebrow">THE ZI WEI LEARNING GALLERY</p><h1>${zh?'三十六堂課，<br>從一張盤開始。':'Thirty-six lessons.<br>Start with one chart.'}</h1><p>${zh?'原 App 的 24 堂核心課與 12 堂工作坊都免費開放。沒有自己的盤，也可以從教學例盤學起。':'All 24 core lessons and 12 workshops from the original app are free. Start with a teaching chart even if you have no chart of your own.'}</p><p id="progress-summary" class="progress-summary" aria-live="polite"></p></section><section class="index-body wrap"><div class="index-intro"><p class="eyebrow">01—36 / CONTENTS</p><p>${zh?'慢慢讀，記下疑問。完成紀錄與筆記只留在這個瀏覽器。':'Read at your pace. Your notes and progress stay in this browser.'}</p><a href="/ziwei-web/learn/review/">${zh?'我的筆記與進度':'My notes and progress'} ↗</a></div><ol class="lesson-list">${list}</ol></section>`;
  return shell(zh?'全部三十六堂課':'All thirty-six lessons',zh?'時來紫微原 App 的全部 36 堂課，免費閱讀。':'All 36 lessons from the original Zi Wei app, free to read.',language,url,alternate,body,'index');
}

mkdirSync(root,{recursive:true});
for(const language of ['zh','en']){
  const dir=join(root,language==='zh'?'':'en');mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'index.html'),indexPage(language));
}
lessonsData.lessons.forEach((lesson,index)=>{
  for(const language of ['zh','en']){
    const dir=join(root,lesson.id,language==='zh'?'':'en');mkdirSync(dir,{recursive:true});
    writeFileSync(join(dir,'index.html'),lessonPage(lesson,language,index));
  }
});
