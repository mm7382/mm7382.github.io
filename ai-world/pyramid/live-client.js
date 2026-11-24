/* Same read-only state feeds local review and the public website. */
(function(){
'use strict';
const live=window.KhufuLive={state:null,online:false,source:'loading',error:'',demo:new URLSearchParams(location.search).get('mode')==='demo'};
const statuses={ready:'等待 AI 設計',thinking:'AI 正在討論',running:'施工中',blocked:'AI 連線受阻 · 施工暫停',paused:'已暫停 · 保留現場',complete:'施工完成 · 查看驗收'};
const modeButton=document.createElement('button');modeButton.id='mode-toggle';modeButton.textContent=live.demo?'返回即時工地':'查看動作預覽';document.querySelector('.camera-controls').append(modeButton);
modeButton.onclick=()=>{live.demo=!live.demo;modeButton.textContent=live.demo?'返回即時工地':'查看動作預覽';document.dispatchEvent(new Event('khufu-mode'));};
const bubble=document.createElement('div');bubble.id='speech-bubble';bubble.hidden=true;document.getElementById('scene-window').append(bubble);
const el=id=>document.getElementById(id);let lastLogKey='';
function update(){
 const s=live.state;el('connection-indicator').dataset.state=live.online?'online':'offline';el('connection-label').textContent=live.online?'連線正常':'保存紀錄';el('connection-status').textContent=s?(live.online?statuses[s.status]||s.status:'保存狀態：'+(statuses[s.status]||s.status)):'尚未連到工地';
 el('connection-detail').textContent=s?(s.error||(live.online?'與 Mac 上的施工狀態同步。':'網站定時更新保存紀錄；本機施工獨立運行。')):'沒有可用資料；畫面不代表已開工。';
 el('model-count').textContent='實際 AI 回覆：'+(s?.modelCalls||0);
 el('build-progress').textContent=s?.plan?`AI 選定 ${s.plan.base} × ${s.plan.base} 底座、${s.plan.layers} 層；已安放 ${s.placed.length} / ${s.totalBlocks} 塊。`:'設計尚未定案 · 已安放 0 塊';
 const buildingList=el('building-list');buildingList.replaceChildren();
 if(!s?.buildings?.length){const note=document.createElement('p');note.textContent='尚未收到 AI 的建築提案。';buildingList.append(note);}
 for(const b of s?.buildings||[]){const card=document.createElement('article'),name=document.createElement('strong'),purpose=document.createElement('p'),status=document.createElement('p');name.textContent=b.name;purpose.textContent=b.purpose;status.textContent=['提案／等待整地','整地完成','基礎完成','主體完成','本版工序完成'][b.stage]||'等待中';card.append(name,purpose,status);const art=[...(s.artRequests||[])].reverse().find(r=>r.buildingId===b.id);const note=document.createElement('p');note.textContent=art?.status==='ready'?'外觀素材已生成（不代表建築完工）':'圖片需求等待處理';card.append(note);if(art?.status==='ready'&&/^assets\/generated\/art[0-9]+\.png$/.test(art.asset)){const img=document.createElement('img');img.src=art.asset;img.alt=b.name+'外觀素材';img.loading='lazy';card.append(img);}buildingList.append(card);}
 const key=s?`${s.run}:${s.events?.at(-1)?.id}`:'';
 if(key!==lastLogKey){lastLogKey=key;el('live-log').replaceChildren();for(const e of [...(s?.events||[])].reverse().slice(0,45)){const row=document.createElement('article'),label=document.createElement('strong'),text=document.createElement('p'),time=document.createElement('time');time.textContent=new Date(e.at*1000).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});label.textContent=e.type==='speech'?s.roles[e.actor]||e.actor:'施工紀錄';text.textContent=e.text;row.append(time,label,text);if(e.type==='speech'){row.dataset.source='model-output';row.title='模型回覆編號：'+e.requestId;}el('live-log').append(row);}}
 const speech=[...(s?.events||[])].reverse().find(e=>e.type==='speech'&&e.source==='model-output');
 bubble.hidden=!speech||live.demo;if(speech)bubble.textContent=(s.roles[speech.actor]||speech.actor)+'：'+speech.text;
}
function updateClock(){
 const s=live.state,c=s?.worldTime,node=el('world-clock');if(!node)return;el('real-clock').textContent='現實時間：'+new Date().toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
 if(!c){node.textContent='世界時間待啟動';return;}
 const elapsed=c.elapsedRealSeconds+(live.online&&c.running?Math.max(0,Date.now()/1000-s.publishedAt):0),minutes=Math.floor(elapsed*24),day=1+Math.floor(minutes/1440),hour=Math.floor(minutes/60)%24,minute=minutes%60;
 node.textContent=`第 ${day} 天 ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}${!live.online||!c.running?' · 時間暫停':''}`;
}
setInterval(updateClock,250);
async function json(url){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('HTTP '+r.status);const v=await r.json();return v;}
function valid(s){return s?.schema===2&&Array.isArray(s.events)&&Array.isArray(s.placed)&&Number.isInteger(s.modelCalls);}
(async()=>{let config;try{config=await json('live-config.json');}catch{config={snapshot:'state.json'};}
 async function poll(){try{
  if(!config.liveUrl)throw Error('No live endpoint');
  const u=new URL(config.liveUrl);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))throw Error('Invalid endpoint');
  const s=await json(config.liveUrl.replace(/\/$/,'')+'/state');if(!valid(s)||Date.now()/1000-s.publishedAt>20)throw Error('Stale state');live.state=s;live.online=true;live.source='live';
 }catch(e){live.online=false;live.source='snapshot';try{const s=await json(config.snapshot||'state.json');if(valid(s)&&(!live.state||s.run!==live.state.run||s.publishedAt>=live.state.publishedAt))live.state=s;}catch{}}
 update();setTimeout(poll,config.liveUrl?3000:15000);
 }poll();})();
document.addEventListener('khufu-mode',update);
})();
