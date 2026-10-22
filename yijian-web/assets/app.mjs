const search=document.querySelector('#hex-search');
if(search)search.addEventListener('input',()=>{let count=0;for(const item of document.querySelectorAll('[data-search]')){item.hidden=!item.dataset.search.includes(search.value.trim());if(!item.hidden)count++;}document.querySelector('#search-status').textContent=`找到 ${count} 卦`;});
