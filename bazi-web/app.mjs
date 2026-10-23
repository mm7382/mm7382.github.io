import { calculateBaziChart } from './chart.mjs';
import { calculateBaziReading } from './reading.mjs';
import {createBaziProfileBook} from './profiles.mjs';
import {compareBaziCharts} from './synastry.mjs';
import {createStudyStore} from './learn/study.mjs';
import {buildDailyQuiz,buildMonthlyReport,createPracticeLog,tenGodLabel} from './monthly.mjs';

const $ = id => document.getElementById(id);
const phaseEnglish = {木:'Wood',火:'Fire',土:'Earth',金:'Metal',水:'Water'};
const gods = {peer:'比肩',rob:'劫財',eatingGod:'食神',hurtingOfficer:'傷官',indirectWealth:'偏財',directWealth:'正財',sevenKillings:'七殺',directOfficer:'正官',indirectResource:'偏印',directResource:'正印'};
let activeProfile = null;
let activeRecordId = null;
const blockedStorage = {getItem(){throw Error('disabled')},setItem(){throw Error('disabled')},removeItem(){throw Error('disabled')}};
let browserStorage;
try {browserStorage=window.localStorage;} catch {browserStorage=blockedStorage;}
const profileBook=createBaziProfileBook(browserStorage);
const studyStore=createStudyStore(browserStorage);
const practiceLog=createPracticeLog(browserStorage);
const quizChoices=new Map();
const node = (tag, className, value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
};

function syncFields() {
  const lunar = $('calendar').value === 'lunar';
  $('leap-wrap').hidden = !lunar;
  if (!lunar) $('leapMonth').checked = false;
  const state = $('timeState').value;
  $('exact-wrap').hidden = state !== 'exact';
  $('branch-wrap').hidden = state !== 'earthlyBranch';
  $('time').disabled = state !== 'exact';
  $('branch').disabled = state !== 'earthlyBranch';
  $('custom-zone-wrap').hidden = $('zone').value !== 'other';
  $('custom-zone').required = $('zone').value === 'other';
}

