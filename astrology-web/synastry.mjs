import {bodies,signs} from './chart.mjs';

const aspects=[['conjunction',0,8],['sextile',60,4],['square',90,6],['trine',120,6],['opposition',180,8]];
const personal=new Set(['sun','moon','mercury','venus','mars']);
const norm=n=>(n%360+360)%360;
function match(a,b){
  const distance=Math.abs(((b-a+540)%360)-180);
  for(const [kind,angle,limit] of aspects){const orb=Math.abs(distance-angle);if(orb<=limit)return {kind,orb};}
  return null;
}
function houseOf(longitude,cusps){
  for(let i=0;i<12;i++){
    const span=norm(cusps[(i+1)%12]-cusps[i]),offset=norm(longitude-cusps[i]);
    if(span===0?i===0:offset<span)return i+1;
  }
  return null;
}
function samples(chart,body){
  if(chart.completeness==='complete')return [chart.placements.find(p=>p.body===body).longitude];
  const values=chart.uncertaintySamples?.[body];
  if(!Array.isArray(values)||values.length!==25)throw new Error('部分盤缺少全日星體樣本，請重新排盤。');
  return values;
}
export function compareCharts(first,second){
  if(!first?.placements||!second?.placements)throw new Error('請先選擇兩張星盤。');
  const hasUnknownTime=first.completeness!=='complete'||second.completeness!=='complete';
  const comparisons=['sun','moon'].map(body=>{
    const a=first.placements.find(p=>p.body===body),b=second.placements.find(p=>p.body===body);
    return {point:body,firstSigns:a.candidateSigns,secondSigns:b.candidateSigns};
  });
  if(!hasUnknownTime)comparisons.push({point:'ascendant',firstSigns:[signs[Math.floor(first.ascendant/30)]],secondSigns:[signs[Math.floor(second.ascendant/30)]]});
  const found=[];
  for(const firstBody of bodies)for(const secondBody of bodies){
    const orbs=new Map();
    // Unknown birth times are independent: compare every sampled hour against
    // every sampled hour. Pairing matching clock hours would invent a relation.
    for(const a of samples(first,firstBody))for(const b of samples(second,secondBody)){
      const hit=match(a,b);if(hit){const list=orbs.get(hit.kind)??[];list.push(hit.orb);orbs.set(hit.kind,list);}
    }
    for(const [kind] of aspects){
      const values=orbs.get(kind);if(!values?.length)continue;
      found.push({id:`${firstBody}-${secondBody}-${kind}`,first:firstBody,second:secondBody,kind,minimumOrb:Math.min(...values),maximumOrb:Math.max(...values),unconfirmed:hasUnknownTime});
    }
  }
  found.sort((a,b)=>a.minimumOrb-b.minimumOrb||(a.id<b.id?-1:a.id>b.id?1:0));
  const houseOverlays=[];
  if(!hasUnknownTime)for(const [from,into,firstInSecond] of [[first,second,true],[second,first,false]]){
    for(const placement of from.placements){const house=houseOf(placement.longitude,into.cusps);if(house)houseOverlays.push({firstInSecond,body:placement.body,house});}
  }
  const basicAspects=found.filter(a=>personal.has(a.first)||personal.has(a.second)).slice(0,3);
  const ids=new Set(basicAspects.map(a=>a.id));
  return {comparisons,aspects:found,basicAspects,remainingAspects:found.filter(a=>!ids.has(a.id)),houseOverlays,hasUnknownTime,orbVersion:'orb-v1'};
}
