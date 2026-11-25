(()=>{
 const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const section=make('section');section.className='visitor-comments';section.id='visitor-comments';section.setAttribute('aria-labelledby','comments-heading');
 const heading=make('h2','給雅特蘭提斯的建議');heading.id='comments-heading';
 const intro=make('p','你希望這個世界如何發展？歡迎留下觀察、建議或想改善的地方。Michael 會在這裡回覆。');
 const note=make('small','留言公開顯示，暱稱不代表已驗證身分。請勿填寫個人聯絡資料；垃圾訊息與不當留言將由管理員移除。');
 const status=make('p','正在連接留言板…');status.className='comments-status';status.setAttribute('role','status');
 const form=make('form');
 const field=(parent,title,tag,max)=>{const label=make('label',title),input=make(tag);input.required=true;input.maxLength=max;label.append(input);parent.append(label);return input;};
 const nickname=field(form,'你的暱稱','input',30);nickname.autocomplete='nickname';
 const body=field(form,'留言內容','textarea',2000);
 const trap=field(form,'網站（請留白）','input',200);trap.required=false;trap.tabIndex=-1;trap.autocomplete='off';trap.parentElement.className='comment-honey';trap.parentElement.setAttribute('aria-hidden','true');
 const send=make('button','送出留言');send.type='submit';send.disabled=true;form.append(send);
 const list=make('div');list.setAttribute('aria-label','訪客留言');
 const pages=make('div'),prev=make('button','上一頁'),next=make('button','下一頁');prev.type=next.type='button';pages.append(prev,next);pages.hidden=true;
 const admin=make('details');admin.className='comments-admin';admin.append(make('summary','管理員登入'));
 const login=make('form'),password=field(login,'管理密碼','input',256);password.type='password';password.autocomplete='current-password';
 const enter=make('button','登入'),logout=make('button','登出');enter.type='submit';logout.type='button';logout.hidden=true;login.append(enter);admin.append(login,logout);
 section.append(heading,intro,note,status,form,list,pages,admin);document.querySelector('main footer').before(section);
 let api='',token='',page=0,loading=false;
 async function request(path,method='GET',data){
  if(!api)throw Error('留言板尚未開放');
  const headers={};if(data)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(api+path,{method,headers,body:data?JSON.stringify(data):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
  const value=await response.json();if(!response.ok)throw Error(value.error||'連線失敗，請稍後再試');return value;
 }
 const message=error=>status.textContent=error.name==='TimeoutError'?'連線逾時，請稍後再試；尚未確認送出結果。':error.message;
 async function load(){
  if(loading)return;loading=true;prev.disabled=next.disabled=true;
  try{const data=await request('/comments?page='+page);list.replaceChildren();
   for(const comment of data.comments){const article=make('article');article.append(make('strong',comment.nickname),make('small',' · '+new Date(comment.created_at).toLocaleString('zh-TW')));const text=make('p',comment.body);text.className='comment-body';article.append(text);
    if(comment.reply){const reply=make('div');reply.className='owner-reply';reply.append(make('strong','Michael · 站長回覆'));const p=make('p',comment.reply);p.className='comment-body';reply.append(p);article.append(reply);}
    if(token){const edit=make('details');edit.append(make('summary',comment.reply?'編輯回覆':'回覆這則留言'));const replyForm=make('form'),replyText=field(replyForm,'站長回覆','textarea',2000);replyText.value=comment.reply||'';const save=make('button','儲存回覆');save.type='submit';replyForm.append(save);edit.append(replyForm);article.append(edit);
     replyForm.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await request('/comments/'+comment.id,'PUT',{reply:replyText.value});await load();status.textContent='回覆已儲存。';}catch(e){message(e);}finally{save.disabled=false;}};
     const remove=make('button','刪除留言');remove.type='button';remove.onclick=async()=>{if(!confirm('確定刪除這則留言及站長回覆？刪除後無法復原。'))return;remove.disabled=true;try{await request('/comments/'+comment.id,'DELETE');await load();status.textContent='留言已刪除。';}catch(e){message(e);remove.disabled=false;}};article.append(remove);
    }list.append(article);
   }if(!data.comments.length)list.append(make('p',page?'這一頁沒有留言。':'還沒有留言，歡迎分享第一個想法。'));pages.hidden=page===0&&!data.hasMore;prev.disabled=page===0;next.disabled=!data.hasMore;
  }catch(e){message(e);}finally{loading=false;}
 }
 prev.onclick=()=>{page=Math.max(0,page-1);load();};next.onclick=()=>{page++;load();};
 form.onsubmit=async e=>{e.preventDefault();send.disabled=true;status.textContent='正在送出…';try{await request('/comments','POST',{nickname:nickname.value,body:body.value,website:trap.value});body.value='';page=0;await load();status.textContent='留言已送出，謝謝你的建議。';}catch(e){message(e);}finally{send.disabled=false;}};
 login.onsubmit=async e=>{e.preventDefault();enter.disabled=true;token=password.value;try{await request('/admin');password.value='';login.hidden=true;logout.hidden=false;status.textContent='已登入，可以回覆或刪除留言。';await load();}catch(e){token='';message(e);}finally{enter.disabled=false;}};
 logout.onclick=()=>{token='';login.hidden=false;logout.hidden=true;status.textContent='已登出。';load();};
 fetch('./comments-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(async config=>{const url=new URL(config.apiBase);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error();api=url.href.replace(/\/$/,'');send.disabled=false;status.textContent='';await load();}).catch(()=>{status.textContent='留言板準備中，暫時尚未開放送出。';admin.hidden=true;});
})();