function renderChart(chart, sample = false, reveal = true) {
  $('result-kind').hidden = !sample;
  $('result-kind').textContent = sample ? '教學例盤・非個人結果 / Sample chart, not your personal result' : '';
  $('pillar-grid').replaceChildren();
  for (const pillar of chart.pillars) {
    const card = node('article', 'pillar');
    card.append(node('p', 'pillar-name', pillar.name));
    const characters = node('div', 'characters');
    const stem = node('span', 'stem', pillar.stem), branch = node('span', 'branch', pillar.branch);
    stem.setAttribute('aria-label', `天干 ${pillar.stem}，五行${pillar.element}`);
    branch.setAttribute('aria-label', `地支 ${pillar.branch}，主氣${pillar.branchElement}`);
    characters.append(stem, branch);
    card.append(characters);
    card.append(node('p', 'phase-caption', `天干 ${pillar.element} · 地支主氣 ${pillar.branchElement}`));
    card.append(node('p', 'god-caption', pillar.tenGod ? `天干十神・${gods[pillar.tenGod]}` : '日主・看盤的起點'));
    card.append(node('p', 'hidden-stem', `主氣 ${pillar.mainStem} · ${gods[pillar.mainStemTenGod]}`));
    $('pillar-grid').append(card);
  }
  if (chart.timeUncertain) {
    const missing = node('article', 'pillar missing');
    missing.append(node('p', 'pillar-name', '時柱'), node('div', 'characters', '？'), node('p', 'phase-caption', '出生時間未知，暫不排出'));
    $('pillar-grid').append(missing);
  }
  $('result-meta').textContent = `國曆 ${chart.birthSolar} · ${chart.birthLunar}`;
  $('time-note').textContent = chart.timeNote;
  $('day-master').textContent = chart.dayMaster;
  $('phase-counts').replaceChildren(...Object.entries(chart.phaseCounts).map(([phase, count]) => {
    const row = node('div', 'phase-row');
    row.append(node('strong', '', phase), node('span', '', phaseEnglish[phase]), node('b', '', String(count)));
    const bar = node('span', 'phase-track');
    const fill = node('i', ''); fill.style.width = `${(count / 8) * 100}%`;
    bar.append(fill); row.append(bar); return row;
  }));
  $('results').hidden = false;
  if (reveal) {
    $('results-title').focus({preventScroll:true});
    $('results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  }
}

function appendText(parent, tag, value, className = '') {
  const item = node(tag, className, value);
  parent.append(item);
  return item;
}

function renderReading() {
  if (!activeProfile) return;
  const date = $('reading-date').value;
  const domain = $('reading-domain').value;
  const lang = $('reading-language').value;
  try {
    const data = calculateBaziReading(activeProfile, window.FortuneEngine, date, domain);
    $('reading-error').hidden = true;
    const plain = $('plain-reading'); plain.replaceChildren();
    appendText(plain, 'p', '01 / THE PLAIN READING', 'eyebrow');
    appendText(plain, 'h3', lang === 'zh' ? '這張盤，先用白話說。' : 'Your chart, in plain words.');
    appendText(plain, 'p', data.dayMasterSentence[lang], 'reading-lead');
    if (!data.hourKnown) appendText(plain, 'p', data.timeNote, 'reading-note');
    for (const [label, key] of [[lang === 'zh'?'最親近的關係':'Closest relationships','closeRelationship'],
      [lang === 'zh'?'工作與日常':'Work and daily life','workAndDaily'],
      [lang === 'zh'?'私下與往後':'Private life and later years','privateAndLater']]) {
      if (!data[key]?.[lang]) continue;
      const row = node('div', 'reading-row'); appendText(row, 'h4', label); appendText(row, 'p', data[key][lang]); plain.append(row);
    }
    appendText(plain, 'p', data.homework[lang], 'reading-note');
    const themes = node('div','theme-grid');
    for (const [key, label] of [['personality',lang==='zh'?'性格':'Personality'],['love',lang==='zh'?'感情':'Relationships'],['work',lang==='zh'?'工作':'Work']]) {
      const words = data.themes[key]?.[lang]; if (!words?.length) continue;
      const card = node('article','theme-card'); appendText(card,'h4',label);
      for (const line of words) appendText(card,'p',line); themes.append(card);
    }
    plain.append(themes);

    const quizPanel=$('quiz-reading');quizPanel.replaceChildren();
    const quiz=buildDailyQuiz(data.today,date);
    if(quiz) {
      appendText(quizPanel,'p','TODAY / ONE QUESTION','eyebrow');
      appendText(quizPanel,'h3',lang==='zh'?'今日練習：先猜，再看推導。':"Today's practice: have a guess first.");
      appendText(quizPanel,'p',lang==='zh'?`今天的日干「${quiz.dayStem}」對你的日主「${quiz.dayMaster}」是什麼十神？`:`Which Ten God is today's stem ${quiz.dayStem} to your Day Master ${quiz.dayMaster}?`,'reading-lead');
      const answered=practiceLog.answer(date)!==undefined;
      const buttons=node('div','quiz-options');
      for(const option of quiz.options) {
        const button=node('button','quiz-option',tenGodLabel(option,lang));button.type='button';button.disabled=answered;
        if(answered&&option===quiz.answer) button.classList.add('correct');
        button.addEventListener('click',()=>{
          practiceLog.record(date,option===quiz.answer);quizChoices.set(date,option);
          renderReading();showStorageWarning();
        });buttons.append(button);
      }
      quizPanel.append(buttons);
      if(answered) {
        const choice=quizChoices.get(date);
        appendText(quizPanel,'p',choice===quiz.answer?(lang==='zh'?'答對了。':'Correct.'):
          (lang==='zh'?`正確答案是${tenGodLabel(quiz.answer,lang)}。`:`The answer is ${tenGodLabel(quiz.answer,lang)}.`),'reading-note');
        appendText(quizPanel,'p',lang==='zh'?`因為日干「${quiz.dayStem}」相對日主「${quiz.dayMaster}」的關係是${tenGodLabel(quiz.answer,lang)}。`:
          `The stem ${quiz.dayStem} relates to your Day Master ${quiz.dayMaster} as ${tenGodLabel(quiz.answer,lang)}.`,'reading-note');
        const lesson=node('a','text-link',lang==='zh'?'去看「十神怎麼推導」這一堂 ↗':'See how Ten Gods are worked out ↗');
        lesson.href='./learn/P09/';quizPanel.append(lesson);
      } else appendText(quizPanel,'p',lang==='zh'?'先想一下再按，答錯也會看到完整推導。':"Take a guess first. You'll see how it's worked out either way.",'reading-note');
    }

    const monthly=$('monthly-reading');monthly.replaceChildren();
    const lessonsRead=studyStore.entries().filter(item=>item.read).length;
    const report=buildMonthlyReport(data.today.dayMaster,data.monthContext,window.FortuneEngine,practiceLog,lessonsRead);
    if(report) {
      appendText(monthly,'p','MONTHLY / PRACTICE & REVIEW','eyebrow');
      appendText(monthly,'h3',lang==='zh'?`${report.month.month} 月・${report.month.ganZhi}`:`Month ${report.month.month} · ${report.month.ganZhi}`);
      appendText(monthly,'p',report.headline[lang],'reading-lead');
      appendText(monthly,'p',report.meaning[lang]);
      appendText(monthly,'h4',lang==='zh'?'這個月，試試三件小事。':'Three small things to try this month.');
      const list=node('ol','monthly-practices');
      for(const practice of report.practices[lang]) appendText(list,'li',practice);
      monthly.append(list);
      appendText(monthly,'h4',lang==='zh'?'上月回顧':'Last month');
      appendText(monthly,'p',report.review[lang]);
      appendText(monthly,'p',lang==='zh'?'取當月 15 日正午的月柱，避開節氣交界；這是傳統分類與原 App 的練習提案，並非事件預測。':
        'The Month Pillar is taken at noon on the 15th, away from solar-term boundaries. This is a learning prompt, not a prediction.','reading-note');
    }

    const luck = $('luck-reading'); luck.replaceChildren();
    if (data.luck?.pillars?.length) {
      appendText(luck,'p','02 / TEN-YEAR CYCLES','eyebrow');
      appendText(luck,'h3',lang==='zh'?'十年一段，看看各段的主題。':'A theme for each ten-year cycle.');
      appendText(luck,'p',lang==='zh'?'大運描述不同階段與日主的關係，不預測具體事件。':'These cycles describe themes, not specific events.','reading-note');
      const list=node('div','cycle-list');
      for (const cycle of data.luck.pillars) {
        const details=node('details','cycle'); if (cycle.current) details.open=true;
        const summary=node('summary');
        appendText(summary,'b',cycle.ganZhi,'cycle-mark');
        appendText(summary,'span',lang==='zh'?`${cycle.startAge}–${cycle.endAge} 歲`:`Ages ${cycle.startAge}–${cycle.endAge}`);
        if (cycle.current) appendText(summary,'em',lang==='zh'?'現在':'Now');
        details.append(summary); appendText(details,'p',cycle.meaning[lang]);
        if (cycle.current) {
          const years=node('div','cycle-years');
          for (const year of cycle.years) {
            const row=node('div','cycle-year'); appendText(row,'strong',`${year.year} · ${year.ganZhi}`);
            appendText(row,'span',year.meaning[lang]); years.append(row);
          }
          details.append(years);
        }
        list.append(details);
      }
      luck.append(list);
    }

    const today = $('today-reading'); today.replaceChildren();
    appendText(today,'p','03 / TODAY','eyebrow');
    appendText(today,'h3',lang==='zh'?`${date}，今日與你的關係。`:`Today and your chart · ${date}`);
    appendText(today,'p',data.today.subtitle,'reading-lead');
    const advice=node('div','advice-grid');
    for (const item of data.today.domains) {
      const card=node('article',`advice-card${item.id===domain?' active':''}`);
      appendText(card,'h4',item.label); appendText(card,'p',data.today.advice[item.id]?.text || ''); advice.append(card);
    }
    today.append(advice);
    const layers=node('div','source-grid');
    for (const layer of Object.values(data.today.layers)) {
      if (!layer) continue;
      const card=node('article','source-card'); appendText(card,'h4',layer.label); appendText(card,'p',layer.text); layers.append(card);
    }
    today.append(layers);
    appendText(today,'p',data.dailyCopy.lead,'reading-note');
    appendText(today,'p',data.dailyCopy.sourceNote,'reading-note');
    appendText(today,'p',data.dailyCopy.tipsLabel,'reading-note');
    for (const tip of data.dailyCopy.tips) appendText(today,'p',tip,'reading-tip');
    appendText(today,'p',data.dailyCopy.disclaimer,'reading-note');

    const seven=$('seven-reading'); seven.replaceChildren();
    appendText(seven,'p','04 / NEXT SEVEN DAYS','eyebrow');
    appendText(seven,'h3',lang==='zh'?'接下來七天，一天一天看。':'The next seven days, one at a time.');
    appendText(seven,'p',lang==='zh'?'七筆是各自的「日」，不是一個新的「週運勢」或吉凶排行。':'Seven separate days, with no ranking or prediction.','reading-note');
    const days=node('div','seven-grid');
    for (const day of data.sevenDays) {
      const card=node('article','day-card'); appendText(card,'span',day.date,'day-date');
      appendText(card,'h4',`${day.ganzhi} · ${day.relationLabel}`);
      appendText(card,'p',day.advice?.[domain]?.text || '');
      appendText(card,'small',day.layers?.calendar?.text || ''); days.append(card);
    }
    seven.append(days);
    $('reading').hidden=false;
  } catch(error) {
    $('reading').hidden=false;
    $('reading-error').textContent=error instanceof Error?error.message:'解讀暫時無法顯示。';
    $('reading-error').hidden=false;
    for (const id of ['plain-reading','luck-reading','quiz-reading','monthly-reading','today-reading','seven-reading']) $(id).replaceChildren();
  }
}

function peopleMessage(value) {
  $('people-message').textContent=value;
  $('people-message').hidden=!value;
}

function showStorageWarning() {
  const warning=[profileBook.warning,studyStore.warning,practiceLog.warning].filter(Boolean).join(' ');
  $('storage-warning').textContent=warning;
  $('storage-warning').hidden=!warning;
}

function fillBirthForm(profile) {
  $('calendar').value=profile.calendar;
  $('birthDate').value=profile.birthDate;
  $('leapMonth').checked=Boolean(profile.leapMonth);
  $('timeState').value=profile.timeState;
  if (profile.timeState==='earthlyBranch') $('branch').value=profile.time;
  else $('time').value=profile.time||'';
  $('gender').value=profile.gender;
  const listed=[...$('zone').options].some(item=>item.value===profile.timeZoneIdentifier);
  $('zone').value=listed?profile.timeZoneIdentifier:'other';
  $('custom-zone').value=listed?'':profile.timeZoneIdentifier;
  $('demo-label').hidden=true;
  syncFields();
}

function openProfile(saved) {
  activeProfile=saved.birth;
  activeRecordId=saved.id;
  fillBirthForm(activeProfile);
  try {
    renderChart(calculateBaziChart(activeProfile,window.FortuneEngine));
    renderReading();
    peopleMessage(`已切換到「${saved.name}」。`);
  } catch(error) { peopleMessage(error instanceof Error?error.message:'這張盤暫時無法開啟。'); }
  renderPeople();
}

function showComparison(saved) {
  if (!activeProfile) {peopleMessage('請先在上方排出自己的命盤。');return;}
  if (activeRecordId===saved.id) {peopleMessage('請選另一位人物，再看兩張盤的對照。');return;}
  try {
    const mine=calculateBaziChart(activeProfile,window.FortuneEngine);
    const theirs=calculateBaziChart(saved.birth,window.FortuneEngine);
    const result=compareBaziCharts(mine,theirs,window.FortuneEngine);
    const lang=$('reading-language').value;
    const comparison=$('comparison'); comparison.replaceChildren();
    appendText(comparison,'p','TWO CHARTS / ONE CONVERSATION','eyebrow');
    appendText(comparison,'h3',`我 × ${saved.name}`);
    const labels=lang==='zh'?['你對他','他對你','相處節奏']:['How you are with them','How they are with you','Your rhythm together'];
    result.readings.forEach((entry,index)=>{
      const row=node('div','comparison-row');
      appendText(row,'strong',labels[index]); appendText(row,'p',entry[lang]);comparison.append(row);
    });
    appendText(comparison,'p',result.note,'comparison-foot');
    if (activeProfile.timeState==='unknown'||saved.birth.timeState==='unknown')
      appendText(comparison,'p','其中一人不知道出生時間；這裡只比較日主與日支。若實際出生在 23:00 後，日柱仍需核對。','comparison-foot');
    const copy=node('button','people-action',lang==='zh'?'複製簡短分享文字':'Copy a short share line');
    copy.type='button';copy.addEventListener('click',async()=>{
      try {await navigator.clipboard.writeText(result.share[lang]);peopleMessage('已複製只含日主與相處節奏的文字，沒有生日。');}
      catch {peopleMessage('瀏覽器未允許複製，請手動選取文字。');appendText(comparison,'p',result.share[lang]);}
    });comparison.append(copy);comparison.hidden=false;
    comparison.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  } catch(error) {peopleMessage(error instanceof Error?error.message:'雙人對照暫時無法完成。');}
}

function renderPeople() {
  const list=$('profile-list');list.replaceChildren();
  const active=profileBook.active();
  const records=profileBook.list();
  if (!records.length) appendText(list,'p','目前還沒儲存人物。先排出自己的盤，或直接加入一位朋友。','reading-note');
  for (const saved of records) {
    const card=node('article',`profile-card${saved.id===active?.id?' active':''}`);
    appendText(card,'h3',saved.name);
    appendText(card,'p',`${saved.birth.birthDate} · ${saved.birth.timeState==='unknown'?'出生時間未知':saved.birth.time}`);
    const actions=node('div','profile-actions');
    const switchButton=node('button','', '切換命盤');switchButton.type='button';
    switchButton.addEventListener('click',()=>{profileBook.select(saved.id);openProfile(saved);});
    const compareButton=node('button','','與目前的盤對照');compareButton.type='button';
    compareButton.addEventListener('click',()=>showComparison(saved));
    const removeButton=node('button','','刪除');removeButton.type='button';
    removeButton.addEventListener('click',()=>{
      if (!window.confirm(`確定刪除「${saved.name}」的出生資料嗎？`)) return;
      profileBook.remove(saved.id);$('comparison').hidden=true;
      if (activeRecordId===saved.id) {activeProfile=null;activeRecordId=null;$('results').hidden=true;$('reading').hidden=true;}
      showStorageWarning();renderPeople();peopleMessage(`已刪除「${saved.name}」。`);
    });
    actions.append(switchButton,compareButton,removeButton);card.append(actions);list.append(card);
  }
  showStorageWarning();
}

$('save-profile').addEventListener('click',()=>{
  if (!activeProfile){peopleMessage('請先在上方排出一張命盤。');return;}
  try {const saved=profileBook.save($('profile-name').value,activeProfile);activeRecordId=saved.id;renderPeople();peopleMessage(`已儲存「${saved.name}」。`);}
  catch(error){peopleMessage(error.message);}
});
$('friend-knows-time').addEventListener('change',()=>{$('friend-time-wrap').hidden=!$('friend-knows-time').checked;});
$('friend-form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const time=$('friend-knows-time').checked?$('friend-time').value:'';
    if ($('friend-knows-time').checked&&!time) throw new Error('請填寫朋友的出生時間，或取消「知道出生時間」。');
    const birth={birthDate:$('friend-birth').value,calendar:'solar',leapMonth:false,
      timeState:time?'exact':'unknown',time,gender:'female',timeZoneIdentifier:'Asia/Taipei'};
    calculateBaziChart(birth,window.FortuneEngine);
    const saved=profileBook.save($('friend-name').value,birth,null,false);
    $('friend-form').reset();$('friend-time-wrap').hidden=true;
    renderPeople();peopleMessage(`已加入「${saved.name}」。`);
  } catch(error) {peopleMessage(error.message);}
});
$('clear-all').addEventListener('click',()=>{
  if (!window.confirm('確定清除這個瀏覽器裡八字的全部人物、課程筆記、複習與每日練習紀錄嗎？這個動作無法復原。')) return;
  profileBook.clear();studyStore.clearAll();practiceLog.clearAll();quizChoices.clear();activeProfile=null;activeRecordId=null;
  $('birth-form').reset();$('results').hidden=true;$('reading').hidden=true;$('comparison').hidden=true;
  renderPeople();peopleMessage(profileBook.persistent&&studyStore.persistent&&practiceLog.persistent?'已清除八字的人物與學習資料。':'清除未完全成功，請查看儲存提示。');
});

