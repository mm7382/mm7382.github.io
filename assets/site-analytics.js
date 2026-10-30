/* Anonymous site-wide counts. No form values, search queries, or full referrer URLs. */
(()=>{'use strict';
 if(window.__malSiteAnalytics)return;window.__malSiteAnalytics=true;
 const endpoint='https://pec-training-events.cl3kx7.workers.dev';
 const excludedKey='mal.analyticsExcluded.v1',visitorKey='mal.siteVisitor.v2',sessionKey='mal.siteSession.v2';
 const lifetime=90*86400000,idle=30*60000;let sent=false,visitor,session;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const excluded=()=>{try{return localStorage.getItem(excludedKey)==='true'}catch{return true}};
 const blocked=()=>excluded()||window.location.hostname!=='mm7382.github.io'||/bot|crawler|spider|headlesschrome|lighthouse/i.test(navigator.userAgent);
 if(blocked())return;
 const now=Date.now();visitor=read(visitorKey);if(!visitor?.id||visitor.expiresAt<now){visitor={id:crypto.randomUUID(),expiresAt:now+lifetime};write(visitorKey,visitor)}
 session=read(sessionKey);if(!session?.id||now-session.lastSeen>=idle){let ref='';try{const u=new URL(document.referrer);if(u.hostname!=='mm7382.github.io')ref=u.origin}catch{}session={id:crypto.randomUUID(),lastSeen:now,referrer:ref}}
 session.lastSeen=now;write(sessionKey,session);
 let viewedAt=new Date().toISOString();
 function flush(){if(sent||blocked())return;sent=true;session.lastSeen=Date.now();write(sessionKey,session);
  const payload={type:'page_summary',occurredAt:viewedAt,page:{path:window.location.pathname,title:window.location.pathname},detail:{visitorId:visitor.id,sessionId:session.id,referrer:session.referrer,contentType:'other'},userAgent:navigator.userAgent,language:navigator.language};
  try{fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
 }
 window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
 window.addEventListener('pageshow',e=>{if(e.persisted){sent=false;viewedAt=new Date().toISOString()}});
 window.MALAnalytics={flush,isExcluded:excluded,setExcluded:value=>{try{localStorage.setItem(excludedKey,String(!!value))}catch{}},recordAction:()=>{},recordSearch:()=>{}};
 const addNotice=()=>{if(document.querySelector('.mal-privacy-notice'))return;const f=document.createElement('footer');f.className='mal-privacy-notice';f.style.cssText='padding:20px;margin-top:24px;text-align:center;font:12px/1.7 system-ui;color:inherit';const a=document.createElement('a');a.href='/pec-ai-agent-training/privacy.html';a.textContent='匿名流量統計與隱私說明';f.append(a);document.body.append(f)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNotice,{once:true});else addNotice();
})();
