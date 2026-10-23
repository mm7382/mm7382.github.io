import {showSavedChart} from './app.mjs';
import {compareCharts} from './synastry.mjs';
import {AstrologyProfiles,CURRENT_CHART_KEY,CURRENT_PROFILE_KEY} from './profiles.mjs';

const $=selector=>document.querySelector(selector);
const manager=new AstrologyProfiles(localStorage);
const names={sun:'太陽',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星',ascendant:'上升'};
const signNames={aries:'牡羊',taurus:'金牛',gemini:'雙子',cancer:'巨蟹',leo:'獅子',virgo:'處女',libra:'天秤',scorpio:'天蠍',sagittarius:'射手',capricorn:'摩羯',aquarius:'水瓶',pisces:'雙魚'};
const kindNames={conjunction:'合相',sextile:'六分相',square:'四分相',trine:'三分相',opposition:'對分相'};
let draft=null,report=null;
const node=(tag,text,className)=>{const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;return element;};
function status(message){$('#profile-status').textContent=message;}
function session(chart,id){
  try{
    if(chart)sessionStorage.setItem(CURRENT_CHART_KEY,JSON.stringify(chart));else sessionStorage.removeItem(CURRENT_CHART_KEY);
    if(chart)sessionStorage.setItem(CURRENT_PROFILE_KEY,id??'astrology.noProfile');else sessionStorage.removeItem(CURRENT_PROFILE_KEY);
  }catch{status('這個瀏覽器無法保留目前選取的盤；課程個人觀察可能無法延續到下一頁。');}
}
function row(record,kind,selected){
  const item=node('div','',selected?'profile-item selected':'profile-item');
  const pick=node('button',`${record.name} · ${record.chart.completeness==='complete'?'完整盤':'部分盤'}`);
  pick.type='button';pick.setAttribute('aria-pressed',String(selected));
  pick.addEventListener('click',()=>{
    try{manager.select(kind,record.id);session(record.chart,record.id);showSavedChart(record);renderAll();}
    catch(error){status(error.message);}
  });
  const remove=node('button','移除','remove');remove.type='button';remove.setAttribute('aria-label',`移除 ${record.name}`);
  remove.addEventListener('click',()=>{
    if(!window.confirm(`確定移除「${record.name}」？這張星盤無法由網站復原。`))return;
    try{
      let showing=false;try{showing=sessionStorage.getItem(CURRENT_PROFILE_KEY)===record.id;}catch{}
      manager.remove(kind,record.id);
      if(showing){const active=manager.active();session(active?.chart??null,active?.id??null);if(active)showSavedChart(active);else $('#results').hidden=true;}
      renderAll();status('已移除這張星盤。');
    }
    catch(error){status(error.message);}
  });
  item.append(pick,remove);return item;
}
function renderList(kind,selector,selectedId){
  const root=$(selector);root.replaceChildren();const entries=manager.state[kind];
  if(!entries.length){root.append(node('p',kind==='profiles'?'還沒有儲存自己的盤。':'還沒有儲存朋友的盤。','empty'));return;}
  for(const record of entries)root.append(row(record,kind,record.id===selectedId));
}
function aspectLabel(aspect){
  const orb=aspect.minimumOrb===aspect.maximumOrb?`${aspect.minimumOrb.toFixed(1)}°`:`${aspect.minimumOrb.toFixed(1)}–${aspect.maximumOrb.toFixed(1)}°`;
  return `${names[aspect.first]} × ${names[aspect.second]} · ${kindNames[aspect.kind]} · ${orb}${aspect.unconfirmed?' · 待確認':''}`;
}
function renderComparison(){
  const root=$('#comparison-result');root.replaceChildren();report=null;
  const first=manager.active(),second=manager.friend();
  if(!first||!second){root.textContent='儲存並選擇一張自己的盤和一張朋友的盤後，這裡會顯示對照。';$('#share-text').textContent='';return;}
  try{report=compareCharts(first.chart,second.chart);}
  catch(error){root.textContent=error.message;$('#share-text').textContent='';return;}
  root.append(node('p',`${first.name} × ${second.name}`,'pair-name'));
  if(report.hasUnknownTime)root.append(node('p','至少有一方不知道出生時間：上升與宮位疊合不顯示；相位只作可能線索，不能當成精確出生相位。','notice'));
  const points=node('div','','comparison-points');
  for(const item of report.comparisons){
    const box=node('div','','comparison-point');box.append(node('small',names[item.point]),node('strong',`${item.firstSigns.map(x=>signNames[x]).join('／')} × ${item.secondSigns.map(x=>signNames[x]).join('／')}`));points.append(box);
  }
  root.append(points,node('h4','最接近的三個個人行星相位'));
  const basic=node('ol','','comparison-aspects');for(const aspect of report.basicAspects)basic.append(node('li',aspectLabel(aspect)));root.append(basic);
  if(!report.basicAspects.length)root.append(node('p','目前沒有落在原 App 容許度內的個人行星相位。'));
  if(report.remainingAspects.length){const detail=document.createElement('details');detail.append(node('summary',`查看其餘 ${report.remainingAspects.length} 個相位`));const list=node('ol','','comparison-aspects');for(const aspect of report.remainingAspects)list.append(node('li',aspectLabel(aspect)));detail.append(list);root.append(detail);}
  if(report.houseOverlays.length){const detail=document.createElement('details');detail.append(node('summary','查看雙向宮位疊合'));const list=node('ul','','overlays');for(const item of report.houseOverlays)list.append(node('li',`${item.firstInSecond?first.name:second.name} 的${names[item.body]}落在 ${item.firstInSecond?second.name:first.name} 的第 ${item.house} 宮`));detail.append(list);root.append(detail);}
  const pointLines=report.comparisons.filter(x=>x.point!=='ascendant').map(x=>`${names[x.point]}：${x.firstSigns.map(s=>signNames[s]).join('／')} × ${x.secondSigns.map(s=>signNames[s]).join('／')}`);
  $('#share-text').textContent=[`${first.name} × ${second.name}｜星盤對照`,...pointLines,...report.basicAspects.map(aspectLabel),report.hasUnknownTime?'出生時間不完整；相位待確認。':'', '這只是星盤位置與相位的對照，不保證關係結果。'].filter(Boolean).join('\n');
}
function renderAll(){
  renderList('profiles','#self-list',manager.state.activeId);
  renderList('friends','#friend-list',manager.state.selectedFriendId);
  renderComparison();
}
window.addEventListener('astrology:chart',event=>{
  draft={chart:event.detail.chart,birth:event.detail.birth};
  session(draft.chart,event.detail.saved?event.detail.profileId:null);
  status(event.detail.saved?'已開啟儲存的星盤。':'星盤已排好，輸入稱呼就能儲存。');
});
for(const [kind,button] of [['profiles','#save-self'],['friends','#save-friend']])$(button).addEventListener('click',()=>{
  if(!draft){status('請先排出一張星盤。');$('#chart-form').scrollIntoView({behavior:'smooth'});return;}
  try{
    const record=manager.add(kind,$('#profile-name').value,draft.birth,draft.chart,crypto.randomUUID());
    if(kind==='profiles')session(record.chart,record.id);
    renderAll();status(`已將「${record.name}」儲存在這個瀏覽器。`);$('#profile-name').value='';
  }catch(error){status(error.message);}
});
$('#copy-share').addEventListener('click',async()=>{
  const copy=$('#share-text').textContent;
  if(!report||!copy){$('#share-status').textContent='請先選擇兩張盤。';return;}
  try{await navigator.clipboard.writeText(copy);$('#share-status').textContent='文字已複製；你可以自己決定要不要分享。';}
  catch{$('#share-status').textContent='瀏覽器未允許複製，請自行選取上面的文字。';}
});
$('#clear-astrology').addEventListener('click',()=>{
  if(!window.confirm('確定清除這個瀏覽器全部星座人物、朋友星盤與課程筆記？網站無法復原。'))return;
  try{manager.clear();session(null,null);draft=null;report=null;$('#results').hidden=true;renderAll();status('星座資料已從這個瀏覽器清除。');}
  catch(error){status(error.message);}
});
if(manager.corrupt)status('原有星盤資料無法讀取，為避免覆蓋，儲存功能已暫停。');
else if(manager.unavailable)status('瀏覽器儲存暫時不可用；目前可以排盤，但無法保存人物。');
renderAll();