$('reading-date').value = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
for (const id of ['reading-date','reading-domain','reading-language']) $(id).addEventListener('change',renderReading);

for (const field of ['calendar','timeState','zone']) $(field).addEventListener('change', syncFields);
$('demo').addEventListener('click', () => {
  $('calendar').value = 'solar'; $('birthDate').value = '2000-08-16'; $('timeState').value = 'exact';
  $('time').value = '03:30'; $('gender').value = 'female'; $('zone').value = 'Asia/Taipei';
  $('demo-label').hidden = false; $('form-error').hidden = true; syncFields(); $('birthDate').focus();
});
for (const field of ['birthDate','time','branch','gender','calendar','timeState','zone','custom-zone','leapMonth']) {
  $(field).addEventListener('input', () => { $('demo-label').hidden = true; });
}
$('birth-form').addEventListener('submit', event => {
  event.preventDefault();
  $('form-error').hidden = true;
  try {
    const profile = {
      calendar:$('calendar').value, birthDate:$('birthDate').value.trim(), leapMonth:$('leapMonth').checked,
      timeState:$('timeState').value, time:$('timeState').value === 'exact' ? $('time').value : $('timeState').value === 'earthlyBranch' ? $('branch').value : '',
      gender:$('gender').value,
      timeZoneIdentifier:$('zone').value === 'other' ? $('custom-zone').value.trim() : $('zone').value,
    };
    if (!profile.birthDate) throw new Error('請先填寫出生日期。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)) throw new Error('出生日期請用西元年－月－日，例如 2000-08-16。');
    if (profile.timeState === 'exact' && !profile.time) throw new Error('請填寫出生時間。');
    if (!profile.timeZoneIdentifier) throw new Error('請填寫出生地時區。');
    const chart = calculateBaziChart(profile, window.FortuneEngine);
    activeProfile = profile;
    activeRecordId = null;
    renderChart(chart, !$('demo-label').hidden);
    renderReading();
  } catch (error) {
    $('results').hidden = true;
    $('reading').hidden = true;
    activeProfile = null;
    activeRecordId = null;
    $('form-error').textContent = error instanceof Error ? error.message : '排盤暫時無法完成，請檢查輸入內容。';
    $('form-error').hidden = false;
    $('form-error').scrollIntoView({block:'nearest'});
  }
});
syncFields();
const restored=profileBook.active();
if (restored) {
  try {
    activeProfile=restored.birth;activeRecordId=restored.id;fillBirthForm(activeProfile);
    renderChart(calculateBaziChart(activeProfile,window.FortuneEngine),false,false);
    renderReading();
  } catch {peopleMessage('先前的人物資料無法排盤，請重新核對出生資料。');}
}
renderPeople();
