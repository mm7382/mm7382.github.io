(function(){
'use strict';

const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const fit=t=>clamp(t)**2*(3-2*clamp(t));
const pt=(x,y,z=0)=>({x,y,z});
const noise=n=>{const x=Math.sin(39.19*n+.613)*32791.411;return x-Math.floor(x);};
const sum=(p,q)=>pt(p.x+q.x,p.y+q.y,p.z+q.z);
const mean=a=>pt(...['x','y','z'].map(k=>a.reduce((s,v)=>s+v[k],0)/a.length));
function camera(w,h){
  // Two construction-scale zones interpolate only in the empty yard between
  // sites. The coordinates in the replay never change.
  function at(v){
    const b=fit((v.x-8.5)/3),z=v.z||0,y=v.y-7;
    const xs=.166+.025*(v.x-6)+.023*y,ys=.607-.004*(v.x-6)+.0058*y;
    const xl=.700+.0204*(v.x-16)+.0396*y,yl=.512-.00444*(v.x-16)+.00355*y;
    const fore=.071*Math.max(0,v.y-11.45)**1.58;
    const shift=lerp(.054,.107,b)*z;
    return {x:clamp(lerp(xs,xl,b),.016,.98)*w,y:(lerp(ys,yl,b)+fore-shift)*h};
  }
  return {
    at,range:p=>p.y-p.x*1.94+p.z*.10,
    humanHeight(p){const y=at({...p,z:0}).y/h; return h*lerp(.043,.153,fit((y-.48)/.34))*(1-p.z*.02);},
    w,h
  };
}
function path(c,p){c.beginPath();p.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();}
function fill(c,p,paint,edge,width=.7){path(c,p);c.fillStyle=paint;c.fill();if(edge){c.lineWidth=width;c.strokeStyle=edge;c.stroke();}}
function oval(c,x,y,w,h,f){c.beginPath();c.ellipse(x,y,Math.max(.1,w),Math.max(.1,h),0,0,Math.PI*2);c.fillStyle=f;c.fill();}
function line(c,a,b,w,color){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineWidth=w;c.lineCap='round';c.strokeStyle=color;c.stroke();}
function faceUV(points,n){
  const xy=Math.abs(n.x)<.3&&Math.abs(n.y)<.3;
  return points.map(v=>({x:v.x*(xy?1:.52)+v.y*(xy?.3:.73),y:v.z*1.03+(xy?v.y*.91:(v.x-v.y)*.057)}));
}
function texTriangle(c,A,B,C,U,V,Q,tile){
  // v pixels expressed in normalized texture coordinates. The transformation
  // keeps pattern aligned continuously across separate stone polygons.
  const du=V.x-U.x,dv=V.y-U.y,eu=Q.x-U.x,ev=Q.y-U.y,det=du*ev-dv*eu;
  if(Math.abs(det)<1e-8)return;
  const a=((B.x-A.x)*ev-(C.x-A.x)*dv)/det,b=((B.y-A.y)*ev-(C.y-A.y)*dv)/det;
  const d=((C.x-A.x)*du-(B.x-A.x)*eu)/det,e=((C.y-A.y)*du-(B.y-A.y)*eu)/det;
  c.save();path(c,[A,B,C]);c.clip();c.transform(a,b,d,e,A.x-a*U.x-d*U.y,A.y-b*U.x-e*U.y);
  const ux=Math.floor(Math.min(U.x,V.x,Q.x)),uy=Math.floor(Math.min(U.y,V.y,Q.y));
  const vx=Math.ceil(Math.max(U.x,V.x,Q.x)),vy=Math.ceil(Math.max(U.y,V.y,Q.y));
  for(let x=ux;x<vx;x++)for(let y=uy;y<vy;y++)c.drawImage(tile,x,y,1,1);
  c.restore();
}
function face(c,p,pts,n,mat,seed,rough=false){
  const sky=!!mat&&mat.complete&&mat.naturalWidth;
  const uv=faceUV(pts,n);
  const strength=clamp((-n.x*.70-n.y*.38+n.z*.24)/(Math.hypot(n.x,n.y,n.z)||1),-.8,.9);
  const light=clamp(.87+.12*strength+(noise(seed)-.5)*.049,.65,1);
  const tint=rough?'#a57b53':'#d4af7d';
  fill(c,p,tint);
  if(sky){
    for(let i=1;i<p.length-1;i++)texTriangle(c,p[0],p[i],p[i+1],uv[0],uv[i],uv[i+1],mat);
    if(light<.998){c.save();c.globalAlpha=(1-light)*.76;fill(c,p,'#3a281b');c.restore();}
  }
  c.save();c.globalAlpha=rough?.34:.105;path(c,p);c.lineWidth=rough?1.3:.68;c.strokeStyle='#5b432e';c.stroke();c.restore();
}
const rockFaces=[[0,1,2,3],[4,5,6,7],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
function rockMesh(s,r=.495,h=.995){
  const z=s.z||0,x=s.x,y=s.y;
  return {vertices:[pt(x-r,y-r,z),pt(x+r,y-r,z),pt(x+r,y+r,z),pt(x-r,y+r,z),pt(x-r,y-r,z+h),pt(x+r,y-r,z+h),pt(x+r,y+r,z+h),pt(x-r,y+r,z+h)],faces:rockFaces};
}
function meshFaces(mesh,cam,index,rough){
  const list=[],center=mean(mesh.vertices);
  for(const faceIds of mesh.faces){
    const vs=faceIds.map(i=>mesh.vertices[i]),k=mean(vs);
    const [a,b,c]=vs;let n=pt((b.y-a.y)*(c.z-a.z)-(b.z-a.z)*(c.y-a.y),(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z),(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
    if(n.x*(k.x-center.x)+n.y*(k.y-center.y)+n.z*(k.z-center.z)<0)n=pt(-n.x,-n.y,-n.z);
    const view=cam.view||{x:-1.94,y:1,z:.10};
    if(n.x*view.x+n.y*view.y+n.z*view.z<=.00001)continue;
    const p=vs.map(t=>cam.at(t));
    list.push({p,pts:vs,n,depth:cam.range(k),rough,index,center:k});
  }
  return list;
}
function drawFaces(c,list,assets){
  list.sort((a,b)=>a.depth-b.depth);
  for(const f of list){
    let mat=f.n.x<-.2?assets.warm:assets.dark;
    if(!mat)mat=assets.warm;
    face(c,f.p,f.pts,f.n,mat,f.index,f.rough);
  }
}
function cast(c,s,cam){
  for(const m of s.sites){
    const center=m.site,r=(m.size??5)*.5;
    const rocks=s.stones.filter(v=>(v.location==='placed'||v.location==='casing')&&Math.abs(v.x-center.x)<=r+.6&&Math.abs(v.y-center.y)<=r+.65);
    if(!rocks.length)continue;
    const h=Math.max(...rocks.map(r=>r.z+(r.mesh?.vertices?.length?.01:1)));
    const k=cam.at(center),w=cam.w*(center.x>10?.122:.078);
    const g=c.createLinearGradient(k.x-w*.55,k.y,k.x+w*(1+h*.25),k.y);
    g.addColorStop(0,'#3a271906');g.addColorStop(.5,'#2b1a1648');g.addColorStop(1,'#34292102');
    oval(c,k.x+w*.48,k.y+cam.h*.027,w*(1+h*.23),cam.h*(.007+h*.0068),g);
  }
}
const workerMasks={
  head:[[521,220],[520,35],[[424,105],[438,54],[474,20],[529,13],[590,43],[608,77],[616,108],[607,127],[612,139],[603,146],[606,157],[591,177],[580,195],[568,218],[537,250],[490,240],[472,200],[445,176],[428,148]]],
  torso:[[490,315],[528,595],[[442,220],[484,240],[544,232],[568,216],[620,253],[663,294],[687,354],[649,411],[642,475],[641,553],[646,617],[596,628],[410,591],[408,531],[377,454],[356,402],[314,369],[327,319],[361,269]]],
  kilt:[[524,600],[518,1026],[[410,589],[481,600],[563,613],[632,605],[646,638],[659,734],[680,1009],[591,1023],[480,1047],[368,1045],[378,940],[383,831],[397,734]]],
  upper:[[363,355],[254,496],[[322,344],[340,327],[398,348],[380,391],[352,430],[320,463],[284,519],[247,505],[230,490],[253,444],[290,397]]],
  fore:[[254,496],[172,716],[[290,481],[279,522],[236,626],[207,688],[187,727],[160,720],[162,687],[172,624],[191,581],[224,507],[248,478]]],
  calf:[[405,1065],[374,1426],[[373,1042],[480,1046],[464,1112],[443,1196],[435,1303],[420,1386],[405,1445],[355,1440],[342,1358],[332,1224],[337,1146]]],
  foot:[[374,1425],[450,1502],[[353,1392],[404,1405],[414,1459],[444,1469],[474,1496],[467,1515],[423,1518],[392,1509],[355,1480],[341,1449]]]
};
function skinPart(c,im,key,p,q,mirror=1,ratio=1,alpha=1){
  const [[ux,uy],[vx,vy],poly]=workerMasks[key],sx=vx-ux,sy=vy-uy,tx=q.x-p.x,ty=q.y-p.y;
  const sl=Math.hypot(sx,sy),tl=Math.hypot(tx,ty);
  if(tl<.5)return;
  const f=sx/sl,g=sy/sl,u=tx/tl,v=ty/tl,l=tl/sl,n=l*mirror*ratio;
  const a=u*f*l+v*g*n,b=v*f*l-u*g*n,d=u*g*l-v*f*n,e=v*g*l+u*f*n;
  c.save();c.globalAlpha=alpha;c.transform(a,b,d,e,p.x-a*ux-d*uy,p.y-b*ux-e*uy);
  path(c,poly.map(([x,y])=>({x,y})));c.clip();c.drawImage(im,0,0,1024,1536);c.restore();
}
function renderHuman(c,a,cam,assets){
  const im=assets.worker;if(!im?.complete||!im.naturalWidth)return false;
  const s=cam.humanHeight(a),r=cam.at(a),move=a.phase==='move'&&a.gaitFrom,op=!!a.target;
  const screen=move?cam.at(a.gaitTo).x-cam.at(a.gaitFrom).x:a.dir;
  const d=screen<-1e-4?-1:1;
  const u=a.u||0,bend=op?Math.sin(Math.PI*u)**1.15:0;
  const contact=op?cam.at(a.target):null,load=!!a.cargo;
  const v=(x,y)=>({x:r.x+d*s*x,y:r.y+s*y});
  const hip=v(.004+.105*bend,-.52+.18*bend);
  const collar=v(.048+(load?.039:0)+.22*bend,-.814+.34*bend);
  const waist=v(.01+.108*bend,-.566+.18*bend);
  const crown=v(.063+.25*bend,-.975+.35*bend);
  const neck=v(.049+.218*bend,-.856+.35*bend);
  const kilt=v(.008+.085*bend,-.286+.16*bend);
  const gait=move?(a.stridePhase??0)*2:0,ax=move?a.gaitTo.x-a.gaitFrom.x:0,ay=move?a.gaitTo.y-a.gaitFrom.y:0,az=move?a.gaitTo.z-a.gaitFrom.z:0;
  function ankle(side){
    if(!move)return v(side*.064,-.012-side*.007);
    const cycle=(gait+(side<0?.5:0))%1,stance=.58;
    const swing=clamp((cycle-stance)/(1-stance));
    const off=cycle<stance?.5*(stance*.5-cycle):.5*stance*(fit(swing)-.5);
    const p=cam.at(pt(a.x+ax*off-ay*side*.077,a.y+ay*off+ax*side*.077,(a.z??0)+az*off));
    return {x:p.x+d*side*s*.039,y:p.y-s*(.016+(cycle>stance?Math.sin(swing*Math.PI)*.074:0))};
  }
  const layer=load?1:0;
  const arm=(side)=>{
    const sh=v(.049+.205*bend+side*.072,-.786+.34*bend+(side>0?.012:0));
    const sw=move?Math.sin((gait+(side<0?.5:0))*Math.PI*2):0;
    let palm=v(.063+sw*.166+.16*bend+layer*.178+side*.04,-.415-.125*layer+.28*bend+Math.abs(sw)*.029);
    if(contact){const amount=Math.sin(Math.PI*u)**.9*.80; palm={x:lerp(palm.x,contact.x+side*s*.046,amount),y:lerp(palm.y,contact.y-s*.08,amount)};}
    const elbow={x:lerp(sh.x,palm.x,.51)-d*s*(load?.045:.034),y:lerp(sh.y,palm.y,.62)+(load?s*.038:0)};
    return {sh,elbow,palm};
  };
  const near=arm(1),far=arm(-1);
  oval(c,r.x+s*.23,r.y+s*.024,s*.42,s*.062,'#30201855');
  for(const side of [-1,1]){
    const f=ankle(side);
    const knee={x:lerp(hip.x,f.x,.42)+d*s*(.025+bend*.22+side*.011),y:lerp(hip.y,f.y,.49)};
    const alpha=side>0?1:.82,heel={x:f.x+d*s*.01,y:f.y+.024*s},tip={x:f.x+d*s*.115,y:f.y+.029*s};
    skinPart(c,im,'calf',knee,f,d,1.14,alpha);skinPart(c,im,'foot',heel,tip,d,1.15,alpha);
  }
  skinPart(c,im,'upper',far.sh,far.elbow,d,1,.77);skinPart(c,im,'fore',far.elbow,far.palm,d,1,.83);
  skinPart(c,im,'torso',collar,waist,d,.94);
  skinPart(c,im,'kilt',waist,kilt,d,1.07);
  skinPart(c,im,'head',neck,crown,d,.96);
  if(load){
    const x=(near.palm.x+far.palm.x)/2+d*s*.025,y=(near.palm.y+far.palm.y)/2-s*.075,B=s*.124;
    const p=[{x:x-B,y:y-B*.44},{x:x+B*.42,y:y-B*.64},{x:x+B,y:y-B*.27},{x:x+B*.85,y:y+B*.21},{x:x-B*.64,y:y+B*.42}];
    fill(c,p,'#b08a59','#806342',.5);
    c.save();path(c,p);c.clip();if(assets.warm?.complete&&assets.warm.naturalWidth)c.drawImage(assets.warm,x-B,y-B*.66,2*B,B*1.08);c.restore();
    fill(c,[p[0],p[2],p[3],p[4]],'#714e363a');
  }
  skinPart(c,im,'upper',near.sh,near.elbow,d,1.03);
  skinPart(c,im,'fore',near.elbow,near.palm,d,1.08);
  return true;
}
function actor(c,a,cam,assets){
  if(renderHuman(c,a,cam,assets))return;
  const root=cam.at(a),size=cam.humanHeight(a),transition=['pickup','deposit','place','casing_place'].includes(a.phase);
  const bend=transition?Math.sin(Math.PI*a.u)*.24:0,strong=a.cargo?1:0,d=(a.dir||1);
  const stride=a.phase==='move'?(a.stridePhase??a.walk)*Math.PI*2.4:0;
  const mate={x:root.x+(bend*.29+strong*.035)*size*d,y:root.y-(.59-bend*.56)*size};
  const chest={x:mate.x+size*(bend*.23+.052*strong)*d,y:mate.y-(.23-bend*.55)*size};
  const hd={x:chest.x+size*(.013+bend*.1)*d,y:chest.y-(.105-bend*.27)*size};
  const right={x:root.x+Math.sin(stride)*size*.145,y:root.y-Math.max(0,Math.cos(stride))*size*.07};
  const left={x:root.x-Math.sin(stride)*size*.161,y:root.y-Math.max(0,-Math.cos(stride))*size*.068-size*.016};
  const shoulder={x:chest.x+d*size*.029,y:chest.y+size*.024};
  const hand={x:shoulder.x+d*size*(.105+(strong?.08:0)),y:shoulder.y+size*(.26+(bend*.56))};
  const nextHand=transition&&a.target?cam.at(a.target):null;
  if(nextHand){const t=clamp(bend*2.2);hand.x=lerp(hand.x,nextHand.x,t);hand.y=lerp(hand.y,nextHand.y-size*.095,t);}
  const skin='#a66e43',bright='#c18b59',shade='#65402d';
  oval(c,root.x+size*.25,root.y+size*.043,size*.39,size*.06,'#30201858');
  const limb=(u,v,length,dark=shade,light=skin)=>{
    const g=c.createLinearGradient(u.x-length,u.y,v.x+length,v.y);g.addColorStop(0,dark);g.addColorStop(.49,light);g.addColorStop(1,dark);
    line(c,u,v,length,g);
  };
  function leg(foot,k,back){
    const knee={x:lerp(mate.x,foot.x,.43)+d*size*(bend*.31+k),y:lerp(mate.y,foot.y,.57)};
    limb(mate,knee,size*.09,shade,back?skin:bright);limb(knee,foot,size*.063,shade,back?skin:bright);oval(c,foot.x+d*size*.037,foot.y,size*.064,size*.018,back?shade:skin);
  }
  leg(left,-.055,true);leg(right,.04,false);
  const g=c.createLinearGradient(mate.x-size*.13,mate.y,mate.x+size*.13,chest.y);
  g.addColorStop(0,'#6f462e');g.addColorStop(.45,bright);g.addColorStop(1,shade);
  fill(c,[{x:chest.x-size*.11,y:chest.y},{x:chest.x+size*.103,y:chest.y-size*.018},{x:mate.x+size*.086,y:mate.y},{x:mate.x-size*.098,y:mate.y}],g);
  const linen=c.createLinearGradient(mate.x-size*.145,mate.y,mate.x+size*.11,mate.y);
  linen.addColorStop(0,'#ad925f');linen.addColorStop(.52,'#ede1b7');linen.addColorStop(1,'#99754e');
  const via={x:mate.x+size*.017*Math.sin(stride),y:mate.y+size*.246};
  fill(c,[{x:mate.x-size*.104,y:mate.y-size*.012},{x:mate.x+size*.113,y:mate.y},{x:via.x+size*.135,y:via.y},{x:via.x-size*.141,y:via.y-size*.003}],linen);
  for(let i=-2;i<3;i++)line(c,{x:mate.x+i*size*.041,y:mate.y+size*.02},{x:via.x+i*size*.052,y:via.y-size*.026},Math.max(.34,size*.007),i%2?'#69502e5f':'#fff7d38b');
  limb(chest,hd,size*.067,shade,skin);
  oval(c,hd.x,hd.y,size*.059,size*.077,skin);
  oval(c,hd.x-d*size*.012,hd.y-size*.033,size*.062,size*.048,'#292018');
  if(a.cargo){
    const x=hand.x+d*size*.057,y=hand.y;
    const dim=size*.105;
    fill(c,[{x:x-dim,y:y-dim*.21},{x:x+dim*.91,y:y-dim*.35},{x:x+dim,y:y+dim*.39},{x:x-dim,y:y+dim*.50}], '#c9a472','#6b4e2e35');
  }
  const elbow={x:lerp(shoulder.x,hand.x,.53)-d*size*.031,y:lerp(shoulder.y,hand.y,.62)};
  limb(shoulder,elbow,size*.068,shade,bright);limb(elbow,hand,size*.048,shade,skin);
  oval(c,hand.x,hand.y,size*.029,size*.035,bright);
}
function staging(c,s,cam){
  if(!s.scaffold || s.stones.filter(v=>v.location==='casing').length===97)return;
  const cSet=s.actors.filter(a=>a.z>.04);
  for(const a of cSet){
    const near=s.scaffold.walkways.filter(p=>p.z>.04&&Math.hypot(p.x-a.x,p.y-a.y)<1.45&&Math.abs(p.z-a.z)<1.21);
    const top=p=>cam.at({...p,z:p.z-.026});
    const boardWidth=cam.w*.0085,paint='#b58a58';
    for(const p of near){
      const v=top(p),base=cam.at({...p,z:Math.max(0,p.z-1.16)});
      line(c,{x:v.x-boardWidth*.68,y:v.y},{x:base.x+boardWidth*.07,y:base.y},Math.max(.65,cam.w*.0015),'#69523c');
      line(c,{x:v.x+boardWidth*.68,y:v.y},{x:base.x-boardWidth*.07,y:base.y},Math.max(.65,cam.w*.0015),'#524134');
      fill(c,[{x:v.x-boardWidth,y:v.y},{x:v.x+boardWidth*.38,y:v.y-boardWidth*.43},{x:v.x+boardWidth,y:v.y-boardWidth*.1},{x:v.x-boardWidth*.41,y:v.y+boardWidth*.36}],paint,'#53433270',.45);
    }
    const p=top(a);
    line(c,{x:p.x-boardWidth*.62,y:p.y+1},{x:p.x+boardWidth*.58,y:p.y-1},Math.max(1,cam.w*.0017),'#9b7853');
  }
}
function render(c,data,tick,assets,w=1440,h=810){
  const cam=camera(w,h),s=stateAPI.snapshot(data,tick);
  c.fillStyle='#af8d64';c.fillRect(0,0,w,h);
  if(assets.plate?.complete&&assets.plate.naturalWidth)c.drawImage(assets.plate,0,0,w,h);
  cast(c,s,cam);
  const placed=s.stones.filter(s=>s.location==='placed'||s.location==='casing'),walls=[],cased=[];
  placed.forEach((s,i)=>{
    // Perfectly valid installed geometry is cut from the casing mask one part
    // at a time. Never cover the unbuilt side with the concept's final tower.
    if(s.location==='casing'&&s.mesh)cased.push(...meshFaces(s.mesh,cam,i,false));
    if(s.location==='placed')walls.push(...meshFaces(rockMesh(s),cam,i,true));
  });
  drawFaces(c,walls,assets);drawFaces(c,cased,assets);
  const piles=new Map();
  for(const v of s.stones.filter(st=>st.location==='source'||st.location==='site')){
    const k=[v.x,v.y,v.z].join(',');
    if(!piles.has(k))piles.set(k,[]);
    piles.get(k).push(v);
  }
  const pilesDraw=[];
  for(const v of piles.values()){
    v.slice(0,5).forEach((x,i)=>{const q=sum(x,pt(((i%3)-1)*.24,Math.floor(i/3)*.26,.02));pilesDraw.push(...meshFaces(rockMesh(q,.17,.18),cam,i,true));});
  }
  drawFaces(c,pilesDraw,assets);
  staging(c,s,cam);
  for(const a of [...s.actors].sort((a,b)=>cam.range(a)-cam.range(b)))actor(c,a,cam,assets);
  return s;
}
function fmt(s){return Math.floor(s/60)+':'+String(Math.floor(s)%60).padStart(2,'0');}
window.Craft={skinPart,meshFaces,drawFaces,rockMesh};
})();
