(()=>{
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const layout=document.querySelector('.layout'),footer=document.querySelector('main footer');
 document.querySelector('.brand strong').textContent='AIWorldLab';document.querySelector('.brand small').textContent='觀察一個世界慢慢長大';
 const topActions=make('div',null,'top-world-actions');for(const id of ['run-state','fresh-world','stop-world']){const n=document.getElementById(id);if(n)topActions.append(n);}document.querySelector('.mast').append(topActions);
 const nav=make('div','雅特蘭提斯 · 海灣聚落','world-tab');document.querySelector('.mast').after(nav);
 const controls=make('details',null,'replay-controls'),summary=make('summary','回放與觀察工具');controls.append(summary);
 const actions=document.querySelector('.world-actions');controls.append(actions,document.querySelector('.transport'));layout.after(controls);
 document.querySelector('.worldbar').hidden=true;document.querySelector('.side').hidden=true;
 const panel=(title,cls)=>{const p=make('section',null,'card '+cls);p.append(make('h2',title));return p;};
 const recent=panel('生活與對話','recent-life');recent.querySelector('h2').append(make('small',' 最新在上'));const feed=make('div',null,'life-feed');recent.append(feed);layout.append(recent);
 const gallery=panel('人物與世界圖鑑','world-gallery');gallery.append(make('p','點圖片可放大查看；數量來自最新保存紀錄。'));const cards=make('div',null,'asset-gallery');gallery.append(cards);footer.before(gallery);
 const highlights=panel('生活重點','life-highlights'),points=make('ul');highlights.append(points);footer.before(highlights);
 const history=panel('歷史訊息','full-history');history.id='dialogue-history';const filters=make('details'),filterTitle=make('summary','篩選與搜尋');filters.append(filterTitle);const filterBox=make('div',null,'history-filters');filterBox.innerHTML='<label>階段 <select id="history-phase"><option value="all">全部</option><option value="harbor">港口</option><option value="settlement">聚落</option></select></label><label>人物 <select id="history-actor"><option value="all">全部人物</option><option value="harbor">涅里奧</option><option value="craft">伊莉亞</option><option value="merchant">馬洛</option></select></label><label>搜尋 <input id="history-search" type="search" placeholder="搜尋訊息"></label>';filters.append(filterBox);const status=make('p','讀取紀錄…'),list=make('div',null,'history-feed');history.append(filters,status,list);footer.before(history);
 const phase=filterBox.querySelector('#history-phase'),actor=filterBox.querySelector('#history-actor'),search=filterBox.querySelector('#history-search');
 const dialog=make('dialog',null,'atlas-dialog'),close=make('button','關閉'),detail=make('div');close.type='button';close.onclick=()=>dialog.close();dialog.append(close,detail);document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 function art(src,box){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',box);svg.setAttribute('role','img');svg.innerHTML='<image href="'+src+'" width="'+(src.includes('buildings')?'2172':'1254')+'" height="'+(src.includes('buildings')?'724':'1254')+'"/>';return svg;}
 function card(name,note,visual){const b=make('button',null,'asset-card');b.type='button';if(visual){visual.setAttribute('aria-label',name);b.append(visual);}else b.append(make('div',name,'stock-icon'));b.append(make('b',name),make('small',note));b.onclick=()=>{detail.replaceChildren(make('h2',name));if(visual)detail.append(visual.cloneNode(true));detail.append(make('p',note));dialog.showModal();};cards.append(b);}
 const records=new Map();let failures=[];
 function row({kind,f},target){const e=f.event,n=make('article',null,'life-row');n.append(make('time',`${kind==='settlement'?'聚落':'港口'} · 第 ${f.snapshot?.day??'—'} 天 · #${e.tick}`));if(e.say?.trim())n.append(make('p',(e.actorName||e.actorId)+'　'+e.say,'spoken'));n.append(make('p','旁白　'+(e.actorName||e.actorId)+'：'+(e.message||'未記載結果')+(e.ok===false?'（未完成）':''),'narration'));target.append(n);}
 function render(){const all=[];for(const [kind,data] of records)for(const [i,f] of data.frames.entries())if(f.event)all.push({kind,f,i});all.sort((a,b)=>(b.kind==='settlement')-(a.kind==='settlement')||b.i-a.i);
 feed.replaceChildren();all.slice(0,20).forEach(r=>row(r,feed));if(!all.length)feed.append(make('p','尚無保存紀錄。'));
 const matches=all.filter(({kind,f})=>(phase.value==='all'||phase.value===kind)&&(actor.value==='all'||actor.value===f.event.actorId)&&((f.event.say||'')+' '+(f.event.message||'')).includes(search.value.trim()));list.replaceChildren();matches.forEach(r=>row(r,list));status.textContent=`${matches.length} 則紀錄${failures.length?'；'+failures.join('、')+'讀取失敗，保留已讀內容':''}`;
 const data=records.get('settlement')||records.get('harbor'),s=data?.frames.at(-1)?.snapshot||data?.initial;if(!s)return;cards.replaceChildren();const crops={harbor:'0 0 627 627',craft:'627 0 627 627',merchant:'0 627 627 627'};for(const a of s.actors||[])card(a.name,(s.sites.find(x=>x.id===a.at)?.label||a.at)+' · '+a.role+(a.energy!==undefined?' · 精力 '+a.energy:'')+(s.autonomy?.goals[a.id]?' · 自主目標：'+s.autonomy.goals[a.id].title:''),art('./assets/actors-ship.png',crops[a.id]));
 const names={shelter:'住屋',well:'水井',garden:'菜園'};for(const [i,kind]of ['shelter','well','garden'].entries()){const bs=s.structures.filter(b=>b.kind===kind);card(names[kind],bs.filter(b=>b.complete).length+' 座完工 · '+bs.filter(b=>!b.complete).length+' 座施工中'+(bs.length&&bs[0].condition!==undefined?' · 耐久 '+bs[0].condition:''),art('./assets/buildings.png',`${i*724} 0 724 724`));}
 if(s.capabilities?.navigationMarker){const count=s.structures.filter(b=>b.kind==='navigation_marker'&&b.complete).length;const im=document.createElementNS('http://www.w3.org/2000/svg','svg');im.setAttribute('viewBox','0 0 64 82');im.innerHTML='<image href="./assets/navigation-marker-v1.png" width="64" height="82"/>';card('航行標誌',count+' 座完工 · 1木4石3工次',im);}
 if(s.ship)card('商船',s.ship.status==='unloaded'?'已卸貨':'港灣船隻',art('./assets/actors-ship.png','627 627 627 627'));
 function landscape(box){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',box);svg.setAttribute('role','img');
  svg.innerHTML='<image href="./assets/bay.png" width="1120" height="600" preserveAspectRatio="none"/>';
  return svg;
 }
 const stock=s.stocks.camp;
 card('營地補給',`食物 ${stock.food??0} 份 · 飲水 ${stock.water??0} 份`,art('./assets/buildings.png','1448 0 724 724'));
 card('營地材料',`木材 ${stock.wood} 份 · 石料 ${stock.stone} 份（圖為海灣地貌）`,landscape('520 20 360 260'));
 points.replaceChildren();
 if(s.trials?.channel==='untested')points.append(make('li','營地已製作井邊導水槽，等待居民實測。'));
 if(s.trials?.channel==='verified')points.append(make('li','導水槽已實測：一次操作可將2份井水送入共用庫存。'));
 const key=all.filter(({f})=>f.event.ok&&(['build','dock','unload','propose_building','explore','prototype','trial'].includes(f.event.action?.type)));for(const {kind,f}of key.slice(0,12))points.append(make('li',`${kind==='settlement'?'聚落':'港口'} 第 ${f.snapshot.day??'—'} 天　${f.event.actorName}　${f.event.message}`));if(!key.length)points.append(make('li','尚無建造、靠泊或卸貨重點紀錄。'));
 }
 for(const e of [phase,actor,search])e.addEventListener('input',render);
 async function refresh(){let changed=false;const errors=[];await Promise.all([['harbor','replay.json'],['settlement','settlement.json']].map(async([kind,path])=>{try{const r=await fetch('./'+path+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.frames))throw Error();if(JSON.stringify(records.get(kind))!==JSON.stringify(data)){records.set(kind,data);changed=true;}}catch{errors.push(kind==='harbor'?'港口':'聚落');}}));if(changed||JSON.stringify(errors)!==JSON.stringify(failures)){failures=errors;render();}}
 refresh();setInterval(refresh,15000);
})();
