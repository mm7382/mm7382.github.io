function draw(){
 if(!latest)return;
 const canvas=$('map'),rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 c.translate(w/2+camera.x,h/2+camera.y);c.scale(camera.zoom,camera.zoom);c.translate(-w/2,-h/2);
 c.fillStyle='#9ab57a';c.fillRect(0,0,w,h);
 const landscape=worldKey==='eden'?edenScenery:scenery;
 if(landscape.complete&&landscape.naturalWidth){
  const scale=Math.max(w/landscape.naturalWidth,h/landscape.naturalHeight);
  const iw=landscape.naturalWidth*scale,ih=landscape.naturalHeight*scale;
  c.drawImage(landscape,(w-iw)/2,(h-ih)/2,iw,ih);
 }
 const mapW=latest.world.width||11,mapH=latest.world.height||10;const unit=Math.max(12,Math.min(w/24,h/15)*Math.min(1,14/mapW));
 const jitter=(x,y,k)=>{const n=Math.sin(x*(k?53.1:91.7)+y*(k?73.7:157.3))*(k?24634.6345:43758.5453);return n-Math.floor(n)-.5};
 const pt=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const noise=k=>jitter(ix,iy,k)*(1-fx)*(1-fy)+jitter(ix+1,iy,k)*fx*(1-fy)+jitter(ix,iy+1,k)*(1-fx)*fy+jitter(ix+1,iy+1,k)*fx*fy;return [w*(.12+x*.71/(mapW-1)+y*.063/(mapH-1))+unit*2.4*noise(0),h*(.25+y*.603/(mapH-1))+unit*2.2*noise(1)]};
 function asset(qx,qy,x,y,width,height){if(!worldAssets.complete||!worldAssets.naturalWidth)return false;const sw=worldAssets.naturalWidth/2,sh=worldAssets.naturalHeight/2;c.drawImage(worldAssets,qx*sw,qy*sh,sw,sh,x,y,width,height);return true}
 function ellipse(x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill()}
 function tree(x,y,scale=1){
  if(asset(0,0,x-unit*2.4*scale,y-unit*5.6*scale,unit*4.8*scale,unit*5.7*scale))return;
  ellipse(x,y+unit*.07,unit*.58,unit*.18,'#233f2445');
  c.fillStyle='#71583d';c.beginPath();c.moveTo(x-unit*.09,y);c.lineTo(x-unit*.075,y-unit*.92);c.lineTo(x+unit*.09,y-unit*.92);c.lineTo(x+unit*.13,y);c.fill();
  for(const [dx,dy,r,col] of [[-.31,-.98,.40,'#536f40'],[.29,-1,.43,'#577847'],[0,-1.25,.46,'#668c51'],[-.2,-1.4,.28,'#769a5a'],[.21,-1.43,.26,'#779d5e']]){
   c.beginPath();c.arc(x+unit*dx,y+unit*dy,unit*r,0,Math.PI*2);c.fillStyle=col;c.fill();
  }
 }
 resourceHits=[];
 const river=latest.world.waterTiles||[];if(river.length>1&&worldKey!=='eden'){
  const points=river.map(tile=>pt(...tile.split(',').map(Number))),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),top=Math.min(...ys),bottom=Math.max(...ys),center=(Math.min(...xs)+Math.max(...xs))/2;
  if(riverAsset.complete&&riverAsset.naturalWidth){const riverWidth=Math.max(unit*5,Math.max(...xs)-Math.min(...xs)+unit*4);c.drawImage(riverAsset,center-riverWidth/2,0,riverWidth,h+unit)}
  else{c.save();c.strokeStyle='#5f8983';c.lineWidth=unit;c.lineCap='round';c.beginPath();c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);c.stroke();c.restore()}
  for(const tile of river){const [x,y]=pt(...tile.split(',').map(Number));resourceHits.push({x,y,radius:unit*.8,caption:'水源'});}
 }
 for(const [xy,fish] of Object.entries(latest.world.fishStock||{})){
  const [x,y]=xy.split(',').map(Number),[px,py]=pt(x,y);
  if(!asset(0,1,px-unit*.48,py-unit*.34,unit*.96,unit*.68)){
   ellipse(px,py,unit*.35,unit*.16,'#849b7d');ellipse(px,py-unit*.02,unit*.29,unit*.12,'#679da0');
  }
  resourceHits.push({x:px,y:py,radius:unit*.9,caption:'水源 · 魚 '+fish+' 份'});
 }
 const objects=[];
 for(const [xy,r] of Object.entries(latest.world.resources||{})){
  const [x,y]=xy.split(',').map(Number);objects.push({kind:'resource',x,y,r});
 }
 for(const landmark of latest.world.landmarks||[])objects.push({kind:'landmark',x:landmark.x,y:landmark.y,landmark});
 for(const landmark of latest.world.landmarks||[])objects.push({kind:'landmark',x:landmark.x,y:landmark.y,landmark});
 for(const b of latest.world.buildings||[])objects.push({kind:'building',x:b.x,y:b.y});
 for(const animal of latest.world.animals||[])objects.push({kind:'animal',x:animal.x,y:animal.y,animal});
 for(const fire of latest.world.fires||[])if(fire.until>latest.minute)objects.push({kind:'fire',x:fire.x,y:fire.y});
 let moving=false;
 for(const [i,p] of latest.world.people.entries()){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  let loc=positions[p.id]||{x:p.x,y:p.y};loc.x+=(p.x-loc.x)*.09;loc.y+=(p.y-loc.y)*.09;
  if(Math.abs(p.x-loc.x)+Math.abs(p.y-loc.y)>.01)moving=true;
  positions[p.id]=loc;objects.push({kind:'person',x:loc.x,y:loc.y,p,i});
 }
 objects.sort((a,b)=>(a.kind==='person'?1:0)-(b.kind==='person'?1:0)||a.y-b.y||a.x-b.x);
 const placedLabels=[];
 for(const object of objects){
  let [x,y]=pt(object.x,object.y);
  if(object.kind==='person'&&(latest.world.buildings||[]).some(b=>b.x===object.p.x&&b.y===object.p.y)){x+=unit*1.2;y+=unit*.30}
  if(object.kind==='resource'){
   if(object.r.wood>0){const woodRatio=Math.min(1,object.r.wood/(mapW>11?16:8));tree(x+unit*.43,y-unit*.08,(mapW>11?.34:.40)+.30*woodRatio)}
   if(object.r.food>0){
    const foodRatio=Math.min(1,object.r.food/(mapW>11?24:12)),bushes=Math.max(1,Math.ceil(foodRatio*3));
    for(let j=0;j<bushes;j++){const bx=x-unit*.85+j*unit*.38,by=y-unit*1.05+(j%2)*unit*.12;if(!asset(1,0,bx,by,unit*.95,unit*.73))ellipse(bx,by,unit*.25,unit*.12,'#527e4b')}
   }
   if(object.r.food>0||object.r.wood>0)resourceHits.push({x,y:y-unit*.75,radius:unit*1.4,caption:'野果 '+(object.r.food||0)+' 份 · 木材 '+(object.r.wood||0)+' 份'});
  }else if(object.kind==='landmark'){
   tree(x,y,1);const label=object.landmark.id==='life-tree'?tr('生命樹','Tree of Life'):tr('知善惡樹','Tree of Knowledge');
   c.save();c.textAlign='center';c.font='650 12px system-ui';const tw=c.measureText(label).width+12;const ty=Math.max(5,y-unit*5.5);c.fillStyle='#172a21e8';c.fillRect(x-tw/2,ty,tw,19);c.fillStyle='#fff2ca';c.fillText(label,x,ty+14);c.restore();
  }else if(object.kind==='landmark'){tree(x,y,1);resourceHits.push({x,y:y-unit*2,radius:unit*2,caption:object.landmark.name});
  }else if(object.kind==='building'){
   if(!asset(1,1,x-unit*2.8,y-unit*4.4,unit*5.6,unit*4.5)){
    c.fillStyle='#b9946d';c.fillRect(x-unit*.54,y-unit*.72,unit*1.08,unit*.72);
   }
  }else if(object.kind==='animal'){
   const animal=object.animal,index={sheep:0,cow:1,horse:2,chicken:3,duck:4}[animal.species];
   if(animalSprites.complete&&animalSprites.naturalWidth&&index!==undefined){const sw=animalSprites.naturalWidth/3,sh=animalSprites.naturalHeight/2,small=index>=3,aw=unit*(small?1.0:2.0),ah=unit*(small?.8:1.65);c.drawImage(animalSprites,(index%3)*sw,Math.floor(index/3)*sh,sw,sh,x-aw/2,y-ah,aw,ah)}
   resourceHits.push({x,y:y-unit*.6,radius:unit*.8,caption:animal.name});
  }else if(object.kind==='fire'){
   ellipse(x,y,unit*.45,unit*.15,'#423029aa');c.save();c.fillStyle='#ffba55';c.beginPath();c.moveTo(x-unit*.2,y);c.quadraticCurveTo(x-unit*.35,y-unit*.35,x,y-unit*.65);c.quadraticCurveTo(x+unit*.32,y-unit*.3,x+unit*.2,y);c.fill();c.restore();
  }else{
   const {p,i}=object,sz=unit*1.25;
   if(p.health<=0){
    ellipse(x,y,unit*.7,unit*.18,'#1b291e70');
    c.fillStyle='#77796b';c.beginPath();c.roundRect(x-unit*.29,y-unit*.96,unit*.58,unit*.93,[unit*.27,unit*.27,unit*.04,unit*.04]);c.fill();
    c.strokeStyle='#c4c4af';c.lineWidth=1;c.beginPath();c.moveTo(x,y-unit*.75);c.lineTo(x,y-unit*.38);c.moveTo(x-unit*.13,y-unit*.61);c.lineTo(x+unit*.13,y-unit*.61);c.stroke();
    resourceHits.push({x,y:y-unit*.5,radius:unit*.75,caption:p.name+' · 已離世',speaker:p.name==='夏娃'?'eve':p.name==='亞當'?'adam':'',priority:true});continue;
   }
   const lastPersonEvent=[...(latest.events||[])].reverse().find(e=>e.actor===p.id&&e.ok),isResting=['rest','sleep'].includes(lastPersonEvent?.action)&&(latest.busyUntil?.[p.id]||0)>latest.minute,isSleeping=isResting&&lastPersonEvent.action==='sleep';
   if(isSleeping&&(latest.world.buildings||[]).some(b=>b.x===p.x&&b.y===p.y)){resourceHits.push({x,y:y-unit,radius:unit*1.3,caption:p.name+' · 在住處睡覺',speaker:p.name==='夏娃'?'eve':p.name==='亞當'?'adam':'',priority:true});c.save();c.font='600 '+Math.max(10,unit*.34)+'px system-ui';c.textAlign='center';c.fillStyle='#fff9de';c.fillText('z z',x+unit*.6,y-unit*3);c.restore();continue}
   ellipse(x,y+sz*.06,sz*.55,sz*.20,i?'#f1c87899':'#91e0d199');ellipse(x,y+sz*.05,sz*.34,sz*.11,'#263c2d88');
   if(characters.complete&&characters.naturalWidth){
    const sourceWidth=characters.naturalWidth/2, sourceHeight=characters.naturalHeight;
    const spriteHeight=unit*(p.isAdult===false?1.5:2.85),spriteWidth=spriteHeight*sourceWidth/sourceHeight;
    c.save();c.shadowColor=i?'#ffcf80':'#b4f0f0';c.shadowBlur=unit*.65;if(p.health<=0)c.globalAlpha=.45;
    if(isResting||activeRest[p.id]>Date.now()){c.translate(x,y-unit*.24);c.rotate(Math.PI/2);c.drawImage(characters,(i%2)*sourceWidth,0,sourceWidth,sourceHeight,-spriteWidth/2,-spriteHeight/2,spriteWidth,spriteHeight)}else{c.drawImage(characters,(i%2)*sourceWidth,0,sourceWidth,sourceHeight,x-spriteWidth/2,y-spriteHeight,spriteWidth,spriteHeight)}
    c.restore();
   }else{
    c.fillStyle=i?'#987458':'#778e83';
    c.beginPath();c.roundRect(x-sz*.17,y-sz*.65,sz*.34,sz*.43,sz*.08);c.fill();
    c.beginPath();c.arc(x,y-sz*.76,sz*.135,0,Math.PI*2);c.fillStyle='#dfb899';c.fill();
   }
   const carriedRaw=Object.entries(p.rawFoods||{}).filter(([k])=>k!=='fish').reduce((n,[,v])=>n+v,0),carriedFish=(p.rawFoods||{}).fish||0,carriedCooked=Object.values(p.cookedFoods||{}).reduce((n,v)=>n+v,0);const carried=[[0,carriedRaw,'生肉'],[2,carriedFish,'生魚'],[1,carriedCooked,'熟食']].filter(row=>row[1]>0);if(foodSprites.complete&&foodSprites.naturalWidth){const fw=foodSprites.naturalWidth/3,fh=foodSprites.naturalHeight;carried.forEach(([index,count,label],row)=>{const size=unit*.65;for(let j=0;j<Math.min(count,4);j++)c.drawImage(foodSprites,index*fw,0,fw,fh,x+unit*.55+j*size*.65,y-unit*.5-row*unit*.55,size,size*.55);c.save();c.font='600 '+Math.max(8/camera.zoom,unit*.2)+'px system-ui';c.textAlign='left';c.fillStyle='#fff9e4';c.strokeStyle='#263929';c.lineWidth=2/camera.zoom;const caption=label+' '+count;c.strokeText(caption,x+unit*.55,y-unit*.55-row*unit*.55);c.fillText(caption,x+unit*.55,y-unit*.55-row*unit*.55);c.restore()})}
   resourceHits.push({x,y:y-unit*1.4,radius:unit*1.5,caption:p.name+(p.sick?' · 生病':''),speaker:p.name==='夏娃'?'eve':p.name==='亞當'?'adam':'',priority:true});
   const speech=activeSpeech[p.id]&&activeSpeech[p.id].until>Date.now()?activeSpeech[p.id]:null;
   if(speech){
    const message=Array.from(speech.text).slice(0,24).join('');
    const lines=message.length>12?[message.slice(0,12),message.slice(12)]:[message];
    c.font='500 '+Math.max(10,unit*.23)+'px system-ui';
    const width=Math.min(w-20,Math.max(...lines.map(line=>c.measureText(line).width))+20);
    const bx=Math.max(10,Math.min(w-width-10,x-width/2)),by=Math.max(10,y-unit*3.1-lines.length*18);
    c.fillStyle='#fffef7f2';c.beginPath();c.roundRect(bx,by,width,lines.length*18+12,10);c.fill();
    c.fillStyle='#30483a';c.textAlign='left';lines.forEach((line,index)=>c.fillText(line,bx+10,by+19+index*18));
   }
  }
 }
 if(moving||Object.values(activeRest).some(t=>t>Date.now()))animation=requestAnimationFrame(draw);else animation=null;
}
