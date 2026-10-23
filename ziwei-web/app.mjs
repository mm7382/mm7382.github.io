import {calculateZiweiChart} from './chart.mjs';
import {buildZiweiReading,buildZiweiWeek} from './reading.mjs';

const $=id=>document.getElementById(id);
const slots={巳:[1,1],午:[1,2],未:[1,3],申:[1,4],酉:[2,4],戌:[3,4],亥:[4,4],子:[4,3],丑:[4,2],寅:[4,1],卯:[3,1],辰:[2,1]};
const starGroup={major:'主星 / Major',minor:'輔星 / Supporting',adjective:'雜曜 / Other'};
const palaceLabel=name=>name.endsWith('宮')?name:`${name}宮`;
let currentChart=null;
let currentProfile=null;
let activeKind='natal';
let activeDay=0;
const node=(tag,className,value)=>{const item=document.createElement(tag);if(className)item.className=className;if(value!==undefined)item.textContent=value;return item;};
const add=(parent,tag,className,value)=>{const item=node(tag,className,value);parent.append(item);return item;};

function syncForm(){
  const lunar=$('calendar').value==='lunar';$('leap-wrap').hidden=!lunar;
  if(!lunar)$('leapMonth').checked=false;
  const state=$('timeState').value;
  $('exact-wrap').hidden=state!=='exact';$('branch-wrap').hidden=state!=='earthlyBranch';
  $('time').disabled=state!=='exact';$('branch').disabled=state!=='earthlyBranch';
}

function openPalace(palace,button){
  const panel=$('palace-detail');panel.replaceChildren();
  const isSoul=palace.branch===currentChart.soulBranch;
  const isBody=palace.branch===currentChart.bodyBranch;
  add(panel,'p','eyebrow',`${palace.branch} · ${palace.stem}${palace.branch} · ${isSoul?'命宮 / LIFE PALACE':isBody?'身宮 / BODY PALACE':'THE TWELVE PALACES'}`);
  add(panel,'h3','',palaceLabel(palace.name));
  add(panel,'p','',`大限 ${palace.decadalAges[0]}–${palace.decadalAges[1]} 歲 · 十年一段的位置，不是吉凶排名。`);
  const groups=add(panel,'div','detail-groups');
  for(const group of ['major','minor','adjective']){
    const box=add(groups,'div','detail-group');add(box,'h4','',starGroup[group]);
    const stars=palace.starDetails.filter(star=>star.group===group);
    if(!stars.length)add(box,'p','',group==='major'?'此宮無正曜；仍可看其他星曜。':'這一組沒有星曜。');
    for(const star of stars){
      const label=star.name+(star.mutagen?` 化${star.mutagen}`:'')+(star.brightness?` · ${star.brightness}`:'');
      add(box,'span',`star-chip ${group}`,label);
    }
  }
  const markers=add(panel,'div','detail-group');add(markers,'h4','','其他盤面標記 / OTHER MARKERS');
  for(const marker of palace.cycleMarkers) add(markers,'span','star-chip',`${marker.group} · ${marker.name}`);
  panel.hidden=false;
  for(const item of $('ziwei-board').querySelectorAll('.palace')) item.classList.toggle('active',item===button);
  panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
}

function renderChart(chart,sample=false){
  currentChart=chart;
  $('result-kind').hidden=!sample;
  $('result-kind').textContent=sample?'教學例盤・非個人結果 / Sample chart, not your result':'';
  $('result-meta').textContent=`國曆 ${chart.birthSolar} · ${chart.birthLunar} · ${chart.fiveElements}`;
  $('time-note').hidden=!chart.timeNote;
  $('time-note').textContent=chart.timeNote;
  const board=$('ziwei-board');board.replaceChildren();
  for(const palace of chart.palaces){
    const slot=slots[palace.branch];if(!slot)continue;
    const button=node('button','palace');button.type='button';
    button.style.gridRow=String(slot[0]);button.style.gridColumn=String(slot[1]);
    button.setAttribute('aria-label',`${palaceLabel(palace.name)}，${palace.branch}位，查看完整星曜`);
    const head=add(button,'span','palace-head');add(head,'span','',`${palace.stem}${palace.branch}`);
    add(head,'span','',palace.branch===chart.soulBranch?'命':palace.branch===chart.bodyBranch?'身':'');
    add(button,'strong','palace-name',palaceLabel(palace.name));
    add(button,'span','palace-stars',palace.stars.length?palace.stars.join(' · '):'無正曜');
    add(button,'span','palace-more',`${palace.starDetails.length} 顆星曜 · 點開查看 ↗`);
    button.addEventListener('click',()=>openPalace(palace,button));board.append(button);
  }
  const center=node('div','board-center');
  add(center,'p','eyebrow','THE TWELVE PALACES');
  add(center,'strong','',`命在${chart.soulBranch} · 身在${chart.bodyBranch}`);
  add(center,'span','',chart.hourAssumed?'午時暫定 · 補上實際時辰後重排':'點開任一宮，慢慢看星曜的位置');
  board.append(center);
  $('palace-detail').hidden=true;
  renderReadings();
  $('results').hidden=false;
  $('results-title').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}

function showSections(target,sections){
  for(const section of sections){
    const box=add(target,'section','reading-section');
    if(section.heading)add(box,'h5','',section.heading);
    for(const item of section.lines)add(box,'p',`reading-line ${item.style}`,item.text);
  }
}

