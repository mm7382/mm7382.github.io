(()=>{
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const panel=make('section',null,'territory-panel'),heading=make('h2','已探索的生活圈'),note=make('p'),cards=make('div',null,'territory-cards'),next=make('details',null,'territory-next');panel.append(heading,note,cards,next);document.querySelector('.layout').after(panel);
 const routes=[['timber','ridge','內陸林坡','倒木'],['quarry','creek','內陸溪谷','天然積水'],['ridge','highland','高地石脊','石料'],['creek','meadow','河畔草地','野食']];
 const uses={camp:'居住、共用倉庫與聚落設施',timber:'可採集野食',quarry:'可採集山泉水',cove:'棧橋與商船停靠地',strand:'可勘查的海岸',point:'日間航行地標',ridge:'倒木材料',creek:'天然積水',highland:'石料',meadow:'野食'};
 function render(data){const s=data?.frames?.at(-1)?.snapshot||data?.initial;if(!s)return;cards.replaceChildren();next.replaceChildren();note.textContent=s.actors.length+' 位居民已探索 '+s.sites.length+' 個地點。';const known=new Map(s.sites.map(x=>[x.id,x]));
 for(const site of s.sites){
  const card=make('article',null,'territory-place');
  const thumbnail=make('div',null,'territory-thumbnail');
  thumbnail.setAttribute('aria-hidden','true');
  // Crop the same bay image used by the map around this saved location.
  const crop=(coordinate,visible)=>Number.isFinite(coordinate)
   ? Math.round(Math.max(0,Math.min(1,(coordinate-visible/2)/(1-visible)))*100)
   : 50;
  const visibleHeight=.25;
  const visibleWidth=visibleHeight*941/1672;
  thumbnail.setAttribute('style',`--site-x:${crop(site.x,visibleWidth)}%;--site-y:${crop(site.y,visibleHeight)}%`);

  const description=make('div',null,'territory-place-copy');
  description.append(make('h3',site.label),make('p',uses[site.id]||'已勘明的地點','territory-use'));
  const stock=s.stocks?.[site.id]||{};
  const items=Object.entries({wood:'木材',stone:'石料',food:'食物',water:'飲水'})
   .filter(([key])=>stock[key]>0).map(([key,label])=>label+' '+stock[key]);
  const people=s.actors.filter(a=>a.at===site.id).map(a=>a.name);
  const metadata=make('div',null,'territory-meta');
  metadata.append(make('span','存放：'+(items.join(' · ')||'無庫存')),make('span','居民：'+(people.join('、')||'無')));
  description.append(metadata);
  card.append(thumbnail,description);
  cards.append(card);
 }
 const pending=routes.filter(([,id])=>!known.has(id)&&(s.frontier||!['highland','meadow'].includes(id)));next.hidden=pending.length===0;next.append(make('summary','尚未探索的方向（'+pending.length+'）'));for(const[from,,label,resource]of pending)next.append(make('p',label+'：'+(known.has(from)?'可從'+known.get(from).label+'出發探索':'須先探索前一段路線')+'，可能取得'+resource+'。'));next.append(make('p','這些路線已有探索規則，須由居民實際出發才會開放。上方海灣畫面目前仍是固定場景，尚未擴成完整內陸地景。'));}
 window.addEventListener('atlantis-record',e=>render(e.detail));fetch('./settlement.json',{cache:'no-store'}).then(r=>r.json()).then(render).catch(()=>note.textContent='地點紀錄暫時無法讀取。');
})();
