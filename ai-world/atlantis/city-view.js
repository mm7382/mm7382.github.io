(()=>{
 const layout=document.querySelector('.layout');
 if(!layout)return;
 const projects={
  waterworks:['公共水道','穩定儲水'],
  granary:['公共糧站','儲備糧食'],
  workshop:['工坊','發展產業'],
  market:['市場與鋪石街','需要工坊'],
  power_grid:['發電站與電網','需要工坊與水道'],
  urban_district:['現代城市街區','需要市場、電網與糧站']
 };
 const section=document.createElement('section');
 section.className='city-projects territory-panel';
 const title=document.createElement('h2');
 title.textContent='港城建設進度';
 const note=document.createElement('p');
 const list=document.createElement('ul');
 section.append(title,note,list);
 layout.after(section);

 function render(record){
  const state=record?.frames?.at(-1)?.snapshot??record?.initial;
  if(!state)return;
  const active=!!state.civilization;
  note.textContent=active
   ? '依居民的實際施工更新。已收到一次建材與食水補給。'
   : '下次續跑時開放，以下為可規劃的工程。';
  list.replaceChildren();
  for(const [kind,[name,description]] of Object.entries(projects)){
   const built=state.structures.find(b=>b.kind===kind);
   const item=document.createElement('li');
   const label=document.createElement('strong');
   label.textContent=name;
   const status=document.createElement('span');
   status.textContent=built?.complete?'已完工':built?'施工 '+built.progress+'/'+built.required:'尚未施工';
   status.dataset.complete=String(!!built?.complete);
   const detail=document.createElement('small');
   detail.textContent=description;
   item.append(label,status,detail);
   list.append(item);
  }
 }
 window.addEventListener('atlantis-record',event=>render(event.detail),{once:false});
 fetch('./settlement.json',{cache:'no-store'}).then(r=>r.json()).then(render)
  .catch(()=>{note.textContent='建設紀錄暫時無法讀取。';});
})();
