import {MONTH_COPY} from './month-copy.mjs';

const KEY='shilai.bazi.practice.v1';
const ALL=['peer','rob','eatingGod','hurtingOfficer','indirectWealth','directWealth','sevenKillings','directOfficer','indirectResource','directResource'];
const LABELS={
  zh:{peer:'比肩',rob:'劫財',eatingGod:'食神',hurtingOfficer:'傷官',indirectWealth:'偏財',directWealth:'正財',sevenKillings:'七殺',directOfficer:'正官',indirectResource:'偏印',directResource:'正印'},
  en:{peer:'Peer',rob:'Rob Wealth',eatingGod:'Eating God',hurtingOfficer:'Hurting Officer',indirectWealth:'Indirect Wealth',directWealth:'Direct Wealth',sevenKillings:'Seven Killings',directOfficer:'Direct Officer',indirectResource:'Indirect Resource',directResource:'Direct Resource'},
};
const GROUP={peer:'peer',rob:'peer',eatingGod:'output',hurtingOfficer:'output',indirectWealth:'wealth',directWealth:'wealth',sevenKillings:'officer',directOfficer:'officer',indirectResource:'resource',directResource:'resource'};
export const tenGodLabel=(god,lang='zh')=>LABELS[lang]?.[god]??god;

/** Same fixed date seed and option order as BaziDailyQuiz.make in the original app. */
export function buildDailyQuiz(today,seed) {
  const {dayStem,dayMaster,tenGod}=today??{};
  if (!dayStem||!dayMaster||!ALL.includes(tenGod)) return null;
  const others=ALL.filter(item=>item!==tenGod);
  const start=[...seed].reduce((hash,char)=>(hash*31+char.codePointAt(0))%9973,0)%others.length;
  const options=[others[start],others[(start+1)%others.length],others[(start+2)%others.length]];
  options.splice(start%4,0,tenGod);
  return {dayStem,dayMaster,answer:tenGod,options};
}

/** Only a yyyy-mm-dd -> correct boolean map, matching the native practice log. */
export function createPracticeLog(storage=globalThis.localStorage) {
  let persistent=true,warning='',entries={};
  try {
    const raw=storage.getItem(KEY);
    if(raw) {
      const value=JSON.parse(raw);
      if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('damaged');
      entries=Object.fromEntries(Object.entries(value).filter(([date,correct])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&typeof correct==='boolean'));
    }
  } catch {persistent=false;warning='瀏覽器無法讀取或儲存每日練習；這次答案只會留在目前頁面。';}
  return {
    get warning(){return warning;},
    get persistent(){return persistent;},
    answer(date){return entries[date];},
    record(date,correct){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      entries[date]=Boolean(correct);
      if(persistent) try {storage.setItem(KEY,JSON.stringify(entries));}
      catch {persistent=false;warning='瀏覽器無法儲存每日練習；這次答案只會留在目前頁面。';}
    },
    summary(monthPrefix){
      const hits=Object.entries(entries).filter(([date])=>date.startsWith(monthPrefix+'-'));
      return {answered:hits.length,correct:hits.filter(([,value])=>value).length};
    },
    clearAll(){
      entries={};
      try {storage.removeItem(KEY);persistent=true;warning='';}
      catch {persistent=false;warning='瀏覽器無法清除每日練習紀錄，請檢查瀏覽器設定。';}
    },
  };
}

export function buildMonthlyReport(dayMaster,month,engine,practiceLog,lessonsRead=0) {
  if(!month?.gan||!dayMaster) return null;
  const god=engine.tenGod(dayMaster,month.gan);
  if(!ALL.includes(god)) return null;
  const previous=new Date(Date.UTC(month.year,month.month-2,1)).toISOString().slice(0,7);
  const summary=practiceLog.summary(previous);
  const read=Math.max(0,Number(lessonsRead)||0);
  const headline={
    zh:`${month.month} 月的月柱是「${month.ganZhi}」。月干「${month.gan}」對你的日主「${dayMaster}」是${tenGodLabel(god,'zh')}。`,
    en:`The Month Pillar for month ${month.month} is ${month.ganZhi}. Its stem, ${month.gan}, is ${tenGodLabel(god,'en')} to your Day Master ${dayMaster}.`,
  };
  const noPractice=summary.answered===0&&read===0;
  const review={
    zh:noPractice?'上個月沒有練習紀錄。這個月做一題就算開始，不用補前面的。':`上個月你答了 ${summary.answered} 題、對 ${summary.correct} 題，讀了 ${read} 堂課。答錯的部分不用在意，記得回去看解說就好。`,
    en:noPractice?"No practice was recorded last month. One question this month is a fine start. There's nothing to catch up on.":`Last month you answered ${summary.answered} questions, got ${summary.correct} right, and read ${read} lessons. Don't worry about the misses. Just go back and read the explanations.`,
  };
  return {month,god,headline,meaning:{zh:MONTH_COPY.meaning.zh[god],en:MONTH_COPY.meaning.en[god]},
    practices:{zh:MONTH_COPY.practices.zh[GROUP[god]],en:MONTH_COPY.practices.en[GROUP[god]]},review};
}
