import {readingCopy as C} from './reading-copy.mjs';

const branches=[... '子丑寅卯辰巳午未申酉戌亥'];
const order=['命宮','兄弟','夫妻','子女','財帛','疾厄','遷移','僕役','官祿','田宅','福德','父母'];
const topicPalace={love:'夫妻',career:'官祿',wealth:'財帛'};
const baseStar=name=>name.replace(/化[祿權科忌]$/u,'');
const loc=(value,language='zh')=>value?.[language]??'';
const fill=(key,values={},language='zh')=>loc(C.copy[key],language).replace(/\{(\w+)\}/g,(_,k)=>values[k]??'');
const palaceName=(name,language='zh')=>language==='zh'?(name.endsWith('宮')?name:`${name}宮`):(C.names.palaces[name]??name);
const starsText=(stars,language='zh')=>stars.map(x=>language==='zh'?x:(C.names.stars[x]??x)).join(language==='zh'?'、':', ');
const section=(heading,lines)=>({heading,lines:lines.filter(Boolean)});
const line=(text,style='body')=>({text,style});

function palace(chart,branch){
  if(!branches.includes(branch))return null;
  const p=chart.palaces?.find(x=>x.branch===branch);
  if(!p||!order.includes(p.name)||!Array.isArray(p.stars))return null;
  const stars=p.stars.map(baseStar);
  if(stars.some(x=>!C.names.stars[x]))return null;
  return {name:p.name,branch,stars};
}

function topicBranch(topic,soul){
  const index=branches.indexOf(soul),offset=order.indexOf(topicPalace[topic]);
  return index<0||offset<0?null:branches[(index-offset+12)%12];
}

function topicFact(chart,topic,layer,timeLayers=chart.timeLayers){
  if(!topicPalace[topic])return null;
  if(layer==='natal'){
    const p=chart.palaces?.find(x=>x.name===topicPalace[topic]);
    return p?palace(chart,p.branch):null;
  }
  const soul=layer==='yearly'?timeLayers?.yearly?.branch:layer==='monthly'?timeLayers?.monthly?.branch:layer==='decadal'?timeLayers?.decadal?.branch:null;
  const branch=topicBranch(topic,soul);
  return branch?palace(chart,branch):null;
}

function guided(chart,p,language,topic){
  const out=[],label=palaceName(p.name,language);let stars=p.stars;
  if(!stars.length){
    const opposite=palace(chart,branches[(branches.indexOf(p.branch)+6)%12]);
    out.push(section(loc(C.copy.opposite,language),[
      line(loc(C.copy.empty,language)),
      opposite&&line(`${palaceName(opposite.name,language)}: ${starsText(opposite.stars,language)}`)
    ]));
    if(opposite)stars=opposite.stars;
  }
  if(stars.length>1){
    const match=stars.length===2?Object.entries(C.pairs).find(([key])=>{
      const names=key.split('+');return names.length===2&&names.every(x=>stars.includes(x));
    }):null;
    out.push(section('',[line(loc(match?.[1]??C.copy.pairUnreviewed,language))]));
  }
  for(const star of stars){
    const guide=C.guides[star];if(!guide)continue;
    const example=topic?C.examples[`${star}.${topic}`]:null;
    out.push(section(`${starsText([star],language)} · ${loc(guide.theme,language)}`,[
      line(loc(guide.explanation,language)),
      line(loc(example?.example??guide.example,language)),
      line(loc(example?.action??guide.practice,language),'practice')
    ]));
  }
  out.push(section('',[line(loc(C.copy.guidedNote,language),'caption')]));
  return out;
}

function sources(palaces,layer,timeLayers,language){
  const lines=[],seen=new Set();
  for(const p of palaces)for(const star of p.stars){
    if(seen.has(star))continue;seen.add(star);
    const c=C.cultures[star]?.citation;if(!c)continue;
    lines.push(line(c.original,'citation'));
    if(language==='en')lines.push(line(c.translation,'citation'));
    lines.push(line(loc(c.book,language),'source'));
  }
  const citation=layer==='yearly'?C.yearlySource:layer==='monthly'?C.monthlySource:null;
  if(citation){lines.push(line(citation.original,'citation'));
    if(language==='en')lines.push(line(citation.translation,'citation'));
    lines.push(line(loc(citation.book,language),'source'));
  }
  if(layer==='monthly'&&timeLayers?.monthly?.isLeapMonth)lines.push(line(loc(C.copy.leapNote,language),'caption'));
  if(layer==='decadal')lines.push(line(loc(C.copy.decadalSourceNote,language),'caption'));
  lines.push(line(loc(C.copy.limits,language),'caption'));
  lines.push(line(fill('ruleVersionLine',{version:'ZR-RULES-1'},language),'caption'));
  return section(loc(C.copy.sourcesHeading,language),lines);
}

