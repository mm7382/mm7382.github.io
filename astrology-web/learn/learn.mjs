const $=selector=>document.querySelector(selector);
const language=document.body.dataset.language;
const lessonId=document.body.dataset.lessonId;
const key='astrology-web-study-v1';
const profileKey='astrology-web-current-profile-id-v1';
const chartKey='astrology-web-current-chart-v1';
let profileId='astrology.noProfile';
try{profileId=sessionStorage.getItem(profileKey)||profileId;}catch{}
let state={profiles:{}};
let blocked=false;
try{
  const raw=localStorage.getItem(key);
  if(raw){const parsed=JSON.parse(raw);if(!parsed.profiles||typeof parsed.profiles!=='object')throw Error('bad study data');state=parsed;}
}catch{
  blocked=true;$('#storage-warning').hidden=false;
  $('#storage-warning').textContent=language==='zh'?'原有筆記無法讀取，為避免覆蓋，這次不會儲存新內容。':'Existing notes could not be read, so new content will not overwrite them.';
}
const study=state.profiles[profileId]??(state.profiles[profileId]={done:[],notes:{},bookmarks:[],wrong:[]});
if(!Array.isArray(study.done))study.done=[];
if(!study.notes||typeof study.notes!=='object')study.notes={};
if(!Array.isArray(study.bookmarks))study.bookmarks=[];
if(!Array.isArray(study.wrong))study.wrong=[];
function save(){
  if(blocked)return false;
  try{localStorage.setItem(key,JSON.stringify(state));return true;}
  catch{$('#storage-warning').hidden=false;$('#storage-warning').textContent=language==='zh'?'瀏覽器儲存不可用，筆記沒有存下來。':'Browser storage is unavailable; your note was not saved.';return false;}
}
function chart(){try{const value=JSON.parse(sessionStorage.getItem(chartKey));return value?.placements?.length===10?value:null;}catch{return null;}}
const bodyName={sun:['太陽','Sun'],moon:['月亮','Moon'],mercury:['水星','Mercury'],venus:['金星','Venus'],mars:['火星','Mars'],jupiter:['木星','Jupiter'],saturn:['土星','Saturn'],uranus:['天王星','Uranus'],neptune:['海王星','Neptune'],pluto:['冥王星','Pluto']};
const signName={aries:['牡羊','Aries'],taurus:['金牛','Taurus'],gemini:['雙子','Gemini'],cancer:['巨蟹','Cancer'],leo:['獅子','Leo'],virgo:['處女','Virgo'],libra:['天秤','Libra'],scorpio:['天蠍','Scorpio'],sagittarius:['射手','Sagittarius'],capricorn:['摩羯','Capricorn'],aquarius:['水瓶','Aquarius'],pisces:['雙魚','Pisces']};
const aspectName={conjunction:['合相','conjunction'],sextile:['六分相','sextile'],square:['四分相','square'],trine:['三分相','trine'],opposition:['對分相','opposition']};
const loc=v=>(v?.[language==='zh'?0:1]??'');
function observationLines(target,value){
  if(target.kind==='noChartData')return [language==='zh'?'這堂課可以先從自己的紀錄與問題開始。':'Start with your own notes and questions.'];
  if(!value)return [language==='zh'?'先到「我的星盤」排盤，再回來對照；這裡不會拿教學例子冒充你的資料。':'Open My chart first, then return. We will not pass off a sample chart as yours.'];
  const byBody=Object.fromEntries(value.placements.map(p=>[p.body,p]));
  const placement=body=>{const p=byBody[body];if(!p)return null;const signs=p.candidateSigns?.length>1?p.candidateSigns.map(s=>loc(signName[s])).join(' / '):loc(signName[p.sign]);return `${loc(bodyName[body])} · ${signs}${p.house?` · ${language==='zh'?'第 '+p.house+' 宮':'house '+p.house}`:''}${p.signIsUnconfirmed?` · ${language==='zh'?'待確認':'unconfirmed'}`:''}`;};
  switch(target.kind){
    case 'luminariesAndAscendant':return [placement('sun'),placement('moon'),value.ascendant==null?(language==='zh'?'上升：時間未知，留白':'Ascendant: unknown without birth time'):`${language==='zh'?'上升':'Ascendant'} · ${loc(signName[Object.keys(signName)[Math.floor(value.ascendant/30)]])}`].filter(Boolean);
    case 'bodies':return target.bodies.map(placement).filter(Boolean);
    case 'houses':return value.cusps?target.houses.map(n=>`${language==='zh'?'第 '+n+' 宮':'House '+n} · ${loc(signName[Object.keys(signName)[Math.floor(value.cusps[n-1]/30)]])}`):[language==='zh'?'出生時間未知，宮位留白。':'Birth time unknown; houses remain blank.'];
    case 'aspects':return value.aspects.filter(a=>target.kinds.includes(a.kind)).slice(0,8).map(a=>`${loc(bodyName[a.first])} × ${loc(bodyName[a.second])} · ${loc(aspectName[a.kind])} ${a.orb.toFixed(1)}°${a.unconfirmed?' ?':''}`);
    case 'retrogrades':return value.placements.filter(p=>p.retrograde).map(p=>loc(bodyName[p.body]));
    case 'lunarPhase':{
      if(!byBody.sun||!byBody.moon)return [];
      const angle=(byBody.moon.longitude-byBody.sun.longitude+360)%360;
      const names=language==='zh'?['新月到上弦','上弦到滿月','滿月到下弦','下弦到新月']:['New to first quarter','First quarter to full','Full to last quarter','Last quarter to new'];
      return [`${language==='zh'?'太陽到月亮的黃道角距':'Sun-to-Moon ecliptic angle'} · ${angle.toFixed(1)}° · ${names[Math.floor(angle/90)]}`];
    }
    case 'elementBalance':{
      const names=['火 Fire','土 Earth','風 Air','水 Water'];const counts=[0,0,0,0];for(const p of value.placements)if(!p.signIsUnconfirmed)counts[Math.floor(p.longitude/30)%4]++;return names.map((n,i)=>`${n} · ${counts[i]}`);
    }
    default:return [];
  }
}
if(document.body.dataset.page==='index'){
  for(const item of document.querySelectorAll('[data-lesson-id]'))item.querySelector('b').hidden=!study.done.includes(item.dataset.lessonId);
  $('#progress-summary').textContent=language==='zh'?`已完成 ${study.done.length} / 36 堂。`:`Completed ${study.done.length} of 36 lessons.`;
}
if(document.body.dataset.page==='review'){
  $('#progress-summary').textContent=`已完成 ${study.done.length} / 36 堂。`;
  const root=$('#review-list');let shown=0;
  const data=await fetch('/astrology-web/lessons-data.json').then(r=>r.json());
  for(const lesson of data.lessons){
    const note=study.notes[lesson.id],done=study.done.includes(lesson.id),bookmark=study.bookmarks.includes(lesson.id);
    if(!note&&!done&&!bookmark)continue;shown++;
    const box=document.createElement('article');box.className='review-item';
    const a=document.createElement('a');a.href=`/astrology-web/learn/${lesson.id}/`;a.textContent=`${String(lesson.number).padStart(2,'0')} · ${lesson.title.zh}`;
    const status=document.createElement('p');status.textContent=[done?'已完成':null,bookmark?'已收藏':null].filter(Boolean).join(' · ')||'閱讀筆記';
    const p=document.createElement('p');p.textContent=note||'';box.append(a,status,p);root.append(box);
  }
  if(!shown)root.textContent='還沒有筆記或完成紀錄。從第一堂開始，慢慢讀就好。';
}
if(document.body.dataset.page==='lesson'){
  const note=$('#my-note');note.value=study.notes[lessonId]??'';
  let debounce;note.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>{
    study.notes[lessonId]=note.value;
    $('#note-status').textContent=save()?(language==='zh'?'已存到這個瀏覽器。':'Saved in this browser.'):(language==='zh'?'儲存失敗。':'Could not save.');
  },350);});
  const bookmark=$('#bookmark'),complete=$('#mark-read');
  function sync(){bookmark.setAttribute('aria-pressed',String(study.bookmarks.includes(lessonId)));complete.setAttribute('aria-pressed',String(study.done.includes(lessonId)));$('#completion-status').textContent=study.done.includes(lessonId)?(language==='zh'?'這堂已完成。':'Lesson complete.'):'';}
  bookmark.addEventListener('click',()=>{study.bookmarks=study.bookmarks.includes(lessonId)?study.bookmarks.filter(x=>x!==lessonId):[...study.bookmarks,lessonId];save();sync();});
  complete.addEventListener('click',()=>{study.done=study.done.includes(lessonId)?study.done.filter(x=>x!==lessonId):[...study.done,lessonId];save();sync();});sync();
  const root=$('#observation'),target=JSON.parse(root.dataset.observation);
  const lines=observationLines(target,chart());
  if(lines.length){const ul=document.createElement('ul');for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li);}root.append(ul);}
  else root.textContent=language==='zh'?'目前這張盤沒有符合本堂練習的項目。':'No matching items in this chart.';
  const data=await fetch('/astrology-web/lessons-data.json').then(r=>r.json());
  const lesson=data.lessons.find(x=>x.id===lessonId);
  for(const field of document.querySelectorAll('.quiz fieldset')){
    const item=lesson.quiz.find(x=>x.id===field.dataset.questionId);
    for(const button of field.querySelectorAll('button[data-option]'))button.addEventListener('click',()=>{
      const option=item.options[Number(button.dataset.option)],correct=option.correct;
      field.querySelectorAll('button').forEach(x=>x.classList.remove('correct','incorrect'));
      button.classList.add(correct?'correct':'incorrect');
      const answer=field.querySelector('.quiz-answer');answer.hidden=false;answer.textContent=option.reason[language];
      if(!correct){if(!study.wrong.some(x=>x.lessonId===lessonId&&x.questionId===item.id))study.wrong.push({lessonId,questionId:item.id});}
      else study.wrong=study.wrong.filter(x=>x.lessonId!==lessonId||x.questionId!==item.id);
      save();
    });
  }
}
