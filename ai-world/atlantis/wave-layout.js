(()=>{
 const hero=document.querySelector('.hero'),layout=document.querySelector('.layout');if(!hero||!layout)return;
 const stage=document.createElement('section');stage.className='wave-stage';stage.setAttribute('aria-label','雅特蘭提斯：浪潮與文明');hero.before(stage);stage.append(hero,layout);
 const title=document.createElement('div');title.className='poster-title';title.setAttribute('aria-hidden','true');title.innerHTML='<span>ATLAN</span><span>TIS</span>';hero.prepend(title);
 const edition=document.createElement('p');edition.className='poster-edition';edition.innerHTML='<span>02</span><b>浪潮與文明</b>';document.querySelector('.hero h1').after(edition);
 const wave=document.createElement('div');wave.className='woodcut-frieze';wave.setAttribute('aria-hidden','true');stage.append(wave);
 const recent=layout.querySelector('.recent-life');if(recent){stage.after(recent);recent.classList.add('wave-conversations');}
 const visitors=document.querySelector('.visitor-summary');if(visitors)stage.before(visitors);
 const link=document.createElement('a');link.className='observe-link';link.href='#scene';link.textContent='觀察世界　↗';hero.append(link);
 const scene=document.getElementById('scene');if(scene){scene.setAttribute('tabindex','-1');link.onclick=()=>scene.focus({preventScroll:true});}
})();
