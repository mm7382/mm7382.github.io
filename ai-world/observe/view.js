'use strict';
const $=id=>document.getElementById(id), en=document.documentElement.lang==='en', tr=(zh,e)=>en?e:zh;
const root='/ai-world/observe/';
let camera={zoom:1,x:0,y:0}, dragging=null, resourceHits=[], latest=null, animation=null, positions={},activeSpeech={},activeRest={},bundle,worldKey=new URLSearchParams(location.search).get('world')||'eden',shown=null,run=null;
const [characters,worldAssets,riverAsset,foodSprites,animalSprites,scenery]=['characters','life-objects','life-river-v1','life-food-v1','life-animals-v1','life-meadow-v2'].map(key=>{const img=new Image();img.onload=()=>{if(latest&&!animation)draw()};img.src=root+'assets/'+key+'.webp';return img});
const edenScenery=new Image();edenScenery.onload=()=>{if(latest&&!animation)draw()};edenScenery.src=root+'assets/eden-meadow.webp';
const labels={move:['移動','walked'],gather:['採集','gathered'],fish:['釣魚','fished'],eat:['吃東西','ate'],drink:['喝水','drank'],rest:['休息','rested'],sleep:['睡覺','slept'],build:['建造住處','built shelter'],talk:['與對方交談','spoke'],share:['分享食物','shared food'],care:['照顧','provided care'],craft:['製作工具','crafted'],hunt:['狩獵','hunted'],fire:['生火','lit a fire'],cook:['烹煮','cooked'],research:['研究','researched'],family:['討論家庭','discussed family'],birth:['出生','birth'],death:['離世','died'],offer:['提出分享','made an offer'],accept:['接受','accepted'],reject:['拒絕','declined']};
const name=id=>worldKey==='eden'?(id==='1'?tr('夏娃','Eve'):tr('亞當','Adam')):(id==='1'?tr('亞當','Adam'):tr('夏娃','Eve'));
const action=a=>(labels[a]||[])[en?1:0]||'';
const stamp=m=>{const n=(m||0)+420;return tr('第 '+(Math.floor(n/1440)+1)+' 天','Day '+(Math.floor(n/1440)+1))+' · '+String(Math.floor((n%1440)/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
function note(e){return stamp(e.minute)+'　'+name(e.actor)+' '+action(e.action)+(e.text?'：「'+e.text+'」':'')}
function listed(data){$('timeline').replaceChildren(...data.events.slice(-6).reverse().map(e=>{const li=document.createElement('li');li.textContent=note(e);return li}));}
function state(data,reset=false){
 if(reset){if(animation)cancelAnimationFrame(animation);animation=null;positions={};activeSpeech={};activeRest={}}
 latest={...data,world:{...data.world,people:data.world.people.map(p=>({...p,name:name(p.id)}))}};
 $('worldTime').textContent=stamp(data.minute);$('worldName').textContent=en?data.en:data.zh;
 $('saved').textContent=tr('存檔時間：','Saved: ')+new Intl.DateTimeFormat(en?'en-GB':'zh-TW',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Taipei'}).format(new Date(data.saved))+tr('（台灣）',' (Taipei)');
 $('people').replaceChildren(...data.world.people.map(p=>{const li=document.createElement('li');li.textContent=name(p.id)+' · '+(p.health<=0?tr('已離世','deceased'):tr('健康 ','Health ')+Math.round(p.health)+' · '+tr('口渴 ','Thirst ')+Math.round(p.thirst));return li}));
 if(!animation)draw();
}
const group=w=>w.category==='development'?'development':'archive';
function showDevelopment(){
 end(false); if(animation)cancelAnimationFrame(animation);
 animation=null; latest=null; shown=null; worldKey='eden';
 $('viewer').hidden=true;
}
function select(data){
 end(false);shown=data;worldKey=data.key;
 $('viewer').hidden=false;
 const g=group(data);(g==='development'?$('unreleased'):$('history')).appendChild($('viewer'));
 const matches=bundle.worlds.filter(w=>group(w)===g);
 $('worldSelect').replaceChildren(...matches.map(w=>{const o=document.createElement('option');o.value=w.key;o.textContent=en?w.en:w.zh;return o}));
 $('worldSelect').value=worldKey;
 $('worldSelect').disabled=matches.length<2;
 $('play').hidden=!data.events.length;listed(data);state(data,true);
 $('mode').textContent=g==='development'?tr('開發中 · 尚未直播','In development · Not live'):tr('歷史實驗 · 非直播','Historical experiment · Not live')+(data.world.people.every(x=>x.health<=0)?tr(' · 此輪已結束',' · Run ended'):'');
 $('event').textContent=g==='development'?tr('這是伊甸園的開發存檔。舊世界的動作沒有算成這一輪的新進展。','This is the Eden development save. Actions from earlier worlds are not counted as Eden progress.'):tr('選「播放紀錄」可看實際移動與已公開的對話。','Play the record to see saved movements and available dialogue.');
 if(!data.events.length){const li=document.createElement('li');li.textContent=tr('尚未發布這個世界的新事件。','No new events have been published for this world.');$('timeline').append(li)}
}

function end(restore=true){if(run)clearTimeout(run.timer);run=null;activeSpeech={};$('play').textContent=tr('播放紀錄','Play record');if(restore&&shown)select(shown)}
function play(){
 if(run){end();return}
 if(!shown)return;
 if(shown.key==='eden'&&shown.replayFrames?.length){playEden();return}
 const e=shown.events, quote=e.findIndex(x=>x.text), n=quote>=0?Math.max(0,quote-8):Math.max(0,e.length-24), frames=e.slice(n,quote>=0?quote+13:undefined);
 if(!frames.length)return;
 const previous={}, deceased=new Set();for(const x of e.slice(0,n)){
  if(x.action==='move'&&x.target)previous[x.actor]=x.target.split(',').map(Number);
  if(x.action==='death')deceased.add(x.actor);
 }
 const people=shown.world.people.map(p=>({...p,x:previous[p.id]?.[0],y:previous[p.id]?.[1],health:deceased.has(p.id)?0:1}));
 latest={...shown,world:{...shown.world,people:people.map(p=>({...p,name:name(p.id)}))},events:[]};positions={};activeRest={};activeSpeech={};
 $('play').textContent=tr('停止回放','Stop replay');$('mode').textContent=tr('紀錄回放 · 地形使用存檔底圖','Record replay · Base map from the save');
 run={i:0,timer:null};
 function step(){if(!run)return; if(run.i>=frames.length){run.timer=setTimeout(end,1800);return}const frame=frames[run.i++],p=latest.world.people.find(v=>v.id===frame.actor);if(frame.action==='move'&&frame.target)[p.x,p.y]=frame.target.split(',').map(Number);if(frame.action==='death')p.health=0;
 activeSpeech={};if(frame.text)activeSpeech[frame.actor]={text:frame.text,until:Date.now()+2300};if(['rest','sleep'].includes(frame.action))activeRest[frame.actor]=Date.now()+650;
 latest.minute=frame.minute;$('worldTime').textContent=stamp(frame.minute);$('event').textContent=note(frame);if(!animation)draw();run.timer=setTimeout(step,frame.text?2400:frame.action==='move'?650:460);
 }
 step();
}
function playEden(){const source=shown,frames=source.replayFrames;let i=0;run={timer:null};$('play').textContent=tr('停止回放','Stop replay');$('mode').textContent=tr('真實決策紀錄回放 · 非直播','Actual decisions replay · Not live');function step(){if(!run)return;if(i>=frames.length){run=null;$('play').textContent=tr('播放紀錄','Play record');return}const frame=frames[i++];state({...source,minute:frame.minute,world:frame.world},true);const ev=frame.event;activeSpeech={};if(ev?.action==='talk'&&ev.text)activeSpeech[ev.actor]={text:ev.text,until:Date.now()+2400};$('event').textContent=ev?note(ev):tr('世界第一天，兩人從這裡開始。','The first day begins here.');if(!animation)draw();run.timer=setTimeout(step,ev?.text?2600:850)}step()}
async function refresh(){
 try{const res=await fetch(root+'data.json',{cache:'no-store',credentials:'omit'});if(!res.ok)throw Error('unavailable');const json=await res.json();
 if(json.version!==1||!Array.isArray(json.worlds)||!json.worlds.length)throw Error('invalid format');
 bundle=json;
 if(worldKey==='eden'){const eden=json.worlds.find(w=>w.key==='eden');if(!eden){if(shown)showDevelopment();return}}
 const w=json.worlds.find(w=>w.key===worldKey);if(!w){showDevelopment();return}
 if(!run&&(!shown||w.minute!==shown.minute||w.saved!==shown.saved)){
  if(shown&&shown.key===w.key){activeSpeech={};const ids=new Set(shown.events.map(e=>e.id));for(const ev of w.events)if(ev.text&&!ids.has(ev.id))activeSpeech[ev.actor]={text:ev.text,until:Date.now()+6500};shown=w;listed(w);state(w);}
  else select(w);
 }
 $('scene').classList.add('ready');
 }catch{if(!bundle)$('mode').textContent=tr('存檔暫時無法讀取','Save temporarily unavailable');}
}
$('closeArchive').onclick=showDevelopment;

$('worldSelect').onchange=()=>{const w=bundle?.worlds.find(x=>x.key===$('worldSelect').value);if(w){camera={zoom:1,x:0,y:0};select(w)}};
$('play').onclick=play;
$('zoomIn').onclick=()=>{camera.zoom=Math.min(3,camera.zoom*1.25);draw()};
$('zoomOut').onclick=()=>{camera.zoom=Math.max(1,camera.zoom/1.25);if(camera.zoom===1)camera={zoom:1,x:0,y:0};draw()};
$('reset').onclick=()=>{camera={zoom:1,x:0,y:0};draw()};
const map=$('map');map.addEventListener('pointerdown',e=>{if(camera.zoom===1)return;dragging={x:e.clientX,y:e.clientY,dx:camera.x,dy:camera.y};map.setPointerCapture(e.pointerId)});
map.addEventListener('pointermove',e=>{if(!dragging)return;camera.x=dragging.dx+e.clientX-dragging.x;camera.y=dragging.dy+e.clientY-dragging.y;draw()});
for(const k of ['pointerup','pointercancel'])map.addEventListener(k,()=>{dragging=null});
window.addEventListener('resize',()=>{if(!animation)draw()});refresh();setInterval(()=>{if(!document.hidden)refresh()},30000);
