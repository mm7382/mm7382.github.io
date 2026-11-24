(() => {
'use strict';
const el = (id) => document.getElementById(id);
const scene = el('scene'), wrap = scene.closest('.viewport');
const BASE = [0,0,1120,600], W = BASE[2], H = BASE[3];
const NS = 'http://www.w3.org/2000/svg';
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const crew = {
  harbor: ['港務官','#86beab',-17,-4],
  craft: ['工匠','#e0a96b',18,4],
  merchant: ['商人','#aab9e4',0,-24],
};
const roleName = (a) => crew[a.id]?.[0] || a.role || a.id;
const name = (a) => a?.name || roleName(a || {});
const phaseLabels = {clear:'風平浪靜',calm:'風平浪靜',breeze:'微風',warning:'風浪漸強',building:'風浪漸強',rising:'風浪漸強',storm:'暴風雨',poststorm:'風雨漸歇',aftermath:'風雨漸歇',easing:'風雨漸歇'};
const shipLabels = {offshore:'尚在外海',docked:'已靠岸',unloaded:'已卸貨',departed:'已離開'};
const activities = {survey:'勘查地形',move:'走動',gather:'採集材料',take:'取材',deposit:'卸下材料',drop:'卸下材料',deliver:'搬運材料',build:'施工',land:'靠岸',dock:'靠岸',unload:'卸載商船',speak:'商議',wait:'等候'};
const clamp = (x,a,b) => Math.min(Math.max(x,a),b);
const int = (x) => Number.isFinite(x) ? Math.round(x) : '—';
const as = (key, data={}) => {const o=document.createElementNS(NS,key); for (const [k,v] of Object.entries(data))o.setAttribute(k,v); return o;};
const node = (tag, cls, copy) => {const e=document.createElement(tag); if(cls)e.className=cls;if(copy)e.textContent=copy;return e;};
const enable = (id, control=true) => {el(id).disabled=!control;};
const move = (obj,x,y) => obj.setAttribute('transform', `translate(${x},${y})`);
let mapZoom=1, manualView=null; let replay, i=0, selected=null, animated, positions={}, shipXY, oldView=BASE.slice(), timer, active=false, resumeMotion=null, pauseMotion=null;
const chars = new Map();
const panels = new Map();
const land = `M-20-20H1148V301Q1092 308 1064 333Q1035 355 989 345Q941 334 895 354Q862 370 826 351Q794 331 754 339Q725 344 704 332Q682 320 633 323Q589 327 554 345Q516 366 475 342Q448 326 419 338Q389 358 358 354Q322 349 299 366Q262 392 228 366Q200 346 151 359Q113 369 89 395Q67 417 39 414L-20 440Z`;
const ripples = `M-10 445Q46 421 67 421Q85 416 103 401Q126 377 152 372Q191 358 219 376Q256 403 300 378Q327 362 358 366Q390 370 430 350Q450 340 473 355Q514 379 560 357Q595 337 635 335Q684 332 704 344Q725 357 756 351Q795 343 827 363Q862 384 898 366Q942 347 990 358Q1036 365 1066 345Q1101 319 1130 319`;
const sky = `<defs>
<linearGradient id="sea" x1="0" x2=".68" y1=".40" y2="1"><stop stop-color="#65b9ad"/><stop offset=".47" stop-color="#208992"/><stop offset="1" stop-color="#153c57"/></linearGradient>
<linearGradient id="landfill" x1=".25" x2=".75" y1="0" y2="1"><stop stop-color="#5a715c"/><stop offset=".54" stop-color="#a69667"/><stop offset="1" stop-color="#d4b984"/></linearGradient>
<linearGradient id="stoneface" x1="0" x2=".5" y1="0" y2="1"><stop stop-color="#b8ae7e"/><stop offset="1" stop-color="#77674b"/></linearGradient>
<radialGradient id="sea-light"><stop stop-color="#6eeac1" stop-opacity=".38"/><stop offset="1" stop-color="#1a7990" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette"><stop offset=".52" stop-color="#031a23" stop-opacity="0"/><stop offset="1" stop-color="#031a23" stop-opacity=".51"/></radialGradient>
<clipPath id="landclip"><path d="${land}"/></clipPath>
<mask id="sea-mask"><rect x="-20" y="-20" width="1160" height="640" fill="white"/><path d="${land}" fill="black"/></mask>
</defs>`;
const esc = (s) => String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function art(){return `<defs><filter id="softshadow"><feGaussianBlur stdDeviation="2"/></filter><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".2 .8" numOctaves="3" seed="12" result="noise"/><feComposite in="noise" in2="SourceGraphic" operator="in" result="clipped"/><feBlend in="SourceGraphic" in2="clipped" mode="soft-light"/></filter><linearGradient id="plank"><stop stop-color="#c0a678"/><stop offset=".55" stop-color="#8b704c"/><stop offset="1" stop-color="#624b34"/></linearGradient></defs><image href="./assets/bay.png" x="0" y="0" width="1120" height="600" preserveAspectRatio="none"/><rect id="stormwash" width="1120" height="600" fill="#102b46" opacity="0" pointer-events="none"/><g id="places"></g><g id="structures"></g><g id="ship"><ellipse cx="5" cy="13" rx="65" ry="9" fill="#102e29" opacity=".25" filter="url(#softshadow)"/><svg x="-78" y="-118" width="156" height="138" viewBox="570 630 684 624" overflow="hidden"><image href="./assets/actors-ship.png" width="1254" height="1254"/></svg></g><g id="actors"></g>`;}
scene.innerHTML = art();
el('ship').append(as('g',{id:'ship-cargo'}));
scene.insertBefore(as('g',{id:'shore-cargo'}),el('actors'));
const empty = {
 tick:0, weather:{phase:'calm'}, sites:[{id:'camp',label:'營地',x:.4,y:.29},{id:'timber',label:'木材場',x:.19,y:.27},{id:'quarry',label:'石場',x:.66,y:.27},{id:'cove',label:'西側灣口',x:.29,y:.58},{id:'strand',label:'中央沙灘',x:.51,y:.55},{id:'point',label:'東側岬角',x:.74,y:.56}],
 actors:Object.entries(crew).map(([id,[role]])=>({id,role,x:.4,y:.29})), ship:{status:'offshore',x:.83,y:.82}, stocks:{}, structures:[]
};
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
function actorPos(a){
 const [,,x,y]=crew[a.id]||[];
 return [finite(a.x,.4)*W+finite(x,0),finite(a.y,.29)*H+finite(y,0)];
}
function shipPos(s){return [finite(s?.x,.83)*W,finite(s?.y,.82)*H];}
function ensureActors(snapshot){
 for(const a of snapshot.actors || []){
  if(chars.has(a.id))continue;
  const col=crew[a.id]?.[1]||'#deb779';
  const g=as('g',{class:'person-mark',role:'button',tabindex:0,'aria-label':`近看${name(a)}`,'aria-pressed':'false'});
  const crop={harbor:'0 0 627 627',craft:'627 0 627 627',merchant:'0 627 627 627'}[a.id];
  g.innerHTML=`<title>${esc(name(a))}</title><ellipse class="pickring" cy="3" rx="7" ry="2" fill="none" stroke="#f4d39a" opacity=".65"/><ellipse cx="7" cy="5" rx="7" ry="2" fill="#26302a" opacity=".35" filter="url(#softshadow)"/><svg class="photo-person" x="-24" y="-47" width="48" height="48" viewBox="${crop}" overflow="hidden"><image href="./assets/actors-ship.png" width="1254" height="1254"/></svg><g class="cargo" opacity="0" transform="translate(0,-15) scale(.55)"><path d="m3-13 13 2v7L3-6z" fill="#99734a" stroke="#4e3b27"/><path d="m3-13 3-3 13 2-3 3z" fill="#d0b381"/><path d="m7-12v7m5-6v7" stroke="#d9c79b"/></g><circle cy="-23" r="24" fill="transparent"/>`;
  const choose=()=>setFocus(selected===a.id?null:a.id);
  g.addEventListener('click',choose);
  g.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
  el('actors').append(g); chars.set(a.id,g);
  const button=node('button','person');button.type='button';button.setAttribute('aria-pressed','false');button.addEventListener('click',choose);
  const emblem=node('span','emblem',roleName(a).slice(0,1));emblem.style.color=col;
  const details=node('span');const title=node('span','role',roleName(a));const task=node('span','task','觀察中');
  details.append(title,task);button.append(emblem,details);el('crew').append(button);panels.set(a.id,{button,title,task});
 }
}
function structures(snapshot){
 el('places').replaceChildren(...(snapshot.sites||[]).map(site=>{
  const g=as('g',{transform:`translate(${site.x*W},${site.y*H})`});
  const t=as('text',{class:'site-label',x:0,y:-16,'text-anchor':'middle'});t.textContent=site.label;
  g.append(as('path',{d:'M-3 8v-14h12l-3 4 3 4h-10v6z',fill:'#e8d5a4',stroke:'#65513c','stroke-width':1}),t);
  return g;
 }));
 el('structures').replaceChildren(...(snapshot.structures||[]).map(s=>{
  const site=(snapshot.sites||[]).find(t=>t.id===s.site);
  const x=finite(s.x,site?.x??.35)*W,y=finite(s.y,site?.y??.57)*H;
  const full=s.complete!==false, ratio=clamp(finite(s.progress,1)/Math.max(1,finite(s.required,1)),.14,1);
  const group=as('g',{transform:`translate(${x},${y})`});
  if(['shelter','well','garden'].includes(s.kind)){
   const offsets={shelter:[75,-25],well:[-58,24],garden:[72,91]};
   const [dx,dy]=offsets[s.kind];group.setAttribute('transform','translate('+(x+dx)+','+(y+dy)+')');
   const foundation='<path d="M-20 0 0-10 23 0 2 12Z" fill="#85775e" stroke="#655b4c"/>';
   if(s.kind==='shelter')group.innerHTML=foundation+'<path d="M-17 0v-23m34 23v-23M-17-23 0-34 17-23" stroke="#796142" stroke-width="3" fill="none"/>'+(ratio>=.66?'<path d="M-17-22 17-22 17 0 0 8-17 0Z" fill="#bba37f"/><path d="M-4 5v-17h8V5" fill="#463d30"/>':'')+(full?'<path d="M-23-21 0-37 23-21 0-13Z" fill="#8b7957" stroke="#b5a16f"/>':'');
   if(s.kind==='well')group.innerHTML=foundation+'<ellipse cy="-4" rx="12" ry="7" fill="#a7997f" stroke="#716653" stroke-width="'+(3+ratio*4)+'"/>'+(full?'<ellipse cy="-5" rx="7" ry="3" fill="#294943"/>':'');
   if(s.kind==='garden')group.innerHTML='<path d="M-23 0 0-11 27 0 4 13Z" fill="#685840"/>'+Array.from({length:Math.ceil(ratio*4)},(_,j)=>'<path d="M'+(-15+j*7)+' 1l18-8" stroke="'+(full?'#738259':'#a08a61')+'" stroke-width="3"/>').join('');
   if(full){const cell={shelter:0,well:1,garden:2}[s.kind],size={shelter:110,well:48,garden:92}[s.kind];
    group.innerHTML='<svg x="'+(-size/2)+'" y="'+(-size*.83)+'" width="'+size+'" height="'+size+'" overflow="hidden" viewBox="'+(cell*724)+' 0 724 724"><image href="./assets/buildings.png" width="2172" height="724"/></svg>';
   }
  }else if(s.kind==='breakwater'){
   const rubble=Array.from({length:Math.ceil(28*ratio)},(_,j)=>{const x=j*2.9-27,y=j*.65+7+Math.sin(j*2.5)*4;return `<path d="m${x.toFixed(1)} ${y.toFixed(1)}q8-6 13-1l3 5-12 4-7-4z" fill="${['#b6a386','#978c72','#847965'][j%3]}" stroke="#645b50" stroke-width=".6"/>`;}).join('');
   group.innerHTML=`<ellipse cx="0" cy="21" rx="${50*ratio}" ry="12" fill="#245b63" opacity=".45"/>${rubble}`;
  } else {
   const end=Math.round((s.kind==='landing'?23:53)*ratio), boards=Array.from({length:Math.floor(end/4)},(_,j)=>`<path d="M-10 ${j*4+3}h20" stroke="#705339" stroke-width=".8" opacity=".86"/>`).join('');
   group.innerHTML=`<path d="M-13 10-5 ${end+11}h22l-8-50z" fill="#134f54" opacity=".40"/>
    <path d="M-9 0v${end+4}m18-${end+4}v${end+4}" stroke="#735336" stroke-width="2"/>
    <path d="M-11 0H11V${end}H-11Z" fill="url(#plank)" stroke="#654833"/>${boards}<path d="M-12 ${end}h24v4h-24z" fill="#714d35"/>`;
  }
  const t=as('title');t.textContent=`${({landing:'簡易碼頭',pier:'棧橋',breakwater:'防波堤'})[s.kind]||s.kind||'工程'}：${full?'完工':'施工中'}`;group.append(t);return group;
 }));
}
// Cargo counts come only from recorded snapshots. Interpolation is visual only.
function cargoScene(s, ev, progress=1){
 const unloading=ev?.ok && ev.action?.type==='unload';
 const previous=i>1?replay.frames[i-2].snapshot:replay?.initial;
 const before=previous?.ship?.cargo??s.ship?.cargo??0;
 const remaining=s.ship?.cargo??0;
 const transferred=unloading?Math.max(0,before-remaining):0;
 const crate=(x,y)=>{
  const g=as('g',{transform:`translate(${x},${y})`});
  g.innerHTML='<rect x="-5" y="-8" width="10" height="8" fill="#e6bd76" stroke="#543c2b"/><path d="M-5-8 5 0M5-8-5 0" stroke="#987042" stroke-width=".8"/>';
  return g;
 };
 el('ship-cargo').replaceChildren(...Array.from({length:remaining},(_,n)=>crate(-20+n*12,2)));
 const shore=[];
 for(const site of s.sites||[]){
  const count=s.stocks?.[site.id]?.cargo||0;
  const moving=unloading&&site.id===s.ship.at?transferred:0;
  for(let n=0;n<count;n++){
   const target=[site.x*W+24+n*13,site.y*H-9];
   const k=n>=count-moving?progress:1;
   const from=shipPos(s.ship);from[0]+=-20+(remaining+n-(count-moving))*12;
   const box=crate(from[0]+(target[0]-from[0])*k,from[1]+(target[1]-from[1])*k);
   box.dataset.cargoSite=site.id;shore.push(box);
  }
 }
 el('shore-cargo').replaceChildren(...shore);
}
const snapshot = () => i===0 ? replay?.initial || empty : replay?.frames?.[i-1]?.snapshot || empty;
const event = () => i===0 ? null : replay?.frames?.[i-1]?.event;
function updateBubble(ev,s){
 if(!ev?.say || !chars.has(ev.actorId)){el('speaker').hidden=true;return;}
 el('speaker').hidden=false;
 el('speaker-role').textContent=ev.actorName||name(s.actors.find(a=>a.id===ev.actorId));
 el('speaker-text').textContent=String(ev.say);
 anchorBubble(ev);
}
function anchorBubble(ev) {
 if(el('speaker').hidden||!ev)return;
 const xy=positions[ev.actorId];if(!xy)return;
 const m=scene.getScreenCTM();if(!m)return;
 const p=scene.createSVGPoint();[p.x,p.y]=[xy[0],xy[1]-50];
 const q=p.matrixTransform(m),b=wrap.getBoundingClientRect();
 if(q.x < b.left-10||q.x>b.right+10||q.y<b.top-10||q.y>b.bottom+10){el('speaker').style.visibility='hidden';return;}
 el('speaker').style.visibility='';
 const pad=el('speaker').offsetWidth/2+8, bx=clamp(q.x-b.left,pad,b.width-pad);
 const by=clamp(q.y-b.top,el('speaker').offsetHeight+6,b.height-32);
 el('speaker').style.left=`${bx}px`;el('speaker').style.top=`${by}px`;
}
function viewTarget(s){
 const a=(s.actors||[]).find(a=>a.id===selected),w=W/mapZoom,h=H/mapZoom;
 const [x,y]=a?actorPos(a):[oldView[0]+oldView[2]/2,oldView[1]+oldView[3]/2];
 el('zoom-in').disabled=mapZoom>=4;el('zoom-out').disabled=mapZoom<=1;
 el('zoom-level').textContent=mapZoom+'×';el('overview').disabled=mapZoom===1&&!selected;
 return [clamp(x-w/2,0,W-w),clamp(y-h/2,0,H-h),w,h];
}
function drawMotion(s, ev, transition){
 scene.classList.remove('paused');
 if(animated)cancelAnimationFrame(animated);
 const targetView=viewTarget(s), startView=oldView.slice(), basePositions={...positions},dest={};
 for(const a of s.actors||[])dest[a.id]=actorPos(a);
 const startShip=shipXY||shipPos(s.ship), targetShip=shipPos(s.ship);
 let begin=performance.now(), pausedAt=null;
 pauseMotion=()=>{if(animated){cancelAnimationFrame(animated);animated=null;pausedAt=performance.now();}};
 resumeMotion=()=>{if(pausedAt!==null){begin+=performance.now()-pausedAt;pausedAt=null;animated=requestAnimationFrame(tick);}};
 const travelMs=Math.max(0,...Object.entries(dest).map(([id,xy])=>{
 const p=basePositions[id]||xy;
 const carrying=Object.values((s.actors||[]).find(a=>a.id===id)?.carry||{}).some(v=>v>0);
 return Math.hypot(p[0]-xy[0],p[1]-xy[1])/(carrying?13:18)*1000;
}),Math.hypot(startShip[0]-targetShip[0],startShip[1]-targetShip[1])/42*1000);
 const duration=transition&&!media.matches?Math.max(690,travelMs):0;
 const tick=(now)=>{
  const k=duration?clamp((now-begin)/duration,0,1):1, ease=k<.12?k*k/.2112:k>.88?1-(1-k)*(1-k)/.2112:(k-.06)/.88;
  const mix=(u,v)=>u+(v-u)*ease;
  for(const [id,xy] of Object.entries(dest)){
   const p=basePositions[id]||xy, g=chars.get(id);
   positions[id]=[mix(p[0],xy[0]),mix(p[1],xy[1])];
   
   const distance=Math.hypot(p[0]-xy[0],p[1]-xy[1]);
   const walking=k<1&&distance>1;
   const depth=.86+clamp((positions[id][1]-130)/240,0,1)*.14;
   move(g,...positions[id]);
   g.setAttribute('transform','translate('+positions[id][0]+','+positions[id][1]+') scale('+depth+')');
   g.dataset.moving=String(walking);
   const picture=g.querySelector('.photo-person');
   if(distance>1)g.dataset.facing=xy[0]<p[0]?'left':'right';
   const facing=g.dataset.facing==='left'?-1:1;
   const phase=distance*ease/9*Math.PI*2;
   const lift=walking?Math.sin(phase)*.3:0;
   picture.setAttribute('transform','translate(0,'+(-Math.abs(lift))+') scale('+facing+',1)');
 
  }
  shipXY=[mix(startShip[0],targetShip[0]),mix(startShip[1],targetShip[1])];
  move(el('ship'),...shipXY);
  
  const cameraEase=duration?Math.min(1,(now-begin)/690):1;
  oldView=targetView.map((v,j)=>startView[j]+(v-startView[j])*cameraEase);
  if(selected&&positions[selected]){
   oldView[0]=clamp(positions[selected][0]-oldView[2]/2,0,W-oldView[2]);
   oldView[1]=clamp(positions[selected][1]-oldView[3]*.59,0,H-oldView[3]);
  }
 if(manualView)oldView=manualView.slice();scene.setAttribute('viewBox',oldView.join(' '));
  anchorBubble(ev);
  cargoScene(s,ev,ease);
  if(k<1)animated=requestAnimationFrame(tick);else {animated=null;resumeMotion=null;pauseMotion=null;}
 };
 tick(begin);
}
function eventLog(ev,s){
 const out=el('events');out.replaceChildren();
 if(!ev){out.append(node('li','','還沒有施工紀錄。'));return;}
 if(ev.say){
  const li=node('li');li.dataset.dialogue='';li.append(node('small','',name(s.actors.find(a=>a.id===ev.actorId))||ev.actorName||'對話'),document.createTextNode(String(ev.say)));out.append(li);
 }
 if(ev.message){
  const li=node('li');li.append(node('small','',ev.ok===false?'未執行':'世界紀錄'),document.createTextNode(String(ev.message)));out.append(li);
 }
}
function render(transition=false){
 const s=snapshot(),ev=event();el('food').textContent=s.stocks?.camp?.food??'—';el('water').textContent=s.stocks?.camp?.water??'—';
 ensureActors(s);
 structures(s);
 const phase=s.weather?.phase||'calm';
 el('stormwash').setAttribute('opacity',phase==='storm'?'.35':['warning','building','rising'].includes(phase)?'.16':'0');
 const ticksPerDay=finite(replay?.ticksPerDay,8);
 el('day').textContent=`第 ${finite(s.day,Math.floor(finite(s.tick,0)/ticksPerDay)+1)} 日`;
 el('weather').textContent=phaseLabels[phase]||phase;
 el('ship-status').textContent=shipLabels[s.ship?.status]||s.ship?.status||'尚在外海';
 const siteStocks=Object.values(s.stocks||{});
 for(const k of ['wood','stone']){
  const list=siteStocks.map(row=>row?.[k]).filter(Number.isFinite);
  el(k).textContent=list.length?String(int(list.reduce((acc,v)=>acc+v,0))):'—';
 }
 for(const a of s.actors||[]){
  const mine=ev?.actorId===a.id,group=chars.get(a.id),panel=panels.get(a.id);
  group.querySelector('.cargo').setAttribute('opacity',Object.values(a.carry||{}).some(v=>v>0)?'1':'0');
  group.dataset.selected=String(a.id===selected);
  group.setAttribute('aria-pressed',String(a.id===selected));panel.button.setAttribute('aria-pressed',String(a.id===selected));
  const label = s.sites?.find(t=>t.id===a.at)?.label;
  panel.title.textContent = a.name&&a.name!==roleName(a)?`${a.name} · ${roleName(a)}`:roleName(a);
  const type=typeof ev?.action==='string'?ev.action:ev?.action?.type;
  panel.task.textContent=mine?activities[type]||label||'觀察中':label||'觀察中';
 }
 el('ship').setAttribute('opacity',s.ship?.status==='departed'?'0':'1');
 el('timeline').value=i;
 const max=replay?.frames?.length||0;
 el('frame-count').value=`${i} / ${max}`;
 el('timeline').setAttribute('aria-valuetext',`第 ${i} 幕，共 ${max} 幕`);
 const outcome=s.outcome==='unloaded'?'首艘商船已卸貨':s.outcome==='ship-departed'?'首艘商船未完成卸貨':'';
 el('stage-note').textContent=outcome || (ev?.message?String(ev.message):i===0?(replay?.phase==='settlement'?'聚落階段起點 · 港口已完成':'開場 · 尚未修建港口'):'觀察回放');
 eventLog(ev,s);
 updateBubble(ev,s);
 drawMotion(s,ev,transition);
 [ ['play',max>0], ['rewind',i>0], ['step',i<max], ['timeline',max>0] ].forEach(([id,on])=>enable(id,on));
}
function setFocus(id){
 selected=id;manualView=null;if(!id)mapZoom=1;
 el('overview').disabled=!id;
 render(true);
}
function stop(){
 active=false;clearTimeout(timer);pauseMotion?.();scene.classList.remove('motion');scene.classList.add('paused');
 el('play').setAttribute('aria-label','播放');el('play').title='播放';
 el('play').firstElementChild.innerHTML='<path d="m9 4 12 8-12 8z"/>';
}
function step(forward=1){
 stop();
 i=clamp(i+forward,0,replay?.frames?.length||0);render(true);
}
function play(){
 if(active){stop();return;}
 const max=replay?.frames?.length||0;
 if(!max)return;
 if(i>=max){i=0;render();}
 active=true;scene.classList.remove('paused');resumeMotion?.();if(!media.matches)scene.classList.add('motion');
 el('play').setAttribute('aria-label','暫停');el('play').title='暫停';
 el('play').firstElementChild.innerHTML='<path d="M7 5h4v14H7zm7 0h4v14h-4z"/>';
 function advance(){
  if(animated){timer=setTimeout(advance,120);return;}
  if(i>=max){stop();return;}
  i+=1;el('session').textContent='AI 實錄回放 · 2.5D';render(true);timer=setTimeout(advance,2400);
 }
 timer=setTimeout(advance,850);
}
function load(data){
 if(data?.schema!==1||!Array.isArray(data.frames)||!data.initial)throw Error('不是支援的海灣回放檔案');
 if([data.initial,...data.frames.map(f=>f.snapshot)].some(s=>!Array.isArray(s?.actors)||!Array.isArray(s?.sites)))throw Error('回放資料缺少角色或地點');
 stop();i=0;selected=null;el('overview').disabled=true;
 for (const n of chars.values())n.remove();for(const n of panels.values())n.button.remove();chars.clear();panels.clear();
 positions={};shipXY=null;replay=data;
 document.querySelector('h1').textContent=data.phase==='settlement'?'向自給聚落前進':'從空海灣開始';
 document.querySelector('.subtitle').textContent=data.phase==='settlement'?data.goal:'給三位 AI 一個目標：讓第一艘商船安全靠岸卸貨。不給藍圖，也不替他們決定結局。';
 const live=data.source==='ai'||data.source==='codex';
 const fixture=['fixture','demo','test','scripted'].includes(data.source);
 el('session').textContent=live?'AI 實錄回放':fixture?'介面測試 · 非 AI':'觀察紀錄';
 el('provenance').textContent=live?`AI 實錄回放${data.model?' · '+data.model:''}，不是直播`:fixture?'介面測試資料，不是 AI 執行結果':'匯入的回放紀錄，來源未標示';
 el('timeline').max=data.frames.length;
 i=data.frames.length;render();el('session').textContent=data.phase==='settlement'?'聚落紀錄 · 最新保存':'最新保存成果 · 2.5D';
}
el('latest').onclick=()=>{stop();i=replay?.frames.length||0;selected=null;el('overview').disabled=true;render();el('session').textContent='最新保存成果 · 2.5D';};
el('harbor-record').onclick=()=>fetch('./replay.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(load).catch(()=>{el('stage-note').textContent='港口紀錄載入失敗';});
el('settlement-record').onclick=()=>fetch('./settlement.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(load).catch(()=>{el('stage-note').textContent='聚落 AI 紀錄尚未匯出';});
function prepareZoom(){if(manualView){oldView=manualView.slice();manualView=null;}}
el('zoom-in').onclick=()=>{prepareZoom();mapZoom=Math.min(4,mapZoom+.5);render(true);};
el('zoom-out').onclick=()=>{prepareZoom();mapZoom=Math.max(1,mapZoom-.5);render(true);};

let mapDrag=null,suppressMapClickUntil=0;
scene.addEventListener('pointerdown',e=>{
 if(mapZoom<=1||e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;
 mapDrag={id:e.pointerId,x:e.clientX,y:e.clientY,view:oldView.slice(),moved:false};
 scene.setPointerCapture?.(e.pointerId);
});
scene.addEventListener('pointermove',e=>{
 if(!mapDrag||e.pointerId!==mapDrag.id)return;
 const dx=e.clientX-mapDrag.x,dy=e.clientY-mapDrag.y;
 if(!mapDrag.moved&&Math.hypot(dx,dy)<5)return;
 mapDrag.moved=true;selected=null;scene.classList.add('map-dragging');
 const b=scene.getBoundingClientRect(),v=mapDrag.view,scale=Math.min(b.width/v[2],b.height/v[3]);
 manualView=[clamp(v[0]-dx/scale,0,W-v[2]),clamp(v[1]-dy/scale,0,H-v[3]),v[2],v[3]];
 oldView=manualView.slice();scene.setAttribute('viewBox',oldView.join(' '));
 el('speaker').hidden=true;
 e.preventDefault();
});
function finishMapDrag(e){if(!mapDrag||e.pointerId!==mapDrag.id)return;if(mapDrag.moved)suppressMapClickUntil=performance.now()+500;scene.releasePointerCapture?.(e.pointerId);mapDrag=null;scene.classList.remove('map-dragging');}
scene.addEventListener('pointerup',finishMapDrag);scene.addEventListener('pointercancel',finishMapDrag);
scene.addEventListener('click',e=>{if(performance.now()<suppressMapClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
el('rewind').onclick=()=>{stop();i=0;render();};
el('play').onclick=play;el('step').onclick=()=>step();el('overview').onclick=()=>setFocus(null);el('zoom-reset').onclick=()=>setFocus(null);
el('timeline').oninput=(e)=>{stop();el('session').textContent='AI 實錄回放 · 2.5D';i=Number(e.target.value);render();};
el('load').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 try{load(JSON.parse(await f.text()));}catch(err){el('stage-note').textContent=`匯入失敗：${err.message}`;}finally{e.target.value='';}
};
window.addEventListener('atlantis-record',e=>{if(replay?.phase==='settlement'&&!active&&i===replay.frames.length){load(e.detail);}});
window.addEventListener('resize',()=>anchorBubble(event()));
render();el('overview').disabled=true;
if(globalThis.ATLANTIS_REPLAY){
 try{load(globalThis.ATLANTIS_REPLAY);}catch(err){el('stage-note').textContent=`回放載入失敗：${err.message}`;}
} else if(location.protocol==='file:'){
 el('stage-note').textContent='請用右上角「匯入紀錄」載入 replay.json。';
} else {
 fetch('./settlement.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>fetch('./replay.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();})).then(load).catch(()=>{el('stage-note').textContent='紀錄載入失敗';});
}
})();
