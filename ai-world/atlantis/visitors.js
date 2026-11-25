(()=>{
 const box=document.createElement('section');box.className='visitor-summary';box.setAttribute('aria-label','公開網站流量');
 const title=document.createElement('b');title.textContent='個人網站 · 近 7 天';const counts=document.createElement('span');counts.textContent='讀取統計中…';const note=document.createElement('small');note.textContent='匿名裝置估計訪客數，非目前在線人數；本機預覽不計入。';box.append(title,counts,note);document.querySelector('.hero').after(box);
 const key='mal.analyticsExcluded.v1';
 if(location.hostname==='mm7382.github.io'){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';try{input.checked=localStorage.getItem(key)==='true';}catch{}input.onchange=()=>{try{localStorage.setItem(key,String(input.checked));}catch{}};label.append(input,document.createTextNode('排除這台裝置之後的瀏覽'));box.append(label);}
 async function refresh(){try{const r=await fetch('./visitor-stats.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(!d.available||!Number.isInteger(d.visitors)||!Number.isInteger(d.views))throw Error();counts.textContent=d.visitors.toLocaleString()+' 位訪客 · '+d.views.toLocaleString()+' 次瀏覽';note.textContent='全站匿名裝置估計，非在線人數；本機不計入。統計更新：'+new Date(d.fetchedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+(Date.now()-Date.parse(d.fetchedAt)>900000?'（同步延遲）':'');}catch{counts.textContent='統計暫時無法取得';note.textContent='不以 0 代替未知數據；本機預覽不計入。';}}
 refresh();setInterval(refresh,60000);
})();
