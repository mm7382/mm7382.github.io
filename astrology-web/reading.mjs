import {bodies,localToUtc,positionsAt} from './chart.mjs';

const angles=[['conjunction',0],['sextile',60],['square',90],['trine',120],['opposition',180]];
const kindRank={conjunction:0,opposition:1,square:2,trine:3,sextile:4};
const phaseRank={exact:0,applying:1,separating:2};
const slowToFast=['pluto','neptune','uranus','saturn','jupiter','mars','venus','mercury','sun','moon'];
const domainOrder=['theme','work','love','money'];
const separation=(a,b)=>{let d=(b-a)%360;if(d>180)d-=360;if(d<=-180)d+=360;return Math.abs(d);};
const targetRank=target=>target==='ascendant'?0:target==='midheaven'?1:2+bodies.indexOf(target);
function match(longitude,target,limit){
  const distance=separation(longitude,target);
  for(const [kind,exact] of angles){const orb=Math.abs(distance-exact);if(orb<=limit)return {kind,orb,exact};}
  return null;
}
function compareKeys(a,b){
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i]?-1:1;
  return 0;
}
export function transitReport(instant,chart,astronomy=globalThis.Astronomy){
  const date=instant instanceof Date?instant:new Date(instant);
  if(Number.isNaN(date.getTime())||date.getUTCFullYear()<1700||date.getUTCFullYear()>2200)throw new Error('日期不在原 App 支援的行運範圍（1700–2200）。');
  const partial=chart.completeness==='validPartial';
  const targets=chart.placements.map(p=>({name:p.body,longitude:p.longitude}));
  if(!partial){targets.push({name:'ascendant',longitude:chart.ascendant},{name:'midheaven',longitude:chart.midheaven});}
  const now=positionsAt(astronomy,date),soon=positionsAt(astronomy,new Date(date.getTime()+3600000));
  const candidates=[];
  for(let i=0;i<now.length;i++)for(const target of targets){
    const body=now[i].body,limit=body==='sun'||body==='moon'?2:1;
    const hit=match(now[i].longitude,target.longitude,limit);
    if(!hit)continue;
    const soonOrb=Math.abs(separation(soon[i].longitude,target.longitude)-hit.exact);
    const phase=hit.orb<=0.1?'exact':soonOrb<hit.orb?'applying':'separating';
    const key=[target.name==='ascendant'||target.name==='midheaven'?0:1,slowToFast.indexOf(body),targetRank(target.name),kindRank[hit.kind],hit.orb,phaseRank[phase],i];
    candidates.push({transiting:body,target:target.name,kind:hit.kind,orb:hit.orb,phase,sortKey:key});
  }
  candidates.sort((a,b)=>compareKeys(a.sortKey,b.sortKey));
  return {instant:date.toISOString(),ruleVersion:'orb-v1',candidates,angleTargetsExcluded:partial};
}
export function adviceForDate(dateText,timeZone,chart,bundle,locale='zh-Hant',astronomy=globalThis.Astronomy){
  const [year,month,day]=String(dateText).split('-').map(Number);
  const valid=new Date(Date.UTC(year,month-1,day));
  if(!Number.isInteger(year)||valid.getUTCFullYear()!==year||valid.getUTCMonth()+1!==month||valid.getUTCDate()!==day)throw new Error('請選擇有效日期。');
  if(bundle.bundleVersion!=='rules-v1.0'||bundle.orbPolicy!=='orb-v1'||!Array.isArray(bundle.rules)||!bundle.fallbacks?.entries)throw new Error('原 App 規則資料無法讀取。');
  const start=localToUtc(year,month,day,0,0,timeZone).utc;
  // Native Calendar adds 12 elapsed hours to the local start of day.
  const report=transitReport(new Date(start.getTime()+12*3600000),chart,astronomy);
  const matches=[];
  for(const candidate of report.candidates){
    const hits=bundle.rules.filter(rule=>rule.status==='approved'&&rule.condition.transiting===candidate.transiting&&rule.condition.kind===candidate.kind&&rule.condition.target===candidate.target)
      .sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id,'en'));
    for(const rule of hits)matches.push({rule,trace:candidate});
  }
  const ordinal=Math.trunc(start.getTime()/86400000);
  const items=domainOrder.map(domain=>{
    const matched=matches.find(m=>m.rule.domain===domain);
    if(matched)return {domain,copy:matched.rule.copy[locale]??matched.rule.copy['zh-Hant'],trace:matched.trace,ruleId:matched.rule.id,source:matched.rule.source};
    const entry=bundle.fallbacks.entries.find(x=>x.domain===domain);
    const variants=entry?.variants??[];
    const variant=variants[((ordinal%variants.length)+variants.length)%variants.length];
    return {domain,copy:variant?.[locale]??variant?.['zh-Hant']??{title:'',body:''},trace:null,ruleId:null,source:null};
  });
  return {day:dateText,items,report,ruleBundleVersion:bundle.bundleVersion};
}
export function sevenDayAdvice(startDate,timeZone,chart,bundle,locale='zh-Hant',astronomy=globalThis.Astronomy){
  const [year,month,day]=startDate.split('-').map(Number);
  return Array.from({length:7},(_,i)=>{
    const date=new Date(Date.UTC(year,month-1,day+i+1));
    const text=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
    return adviceForDate(text,timeZone,chart,bundle,locale,astronomy);
  });
}
