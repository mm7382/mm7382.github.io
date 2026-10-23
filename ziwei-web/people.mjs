import {readingCopy} from './reading-copy.mjs';
import {peopleCopy} from './people-copy.mjs';

const key='ziwei-web-people-v1';
const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const palaceNames=Object.keys(readingCopy.names.palaces);
const starNames=Object.keys(readingCopy.names.stars);
const base=name=>name.replace(/化[祿權科忌]$/u,'');
const loc=(v,language='zh')=>v?.[language]??'';
const fill=(template,values)=>template.replace(/\{([A-Za-z]+)\}/g,(_,token)=>values[token]??`{${token}}`);

export function createZiweiPeopleStore(storage=globalThis.localStorage){
  let records=[],activeId=null,warning='',corrupted=false,persistent=Boolean(storage);
  try{
    const raw=storage?.getItem(key);
    if(raw){
      const parsed=JSON.parse(raw);
      if(!Array.isArray(parsed.records)||!parsed.records.every(x=>x&&typeof x.id==='string'&&x.profile&&typeof x.profile.birthDate==='string'))throw Error('corrupt');
      records=parsed.records;activeId=typeof parsed.activeId==='string'?parsed.activeId:null;
    }
  }catch{corrupted=true;warning='原有紫微人物資料讀取失敗。為避免覆蓋，請先備份或按「清除全部」重設。';}
  const persist=()=>{
    if(corrupted)throw Error(warning);
    try{storage?.setItem(key,JSON.stringify({version:1,activeId,records}));warning='';persistent=Boolean(storage);}
    catch{warning='瀏覽器儲存不可用；人物暫時只留在這個頁面。';persistent=false;}
  };
  return {
    get warning(){return warning;},get corrupted(){return corrupted;},get persistent(){return persistent;},
    list:()=>records.map(x=>({...x,profile:{...x.profile}})),
    active:()=>records.find(x=>x.id===activeId)??records[0]??null,
    save(name,profile){
      if(corrupted)throw Error(warning);
      if(!profile||!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)||!['solar','lunar'].includes(profile.calendar))throw Error('請先排出有效的紫微命盤。');
      const id=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
      const record={id,name:String(name??'').trim().slice(0,40)||`人物 ${records.length+1}`,profile:{
        birthDate:profile.birthDate,calendar:profile.calendar,leapMonth:Boolean(profile.leapMonth),
        timeState:profile.timeState,time:profile.time,gender:profile.gender}};
      records.push(record);activeId=id;persist();return {...record,profile:{...record.profile}};
    },
    select(id){if(!records.some(x=>x.id===id))throw Error('找不到這位人物。');activeId=id;persist();},
    rename(id,name){const x=records.find(x=>x.id===id);if(!x)throw Error('找不到這位人物。');x.name=String(name??'').trim().slice(0,40)||x.name;persist();},
    remove(id){records=records.filter(x=>x.id!==id);if(activeId===id)activeId=records[0]?.id??null;persist();},
    clear(){storage?.removeItem(key);records=[];activeId=null;warning='';corrupted=false;persistent=Boolean(storage);}
  };
}

function validated(chart){
  if(!chart||chart.palaces?.length!==12||
    new Set(chart.palaces.map(x=>x.name)).size!==12||
    new Set(chart.palaces.map(x=>x.branch)).size!==12||
    !chart.palaces.every(p=>palaceNames.includes(p.name)&&branches.includes(p.branch)&&p.stars?.every(s=>starNames.includes(base(s))))||
    chart.palaces.find(x=>x.branch===chart.soulBranch)?.name!=='命宮'||
    !chart.palaces.some(x=>x.branch===chart.bodyBranch))return null;
  return new Map(chart.palaces.map(x=>[x.branch,x]));
}

function direction(source,target,sourceMap,targetMap){
  const life=sourceMap.get(source.soulBranch),intoLife=targetMap.get(source.soulBranch),intoBody=targetMap.get(source.bodyBranch);
  if(!life||!intoLife||!intoBody)return null;
  return {life:{sourceBranch:source.soulBranch,targetPalace:intoLife.name,targetStars:intoLife.stars.map(base)},
    body:{sourceBranch:source.bodyBranch,targetPalace:intoBody.name,targetStars:intoBody.stars.map(base)},
    lifeStars:life.stars.map(s=>({name:base(s),sourceBranch:source.soulBranch,targetPalace:intoLife.name}))};
}

export function compareZiweiCharts(first,second){
  const a=validated(first),b=validated(second);if(!a||!b)return null;
  const firstToSecond=direction(first,second,a,b),secondToFirst=direction(second,first,b,a);
  return firstToSecond&&secondToFirst?{firstToSecond,secondToFirst}:null;
}

function safeName(candidate,fallback){
  const name=String(candidate??'').trim();
  return name&&!/[0-9０-９零〇○一二三四五六七八九十百千兩两壹貳參肆伍陸柒捌玖拾年月日時时點点{}]/u.test(name)?name:fallback;
}

export function renderZiweiRole(source,target,palace,language='zh'){
  const role=peopleCopy.roles[palace];if(!role)return null;
  return fill(loc(peopleCopy.roleLine,language),{source,target,role:loc(role,language)});
}

export function shareZiweiComparison({first,second,comparison,firstName,secondName,firstProfile,secondProfile,language='zh'}){
  if(!comparison||JSON.stringify(comparison)!==JSON.stringify(compareZiweiCharts(first,second)))return null;
  const a=safeName(firstName,loc(peopleCopy.copy.synCardFirstFallback,language));
  const b=safeName(secondName,loc(peopleCopy.copy.synCardSecondFallback,language));
  const nameOf=p=>language==='zh'?p:(readingCopy.names.palaces[p]??p);
  const statement=fill(loc(peopleCopy.copy.synCardStatement,language),{
    first:a,second:b,firstPalace:nameOf(comparison.firstToSecond.life.targetPalace),
    secondPalace:nameOf(comparison.secondToFirst.life.targetPalace)});
  const cells=branches.map(branch=>{
    const p=first.palaces.find(x=>x.branch===branch),q=second.palaces.find(x=>x.branch===branch);
    return `${branch} · ${nameOf(p.name)} / ${nameOf(q.name)}`;
  });
  const assumed=first.hourAssumed||second.hourAssumed||firstProfile?.timeState==='unknown'||secondProfile?.timeState==='unknown';
  return [a,b,statement,...cells,loc(peopleCopy.copy.synShareNote,language),
    assumed?loc(peopleCopy.hourAssumed,language):'',language==='zh'?'時來－紫微':'SHILAI－Zi Wei'].filter(Boolean).join('\n');
}
