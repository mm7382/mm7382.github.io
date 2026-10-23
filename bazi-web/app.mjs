import { calculateBaziChart } from './chart.mjs';

const $ = id => document.getElementById(id);
const phaseEnglish = {木:'Wood',火:'Fire',土:'Earth',金:'Metal',水:'Water'};
const gods = {peer:'比肩',rob:'劫財',eatingGod:'食神',hurtingOfficer:'傷官',indirectWealth:'偏財',directWealth:'正財',sevenKillings:'七殺',directOfficer:'正官',indirectResource:'偏印',directResource:'正印'};
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
    renderChart(calculateBaziChart(profile, window.FortuneEngine), !$('demo-label').hidden);
  } catch (error) {
    $('results').hidden = true;
    $('form-error').textContent = error instanceof Error ? error.message : '排盤暫時無法完成，請檢查輸入內容。';
    $('form-error').hidden = false;
    $('form-error').scrollIntoView({block:'nearest'});
  }
});
syncFields();
