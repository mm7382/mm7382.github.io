'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),W=1440,H=900;
let demo=null,demoStarted=0,liveState=null;
let state=null,config=null,received=0,connected=false,zoom=1,pan={x:0,y:0},pin=null,marking=false,drag=null,lastEvents='';
const assets={};for(const [id,file]of Object.entries({plate:'giza-base.webp',worker:'worker.webp',warm:'limestone-warm.webp',dark:'limestone-shade.webp'})){let im=new Image();im.src='assets/'+file;assets[id]=im;}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
const names={ready:'尚未啟動 AI',thinking:'AI 正在討論',running:'施工中',complete:'單石驗收已完成',paused:'已暫停',blocked:'AI 啟動受阻'};
const actions={load:'裝載雪橇',wet:'整路灑水',repair:'清理路段',haul:'多人拖運',place:'卸載定位'};
function point(x,y,z=0){return{x:W*(.17+x*.035+y*.012),y:H*(.80-x*.009+y*.022-z*.055)}}
function line(a,b,color,width=2){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function poly(pts,color){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function ellipse(p,rx,ry,color){ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function stone(x,y,z=0){const cam={at:p=>point(p.x,p.y,p.z),range:p=>p.y-p.x*.343+p.z*.456,view:{x:-.343,y:1,z:.456}};const mesh=Craft.rockMesh({x,y,z},.55,.8);Craft.drawFaces(ctx,Craft.meshFaces(mesh,cam,7,true),assets)}
function human(x,y,phase,walk,ropeEnd){
 const p=point(x,y),s=105,im=assets.worker;if(!im.complete||!im.naturalWidth)return;
 const hauling=phase==='haul',bend=hauling?.16:phase==='work'?.24:0;
 const v=(dx,dy)=>({x:p.x+s*dx,y:p.y+s*dy}),hip=v(bend*.2,-.50),waist=v(bend*.3,-.56),collar=v(bend,-.81),neck=v(bend,-.86),head=v(bend+.01,-.99);
 ellipse({x:p.x+18,y:p.y+5},34,7,'#30201850');
 const gait=phase==='haul'?walk:0;
 for(let side of [-1,1]){let t=(gait+(side<0?.5:0))%1,stance=t<.6;let dx=phase==='haul'?(stance?.13-t*.44:-.13+(t-.6)*.66):side*.065;
  const foot=v(dx+side*.035,phase==='haul'&&!stance?-.06*Math.sin((t-.6)/.4*Math.PI):0),knee={x:lerp(hip.x,foot.x,.55)-s*.035,y:lerp(hip.y,foot.y,.48)};
  Craft.skinPart(ctx,im,'calf',knee,foot,1,1.05,side<0?.8:1);Craft.skinPart(ctx,im,'foot',foot,{x:foot.x+11,y:foot.y+2},1,1);
 }
 Craft.skinPart(ctx,im,'torso',collar,waist,1,.95);Craft.skinPart(ctx,im,'kilt',waist,v(-bend*.25,-.27),1,1.02);Craft.skinPart(ctx,im,'head',neck,head,1,.96);
 for(let side of [-1,1]){const shoulder=v(bend+side*.065,-.77),hand=hauling?v(-.25+side*.025,-.53):phase==='work'?v(.26+side*.03,-.34):v(.04+side*.09,-.42);
  const elbow={x:lerp(shoulder.x,hand.x,.5)-10,y:lerp(shoulder.y,hand.y,.6)};
  if(ropeEnd&&side===1){line(ropeEnd,hand,'#4a3520',4);line({x:ropeEnd.x,y:ropeEnd.y-1},{x:hand.x,y:hand.y-1},'#c7aa74',1.4)}
  Craft.skinPart(ctx,im,'upper',shoulder,elbow,1,1,side<0?.85:1);Craft.skinPart(ctx,im,'fore',elbow,hand,1,1);
 }
}
function render(){
 if(demo){const t=Math.min(demo.duration,(Date.now()-demoStarted)/1000);const f=demo.frames.filter(f=>f.time<=t).at(-1);state=structuredClone(f.state);state.publishedAt=t;received=Date.now();connected=true;update();if(t>=demo.duration){$('notice').textContent='動作測試已播完。這不是 AI 自主施工的成果。'}}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b89970';ctx.fillRect(0,0,W,H);if(assets.plate.complete&&assets.plate.naturalWidth)ctx.drawImage(assets.plate,0,0,W,H);
 ctx.save();ctx.translate(W/2+pan.x,H*.65+pan.y);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H*.65);
 // Work plane with surveyed foundation courses, not a prefinished tower.
 poly([point(11,-4),point(19,-4),point(19,3),point(11,3)],'#b9a27b99');
 for(let y=-3;y<=1;y++)for(let x=18;x>=13;x--)stone(x,y,-.30);
 // Visible haul lane and a branch, all at ground level in this slice.
 ctx.save();ctx.globalAlpha=.33;line(point(0,0),point(13,0),state?.wet?'#524b37':'#cdb58c',42);line(point(5,0),point(8,3),'#cdb58c',35);line(point(8,3),point(13,0),'#cdb58c',35);ctx.restore();
 let st=state?.stone||{progress:0,route:'direct',location:'quay'},m=st.motion,now=(state?.publishedAt||Date.now()/1000)+(Date.now()-received)/1000;
 // Extrapolate only a server-accepted motion while the connection is fresh.
 let u=m&&connected&&Date.now()-received<15000?clamp((now-m.started)/m.duration,0,1):0;
 let progress=m?.kind==='haul'&&connected&&Date.now()-received<15000?lerp(m.from,m.to,u):st.progress;
 const branch=st.branchProgress??.44;
 let x=progress*13,y=st.route==='detour'&&progress>branch?Math.sin((progress-branch)/(1-branch)*Math.PI)*3:0;
 const active=m?.kind,work=active&&['load','wet','repair','place'].includes(active),crew=state?.crew||0;
 if(st.location==='quay')x=0;
 let z=st.placed?.5:active==='place'?.5*u:0;
 // Timber runners, cross members and lashed load.
 if(st.location!=='quay'&&!st.placed||active==='load'){
  for(let off of [-.55,.55]){line(point(x-.9,y+off,.05),point(x+1,y+off,.05),'#59432a',9);line(point(x-.9,y+off,.07),point(x+1,y+off,.07),'#b7955c',3)}
  for(let off of [-.65,0,.65])line(point(x+off,y-.6,.12),point(x+off,y+.6,.12),'#85613a',6);
 }
 stone(st.placed?13:x,st.placed?0:y,z+.15);
 if(!st.placed){for(let dx of [-.3,.3]){line(point(x+dx,y-.56,.2),point(x+dx,y-.56,.97),'#765a32',2.4);line(point(x+dx,y-.56,.97),point(x+dx,y+.56,.97),'#bca178',2)}}
 if(state?.blocked){for(let i=0;i<4;i++)stone(8+i*.4,-.6+i*.25,-.18)}
 const walk=progress*13/.8;
 // Workers face travel direction, two rope teams. Worker count follows allocation.
 for(let i=0;i<crew;i++){
  let row=Math.floor(i/2),side=i%2?1:-1;
  let wx=x+1.8+row*.38,wy=y+side*(.85+row*.04);
  const hauling=active==='haul'&&connected;
  if(st.placed){wx=12+(i%6)*.38;wy=2+Math.floor(i/6)*.35}
  const p=point(x+.8,y+side*.5,.35);
  human(wx,wy,hauling?'haul':work?'work':'idle',(walk+row*.04)%1,st.location!=='quay'&&!st.placed?p:null);
 }
 human(11,-3,'idle',0,null);human(2,3,'idle',0,null);human(7,-2,'idle',0,null);
 if(pin){const q={x:pin.x*W,y:pin.y*H};ellipse(q,16,16,'#9d302dcc');ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('1',q.x,q.y+6)}
 ctx.restore();requestAnimationFrame(render);
}
function update(){if(!state)return;const stale=connected&&Date.now()-received>15000;
 $('status').textContent=demo?'動作測試・非 AI 自主施工':stale?'連線中斷':connected?(names[state.status]||'狀態未知'):'未連接即時工地';
 $('notice').textContent=demo?'固定輸入的搬運動作測試；不產生 AI 發言，也不算自主施工驗收。':connected?(state.error||'讀取 Mac 工地的實際狀態。只有取得模型回覆後才會顯示角色發言。'):'目前是待驗收畫面，AI 尚未連線。沒有 AI 對話，也不會假裝工人在自主施工。';
 $('scope').textContent=state.scope||'';$('updated').textContent=demo?'動作測試：'+Math.min(demo.duration,(Date.now()-demoStarted)/1000).toFixed(0)+' 秒':state.updatedAt?'紀錄時間：'+new Date(state.updatedAt*1000).toLocaleString('zh-TW'):'';
 $('crew').textContent=state.crew+' 人';$('force').textContent=state.physics.availableN+' / '+state.physics.requiredN+' N';$('calls').textContent=state.modelCalls+' 次';
 $('phase').textContent=state.stone.placed?'石材已安放':actions[state.stone.motion?.kind]||'等待下一個決定';$('progress').textContent=(state.stone.progress*100).toFixed(0)+'%';
 const events=(state.events||[]).filter(e=>!$('speech-only').checked||e.type==='speech').slice().reverse();
 const key=JSON.stringify(events);if(key!==lastEvents){lastEvents=key;$('events').replaceChildren();if(!events.length){const e=document.createElement('p');e.className='empty';e.textContent='還沒有實際 AI 發言。';$('events').append(e)}
 for(const e of events){const box=document.createElement('div');box.className='event '+e.type;const t=document.createElement('time');t.textContent=new Date(e.at*1000).toLocaleTimeString('zh-TW');const n=document.createElement('strong');n.textContent=e.type==='speech'?(state.roles[e.actor]||e.actor):e.type==='rejected'?'執行被拒絕':e.type==='test-condition'?'驗收條件':'工地紀錄';const p=document.createElement('p');p.textContent=e.text;box.append(t,n,p);if(e.cause||e.requestId){const s=document.createElement('small');s.textContent=e.requestId?'實際模型回覆 · '+e.requestId:'對應決定 #'+e.cause;box.append(s)}$('events').append(box)}}
}
async function poll(){if(demo){setTimeout(poll,3000);return}try{config=await(await fetch('config.json',{cache:'no-store'})).json();if(config.liveUrl){const r=await fetch(config.liveUrl+'/state',{cache:'no-store',signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('offline');const s=await r.json();if(s.schema!==1||!s.stone||!Array.isArray(s.events))throw Error('schema');state=s;received=Date.now();connected=true}else{connected=false;if(!state)state=await(await fetch(config.snapshot,{cache:'no-store'})).json()}}catch{connected=false}update();setTimeout(poll,config?.pollMs||3000)}
$('speech-only').onchange=()=>{lastEvents='';update()};$('zoomin').onclick=()=>zoom=clamp(zoom+.2,1,3);$('zoomout').onclick=()=>zoom=clamp(zoom-.2,1,3);$('reset').onclick=()=>{zoom=1;pan={x:0,y:0}};$('full').onclick=()=>canvas.parentElement.requestFullscreen?.();
$('mark').onclick=()=>{marking=true;$('review-status').textContent='請點施工畫面上的位置。'};
canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;if(marking){pin={x:((x-W/2-pan.x)/zoom+W/2)/W,y:((y-H*.65-pan.y)/zoom+H*.65)/H};marking=false;$('review-status').textContent='已標記位置。';return}drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(drag){const r=canvas.getBoundingClientRect();pan.x+=(e.clientX-drag.x)*W/r.width;pan.y+=(e.clientY-drag.y)*H/r.height;drag={x:e.clientX,y:e.clientY}}};canvas.onpointerup=()=>drag=null;
$('copy').onclick=async()=>{const text=JSON.stringify({scene:'古夫工地 K001',mode:demo?'animation-test':'live',testSeconds:demo?Math.min(demo.duration,(Date.now()-demoStarted)/1000):null,run:state?.run,sequence:state?.events?.at(-1)?.id,position:pin,feedback:$('feedback').value},null,2);try{await navigator.clipboard.writeText(text);$('review-status').textContent='已複製，貼回對話即可。'}catch{$('feedback').value=text;$('review-status').textContent='請選取上方文字複製。'}};
$('demo').onclick=async()=>{if(!demo)liveState=state;demo=await(await fetch('motion-test.json')).json();demoStarted=Date.now();lastEvents='';};
$('live').onclick=()=>{demo=null;state=liveState;connected=false;lastEvents='';update();};
render();poll();
