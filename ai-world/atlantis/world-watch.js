// World execution is independent of the spectator's playback controls.
(()=>{
 const panel=document.createElement('div');panel.className='world-run';
 panel.innerHTML='<span id="run-state">讀取世界狀態…</span> <button id="fresh-world" type="button" hidden>查看新進展</button> <button id="stop-world" type="button" hidden>暫停世界</button>';
 document.querySelector('.hero').append(panel);
 const clockLabel=document.createElement('div');clockLabel.className='live-world-clock';
 clockLabel.innerHTML='<strong id="world-clock-time">讀取世界時間…</strong><span id="real-clock-time"></span><span>現實 1 分鐘＝世界 1 天</span><small id="ai-reply-count">實際 AI 回覆：—</small><span id="clock-status-note"></span>';panel.append(clockLabel);
 const worldTime=clockLabel.querySelector('#world-clock-time'),realTime=clockLabel.querySelector('#real-clock-time'),replyCount=clockLabel.querySelector('#ai-reply-count'),clockNote=clockLabel.querySelector('#clock-status-note');
 let clockState=null,runStatus=null,lastSavedAt=null,frozenAt=null,replies=0,actions=0;
 const pad=n=>String(n).padStart(2,'0');
 function updateClock(){
  const now=Date.now();realTime.textContent='現實時間：'+new Date(now).toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
  if(!clockState?.clock)return;
  const recent=runStatus&&now-Date.parse(runStatus.updatedAt)<(location.hostname==='127.0.0.1'?20000:600000);
  const live=recent&&runStatus.running&&!['stopped','stopping','needs-attention','retrying','checking'].includes(runStatus.phase);
  if(live)frozenAt=null;else if(frozenAt===null)frozenAt=Date.parse(runStatus?.updatedAt||lastSavedAt||clockState.clock.epoch);
  const value=live?AtlantisClock.reading(clockState.clock,now):{day:clockState.day,hour:0,minute:0};
  worldTime.textContent=AtlantisClock.elapsedLabel(value)+(live?'':'（已保存）');
  replyCount.textContent='AI 回覆 '+replies+' · 按計畫執行 '+(actions-replies);replyCount.title='聚落階段已保存且通過驗證的 AI 回覆數，不含尚未完成的請求。';
  clockNote.textContent=live?'':runStatus?.phase==='stopped'?'世界已停止':runStatus?.phase==='stopping'?'正在停止':'時間暫停更新，等待確認運行狀態';
  worldTime.title='模擬曆：每月30天、每年12個月，第1天為經過0天；目前已結算至第 '+clockState.day+' 天。';
 }
 updateClock();setInterval(updateClock,250);
 const label=panel.querySelector('#run-state'),fresh=panel.querySelector('#fresh-world'),stop=panel.querySelector('#stop-world');
 const local=location.hostname==='127.0.0.1';let known=null;
 fresh.onclick=()=>location.reload();
 stop.onclick=async()=>{stop.disabled=true;try{const r=await fetch('http://127.0.0.1:8779/stop',{method:'POST',headers:{'X-Atlantis-Control':'stop'}});if(!r.ok)throw Error();label.textContent='正在保存本批決策並停止世界…';}catch{label.textContent='停止指令未送達，請在對話告訴我停止。';stop.disabled=false;}};
 async function poll(){
 try{
  const r=await fetch('./world-status.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();runStatus=s;updateClock();
  const stale=Date.now()-Date.parse(s.updatedAt)>(local?20000:600000);
  const names={checking:'正在確認訂閱連線',retrying:'連線暫時受阻，系統會自動重試',starting:'世界正在啟動',deciding:'居民正在行動或規劃',publishing:'正在同步新紀錄',waiting:'世界運行中，等待下一批行動',stopping:'正在安全停止',stopped:'世界已停止','needs-attention':'AI 連線或額度受阻，現場已保存'};
  label.textContent=stale?'背景程序尚無近期回報，顯示最後存檔':(names[s.phase]||s.phase);
  if(!stale&&s.phase==='retrying'){const reason=(s.error||'').replace('ATLANTIS_PREFLIGHT_BLOCKED: ','');label.textContent=reason.startsWith('ATLANTIS_MODEL_TIMEOUT:')?'Codex 回覆逾時，稍後自動續跑':reason.includes('執行環境拒絕')?'執行環境拒絕啟動 Codex，居民暫停中':reason.includes('initialize')||reason.includes('資料庫')?'Codex 尚未完成啟動，稍後自動重試':'訂閱連線尚未就緒，稍後自動重試';}
  stop.hidden=!local||!s.running;panel.title=s.policy||'';
 }catch{runStatus=null;if(frozenAt===null)frozenAt=Date.now();updateClock();label.textContent='目前無法確認世界運行狀態';}
 try{const data=await fetch('./settlement.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());clockState=data.frames.at(-1)?.snapshot||data.initial;lastSavedAt=data.frames.at(-1)?.observedAt;actions=data.frames.length;replies=data.aiReplies??actions;updateClock();if(known===null||data.frames.length>known){window.dispatchEvent(new CustomEvent('atlantis-record',{detail:data}));known=data.frames.length;}}catch{}
 }
 poll();setInterval(poll,15000);
})();
