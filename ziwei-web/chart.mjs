/** Web adapter around the same bundled engine loaded by the native Ziwei app. */
export function calculateZiweiChart(profile,engine,targetDate) {
  if(!profile||typeof profile!=='object') throw new Error('請填寫出生資料。');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) throw new Error('請選擇有效的閱讀日期。');
  const hourAssumed=profile.timeState==='unknown';
  // The native FB-03 decision: keep the saved state unknown, calculate a clearly
  // labelled provisional chart at 12:00 solely for this display.
  const engineProfile=hourAssumed?{...profile,timeState:'exact',time:'12:00'}:profile;
  const input={...engineProfile,date:targetDate,activity:'negotiation',startHour:9,endHour:21};
  const config={version:1,notice:'命理學習與民俗參考。',timingEnabled:false};
  const response=JSON.parse(engine.calculateJSON(JSON.stringify(input),JSON.stringify(config)));
  if(!response.ok) throw new Error(response.error||'紫微命盤暫時無法排出。');
  const result=response.result;
  if(result.ziweiStatus!=='ok'||!result.ziwei?.palaces||result.ziwei.palaces.length!==12)
    throw new Error('出生資料不足，無法排出完整紫微盤。');
  return {...result.ziwei,birthSolar:result.birthSolar,birthLunar:result.birthLunar,
    hourAssumed,timeNote:hourAssumed?'出生時辰未知：以下以午時暫定排盤。命宮、身宮與星曜可能隨實際時辰改變；補上時間後請重新排盤。':
      (profile.timeState==='earthlyBranch'?'只知道時辰：使用原 App 約定的時辰中間值排盤。':
      (engine.getBoundaryWarning(profile.time)||'')),
    sourceVersion:result.version};
}
