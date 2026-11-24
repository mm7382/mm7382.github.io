// World execution is independent of the spectator's playback controls.
(()=>{
 const panel=document.createElement('div');panel.className='world-run';
 panel.innerHTML='<span id="run-state">讀取世界狀態…</span> <button id="fresh-world" type="button" hidden>查看新進展</button> <button id="stop-world" type="button" hidden>停止世界運行</button>';
 document.querySelector('.world').before(panel);
 const label=panel.querySelector('#run-state'),fresh=panel.querySelector('#fresh-world'),stop=panel.querySelector('#stop-world');
 const local=location.hostname==='127.0.0.1';let known=null;
 fresh.onclick=()=>location.reload();
 stop.onclick=async()=>{stop.disabled=true;try{const r=await fetch('http://127.0.0.1:8779/stop',{method:'POST',headers:{'X-Atlantis-Control':'stop'}});if(!r.ok)throw Error();label.textContent='正在保存目前決策並停止世界…';}catch{label.textContent='停止指令未送達，請在對話告訴我停止。';stop.disabled=false;}};
 async function poll(){
 try{
  const r=await fetch(local?'http://127.0.0.1:8779/status':'./world-status.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();
  const stale=Date.now()-Date.parse(s.updatedAt)>10*60*1000;
  const names={starting:'世界正在啟動',deciding:'AI 正在決策',publishing:'正在同步新紀錄',waiting:'世界運行中，等待下一批決策',stopping:'正在安全停止',stopped:'世界已停止','needs-attention':'AI 連線或額度受阻，現場已保存'};
  label.textContent=stale?'尚未收到近期運行狀態':(names[s.phase]||s.phase);
  stop.hidden=!local||!s.running;panel.title=s.policy||'';
 }catch{label.textContent='目前無法確認世界運行狀態';}
 try{const data=await fetch('./settlement.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());if(known===null)known=data.frames.length;else if(data.frames.length>known){window.dispatchEvent(new CustomEvent('atlantis-record',{detail:data}));known=data.frames.length;fresh.hidden=false;fresh.textContent='查看新進展（'+data.frames.length+' 個動作）';}}catch{}
 }
 poll();setInterval(poll,15000);
})();
