import {adviceForDate,sevenDayAdvice} from './reading.mjs';
import {signs} from './chart.mjs';

const $=selector=>document.querySelector(selector);
const names={sun:'太陽',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星',ascendant:'上升',midheaven:'天頂'};
const signNames=['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
const aspects={conjunction:'合相',sextile:'六分相',square:'四分相',trine:'三分相',opposition:'對分相'};
const phases={applying:'入相',exact:'接近精確',separating:'離相'};
const domains={theme:'今日主題',work:'工作',love:'關係',money:'金錢'};
const domainsEn={theme:'Theme',work:'Work',love:'Relationships',money:'Money'};
const nameSign=sign=>signNames[signs.indexOf(sign)]??sign;
const astro=()=>globalThis.Astronomy;
let activeChart=null,bundlePromise=null,sequence=0;
const todayText=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
const create=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
function natalFact(label,value,note){
  const card=create('article','natal-fact');card.append(create('span','fact-label',label),create('strong','fact-value',value),create('p','fact-note',note));return card;
}
function renderNatal(chart){
  const root=$('#natal-facts');root.replaceChildren();
  const byBody=body=>chart.placements.find(x=>x.body===body);
  for(const [body,label] of [['sun','太陽'],['moon','月亮']]){
    const item=byBody(body),value=item.signIsUnconfirmed?item.candidateSigns.map(nameSign).join('／'):nameSign(item.sign);
    root.append(natalFact(label,value,item.signIsUnconfirmed?'出生時間未知；當天可能跨星座，暫時保留兩個答案。':'這是排盤結果。先辨認位置，再到課程閱讀含義。'));
  }
  root.append(natalFact('上升',chart.ascendant===null?'尚無資料':nameSign(signs[Math.floor(chart.ascendant/30)]),chart.ascendant===null?'出生時間未知，原 App 不計算上升或宮位。':'由出生時間與地點計算；上升也是第一宮宮頭。'));
  const sun=byBody('sun'),moon=byBody('moon');
  const start=((moon.longitude-sun.longitude)%360+360)%360;
  const end=sun.dayEndLongitude===null?null:((moon.dayEndLongitude-sun.dayEndLongitude)%360+360)%360;
  const phaseValue=end===null?`${start.toFixed(1)}°`:`${Math.floor(start)}°–${Math.ceil(end)}°${end<start?'（跨過 0°）':''}`;
  root.append(natalFact('日月夾角',phaseValue,end===null?'以確定出生時間計算。':'出生時間未知，這是從當天開始到結束的角度範圍，不是一個確定度數。'));
}
const traceText=(trace,language)=>language==='en'?`${trace.transiting} ${trace.kind} natal ${trace.target} · orb ${trace.orb.toFixed(1)}° · ${trace.phase}`:
  `${names[trace.transiting]} ${aspects[trace.kind]} 本命${names[trace.target]} · 容許度 ${trace.orb.toFixed(1)}° · ${phases[trace.phase]}`;
function adviceCard(item,compact=false,language='zh-Hant'){
  const card=create('article',compact?'advice-card compact':'advice-card');
  const head=create('div','advice-head');head.append(create('span','advice-domain',language==='en'?domainsEn[item.domain]:domains[item.domain]),create('span','advice-kind',item.trace?(language==='en'?'Transit noted':'有行運線索'):(language==='en'?'Quiet day':'安靜日')));card.append(head);
  card.append(create('h4','',item.copy.title),create('p','',item.copy.body));
  if(item.trace){
    card.append(create('p','advice-trace',traceText(item.trace,language)));
    if(item.source){
      const source=create('p','advice-source',`${language==='en'?'Source':'來源'}：${item.source.work} · ${item.source.basis} `);
      if(item.source.url?.startsWith('https://archive.org/')){const link=create('a','',language==='en'?'View source ↗':'查看原始來源 ↗');link.href=item.source.url;link.target='_blank';link.rel='noopener noreferrer';source.append(link);}
      card.append(source);
    }
  }else card.append(create('p','advice-trace',language==='en'?'No approved rule matched this topic today. This is the original app’s quiet-day text.':'今日沒有這個主題的核准規則命中；這段是原 App 的安靜日備用文字。'));
  return card;
}
function renderDay(day,language){
  $('#today-cards').replaceChildren(...day.items.map(item=>adviceCard(item,false,language)));
  const list=$('#transit-list');list.replaceChildren();
  if(!day.report.candidates.length)list.append(create('p','',language==='en'?'No transit aspects fall within the original app’s orbs today.':'今天沒有落在原 App 容許度內的行運相位。'));
  else for(const trace of day.report.candidates)list.append(create('p','transit-row',traceText(trace,language)));
  const partial=$('#partial-reading-note');partial.hidden=!day.report.angleTargetsExcluded;
  partial.textContent=day.report.angleTargetsExcluded?(language==='en'?'Birth time unknown: today and the next seven days exclude rising sign and MC contacts. Degree-specific readings remain uncertain.':'出生時間未知：今日與七日行運已排除上升、天頂；涉及當日度數的個人解讀仍需保留不確定性。'):'';
}
function renderWeek(days,language){
  const root=$('#week-days');root.replaceChildren();
  for(const day of days){
    const details=create('details','week-day');const summary=create('summary','',day.day);details.append(summary);
    const cards=create('div','week-cards');cards.append(...day.items.map(item=>adviceCard(item,true,language)));details.append(cards);root.append(details);
  }
}
async function refresh(){
  if(!activeChart)return;
  const seq=++sequence,status=$('#reading-status');status.textContent='正在整理這一天的天空…';
  try{
    bundlePromise??=fetch('./assets/rules-v1.json').then(response=>{if(!response.ok)throw Error('核准規則尚未載入。');return response.json();});
    const bundle=await bundlePromise;
    if(seq!==sequence)return;
    const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',date=$('#reading-date').value,language=$('#reading-language').value;
    const today=adviceForDate(date,zone,activeChart,bundle,language,astro());
    const week=sevenDayAdvice(date,zone,activeChart,bundle,language,astro());
    if(seq!==sequence)return;
    renderDay(today,language);renderWeek(week,language);status.textContent=language==='en'?`${date} · day changes in your browser's ${zone} time zone · approved rules ${bundle.bundleVersion}`:`${date} · 以目前瀏覽器的 ${zone} 時區換日 · 核准規則 ${bundle.bundleVersion}`;
  }catch(error){if(seq!==sequence)return;status.textContent=`導讀暫時無法載入：${error instanceof Error?error.message:'請稍後重試。'}`;bundlePromise=null;}
}
$('#reading-date').value=todayText();
$('#reading-date').addEventListener('change',refresh);
$('#reading-language').addEventListener('change',refresh);
export function renderReading(chart){activeChart=chart;renderNatal(chart);refresh();}
