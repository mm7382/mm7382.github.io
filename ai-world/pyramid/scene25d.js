/* Photographic 2.5D review renderer. Fixed visual fixture; no model outputs. */
(function(root){
'use strict';
const W=1600,H=900,DURATION=32,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>{t=clamp(t);return t*t*(3-2*t)};
function stateAt(time){const t=clamp(time,0,DURATION),progress=ease((t-2)/23);return{t,progress,x:270+progress*310,walk:progress*310,phase:t<2?'收緊繩索':t<23?'合力拖運':t<26?'減速停穩':t<30?'檢查石材與定位':'本段搬運完成',moving:t>=2&&t<25,arrived:t>=25};}
// Generated atlas cells are used as poses, not evidence of AI action.
function cell(image,col,row,cols=4,rows=2){if(row===1 && image.width/image.height>1.9){const bounds=[[0,.21],[.23,.24],[.51,.14],[.696,.304]][col];return {image,sx:bounds[0]*image.width,sy:image.height/2,sw:bounds[1]*image.width,sh:image.height/2};}return {image,sx:col*image.width/cols,sy:row*image.height/rows,sw:image.width/cols,sh:image.height/rows};}
function sprite(ctx,c,x,feet,height,alpha=1){const width=height*c.sw/c.sh;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(c.image,c.sx,c.sy,c.sw,c.sh,x-width/2,feet-height,width,height);ctx.restore();return{left:x-width/2,top:feet-height,width,height};}
function shadow(ctx,x,y,w){ctx.save();ctx.fillStyle='#49311d';ctx.globalAlpha=.17;ctx.beginPath();ctx.ellipse(x+12,y+1,w,8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#55432d';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#cfb68c';ctx.lineWidth=1.5;ctx.stroke();}
function worker(ctx,assets,x,y,h,distance,variant,offset){
 const c=cell(variant?assets.crew:assets.walk,0,0);
 return root.KhufuRig.haul(ctx,assets,c,x,y,h,distance,variant,offset);
}
function liveState(data,extrapolate){
 const stone=data.stone||{},m=stone.motion;let progress=clamp(stone.progress||0);if(extrapolate&&m?.kind==='haul'){const f=clamp((Date.now()/1000-m.started)/m.duration);progress=clamp(m.from+(m.to-m.from)*f);}
 return {t:0,progress,x:270+progress*310,walk:progress*310,moving:m?.kind==='haul',arrived:progress>=1,phase:data.status==='thinking'?'AI 正在討論':data.status==='blocked'?'施工暫停':m?({load:'裝載石材',wet:'灑水整路',haul:'合力拖運',place:'卸載定位',repair:'清理路段'}[m.kind]||m.kind):data.status==='complete'?'施工驗收完成':data.plan?'等待下一項決策':'等待 AI 設計'};
}
function placedStone(ctx,assets,cell,n){
 const [gx,gy,z]=cell,x=800+(gx-gy)*24,y=415+(gx+gy-n+1)*12-z*26;
 const faces=[[[x,y-24],[x+23,y-12],[x,y],[x-23,y-12]],[[x-23,y-12],[x,y],[x,y+24],[x-23,y+12]],[[x,y],[x+23,y-12],[x+23,y+12],[x,y+24]]];
 for(let i=0;i<3;i++){ctx.save();ctx.beginPath();faces[i].forEach(([a,b],j)=>ctx[j?'lineTo':'moveTo'](a,b));ctx.closePath();ctx.clip();ctx.drawImage(assets.crew,assets.crew.width*.78,assets.crew.height*.67,assets.crew.width*.11,assets.crew.height*.12,x-24,y-25,49,50);ctx.fillStyle=['#fff4ca18','#4d392440','#5c44232b'][i];ctx.fillRect(x-25,y-26,51,52);ctx.restore();ctx.strokeStyle='#62503980';ctx.lineWidth=.8;ctx.beginPath();faces[i].forEach(([a,b],j)=>ctx[j?'lineTo':'moveTo'](a,b));ctx.closePath();ctx.stroke();}
}
function render(ctx,assets,time,view={mode:'overview',zoom:1,panX:0,panY:0},pin=null){
 const live=view.live||null,s=live?liveState(live,view.extrapolate):stateAt(time);ctx.clearRect(0,0,W,H);ctx.drawImage(assets.site,0,0,W,H);
 let zoom=view.zoom||1,panX=view.panX||0,panY=view.panY||0;
 if(view.mode==='follow'){zoom*=1.55;panX+=(W/2-(s.x+300))*zoom;panY+=(H*.56-665)*zoom;}
 ctx.save();ctx.translate(W/2+panX,H*.56+panY);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H*.56);ctx.drawImage(assets.site,0,0,W,H);
 // Continuous local task animation; these are visual fixtures, not model decisions.
 const foreman=cell(assets.crew,2,1),kneeler=cell(assets.crew,1,1),pour=cell(assets.crew,0,1),load=cell(assets.crew,3,1);
 shadow(ctx,790,382,20);root.KhufuRig.task(ctx,assets,foreman,790,391,152,live?(live.status==='thinking'?time:0):s.t,'foreman');
 shadow(ctx,440,444,23);root.KhufuRig.task(ctx,assets,kneeler,440,450,132,live?(live.stone?.motion?.kind==='place'?time:0):s.t,'lever');
 shadow(ctx,1080,460,22);root.KhufuRig.task(ctx,assets,foreman,1080,465,160,live?(live.status==='thinking'?time+1.8:0):s.t+1.8,'foreman');
 if(live)for(const block of [...live.placed].sort((a,b)=>a.cell[2]-b.cell[2]||a.cell[1]-b.cell[1]||a.cell[0]-b.cell[0]))placedStone(ctx,assets,block.cell,live.plan?.base||3);
 // Two staggered rope teams. Back row is drawn before the load and front row.
 const back=[],front=[];
 const crewCount=live?Math.max(0,(live.crew||0)-(live.stone?.motion?.kind==='wet'?1:0)):10;
 for(let row=0;row<Math.ceil(crewCount/2);row++){
  const baseX=s.x+170+row*(crewCount>10?60:94);
  back.push(worker(ctx,assets,baseX,617,219,s.walk,row%2,row*.13));
  if(row*2+1<crewCount)front.push(worker(ctx,assets,baseX+16,691,244,s.walk,(row+1)%2,.38+row*.13));
 }
 for(const p of [...back,...front])for(const f of p.feet)if(f.planted)shadow(ctx,f.x,f.y,p.h*.065);
 const anchors=[{x:s.x+94,y:623},{x:s.x+97,y:663}];
 for(let j=0;j<2;j++){const team=j?front:back;let previous=anchors[j];for(const p of team){line(ctx,previous,p.hand);previous=p.hand;}}
 back.forEach(p=>p.draw());
 if(!live||live.target){shadow(ctx,s.x,683,100);sprite(ctx,load,s.x,700,228);}
 // Short attachments reappear over the sledge's leading timber.
 if(front[0])line(ctx,{x:s.x+78,y:663},front[0].hand);if(back[0])line(ctx,{x:s.x+77,y:624},back[0].hand);
 front.forEach(p=>p.draw());
 // A short visible rope section crosses each grip, tracking the hand joint.
 for(const p of [...back,...front])line(ctx,{x:p.hand.x-4,y:p.hand.y+2},{x:p.hand.x+5,y:p.hand.y+2});
 // Watering stays at its work position, with an articulated arm and animated stream.
 if(!live||live.stone?.motion?.kind==='wet'){shadow(ctx,135,716,26);root.KhufuRig.task(ctx,assets,pour,135,721,219,live?(live.stone?.motion?.kind==='wet'?time:0):s.t,'pour');}
 // Fine dust is tied to actual displacement; none appears while the load is stationary.
 if(s.moving){ctx.save();for(let i=0;i<16;i++){const k=(s.t*1.4+i*.47)%2,alpha=(1-k/2)*.035;ctx.fillStyle=`rgba(210,188,150,${alpha})`;ctx.beginPath();ctx.ellipse(s.x-75-k*35+i%3*12,683-k*9,20+k*14,5+k*4,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(pin){ctx.fillStyle='#bc5837';ctx.strokeStyle='#fff3d8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(pin.x*W,pin.y*H,13,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();return{s,transform:{zoom,panX,panY}};
}
root.Khufu25D={W,H,DURATION,stateAt,render};
})(typeof window==='undefined'?globalThis:window);