function topicSections(chart,topics,layer,timeLayers,language){
  const facts=topics.map(t=>topicFact(chart,t,layer,timeLayers));
  if(facts.some(x=>!x))return null;
  const out=[];
  for(let i=0;i<topics.length;i++){
    const topic=topics[i],p=facts[i],name=palaceName(p.name,language);
    const lines=[line(fill('conclusion',{layer:loc(C.layers[layer],language),topic:loc(C.topics[topic].name,language),palace:name},language),'headline'),
      line(p.stars.length?fill('stars',{stars:starsText(p.stars,language)},language):loc(C.copy.noStars,language))];
    const guide=C.palaceGuides[p.name];
    if(guide)lines.push(line(fill('life',{palace:name,gloss:loc(guide.gloss,language)},language)));
    out.push(section(loc(C.topics[topic].name,language),lines),...guided(chart,p,language,topic));
    out.push(section(loc(C.copy.practice,language),[line(loc(C.topics[topic].context,language))]));
  }
  const basis=layer==='natal'?fill('basisNatal',{palace:palaceName(facts[0].name,language)},language):
    layer==='yearly'?fill('basisYearly',{ganzhi:timeLayers?.yearly?.ganzhi},language):
    layer==='monthly'?fill('basisMonthly',{month:timeLayers?.monthly?.lunarMonth},language):
    fill('basisDecadal',{age:timeLayers?.nominalAge,start:timeLayers?.decadal?.ageStart,end:timeLayers?.decadal?.ageEnd},language);
  out.push(section('',[line(basis)]),sources(facts,layer,timeLayers,language));
  return out;
}

export function buildZiweiReading(chart,kind,language='zh'){
  if(!C.kinds[kind])throw Error('Unknown reading kind');
  const title=loc(C.kinds[kind].title,language),summary=loc(C.kinds[kind].summary,language);
  let sections=null,palaces=[];
  if(kind==='natal'){
    const soul=palace(chart,chart.soulBranch),body=palace(chart,chart.bodyBranch);
    const positions=[0,6,4,8].map(n=>palace(chart,branches[(branches.indexOf(chart.soulBranch)+n)%12]));
    if(soul&&body&&positions.every(Boolean)){
      palaces=[soul];
      const name=palaceName(soul.name,language);
      const head=[line(soul.stars.length?fill('stars',{stars:starsText(soul.stars,language)},language):loc(C.copy.noStars,language)),
        line(fill('natalBody',{palace:palaceName(body.name,language)},language)),
        line(fill('natalFive',{five:chart.fiveElements},language))];
      const guide=C.palaceGuides[soul.name];if(guide)head.push(line(fill('life',{palace:name,gloss:loc(guide.gloss,language)},language)));
      sections=[section(name,head),...guided(chart,soul,language),
        section(loc(C.copy.natalTriadHeading,language),positions.map(p=>line(`${palaceName(p.name,language)}${language==='zh'?'：':': '}${p.stars.length?starsText(p.stars,language):loc(C.copy.noStars,language)}`))),
        sources([soul,...positions],'natal',null,language)];
    }
  }else{
    const layer=kind==='yearly'||kind==='monthly'?kind:'natal';
    const topics=layer==='natal'?[kind]:['love','career','wealth'];
    sections=topicSections(chart,topics,layer,chart.timeLayers,language);
    if(sections)palaces=topics.map(t=>topicFact(chart,t,layer));
  }
  return {kind,title,summary,unavailable:!sections,sections:sections??[],palaces};
}

export function buildZiweiWeek(chart,language='zh'){
  const layers=chart.timeLayersByDay??[],transits=chart.dailyTransits??[];
  return layers.slice(0,7).map((timeLayers,index)=>{
    const date=timeLayers.targetDate,transit=transits.find(t=>t.date===date);
    const monthly=['love','career','wealth'].map(t=>topicFact(chart,t,'monthly',timeLayers));
    const day=palace(chart,timeLayers.daily?.branch);
    const topicLines=monthly.every(Boolean)?monthly.map((p,i)=>fill('conclusion',{
      layer:loc(C.layers.monthly,language),topic:loc(C.topics[['love','career','wealth'][i]].name,language),palace:palaceName(p.name,language)
    },language)):[];
    const dayLine=day?fill(index===0?'todayDay':'dayLine',{palace:palaceName(day.name,language)},language):loc(C.copy.unavailable,language);
    const guides=[];
    if(monthly.every(Boolean)&&day&&transit?.method==='IZTRO-2.6.1-DAILY-1'&&transit.dayBoundary==='Asia/Taipei 00:00'){
      for(const topic of ['love','career','wealth']){
        const branch=topicBranch(topic,transit.dailySoulBranch),fact=palace(chart,branch);
        if(!fact){guides.length=0;break;}
        const sections=[section(loc(C.topics[topic].name,language),[
          line(`${palaceName(fact.name,language)} · ${starsText(fact.stars,language)}`,'caption'),
          line(loc(C.topics[topic].context,language))]),...guided(chart,fact,language,topic)];
        const context=[];
        for(const [layer,soul] of [['natal',chart.soulBranch],['yearly',transit.yearlySoulBranch],['monthly',transit.monthlySoulBranch]]){
          const p=palace(chart,topicBranch(topic,soul));if(!p){guides.length=0;break;}
          context.push(line(`${loc(C.layers[layer],language)} · ${palaceName(p.name,language)} · ${p.stars.length?starsText(p.stars,language):loc(C.copy.noStars,language)}`));
        }
        sections.push(section(loc(C.copy.layersHeading,language),[...context,line(loc(C.copy.layersNote,language),'caption')]));
        const action=sections.flatMap(s=>s.lines).find(x=>x.style==='practice')?.text;
        if(!action){guides.length=0;break;}
        guides.push({topic,title:loc(C.topics[topic].name,language),action,sections,palace:fact});
      }
    }
    return {date,topicLines,dayLine,isLeapMonth:timeLayers.monthly?.isLeapMonth??false,
      guides,methodNote:guides.length===3?loc(C.copy.methodNote,language):null,
      layers:timeLayers};
  });
}
