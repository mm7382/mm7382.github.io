// The public seam for the Bazi gallery. The engine is the frozen native JS bundle.
const STEM_ELEMENTS = Object.freeze({甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'});
// Native BaziPlain.branchMainStem uses these primary hidden stems for beginner readings.
const BRANCH_STEMS = Object.freeze({子:'癸',丑:'己',寅:'甲',卯:'乙',辰:'戊',巳:'丙',午:'丁',未:'己',申:'庚',酉:'辛',戌:'戊',亥:'壬'});
const PILLAR_NAMES = ['年柱', '月柱', '日柱', '時柱'];

function civilParts(instant, zone) {
  const formatter = new Intl.DateTimeFormat('en-US', {timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
  return Object.fromEntries(formatter.formatToParts(instant).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
}

function civilMilliseconds(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
}

function sameCivil(a, b) {
  return ['year','month','day','hour','minute'].every(key => a[key] === b[key]);
}

/** Resolve one historical civil clock reading to an instant; reject DST gaps and folds. */
export function exactCivilToTaipei(date, time, zone) {
  if (zone === 'Asia/Taipei') return { date, time }; // native engineProfile uses its fixed UTC+8 calendar
  let desired;
  try {
    desired = { year: Number(date.slice(0,4)), month: Number(date.slice(5,7)), day: Number(date.slice(8,10)), hour: Number(time.slice(0,2)), minute: Number(time.slice(3,5)) };
    new Intl.DateTimeFormat('en-US', {timeZone: zone});
  } catch { throw new Error('找不到這個出生地時區，請填寫有效的 IANA 時區名稱。'); }
  const naive = civilMilliseconds(desired);
  const candidates = new Set();
  for (let shift = -48; shift <= 48; shift += 6) {
    const probe = new Date(naive + shift * 3_600_000);
    const offset = civilMilliseconds(civilParts(probe, zone)) - probe.getTime();
    const possible = naive - offset;
    if (sameCivil(civilParts(new Date(possible), zone), desired)) candidates.add(possible);
  }
  if (!candidates.size) throw new Error('這個出生時間在所選時區不存在，可能落在夏令時間跳轉區間。');
  if (candidates.size > 1) throw new Error('這個出生時間在夏令時間回撥時出現兩次，請確認時間或選擇台灣時間。');
  const target = civilParts(new Date([...candidates][0]), 'Asia/Taipei');
  const pad = value => String(value).padStart(2, '0');
  return { date: `${target.year}-${pad(target.month)}-${pad(target.day)}`, time: `${pad(target.hour)}:${pad(target.minute)}` };
}

/** Generate public-facing facts using exactly the native engine bundle. */
export function calculateBaziChart(profile, engine, date = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Taipei'})) {
  if (!engine?.calculateJSON || !engine?.resolveBirthSolarJSON || !engine?.tenGod) throw new Error('八字計算核心尚未載入。');
  const input = { ...profile };
  const zone = input.timeZoneIdentifier || 'Asia/Taipei';
  if (input.timeState === 'exact' && zone !== 'Asia/Taipei') {
    // Match FortuneCalculator.engineProfile: lunar-to-solar first, then IANA civil time.
    const resolved = JSON.parse(engine.resolveBirthSolarJSON(JSON.stringify(input)));
    if (!resolved.ok) throw new Error(resolved.error);
    const taipei = exactCivilToTaipei(resolved.result.date, resolved.result.time, zone);
    Object.assign(input, {calendar:'solar', leapMonth:false, birthDate:taipei.date, time:taipei.time});
  } else if (input.timeState === 'exact') {
    // Validate even if engineProfile intentionally skips conversion for Taipei.
    exactCivilToTaipei(input.birthDate, input.time, zone);
  } else {
    try { new Intl.DateTimeFormat('en-US', {timeZone:zone}); }
    catch { throw new Error('找不到這個出生地時區，請填寫有效的 IANA 時區名稱。'); }
  }
  const response = JSON.parse(engine.calculateJSON(JSON.stringify({ ...input, date, activity:'negotiation', startHour:9, endHour:21 }), JSON.stringify({version:1, notice:'只顯示原 App 排出的八字事實；判讀與擇時規則另行說明。', timingEnabled:false})));
  if (!response.ok) throw new Error(response.error);
  const raw = response.result;
  const dayMaster = raw.pillars.find(p => p.name === '日柱')?.value?.[0];
  const pillars = raw.pillars.map((pillar, index) => {
    const stem = pillar.value[0], branch = pillar.value[1], mainStem = BRANCH_STEMS[branch];
    return { name:PILLAR_NAMES[index], value:pillar.value, stem, branch,
      element:STEM_ELEMENTS[stem], branchElement:STEM_ELEMENTS[mainStem],
      tenGod:index === 2 ? null : engine.tenGod(dayMaster, stem),
      mainStem, mainStemTenGod:engine.tenGod(dayMaster, mainStem) };
  });
  const phaseCounts = {木:0, 火:0, 土:0, 金:0, 水:0};
  for (const pillar of pillars) { phaseCounts[pillar.element]++; phaseCounts[pillar.branchElement]++; }
  const unknown = input.timeState === 'unknown';
  return { pillars, phaseCounts, dayMaster, birthSolar:raw.birthSolar, birthLunar:raw.birthLunar,
    sourceVersion:raw.version, timeZoneIdentifier:zone, timeUncertain:unknown,
    timeNote:unknown ? '不知道出生時間，時柱無法確定；若實際出生在 23:00 後，日柱也可能不同。' :
      input.timeState === 'earthlyBranch' ? '只知道時辰時，原 App 以該時辰中段排盤；靠近交界請核對出生時間。' :
      '精確時間依出生地的民用時間換算。台灣時間沿用原 App 的固定 UTC+8 排盤方式。' };
}
