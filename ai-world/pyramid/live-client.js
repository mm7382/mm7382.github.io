/* Same read-only state feeds local review and the public website. */
(function(){
'use strict';
const live=window.KhufuLive={state:null,online:false,source:'loading',error:'',demo:new URLSearchParams(location.search).get('mode')==='demo'};
const statuses={ready:'等待 AI 設計',thinking:'AI 正在討論',running:'施工中',blocked:'AI 連線受阻 · 施工暫停',paused:'已暫停 · 保留現場',complete:'施工完成 · 查看驗收'};
const empty=document.querySelector('.empty');empty.innerHTML='<h3 id="connection-status">讀取工地狀態…</h3><p id="connection-detail"></p><span class="badge" id="model-count">實際 AI 回覆：0</span><p id="build-progress"></p><div id="live-log" aria-live="polite"></div>';
const modeButton=document.createElement('button');modeButton.id='mode-toggle';modeButton.textContent=live.demo?'返回即時工地':'查看動作預覽';document.querySelector('.camera-controls').append(modeButton);
modeButton.onclick=()=>{live.demo=!live.demo;modeButton.textContent=live.demo?'返回即時工地':'查看動作預覽';document.dispatchEvent(new Event('khufu-mode'));};
const bubble=document.createElement('div');bubble.id='speech-bubble';bubble.hidden=true;document.getElementById('viewport').append(bubble);
const el=id=>document.getElementById(id);let lastLogKey='';
function update(){
 const s=live.state;el('connection-status').textContent=s?(live.online?statuses[s.status]||s.status:'離線 · 顯示最後存檔'):'尚未連到工地';
 el('connection-detail').textContent=s?(s.error||(live.online?'與 Mac 上的施工狀態同步。':'目前未收到即時狀態，不會自行推進施工。')):'沒有可用資料；畫面不代表已開工。';
 el('model-count').textContent='實際 AI 回覆：'+(s?.modelCalls||0);
 el('build-progress').textContent=s?.plan?`AI 選定 ${s.plan.base} × ${s.plan.base} 底座、${s.plan.layers} 層；已安放 ${s.placed.length} / ${s.totalBlocks} 塊。`:'設計尚未定案 · 已安放 0 塊';
 const key=s?`${s.run}:${s.events?.at(-1)?.id}`:'';
 if(key!==lastLogKey){lastLogKey=key;el('live-log').replaceChildren();for(const e of [...(s?.events||[])].reverse().slice(0,45)){const row=document.createElement('article'),label=document.createElement('strong'),text=document.createElement('p');label.textContent=e.type==='speech'?s.roles[e.actor]||e.actor:'施工紀錄';text.textContent=e.text;row.append(label,text);if(e.type==='speech'){row.dataset.source='model-output';row.title='模型回覆編號：'+e.requestId;}el('live-log').append(row);}}
 const speech=[...(s?.events||[])].reverse().find(e=>e.type==='speech'&&e.source==='model-output');
 bubble.hidden=!speech||live.demo;if(speech)bubble.textContent=(s.roles[speech.actor]||speech.actor)+'：'+speech.text;
}
async function json(url){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('HTTP '+r.status);const v=await r.json();return v;}
function valid(s){return s?.schema===2&&Array.isArray(s.events)&&Array.isArray(s.placed)&&Number.isInteger(s.modelCalls);}
(async()=>{let config;try{config=await json('live-config.json');}catch{config={snapshot:'state.json'};}
 async function poll(){try{
  if(!config.liveUrl)throw Error('No live endpoint');
  const u=new URL(config.liveUrl);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))throw Error('Invalid endpoint');
  const s=await json(config.liveUrl.replace(/\/$/,'')+'/state');if(!valid(s)||Date.now()/1000-s.publishedAt>20)throw Error('Stale state');live.state=s;live.online=true;live.source='live';
 }catch(e){live.online=false;live.source='snapshot';if(!live.state)try{const s=await json(config.snapshot||'state.json');if(valid(s))live.state=s;}catch{}}
 update();setTimeout(poll,3000);
 }poll();})();
document.addEventListener('khufu-mode',update);
})();
