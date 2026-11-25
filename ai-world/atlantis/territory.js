(()=>{
 const panel=document.createElement('section');panel.className='territory-panel';const heading=document.createElement('h2');heading.textContent='生活圈與探索路線';const note=document.createElement('p');const map=document.createElementNS('http://www.w3.org/2000/svg','svg');map.classList.add('territory-map');map.setAttribute('viewBox','0 0 900 300');map.setAttribute('role','img');map.setAttribute('aria-label','海灣與內陸探索路線示意圖');const detail=document.createElement('p');panel.append(heading,note,map,detail);document.querySelector('.layout').after(panel);
 const coords={camp:[450,160],timber:[250,150],quarry:[650,150],cove:[100,255],strand:[450,255],point:[800,255],ridge:[220,90],creek:[680,90],highland:[100,30],meadow:[800,30]};
 const routes=[['timber','ridge','內陸林坡'],['quarry','creek','內陸溪谷'],['ridge','highland','高地石脊'],['creek','meadow','河畔草地']];
 function el(tag,attrs,text){const n=document.createElementNS(map.namespaceURI,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n;}
 function render(data){const s=data?.frames?.at(-1)?.snapshot||data?.initial;if(!s)return;map.replaceChildren();note.textContent='已開放 '+s.sites.length+' 個地點 · '+s.actors.length+' 位居民。虛線為待探索路線；此圖為位置示意，海灣實景保留原貌。';
 const known=new Map(s.sites.map(site=>[site.id,site]));
 for(const[from,to]of routes){if(!s.frontier&&['highland','meadow'].includes(to))continue;const a=coords[from],b=coords[to];map.append(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],'stroke-dasharray':known.has(to)?'none':'5 5'}));}
 const sites=[...s.sites,...routes.filter(([,id])=>!known.has(id)&&(s.frontier||!['highland','meadow'].includes(id))).map(([,id,label])=>({id,label}))];
 for(const site of sites){const pos=coords[site.id];if(!pos)continue;const[x,y]=pos,open=known.has(site.id),g=el('g',{});g.append(el('circle',{cx:x,cy:y,r:9,class:open?'':'unexplored'}));g.append(el('text',{x,y:y+26,'text-anchor':'middle',class:open?'':'unknown'},site.label+(open?'':' · 待探索')));const people=s.actors.filter(a=>a.at===site.id);g.append(el('title',{},site.label+(open?'：'+(people.map(a=>a.name).join('、')||'目前無居民'):'：須居民親自探索')));if(people.length)g.append(el('text',{x,y:y-15,'text-anchor':'middle'},people.map(a=>a.name).join('、')));map.append(g);}
 detail.textContent='居民可自行選擇探索、搬取材料及選址建設。新路線不代表已發現，也不會自動新增人口。';}
 window.addEventListener('atlantis-record',e=>render(e.detail));fetch('./settlement.json',{cache:'no-store'}).then(r=>r.json()).then(render).catch(()=>{note.textContent='生活圈紀錄暫時無法讀取。';});
})();
