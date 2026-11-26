(()=>{
 const hero=document.querySelector('.hero'),layout=document.querySelector('.layout');
 if(!hero||!layout)return;
 const choices={
  golden:'海神的黃金卷軸',
  wave:'浪潮與文明',
  dream:'失落之城的夢'
 };
 const stage=document.createElement('section');
 stage.className='wave-stage';
 hero.before(stage);
 stage.append(hero,layout);

 const title=document.createElement('div');
 title.className='poster-title';
 title.setAttribute('aria-hidden','true');
 title.innerHTML='<span>ATLAN</span><span>TIS</span>';
 hero.prepend(title);

 const edition=document.createElement('p');
 edition.className='poster-edition';
 const editionName=document.createElement('b');
 edition.append(editionName);
 hero.querySelector('h1').after(edition);

 const wave=document.createElement('div');
 wave.className='woodcut-frieze';
 wave.setAttribute('aria-hidden','true');
 stage.append(wave);

 const recent=layout.querySelector('.recent-life');
 if(recent){
  stage.after(recent);
  recent.classList.add('wave-conversations');
 }
 const visitors=document.querySelector('.visitor-summary');
 if(visitors)stage.before(visitors);

 const link=document.createElement('a');
 link.className='observe-link';
 link.href='#scene';
 link.textContent='觀察世界　↗';
 hero.append(link);
 const scene=document.getElementById('scene');
 if(scene){
  scene.setAttribute('tabindex','-1');
  link.onclick=()=>scene.focus({preventScroll:true});
 }

 const navigation=document.createElement('nav');
 navigation.className='design-picker';
 navigation.setAttribute('aria-label','切換世界設計');
 stage.before(navigation);

 function renderDesign(){
  const requested=new URLSearchParams(location.search).get('design');
  const current=Object.hasOwn(choices,requested)?requested:'golden';
  document.documentElement.dataset.design=current;
  stage.setAttribute('aria-label','雅特蘭提斯・'+choices[current]);
  editionName.textContent=choices[current];
  for(const item of navigation.querySelectorAll('a')){
   if(item.dataset.design===current)item.setAttribute('aria-current','true');
   else item.removeAttribute('aria-current');
  }
  window.dispatchEvent(new Event('resize'));
 }

 for(const [id,name] of Object.entries(choices)){
  const item=document.createElement('a');
  const target=new URL(location.href);
  target.searchParams.set('design',id);
  item.href=target.href;
  item.dataset.design=id;
  item.textContent=name;
  item.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   const url=new URL(location.href);
   url.searchParams.set('design',id);
   history.pushState(null,'',url);
   renderDesign();
  });
  navigation.append(item);
 }
 window.addEventListener('popstate',renderDesign);
 renderDesign();
})();
