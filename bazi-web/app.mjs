import { calculateBaziChart } from './chart.mjs';
import { calculateBaziReading } from './reading.mjs';

const $ = id => document.getElementById(id);
const phaseEnglish = {木:'Wood',火:'Fire',土:'Earth',金:'Metal',水:'Water'};
const gods = {peer:'比肩',rob:'劫財',eatingGod:'食神',hurtingOfficer:'傷官',indirectWealth:'偏財',directWealth:'正財',sevenKillings:'七殺',directOfficer:'正官',indirectResource:'偏印',directResource:'正印'};
let activeProfile = null;
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

function renderChart(chart, sample = false) {
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
  $('results-title').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
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
    for (const id of ['plain-reading','luck-reading','today-reading','seven-reading']) $(id).replaceChildren();
  }
}

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
    renderChart(chart, !$('demo-label').hidden);
    renderReading();
  } catch (error) {
    $('results').hidden = true;
    $('reading').hidden = true;
    activeProfile = null;
    $('form-error').textContent = error instanceof Error ? error.message : '排盤暫時無法完成，請檢查輸入內容。';
    $('form-error').hidden = false;
    $('form-error').scrollIntoView({block:'nearest'});
  }
});
syncFields();
