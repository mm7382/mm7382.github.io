import {calculateChart,signs} from './chart.mjs';
import {renderReading} from './reading-ui.mjs';

const $=selector=>document.querySelector(selector);
const cities={
  taipei:{name:'台北 Taipei',latitude:25.033,longitude:121.565,timeZone:'Asia/Taipei'},
  hongkong:{name:'香港 Hong Kong',latitude:22.319,longitude:114.169,timeZone:'Asia/Hong_Kong'},
  tokyo:{name:'東京 Tokyo',latitude:35.676,longitude:139.65,timeZone:'Asia/Tokyo'},
  london:{name:'倫敦 London',latitude:51.507,longitude:-0.128,timeZone:'Europe/London'},
  newyork:{name:'紐約 New York',latitude:40.713,longitude:-74.006,timeZone:'America/New_York'},
  sydney:{name:'雪梨 Sydney',latitude:-33.868,longitude:151.209,timeZone:'Australia/Sydney'},
  tromso:{name:'特羅姆瑟 Tromsø',latitude:69.649,longitude:18.956,timeZone:'Europe/Oslo'}
};
const names={sun:['太陽','☉'],moon:['月亮','☾'],mercury:['水星','☿'],venus:['金星','♀'],mars:['火星','♂'],jupiter:['木星','♃'],saturn:['土星','♄'],uranus:['天王星','♅'],neptune:['海王星','♆'],pluto:['冥王星','♇']};
const signNames=['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
const signGlyphs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const aspectNames={conjunction:'合相',sextile:'六分相',square:'四分相',trine:'三分相',opposition:'對分相'};
const svgNS='http://www.w3.org/2000/svg';
const svg=(name,attrs={},text='')=>{const el=document.createElementNS(svgNS,name);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));if(text)el.textContent=text;return el;};
const angle=longitude=>(180-longitude)*Math.PI/180;
const xy=(longitude,radius)=>[300+radius*Math.cos(angle(longitude)),300-radius*Math.sin(angle(longitude))];
const displayLongitude=value=>{
  const total=Math.round(value*60)%21600,index=Math.floor(total/1800),within=total%1800;
  return `${signNames[index]} ${Math.floor(within/60)}°${String(within%60).padStart(2,'0')}′`;
};
const cityInput=()=>{
  const city=cities[$('#city').value];
  return city??{name:'自訂地點',latitude:$('#latitude').value,longitude:$('#longitude').value,timeZone:$('#birth-zone').value.trim()};
};
function syncInputs(){
  const custom=$('#city').value==='custom',unknown=$('#unknown-time').checked;
  $('#birth-time').disabled=unknown;$('#birth-time').required=!unknown;
  $('#coordinates').hidden=!custom;$('#zone-wrap').hidden=!custom;
  for(const id of ['latitude','longitude','birth-zone'])$('#'+id).required=custom;
}
$('#city').addEventListener('change',syncInputs);
$('#unknown-time').addEventListener('change',syncInputs);
$('#sample').addEventListener('click',()=>{
  $('#birth-date').value='1988-05-20';$('#birth-time').value='08:30';$('#unknown-time').checked=false;$('#city').value='taipei';$('#sample-note').hidden=false;syncInputs();
});
function wheel(chart){
  const root=$('#chart-wheel');root.replaceChildren();
  const title=svg('title',{},chart.completeness==='complete'?'出生星盤：十星、黃道星座與十二宮':'部分星盤：十星與黃道星座，沒有上升及宮位');
  root.append(title,svg('circle',{cx:300,cy:300,r:284,class:'wheel-outer'}),svg('circle',{cx:300,cy:300,r:223,class:'wheel-ring'}),svg('circle',{cx:300,cy:300,r:168,class:'wheel-inner'}));
  for(let i=0;i<12;i++){
    const [x1,y1]=xy(i*30,224),[x2,y2]=xy(i*30,282),[gx,gy]=xy(i*30+15,252);
    root.append(svg('line',{x1,y1,x2,y2,class:'zodiac-line'}),svg('text',{x:gx,y:gy,class:'sign-symbol','text-anchor':'middle','dominant-baseline':'middle'},signGlyphs[i]));
  }
  if(chart.cusps){
    chart.cusps.forEach((value,index)=>{
      const [x1,y1]=xy(value,40),[x2,y2]=xy(value,168),[lx,ly]=xy(value+14,142);
      root.append(svg('line',{x1,y1,x2,y2,class:index===0?'house-line asc-line':'house-line'}),svg('text',{x:lx,y:ly,class:'house-number','text-anchor':'middle','dominant-baseline':'middle'},String(index+1)));
    });
  }
  chart.placements.forEach((item,index)=>{
    const rank=chart.placements.slice(0,index).filter(other=>Math.abs(((item.longitude-other.longitude+540)%360)-180)<10).length;
    const [x,y]=xy(item.longitude,200-Math.min(rank,3)*20);
    const label=svg('text',{x,y,class:'planet-symbol','text-anchor':'middle','dominant-baseline':'middle','aria-label':names[item.body][0]},names[item.body][1]);
    root.append(label);
  });
  root.append(svg('circle',{cx:300,cy:300,r:40,class:'wheel-center'}),svg('text',{x:300,y:294,class:'center-word','text-anchor':'middle'},chart.completeness==='complete'?'NATAL':'PARTIAL'),svg('text',{x:300,y:312,class:'center-sub','text-anchor':'middle'},'SKY / 星圖'));
}
function render(chart,place){
  $('#results').hidden=false;
  $('#chart-summary').textContent=`${$('#birth-date').value} · ${place.name} · ${chart.completeness==='complete'?'完整星盤 / Full chart':'部分星盤 / Partial chart'}`;
  const timeWarning=$('#time-warning');
  timeWarning.hidden=chart.completeness==='complete'&&!chart.metadata.ambiguousBirthTime&&!chart.metadata.adjustedBirthTime;
  timeWarning.textContent=chart.completeness==='validPartial'?'不知道出生時間：上升、天頂和宮位留白；星座與相位可能跨越當天，請看待確認標記。 / No birth time: rising sign, MC and houses stay blank.':
    chart.metadata.ambiguousBirthTime?'這個出生時間遇到夏令時間重複時段。此盤暫用較早的那一次，請核對原始記錄。':
    '這個出生時間落在夏令時間跳轉的空檔。原 App 會順延到下一個有效時間；本盤沿用該規則，請核對原始記錄。';
  const fallback=$('#fallback-warning');fallback.hidden=!chart.fallbackReason;
  fallback.textContent=chart.fallbackReason==='extremeLatitude'?'出生地位於極緯，Placidus 宮位無法求解；此盤明示改用整宮制。 / Whole Sign houses used at extreme latitude.':'Placidus 宮位無法求解；此盤明示改用整宮制。';
  wheel(chart);
  const placements=$('#placements');placements.replaceChildren();
  for(const item of chart.placements){
    const row=document.createElement('div');row.className='placement';
    const heading=document.createElement('strong');heading.textContent=`${names[item.body][1]} ${names[item.body][0]}`;
    const value=document.createElement('span');
    const signsText=item.signIsUnconfirmed?item.candidateSigns.map(s=>signNames[signs.indexOf(s)]).join('／'):displayLongitude(item.longitude);
    value.textContent=`${signsText}${item.house?` · 第 ${item.house} 宮`:''}${item.retrograde?' · 逆行':''}${item.signIsUnconfirmed?' · 待確認':''}`;
    row.append(heading,value);placements.append(row);
  }
  $('#angles').textContent=chart.cusps?`上升 ASC：${displayLongitude(chart.ascendant)}　·　天頂 MC：${displayLongitude(chart.midheaven)}　·　${chart.houseSystem==='placidus'?'Placidus 宮位':'整宮制 Whole Sign'}`:'上升與天頂：出生時間未知，保持空白。';
  const aspectRoot=$('#aspects');aspectRoot.replaceChildren();
  if(!chart.aspects.length){const p=document.createElement('p');p.textContent='目前沒有落在原 App 容許度內的五大相位。';aspectRoot.append(p);}
  for(const aspect of chart.aspects){
    const row=document.createElement('p');row.className='aspect-row';
    row.textContent=`${names[aspect.first][0]} × ${names[aspect.second][0]}　${aspectNames[aspect.kind]}　${aspect.orb.toFixed(1)}°${aspect.unconfirmed?' · 待確認':''}`;
    aspectRoot.append(row);
  }
  renderReading(chart);
  $('#results-title').focus({preventScroll:true});$('#results').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#chart-form').addEventListener('submit',event=>{
  event.preventDefault();const error=$('#form-error');error.hidden=true;
  if(!$('#chart-form').reportValidity())return;
  const place=cityInput();
  try{
    const chart=calculateChart({date:$('#birth-date').value,time:$('#unknown-time').checked?null:$('#birth-time').value,latitude:place.latitude,longitude:place.longitude,timeZone:place.timeZone});
    render(chart,place);
  }catch(cause){error.hidden=false;error.textContent=cause instanceof Error?cause.message:'星盤暫時無法計算，請核對出生資料。';}
});
syncInputs();
