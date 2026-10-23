import {calculateBaziChart, prepareBaziProfile} from './chart.mjs';
import {PLAIN_COPY} from './plain-copy.mjs';

const groups = {peer:'peer',rob:'peer',eatingGod:'output',hurtingOfficer:'output',
  indirectWealth:'wealth',directWealth:'wealth',sevenKillings:'officer',directOfficer:'officer',
  indirectResource:'resource',directResource:'resource'};
const groupOrder = ['peer','output','wealth','officer','resource'];
const stemPhase = {甲:['wood',true],乙:['wood',false],丙:['fire',true],丁:['fire',false],
  戊:['earth',true],己:['earth',false],庚:['metal',true],辛:['metal',false],壬:['water',true],癸:['water',false]};

function bilingual(table, key) {
  return {zh:table.zh[key] ?? '', en:table.en[key] ?? ''};
}
function context(group, name) {
  return {zh:PLAIN_COPY.contexts.zh[group]?.[name] ?? '',en:PLAIN_COPY.contexts.en[group]?.[name] ?? ''};
}
function theme(group, name) {
  const field = name === 'personality' ? 'later' : name === 'love' ? 'intimacy' : 'work';
  return {
    zh:[PLAIN_COPY.contexts.zh[group]?.[field],PLAIN_COPY.themeTails.zh[group]?.[name]].filter(Boolean),
    en:[PLAIN_COPY.contexts.en[group]?.[field],PLAIN_COPY.themeTails.en[group]?.[name]].filter(Boolean),
  };
}

/** Exact prose contracts from BaziPlain, with the native engine as the only chart/date calculator. */
export function calculateBaziReading(profile, engine, date, focusDomain = 'work') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('請選擇有效日期。');
  if (!['work','love','money'].includes(focusDomain)) throw new Error('請選擇工作、感情或財務。');
  const chart = calculateBaziChart(profile, engine, date);
  const normalized = prepareBaziProfile(profile, engine);
  const input = {...normalized,date,activity:'negotiation',startHour:9,endHour:21,focusDomain};
  const config = {version:1,notice:'命理學習與民俗參考。',timingEnabled:false};
  const native = JSON.parse(engine.calculateJSON(JSON.stringify(input),JSON.stringify(config)));
  if (!native.ok) throw new Error(native.error);
  const upcoming = JSON.parse(engine.calculateUpcomingJSON(JSON.stringify(input)));
  if (!upcoming.ok) throw new Error(upcoming.error);
  const raw = native.result;
  const day = chart.dayMaster;
  const phase = stemPhase[day];
  const dayMasterSentence = phase ? {
    zh:PLAIN_COPY.dayMaster.zh[phase[0]][phase[1]?'yang':'yin'],
    en:PLAIN_COPY.dayMaster.en[phase[0]][phase[1]?'yang':'yin'],
  } : {zh:'',en:''};
  const byName = name => chart.pillars.find(p=>p.name===name);
  const dayPillar = byName('日柱');
  const monthPillar = byName('月柱');
  const hourPillar = byName('時柱');
  const loveGroup = groups[dayPillar?.mainStemTenGod];
  const workGroup = groups[monthPillar?.tenGod];
  const laterGroup = groups[hourPillar?.tenGod];
  const counts = Object.fromEntries(groupOrder.map(g=>[g,0]));
  for (const pillar of chart.pillars) {
    if (pillar.name !== '日柱' && groups[pillar.tenGod]) counts[groups[pillar.tenGod]]++;
    if (groups[pillar.mainStemTenGod]) counts[groups[pillar.mainStemTenGod]]++;
  }
  const most = groupOrder.reduce((winner,g)=>counts[g]>counts[winner]?g:winner);
  const least = groupOrder.reduce((winner,g)=>counts[g]<counts[winner]?g:winner);
  const homework = {
    zh:`你的預設是「${PLAIN_COPY.homework.zh[most]}」，這一塊不用學就會。最少的是「${PLAIN_COPY.homework.zh[least]}」，那通常就是你的功課——不是缺陷，是沒練過。`,
    en:`Your default is ${PLAIN_COPY.homework.en[most]}. That comes without practice. Your weakest area is ${PLAIN_COPY.homework.en[least]}. That's usually what to work on. It isn't a flaw, just less practiced.`,
  };
  const themes = {
    personality:theme(most,'personality'),
    love:loveGroup?theme(loveGroup,'love'):null,
    work:workGroup?theme(workGroup,'work'):null,
  };
  const luck = raw.luck ? {...raw.luck,pillars:raw.luck.pillars.map(p=>{
    const god = engine.tenGod(day,p.ganZhi[0]);
    const group = groups[god];
    return {...p,meaning:group?bilingual(PLAIN_COPY.cycles,group):{zh:'',en:''},
      years:p.years.map(y=>({...y,meaning:bilingual(PLAIN_COPY.years,engine.tenGod(day,y.ganZhi[0]))}))};
  })} : null;
  return {
    dayMasterSentence, closeRelationship:loveGroup?context(loveGroup,'intimacy'):null,
    workAndDaily:workGroup?context(workGroup,'work'):null,
    privateAndLater:laterGroup?context(laterGroup,'later'):null,
    homework,themes,luck,
    today:raw.homeToday, branchContext:raw.branchContext, dailyCopy:raw.dailyCopy,
    sevenDays:upcoming.result.days, lunarDate:raw.lunarDate, solarTerm:raw.solarTerm,
    timeNote:chart.timeNote,hourKnown:!chart.timeUncertain,
    sourceVersion:raw.version,
  };
}
