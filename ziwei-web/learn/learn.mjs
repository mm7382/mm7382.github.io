import {lessonsData} from '../lessons-data.mjs';
import {readingCopy} from '../reading-copy.mjs';

const $=selector=>document.querySelector(selector);
const language=document.body.dataset.language;
const text=value=>value?.[language]??'';
const key='ziwei-web-study-v1';
const chartKey='ziwei-web-current-chart-v1';
const profileKey='ziwei-web-current-profile-id-v1';
const warnings=()=>$('#storage-warning');
const names=readingCopy.names;
const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const baseStar=name=>name.replace(/化[祿權科忌]$/u,'');
const namePalace=name=>language==='zh'?name:(names.palaces[name]??name);
const nameStar=name=>language==='zh'?name:(names.stars[name]??name);
const joined=names=>names.join(language==='zh'?'、':', ');
let profileId='ziwei.noProfile';
try{profileId=sessionStorage.getItem(profileKey)||profileId;}catch{}
let state={profiles:{}};
let studyCorrupt=false;

try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);
  if(parsed.profiles&&typeof parsed.profiles==='object')state=parsed;
  else if(Array.isArray(parsed.done)&&parsed.notes&&typeof parsed.notes==='object')state={profiles:{'ziwei.noProfile':{done:parsed.done,notes:parsed.notes}}};
  else throw Error('corrupt');
}}
catch{studyCorrupt=true;warnings().hidden=false;warnings().textContent=language==='zh'?'原有學習資料讀取失敗。為避免覆蓋，這次新增的筆記不會儲存。':'Existing study data could not be read. New notes will not overwrite it.';}
const study=state.profiles[profileId]??(state.profiles[profileId]={done:[],notes:{}});
if(!Array.isArray(study.done))study.done=[];
if(!study.notes||typeof study.notes!=='object')study.notes={};
if(!Array.isArray(study.bookmarks))study.bookmarks=[];
if(!Array.isArray(study.wrong))study.wrong=[];
function save(){if(studyCorrupt)return false;try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{warnings().hidden=false;warnings().textContent=language==='zh'?'瀏覽器儲存不可用，筆記暫時無法保留。':'Browser storage is unavailable. Notes could not be saved.';return false;}}
function currentChart(){try{const chart=JSON.parse(sessionStorage.getItem(chartKey));return chart?.palaces?.length===12?chart:null;}catch{return null;}}
const lesson=lessonsData.lessons.find(x=>x.id===document.body.dataset.lessonId);