function renderReadings(){
  if(!currentChart)return;
  const reading=buildZiweiReading(currentChart,activeKind);
  const display=$('reading-display');display.replaceChildren();
  add(display,'p','eyebrow',`${activeKind.toUpperCase()} / ORIGINAL APP READING`);
  add(display,'h4','',reading.title);
  add(display,'p','reading-summary',reading.summary);
  const layer=currentChart.timeLayers;
  if(layer){
    const facts=add(display,'div','time-facts');
    for(const [label,value] of [
      ['大限',layer.decadal?`${layer.decadal.ageStart}–${layer.decadal.ageEnd} 歲 · ${layer.decadal.branch}位`:'資料不足'],
      ['流年',`${layer.yearly.ganzhi} · ${layer.yearly.branch}位`],
      ['小限',layer.age?.branch?`${layer.age.branch}位`:'資料不足'],
      ['流月',layer.monthly?.branch?`農曆${layer.monthly.lunarMonth}月 · ${layer.monthly.branch}位`:'資料不足'],
      ['當日地支',`${layer.daily.ganzhi} · ${layer.daily.branch}位`]]){
      const fact=add(facts,'div','time-fact');add(fact,'span','',label);add(fact,'strong','',value);
    }
  }
  if(reading.unavailable)add(display,'p','assumed-note','這一項資料不足，原 App 不會猜出結果。請檢查出生資料或閱讀日期。');
  else showSections(display,reading.sections);
  for(const button of $('reading-tabs').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.kind===activeKind));
  const week=buildZiweiWeek(currentChart),list=$('week-days');list.replaceChildren();
  week.forEach((day,index)=>{
    const button=add(list,'button','week-button',day.date);
    button.type='button';button.setAttribute('aria-pressed',String(index===activeDay));
    button.addEventListener('click',()=>{activeDay=index;renderDay(week);});
  });
  renderDay(week);
}

function renderDay(week){
  const day=week[activeDay],target=$('day-display');target.replaceChildren();
  if(!day)return;
  for(const button of $('week-days').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.textContent===day.date));
  add(target,'p','eyebrow',`${day.date} / DAILY GUIDE`);
  add(target,'h4','',activeDay===0?'今天的盤面線索':'這一天的盤面線索');
  for(const sentence of day.topicLines)add(target,'p','',sentence);
  add(target,'p','day-branch',day.dayLine);
  if(day.isLeapMonth)add(target,'p','reading-line caption','本月是閏月，斗君沿用同一月份數；請留意原 App 的閏月約定。');
  if(!day.guides.length){add(target,'p','reading-line caption','流日資料不足或來源方法未核實，今日三主題暫不顯示。');return;}
  const topics=add(target,'div','daily-guides');
  for(const guide of day.guides){
    const box=add(topics,'section','daily-guide');add(box,'p','eyebrow',guide.title);
    add(box,'h5','',`${palaceLabel(guide.palace.name)} · ${guide.palace.stars.join('、')||'無正曜'}`);
    add(box,'p','',guide.action);
    const detail=add(box,'details','daily-detail');add(detail,'summary','','看完整導讀與依據');
    showSections(detail,guide.sections);
  }
  add(target,'p','reading-line caption',day.methodNote);
}

for(const id of ['calendar','timeState'])$(id).addEventListener('change',syncForm);
for(const button of $('reading-tabs').querySelectorAll('button'))button.addEventListener('click',()=>{
  activeKind=button.dataset.kind;renderReadings();
});
$('reading-date').addEventListener('change',()=>{
  if(!currentProfile)return;
  try{
    const date=$('reading-date').value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('請選擇有效日期。');
    currentChart=calculateZiweiChart(currentProfile,window.FortuneEngine,date);
    activeDay=0;$('reading-error').hidden=true;renderReadings();
  }catch(error){$('reading-error').textContent=error.message;$('reading-error').hidden=false;}
});
for(const id of ['calendar','birthDate','leapMonth','timeState','time','branch','gender'])$(id).addEventListener('input',()=>{$('demo-label').hidden=true;});
$('demo').addEventListener('click',()=>{
  $('calendar').value='solar';$('birthDate').value='2000-08-16';$('leapMonth').checked=false;
  $('timeState').value='exact';$('time').value='03:30';$('gender').value='female';
  $('demo-label').hidden=false;$('form-error').hidden=true;syncForm();$('birthDate').focus();
});
$('birth-form').addEventListener('submit',event=>{
  event.preventDefault();$('form-error').hidden=true;
  try{
    const profile={birthDate:$('birthDate').value.trim(),calendar:$('calendar').value,
      leapMonth:$('leapMonth').checked,timeState:$('timeState').value,
      time:$('timeState').value==='exact'?$('time').value:$('timeState').value==='earthlyBranch'?$('branch').value:'',
      gender:$('gender').value};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)) throw Error('出生日期請用西元年－月－日，例如 2000-08-16。');
    if(profile.timeState==='exact'&&!profile.time) throw Error('請填寫出生時間。');
    const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
    const chart=calculateZiweiChart(profile,window.FortuneEngine,date);
    currentProfile=profile;activeKind='natal';activeDay=0;$('reading-date').value=date;
    renderChart(chart,!$('demo-label').hidden);
  }catch(error){
    $('results').hidden=true;$('form-error').textContent=error instanceof Error?error.message:'排盤暫時無法完成。';
    $('form-error').hidden=false;$('form-error').scrollIntoView({block:'nearest'});
  }
});
syncForm();
