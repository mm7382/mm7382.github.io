// Pure display calculation; never advances or alters simulation records.
(function(root){
 function reading(clock,at){
  const elapsed=Math.max(0,at-Date.parse(clock.epoch));
  const minutes=Math.floor(elapsed/(clock.realSecondsPerDay*1000)*1440);
  return {day:clock.startDay+Math.floor(minutes/1440),hour:Math.floor(minutes%1440/60),minute:minutes%60};
 }
 function elapsedLabel(value){const days=Math.max(0,value.day-1);return ''+Math.floor(days/360)+' 年 '+Math.floor(days%360/30)+' 個月 '+days%30+' 天 '+value.hour+' 小時 '+value.minute+' 分鐘';}
 const api={reading,elapsedLabel};if(typeof module!=='undefined')module.exports=api;else root.AtlantisClock=api;
})(globalThis);
