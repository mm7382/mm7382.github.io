/* Local visual review only. No model calls and no simulated conversations. */
(async function(){
'use strict';
const $=id=>document.getElementById(id),R=window.Khufu25D,canvas=document.createElement('canvas');
canvas.width=R.W;canvas.height=R.H;$('world').append(canvas);
const ctx=canvas.getContext('2d'),view={mode:'overview',zoom:1,panX:0,panY:0};
let t=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,last=0,pin=null,mark=false,drag=null,transform=null;
const assets={};
try{await Promise.all(Object.entries({site:'site-25d.png',walk:'haul-frames.png',crew:'crew-atlas.png'}).map(async([key,file])=>{const im=new Image();im.src='assets/'+file;await im.decode();assets[key]=im;}));}catch(e){$('loading').innerHTML='<strong>素材載入失敗</strong><p>請重新整理頁面再試。</p>';return;}
$('loading').classList.add('hidden');
let renderStamp='';
function draw(){const live=window.KhufuLive;view.extrapolate=live?.online===true;view.live=live&&!live.demo?(live.state||{schema:2,status:'ready',placed:[],stone:{progress:0}}):null;const stamp=[t,playing,view.mode,view.zoom,view.panX,view.panY,pin?.x,pin?.y,view.live?JSON.stringify(view.live):'demo',view.live?Math.floor(performance.now()/50):0].join(':');if(stamp===renderStamp)return;renderStamp=stamp;const result=R.render(ctx,assets,view.live?(window.KhufuLive.online?performance.now()/1000:0):t,view,pin);transform=result.transform;$('phase').textContent=result.s.phase;$('timeline').value=t;$('clock').textContent=`00:${String(Math.floor(t)).padStart(2,'0')} / 00:32`;$('play').textContent=playing?'暫停':t>=R.DURATION?'重新播放':'播放動作';$('detail').textContent=view.live?(window.KhufuLive.online?'即時施工狀態 · 僅顯示真實模型回覆':'最後存檔 · 尚未接上即時施工'):t>=R.DURATION?'32 秒展示已結束 · 按「重新播放」再看動作':'2.5D 動作展示 · 尚未接上 AI';}
function frame(now){if(last&&playing&&(!window.KhufuLive||window.KhufuLive.demo)){t=Math.min(R.DURATION,t+Math.min((now-last)/1000,.1)*Number($('speed').value));if(t===R.DURATION)playing=false;}last=now;draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
document.addEventListener('khufu-mode',()=>{t=0;playing=true;document.querySelector('.playback').hidden=!window.KhufuLive.demo;});document.querySelector('.playback').hidden=!window.KhufuLive?.demo;
$('play').onclick=()=>{if(t===R.DURATION)t=0;playing=!playing;};
$('timeline').oninput=e=>{t=Number(e.target.value);playing=false;};
function reset(mode='overview'){Object.assign(view,{mode,zoom:1,panX:0,panY:0});document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===mode));$('camera-label').textContent={overview:'工地全景',follow:'近景 · 跟隨工班',walk:'自由移動 · 2.5D'}[mode];}
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>reset(b.dataset.camera));$('reset').onclick=()=>reset(view.mode);
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*R.W,y:(e.clientY-r.top)/r.height*R.H};}
canvas.onpointerdown=e=>{const p=point(e);if(mark){pin={x:((p.x-R.W/2-transform.panX)/transform.zoom+R.W/2)/R.W,y:((p.y-R.H*.56-transform.panY)/transform.zoom+R.H*.56)/R.H};mark=false;$('mark').classList.remove('active');$('feedback').focus();return;}drag={x:p.x,y:p.y};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const p=point(e);view.panX+=p.x-drag.x;view.panY+=p.y-drag.y;drag=p;};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=Math.max(.8,Math.min(2.6,view.zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
$('mark').onclick=()=>{mark=!mark;$('mark').classList.toggle('active',mark);$('hint').textContent=mark?'點選要修改的位置':'拖曳移動畫面 · 滾輪縮放 · 可暫停逐段檢查';};
$('reference').onclick=()=>$('reference-dialog').showModal();$('close-reference').onclick=()=>$('reference-dialog').close();
try{$('feedback').value=localStorage.getItem('khufu-review-feedback')||'';}catch{}
$('feedback').oninput=()=>{try{localStorage.setItem('khufu-review-feedback',$('feedback').value);}catch{}};
$('copy').onclick=async()=>{const text=`金字塔 2.5D 修改意見\n時間：${t.toFixed(1)} 秒；視角：${$('camera-label').textContent}\n標記：${pin?JSON.stringify(pin):'未標記'}\n${$('feedback').value}`;try{await navigator.clipboard.writeText(text);$('feedback-status').textContent='已複製，貼到這裡就能繼續修改。';}catch{$('feedback-status').textContent='無法存取剪貼簿，請直接複製文字欄的意見。';}};
$('capture').onclick=()=>{draw();const a=document.createElement('a');a.download='khufu-25d-review.png';a.href=canvas.toDataURL('image/png');a.click();};
let revision;setInterval(async()=>{try{const r=await fetch('/__revision',{cache:'no-store'});if(!r.ok)return;const data=await r.json();if(revision&&revision!==data.revision)location.reload();revision=data.revision;}catch{}},2500);
})();