function branchForLayer(chart,layer){
  return layer==='natal'?chart.soulBranch:layer==='yearly'?chart.timeLayers?.yearly?.branch:
    layer==='monthly'?chart.timeLayers?.monthly?.branch:chart.timeLayers?.decadal?.branch;
}
function diagramBranches(diagram,chart){
  if(!diagram||!chart)return [];
  const byNames=names=>chart.palaces.filter(p=>names.includes(p.name)).map(p=>p.branch);
  const opposite=branches[(branches.indexOf(chart.soulBranch)+6)%12];
  switch(diagram.kind){
    case 'palaces':return byNames(diagram.names);
    case 'soulAndBody':return [chart.soulBranch,chart.bodyBranch];
    case 'soulAndOpposite':return [chart.soulBranch,opposite];
    case 'fourPositions':return [0,6,4,8].map(n=>branches[(branches.indexOf(chart.soulBranch)+n)%12]);
    case 'emptyPalaces':return chart.palaces.filter(p=>p.stars.length===0).map(p=>p.branch);
    case 'doubleStarPalaces':return chart.palaces.filter(p=>p.stars.length>=2).map(p=>p.branch);
    case 'timeLayer':return [branchForLayer(chart,diagram.layer)].filter(Boolean);
    case 'agePalace':return [chart.timeLayers?.age?.branch].filter(Boolean);
    case 'stars':return chart.palaces.filter(p=>p.stars.some(s=>diagram.names.includes(baseStar(s)))).map(p=>p.branch);
    default:return [];
  }
}
function chartTaskAnswer(target,chart){
  if(!target||!chart)return null;
  const p=chart.palaces;
  const byBranch=branch=>p.find(x=>x.branch===branch);
  const shown=palaces=>palaces?.length?joined(palaces.map(x=>namePalace(x.name))):(language==='zh'?'盤上沒有找到':'None found on this chart');
  const starList=stars=>stars.length?joined(stars.map(nameStar)):(language==='zh'?'無正曜':'No major stars');
  const starsOf=palace=>palace?.stars.map(baseStar)??[];
  let fact=null;
  switch(target.kind){
    case 'anyPalaceName':fact=p[0]?[p[0]]:null;return fact?shown(fact):null;
    case 'soulBranch':return chart.soulBranch||null;
    case 'majorStarsInSoulPalace':return starList(starsOf(byBranch(chart.soulBranch)));
    case 'bodyPalaceName':return byBranch(chart.bodyBranch)?shown([byBranch(chart.bodyBranch)]):null;
    case 'fiveElements':return chart.fiveElements||null;
    case 'palaceStars':return p.find(x=>x.name===target.name)?starList(starsOf(p.find(x=>x.name===target.name))):null;
    case 'oppositeOfSoulPalaceName':return byBranch(branches[(branches.indexOf(chart.soulBranch)+6)%12])?shown([byBranch(branches[(branches.indexOf(chart.soulBranch)+6)%12])]):null;
    case 'fourPositionsPalaceNames':return shown([0,6,4,8].map(n=>byBranch(branches[(branches.indexOf(chart.soulBranch)+n)%12])).filter(Boolean));
    case 'emptyPalaceNames':return shown(p.filter(x=>!x.stars.length));
    case 'doubleStarPalaceNames':return shown(p.filter(x=>x.stars.length>=2));
    case 'palaceOfStar':return p.find(x=>x.stars.some(s=>baseStar(s)===target.name))?shown([p.find(x=>x.stars.some(s=>baseStar(s)===target.name))]):null;
    case 'layerSoulPalaceName':return byBranch(branchForLayer(chart,target.layer))?shown([byBranch(branchForLayer(chart,target.layer))]):null;
    case 'agePalaceName':return byBranch(chart.timeLayers?.age?.branch)?shown([byBranch(chart.timeLayers?.age?.branch)]):null;
    default:return null;
  }
}

