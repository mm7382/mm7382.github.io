// Browser port of the frozen ShilaiAstrology calculation contract. Astronomy
// Engine 2.1.19 is vendored separately; the source project is read-only.
export const bodies=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
export const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const aspects=[['conjunction',0,8],['sextile',60,4],['square',90,6],['trine',120,6],['opposition',180,8]];
const rad=Math.PI/180;
const norm=n=>(n%360+360)%360;
const separation=(a,b)=>{let d=(b-a)%360;if(d>180)d-=360;if(d<=-180)d+=360;return d;};
const sign=n=>signs[Math.floor(norm(n)/30)];
const formatterCache=new Map();
function zoneFormatter(zone){
  if(!formatterCache.has(zone))formatterCache.set(zone,new Intl.DateTimeFormat('en-GB',{timeZone:zone,calendar:'gregory',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}));
  return formatterCache.get(zone);
}
function wallParts(utc,zone){
  const parts=Object.fromEntries(zoneFormatter(zone).formatToParts(new Date(utc)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
  return parts;
}
export function localToUtc(year,month,day,hour,minute,zone){
  const wall=Date.UTC(year,month-1,day,hour,minute);
  const offsets=new Set();
  for(let h=-48;h<=48;h+=6){
    const sample=wall+h*3600000,p=wallParts(sample,zone);
    offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-sample);
  }
  const candidates=[...offsets].map(offset=>wall-offset).filter(utc=>{
    const p=wallParts(utc,zone);
    return p.year===year&&p.month===month&&p.day===day&&p.hour===hour&&p.minute===minute;
  }).sort((a,b)=>a-b);
  if(!candidates.length){
    // Foundation Calendar rolls a spring-forward wall time to the first
    // matching minute after the gap (02:30 → 03:30 in New York). Preserve that
    // native result and surface the adjustment in metadata/UI.
    const shifted=[...offsets].map(offset=>wall-offset).map(utc=>({utc,p:wallParts(utc,zone)})).filter(({p})=>
      p.year===year&&p.month===month&&p.day===day&&(p.hour*60+p.minute)>(hour*60+minute)).sort((a,b)=>(a.p.hour*60+a.p.minute)-(b.p.hour*60+b.p.minute));
    if(!shifted.length||shifted[0].p.hour*60+shifted[0].p.minute-hour*60-minute>180)throw new Error('這個日期或時間在出生地時區不存在，請核對夏令時間。');
    return {utc:new Date(shifted[0].utc),ambiguous:false,adjusted:true};
  }
  return {utc:new Date(candidates[0]),ambiguous:candidates.length>1,adjusted:false};
}
function nextDay(year,month,day){const d=new Date(Date.UTC(year,month-1,day+1));return [d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()];}
function longitude(astronomy,body,date){
  const time=new astronomy.AstroTime(date);
  const vector=astronomy.GeoVector(body[0].toUpperCase()+body.slice(1),time,true);
  const rotated=astronomy.RotateVector(astronomy.Rotation_EQJ_ECT(time),vector);
  return norm(astronomy.SphereFromVector(rotated).lon);
}
function position(astronomy,body,date){
  const value=longitude(astronomy,body,date);
  if(body==='sun'||body==='moon')return {body,longitude:value,retrograde:false};
  const later=longitude(astronomy,body,new Date(date.getTime()+3600000));
  return {body,longitude:value,retrograde:separation(value,later)<0};
}
const allPositions=(astronomy,date)=>bodies.map(body=>position(astronomy,body,date));
export const positionsAt=allPositions;
function trueObliquity(tt){
  const t=tt/36525,meanArcseconds=21.448-t*(46.8150+t*(0.00059-t*0.001813));
  const omega=(125.04452-1934.136261*t)*rad;
  const sun=(280.4665+36000.7698*t)*rad;
  const moon=(218.3165+481267.8813*t)*rad;
  return 23+26/60+meanArcseconds/3600+(9.20*Math.cos(omega)+0.57*Math.cos(2*sun)+0.10*Math.cos(2*moon)-0.09*Math.cos(2*omega))/3600;
}
const eclipticFromRa=(ra,obliquity)=>norm(Math.atan2(Math.sin(ra*rad),Math.cos(ra*rad)*Math.cos(obliquity*rad))/rad);
const ascendant=(ramc,latitude,obliquity)=>norm(Math.atan2(Math.cos(ramc*rad),-(Math.sin(ramc*rad)*Math.cos(obliquity*rad)+Math.tan(latitude*rad)*Math.sin(obliquity*rad)))/rad);
function placidus(ramc,latitude,obliquity){
  if(Math.abs(latitude)>=90-obliquity)return null;
  const mc=eclipticFromRa(ramc,obliquity),asc=ascendant(ramc,latitude,obliquity);
  const found={};
  for(const [house,base,factor] of [[11,30,1/3],[12,60,2/3],[2,120,2/3],[3,150,1/3]]){
    let lon=eclipticFromRa(norm(ramc+base),obliquity),converged=false;
    for(let i=0;i<100;i++){
      const declination=Math.asin(Math.sin(obliquity*rad)*Math.sin(lon*rad));
      const sine=Math.tan(latitude*rad)*Math.tan(declination);
      if(Math.abs(sine)>1)return null;
      const next=eclipticFromRa(norm(ramc+base+factor*Math.asin(sine)/rad),obliquity);
      if(Math.abs(separation(lon,next))<1/360000){lon=next;converged=true;break;}
      lon=next;
    }
    if(!converged)return null;
    found[house]=lon;
  }
  return [asc,found[2],found[3],norm(mc+180),norm(found[11]+180),norm(found[12]+180),norm(asc+180),norm(found[2]+180),norm(found[3]+180),mc,found[11],found[12]];
}
function houseOf(longitude,cusps){
  for(let i=0;i<12;i++){
    const span=norm(cusps[(i+1)%12]-cusps[i]),offset=norm(longitude-cusps[i]);
    if(span===0?i===0:offset<span)return i+1;
  }
  return null;
}
function matchAspect(a,b){
  const distance=Math.abs(separation(a,b));
  for(const [kind,angle,limit] of aspects){const orb=Math.abs(distance-angle);if(orb<=limit)return {kind,orb};}
  return null;
}
function chartAspects(placements,samplesByBody=null){
  const result=[];
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
    const first=bodies[i],second=bodies[j],initial=matchAspect(placements[i].longitude,placements[j].longitude);
    if(!samplesByBody){if(initial)result.push({first,second,...initial,unconfirmed:false});continue;}
    const matches=samplesByBody[first].map((v,k)=>matchAspect(v,samplesByBody[second][k]));
    if(initial)result.push({first,second,...initial,unconfirmed:!matches.every(m=>m?.kind===initial.kind)});
    else {const transient=matches.find(Boolean);if(transient)result.push({first,second,...transient,unconfirmed:true});}
  }
  return result;
}
export function calculateChart(input,astronomy=globalThis.Astronomy){
  if(!astronomy)throw new Error('星曆尚未載入。');
  const [year,month,day]=String(input.date).split('-').map(Number);
  const check=new Date(Date.UTC(year,month-1,day));
  if(!Number.isInteger(year)||year<1800||year>2100||check.getUTCFullYear()!==year||check.getUTCMonth()+1!==month||check.getUTCDate()!==day)throw new Error('請輸入有效的出生日期（1800–2100）。');
  const latitude=Number(input.latitude),eastLongitude=Number(input.longitude),zone=input.timeZone;
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(eastLongitude)||Math.abs(eastLongitude)>180)throw new Error('請核對出生地經緯度。');
  try{zoneFormatter(zone);}catch{throw new Error('找不到這個出生地時區。');}
  const unknown=input.time===null||input.time===undefined||input.time==='';
  let dates,first,ambiguous=false,adjusted=false;
  if(unknown){
    first=localToUtc(year,month,day,0,0,zone).utc;
    const [ny,nm,nd]=nextDay(year,month,day),end=localToUtc(ny,nm,nd,0,0,zone).utc;
    dates=Array.from({length:25},(_,i)=>new Date(first.getTime()+(end-first)*i/24));
  }else{
    const time=String(input.time).match(/^(\d{1,2}):(\d{2})$/);
    if(!time||Number(time[1])>23||Number(time[2])>59)throw new Error('請輸入有效的出生時間。');
    const resolved=localToUtc(year,month,day,Number(time[1]),Number(time[2]),zone);
    first=resolved.utc;ambiguous=resolved.ambiguous;adjusted=resolved.adjusted;dates=[first];
  }
  const sampled=dates.map(date=>allPositions(astronomy,date));
  const samplesByBody=Object.fromEntries(bodies.map((body,index)=>[body,sampled.map(row=>row[index].longitude)]));
  const placements=sampled[0].map(item=>{
    const candidates=[...new Set(samplesByBody[item.body].map(sign))];
    return {...item,sign:sign(item.longitude),house:null,candidateSigns:candidates,signIsUnconfirmed:candidates.length>1,dayEndLongitude:unknown?samplesByBody[item.body].at(-1):null};
  });
  let cusps=null,midheaven=null,houseSystem=null,fallbackReason=null;
  if(!unknown){
    const time=new astronomy.AstroTime(first),obliquity=trueObliquity(time.tt),ramc=norm(astronomy.SiderealTime(time)*15+eastLongitude);
    midheaven=eclipticFromRa(ramc,obliquity);
    cusps=placidus(ramc,latitude,obliquity);
    if(cusps)houseSystem='placidus';
    else{houseSystem='wholeSign';fallbackReason=Math.abs(latitude)>=90-obliquity?'extremeLatitude':'undefinedPlacidusSolution';const start=Math.floor(ascendant(ramc,latitude,obliquity)/30)*30;cusps=Array.from({length:12},(_,i)=>norm(start+i*30));}
    for(const item of placements)item.house=houseOf(item.longitude,cusps);
  }
  return {completeness:unknown?'validPartial':'complete',placements,cusps,ascendant:cusps?.[0]??null,midheaven,houseSystem,fallbackReason,aspects:chartAspects(placements,unknown?samplesByBody:null),metadata:{ephemerisName:'Astronomy Engine',ephemerisVersion:'2.1.19',utcInstant:first.toISOString(),resolvedTimeZoneIdentifier:zone,ambiguousBirthTime:ambiguous,adjustedBirthTime:adjusted}};
}
