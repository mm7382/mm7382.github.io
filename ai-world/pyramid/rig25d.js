/* Continuous photographic puppet deformation. Visual fixture, not AI or force simulation. */
(function(root){
'use strict';
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)},TAU=Math.PI*2;
function footAt(distance,stride,offset,height){
 const cycle=distance/stride+offset,step=Math.floor(cycle),p=cycle-step,stance=.64;
 const x=p<stance?stride*(stance/2-p):stride*(-stance/2+stance*smooth((p-stance)/(1-stance)));
 return {x,y:p<stance?0:-height*.065*Math.sin(Math.PI*(p-stance)/(1-stance)),planted:p<stance,step};
}
function kneeAt(hip,foot,l1,l2){const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy)),r=Math.min(d,l1+l2-.001),along=(l1*l1-l2*l2+r*r)/(2*r),out=Math.sqrt(Math.max(0,l1*l1-along*along));return{x:hip.x+dx/d*along+dy/d*out,y:hip.y+dy/d*along-dx/d*out};}
function mapBone(p,a,b,A,B){const sx=b.x-a.x,sy=b.y-a.y,tx=B.x-A.x,ty=B.y-A.y,l=sx*sx+sy*sy,u=((p.x-a.x)*sx+(p.y-a.y)*sy)/l,v=(-(p.x-a.x)*sy+(p.y-a.y)*sx)/l;return{x:A.x+u*tx-v*ty,y:A.y+u*ty+v*tx};}
function triangle(ctx,im,s,d){
 const a=s[0],b=s[1],c=s[2],A=d[0],B=d[1],C=d[2],den=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
 if(Math.abs(den)<1e-7)return;
 const m00=((B.x-A.x)*(c.y-a.y)-(C.x-A.x)*(b.y-a.y))/den,m01=((C.x-A.x)*(b.x-a.x)-(B.x-A.x)*(c.x-a.x))/den;
 const m10=((B.y-A.y)*(c.y-a.y)-(C.y-A.y)*(b.y-a.y))/den,m11=((C.y-A.y)*(b.x-a.x)-(B.y-A.y)*(c.x-a.x))/den;
 ctx.save();ctx.beginPath();const cx=(A.x+B.x+C.x)/3,cy=(A.y+B.y+C.y)/3;
 for(let i=0;i<3;i++){const p=d[i],dx=p.x-cx,dy=p.y-cy,len=Math.hypot(dx,dy)||1;ctx[i?'lineTo':'moveTo'](p.x+dx/len*.25,p.y+dy/len*.25);}ctx.closePath();ctx.clip();ctx.transform(m00,m10,m01,m11,A.x-m00*a.x-m01*a.y,A.y-m10*a.x-m11*a.y);ctx.drawImage(im,0,0);ctx.restore();
}
function mesh(ctx,im,map,cols=6,rows=9){const points=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const s={x:x/cols*im.width,y:y/rows*im.height};points.push({s,d:map({x:x/cols,y:y/rows})});}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const k=y*(cols+1)+x;for(const ids of [[k,k+1,k+cols+1],[k+1,k+cols+2,k+cols+1]])triangle(ctx,im,ids.map(i=>points[i].s),ids.map(i=>points[i].d));}}
const cache=new WeakMap();
function surface(ctx,assets,w,h){if(assets.createCanvas)return assets.createCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function texture(ctx,assets,c,polygon){const out=surface(ctx,assets,Math.round(c.sw),Math.round(c.sh)),g=out.getContext('2d');if(polygon){g.beginPath();polygon.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x*out.width,y*out.height));g.closePath();g.clip();}g.drawImage(c.image,c.sx,c.sy,c.sw,c.sh,0,0,out.width,out.height);return out;}
function parts(ctx,assets,c,key){let bag=cache.get(assets);if(!bag){bag={};cache.set(assets,bag);}if(bag[key])return bag[key];
 const rear=[[0,.49],[.47,.49],[.49,.61],[.47,.71],[.43,.82],[.42,1],[0,1]];
 const front=[[.46,.49],[1,.49],[1,1],[.42,1],[.43,.82],[.47,.71],[.49,.61]];
 return bag[key]={rear:texture(ctx,assets,c,rear),front:texture(ctx,assets,c,front),body:texture(ctx,assets,c,[[0,0],[1,0],[1,.56],[0,.56]])};
}
function haul(ctx,assets,c,x,y,h,distance,variant,offset){
 const width=h*c.sw/c.sh,base={x:x-width/2,y:y-h*.94},stride=h*.38;
 const feet=[footAt(distance,stride,offset,h),footAt(distance,stride,offset+.5,h)];
 const bob=Math.sin((distance/stride+offset)*TAU*2)*h*.004;
 const hip={x:x-width*.04,y:y-h*.44+bob};
 const config=variant?{hip:[.45,.50],knees:[[.28,.69],[.61,.71]],ankles:[[.15,.98],[.65,.98]],hand:[.75,.435]}:{hip:[.46,.50],knees:[[.27,.71],[.62,.70]],ankles:[[.14,.94],[.65,.94]],hand:[.80,.405]};
 const bodyMap=p=>({x:base.x+p.x*width+Math.sin(distance/stride*TAU)*h*.003*(1-p.y),y:base.y+p.y*h+bob});
 const hand=bodyMap({x:config.hand[0],y:config.hand[1]});
 const draw=()=>{
 const images=parts(ctx,assets,c,'haul-'+variant);
 for(let i=0;i<2;i++){
 const H={x:config.hip[0]*width,y:config.hip[1]*h},K={x:config.knees[i][0]*width,y:config.knees[i][1]*h},F={x:config.ankles[i][0]*width,y:config.ankles[i][1]*h};
 const foot={x:x+feet[i].x,y:y+feet[i].y},knee=kneeAt(hip,foot,h*.225,h*.235);
 mesh(ctx,images[i?'front':'rear'],p=>{const q={x:p.x*width,y:p.y*h},upper=mapBone(q,H,K,hip,knee),lower=mapBone(q,K,F,knee,foot),blend=smooth((p.y-.65)/.12);let out={x:upper.x*(1-blend)+lower.x*blend,y:upper.y*(1-blend)+lower.y*blend};
 // Keep sandals level while the ankle translates; blend the last calf rows into the shoe.
 const shoe=smooth((p.y-.86)/.045);out={x:out.x*(1-shoe)+(foot.x+q.x-F.x)*shoe,y:out.y*(1-shoe)+(foot.y+q.y-F.y)*shoe};const join=smooth((p.y-.49)/.13),body=bodyMap(p);return{x:body.x*(1-join)+out.x*join,y:body.y*(1-join)+out.y*join};},5,8);
 }
 mesh(ctx,images.body,bodyMap,4,4);
 };
 return{draw,hand,feet:feet.map(f=>({x:x+f.x,y:y+f.y,planted:f.planted})),h};
}
function localPose(kind,t){const a=Math.sin(t*(kind==='lever'?1.6:1.1));return{bend:kind==='lever'?.11*(.5+.5*a):kind==='pour'?.045*(.5+.5*a):.017*a,gesture:kind==='foreman'?.065*Math.sin(t*.9):0};}
function task(ctx,assets,c,x,y,h,time,kind){let bag=cache.get(assets);if(!bag){bag={};cache.set(assets,bag);}const key='task-'+kind,im=bag[key]||(bag[key]=texture(ctx,assets,c)),w=h*c.sw/c.sh,pose=localPose(kind,time);
 const map=p=>{const upper=1-smooth((p.y-.49)/.34),arm=Math.exp(-((p.x-.7)**2/.065+(p.y-.43)**2/.025));return{x:x-w/2+p.x*w+upper*pose.bend*h,y:y-h+p.y*h+upper*pose.bend*h*.55-arm*pose.gesture*h};};
 mesh(ctx,im,map,5,7);
 if(kind==='pour'){
 const spout=map({x:.80,y:.59});ctx.save();ctx.strokeStyle='rgba(220,230,219,.65)';ctx.lineWidth=1.1;for(let j=0;j<4;j++){ctx.beginPath();for(let n=0;n<12;n++){const u=n/11,px=spout.x+u*12+Math.sin(time*12-u*9+j)*2,py=spout.y+u*h*.29;ctx[n?'lineTo':'moveTo'](px+j,py);}ctx.stroke();}ctx.fillStyle='rgba(85,72,47,.12)';ctx.beginPath();ctx.ellipse(spout.x+13,y-h*.12,15,4,0,0,TAU);ctx.fill();ctx.restore();
 }
 return pose;
}
root.KhufuRig={haul,task,footAt,kneeAt,localPose};
})(typeof window==='undefined'?globalThis:window);