if(document.body.dataset.page==='index'){
  for(const item of document.querySelectorAll('[data-lesson-id]')){
    item.querySelector('b').hidden=!study.done.includes(item.dataset.lessonId);
  }
  $('#progress-summary').textContent=language==='zh'?`已完成 ${study.done.length} / 36 堂。`:`Completed ${study.done.length} of 36 lessons.`;
}
if(document.body.dataset.page==='review'){
  $('#progress-summary').textContent=`已完成 ${study.done.length} / 36 堂。`;
  const list=$('#review-list');list.style.display='block';
  let found=0;
  for(const item of lessonsData.lessons){
    const note=study.notes[item.id],done=study.done.includes(item.id),bookmarked=study.bookmarks.includes(item.id);
    const wrong=study.wrong.filter(x=>x.lessonId===item.id);
    if(!done&&!note&&!bookmarked&&!wrong.length)continue;found++;
    const box=document.createElement('article');box.className='review-item';
    const title=document.createElement('h2');title.textContent=`${item.id} · ${item.title.zh}`;box.append(title);
    const status=document.createElement('p');status.textContent=[done?'已完成':null,bookmarked?'已收藏':null,
      wrong.length?`${wrong.length} 題待複習`:null].filter(Boolean).join(' · ')||'閱讀筆記';box.append(status);
    for(const answer of wrong){
      const question=item.questions.find(q=>q.id===answer.questionId),info=document.createElement('p');
      info.textContent=`待複習：${question?.prompt.zh??answer.questionId}${answer.lessonVersion!==item.version?' · 教材已更新，建議重做':''}`;
      box.append(info);
    }
    if(note){const memo=document.createElement('p');memo.textContent=note;box.append(memo);}
    const link=document.createElement('a');link.href=`/ziwei-web/learn/${item.id}/`;link.textContent='回到這堂課 ↗';box.append(link);list.append(box);
  }
  if(!found){const empty=document.createElement('p');empty.textContent='還沒有閱讀紀錄。從任何一堂開始都可以。';list.append(empty);}
}
if(document.body.dataset.page==='lesson'&&lesson){
  const chart=currentChart()??lessonsData.teachingExample.chart;
  const personal=Boolean(currentChart());
  const figure=$('.course-figure');
  if(figure){
    const highlights=new Set(diagramBranches(lesson.diagram,chart));
    for(const card of figure.querySelectorAll('.palace-mini')){
      const p=chart.palaces.find(x=>x.branch===card.dataset.branch);
      card.classList.toggle('highlight',highlights.has(card.dataset.branch));
      if(p){card.querySelector('strong').textContent=namePalace(p.name);card.querySelector('span').textContent=p.stars.join(' · ')||(language==='zh'?'無正曜':'No major stars');}
    }
    figure.querySelector('.figure-note').textContent=personal?(chart.hourAssumed?
      (language==='zh'?'午時暫定命盤・時辰未知，位置可能改變':'Provisional noon chart · birth time unknown'):
      (language==='zh'?'你的本次命盤・只用於目前瀏覽器工作階段':'Your chart · this browser session only')):
      `${text(lessonsData.teachingExample.label)} · ${lessonsData.teachingExample.referenceDate}`;
  }
  const answer=chartTaskAnswer(lesson.chartTask.target,chart);
  $('#chart-task-answer').textContent=answer?
    `${personal?(chart.hourAssumed?(language==='zh'?'午時暫定盤':'Provisional chart'):(language==='zh'?'我的盤':'My chart')):(language==='zh'?'教學例盤':'Teaching chart')}：${answer}`:text(lesson.chartTask.missingDataNote);
  const note=$('#my-note');note.value=study.notes[lesson.id]??'';
  note.addEventListener('input',()=>{study.notes[lesson.id]=note.value;$('#note-status').textContent=save()?(language==='zh'?'筆記已保存在這個瀏覽器。':'Note saved in this browser.'):'';});
  const bookmark=$('#bookmark');
  const showBookmark=()=>{bookmark.textContent=study.bookmarks.includes(lesson.id)?(language==='zh'?'已收藏 ✓':'Bookmarked ✓'):(language==='zh'?'收藏這堂':'Bookmark lesson');bookmark.setAttribute('aria-pressed',String(study.bookmarks.includes(lesson.id)));};
  showBookmark();
  bookmark.addEventListener('click',()=>{study.bookmarks=study.bookmarks.includes(lesson.id)?study.bookmarks.filter(x=>x!==lesson.id):[...study.bookmarks,lesson.id];save();showBookmark();});
  const correct=new Set();
  let chartTaskDone=false;
  const mark=$('#mark-read');
  const updateComplete=()=>{mark.disabled=study.done.includes(lesson.id)||!chartTaskDone||correct.size!==lesson.questions.length;};
  $('#chart-task-done').addEventListener('click',()=>{
    chartTaskDone=true;$('#chart-task-done').setAttribute('aria-pressed','true');
    $('#chart-task-done').textContent=language==='zh'?'已對照盤面 ✓':'Chart checked ✓';updateComplete();
  });
  for(const question of document.querySelectorAll('.quiz-question')){
    for(const button of question.querySelectorAll('button'))button.addEventListener('click',()=>{
      const selected=Number(button.dataset.option),right=Number(question.dataset.answer);
      for(const option of question.querySelectorAll('button'))option.classList.remove('correct','incorrect');
      button.classList.add(selected===right?'correct':'incorrect');
      question.querySelector('.quiz-answer').hidden=false;
      if(selected===right){correct.add(question.dataset.questionId);study.wrong=study.wrong.filter(x=>!(x.lessonId===lesson.id&&x.questionId===question.dataset.questionId));}
      else{correct.delete(question.dataset.questionId);question.querySelector(`button[data-option="${right}"]`).classList.add('correct');
        study.wrong=study.wrong.filter(x=>!(x.lessonId===lesson.id&&x.questionId===question.dataset.questionId));
        study.wrong.push({lessonId:lesson.id,questionId:question.dataset.questionId,lessonVersion:lesson.version});}
      save();
      updateComplete();
      $('#completion-status').textContent=selected===right?(language==='zh'?'答對了。':'Correct.'):(language==='zh'?'這題再看一下原課解說，然後可再選一次。':'Read the explanation, then try again.');
    });
  }
  updateComplete();
  if(study.done.includes(lesson.id)){$('#completion-status').textContent=language==='zh'?'這堂已完成。':'Lesson completed.';}
  mark.addEventListener('click',()=>{
    if(!chartTaskDone||correct.size!==lesson.questions.length)return;
    if(!study.done.includes(lesson.id))study.done.push(lesson.id);
    if(save()){$('#completion-status').textContent=language==='zh'?'這堂已完成，進度保存在這個瀏覽器。':'Completed. Progress is saved in this browser.';mark.disabled=true;}
  });
}
