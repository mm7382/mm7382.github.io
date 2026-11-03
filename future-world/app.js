const $=id=>document.getElementById(id),video=$('motion');let destination=null,entered=false,playing=false,movementPlayed=false,token=0;
const ready=new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',reject,{once:true});if(video.readyState>=2)resolve();});
$('start-forward').disabled=true;ready.then(()=>{$('start-forward').disabled=false;$('status').textContent='空橋已在眼前，隨時可以啟程。';}).catch(()=>{$('status').textContent='影片載入失敗，請重新整理';});
const stopImage=$('stop-frame');
const hideReading=()=>{$('invitation').hidden=true;$('show-invitation').hidden=playing||!entered;};
$('hide-invitation').onclick=hideReading;$('show-invitation').onclick=()=>{if(!entered||playing)return;$('invitation').hidden=false;$('show-invitation').hidden=true;};
function resetStart(){$('stop-frame').hidden=true;document.body.classList.remove('moving');token++;video.pause();video.currentTime=0;playing=entered=movementPlayed=false;$('entry').hidden=true;$('invitation').hidden=true;$('show-invitation').hidden=true;$('hotspots').hidden=true;$('stopbar').hidden=true;$('start-forward').hidden=false;readingIndex=0;renderReading();$('status').textContent='空橋已在眼前，隨時可以啟程。';}
async function enter(){if(playing)return;const mine=++token;playing=true;entered=false;$('stop-frame').hidden=true;document.body.classList.add('moving');readingIndex=0;renderReading();hideReading();$('hotspots').hidden=true;$('stopbar').hidden=true;$('start-forward').hidden=true;video.currentTime=0;$('status').textContent='沿空橋前進…';video.onended=()=>{if(mine!==token||!video.ended)return;playing=false;entered=true;document.body.classList.remove('moving');movementPlayed=true;if(stopImage.complete&&stopImage.naturalWidth)stopImage.hidden=false;else stopImage.decode().then(()=>{if(entered&&!playing)stopImage.hidden=false;}).catch(()=>{});$('invitation').hidden=false;$('show-invitation').hidden=true;$('hotspots').hidden=false;$('stopbar').hidden=false;$('status').textContent='已停下 · 依你的步調閱讀';};try{await video.play();}catch(e){document.body.classList.remove('moving');playing=false;$('start-forward').hidden=false;hideReading();$('status').textContent='播放未啟動，請再點一次前進。';}}
video.addEventListener('playing',()=>{$('invitation').hidden=true;$('show-invitation').hidden=true;});
$('start-forward').onclick=enter;$('enter').onclick=enter;$('continue').hidden=true;
$('home').onclick=e=>{e.preventDefault();resetStart();};
for(const id of ['device','device-alt'])$(id).onclick=()=>{$('device-dialog').showModal();};
for(const id of ['route','route-alt'])$(id).onclick=()=>{$('route-dialog').showModal();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('[name=destination]').forEach(r=>r.onchange=()=>{$('selection').textContent=`已選擇「${r.value}」；目的地尚未開放。`;$('confirm').disabled=false;});
$('confirm').onclick=()=>$('route-dialog').close();
window.__stopPoint={snapshot:()=>({entered,destination,movementPlayed,playing,scene:'first-scene-coated',viewpoint:'Michael',availableViewpoints:['Michael'],lucyStatus:'coming-soon',frameCount:48,renderResolution:[2560,1440],stopImageVisible:!stopImage.hidden,openDialog:document.querySelector('dialog[open]')?.id||null,videoTime:video.currentTime,ready:video.readyState>=2})};

const readingPages=["那份感覺裡，大部分是平靜。\nMichael 仍站在空橋上，望著眼前的城市。\n她的思念很輕，輕得容得下這片風景。", "有一點思念，有一點需要他。\n想聊聊天，也想讓他在身邊。\n那些心意輕輕相依，沒有一句話，卻已經很近。", "她沒有催他。\n他可以再看一會兒，讓眼前的城市慢慢映入心裡。\n那份想念安靜地陪著他，沒有拉住他的腳步。", "她的位置、影像、平靜與思念，\n連同想見他的心意，同時清晰起來。\n還不必整理成語句，他就已經懂了。"];let readingIndex=0;
function renderReading(){$('reading-text').textContent=readingPages[readingIndex];$('reading-count').textContent=`${readingIndex+1} / 4 · 依你的步調閱讀`;$('reading-prev').disabled=readingIndex===0;$('reading-next').disabled=readingIndex===3;}
$('reading-prev').onclick=()=>{if(entered&&!playing&&readingIndex>0){readingIndex--;renderReading();}};
$('reading-next').onclick=()=>{if(entered&&!playing&&readingIndex<3){readingIndex++;renderReading();}};
$('reading-forward').onclick=enter;

$('open-viewpoint').onclick=()=>{if(playing)return;$('viewpoint-dialog').showModal();};
$('choose-michael').onclick=()=>{$('viewpoint-dialog').close();};
