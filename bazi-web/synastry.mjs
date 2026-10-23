// Approved BaziSynastry prose from the native source snapshot. This uses only day stems/branches.
const harmony = {子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
const clash = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
const stemEnglish={甲:'Jia',乙:'Yi',丙:'Bing',丁:'Ding',戊:'Wu',己:'Ji',庚:'Geng',辛:'Xin',壬:'Ren',癸:'Gui'};
const direction={
  peer:['你把對方當同輩，有話直說，也容易跟他比。','You treat them as an equal and speak plainly, but you may also compare yourself to them.'],
  rob:['你在他面前比較不想退讓，資源或注意力上容易有拉扯。',"You're less willing to give ground with them, so attention and resources can turn into a tug-of-war."],
  eatingGod:['你在他面前放得開，願意講自己的想法，相處起來不費力。','You relax around them and share what you think. Being together feels easy.'],
  hurtingOfficer:['你很容易對他講真話，包括他不想聽的那種。','You tell them the truth easily, including the parts they would rather not hear.'],
  indirectWealth:['你把他看成能一起去闖的人，相處熱絡但不一定深。',"You see them as someone to take on adventures with. It's warm, but not always deep."],
  directWealth:['你願意為他實際付出，安排、打理、給資源。','You put real effort into them: planning, providing, taking care of things.'],
  sevenKillings:['你在他面前會繃著，想做好、怕被看扁。',"You tense up around them. You want to do well and worry they'll think less of you."],
  directOfficer:['你會不自覺配合他的標準，相處得體但不太敢任性。',"You go along with their standards without thinking. You're polite, but hold back from being yourself."],
  indirectResource:['你把他當可以討論的對象，聽他的想法但保留判斷。','You treat them as someone to talk things over with. You hear them out but keep your own judgment.'],
  directResource:['你依賴他、也信任他，從他那裡得到支撐。','You lean on them and trust them, and they give you support.'],
};
const rhythm={
  harmony:['你們的日支相合：節奏容易對上，約得出來、講得下去，也容易因為太順而少講真話。',"Your day branches combine. Your timing tends to line up and conversation flows, so it's easy to skip the hard topics."],
  clash:['你們的日支相沖：節奏常常對不上，容易誤會時間與期待。講清楚比猜有用。',"Your day branches clash. Your timing often doesn't line up, and expectations get crossed. Saying things plainly works better than guessing."],
  neutral:['你們的日支不合也不沖：相處沒有特別的拉力，走成什麼樣主要看你們自己經營。',"Your day branches neither combine nor clash. There's no built-in pull either way, so it's mostly up to the two of you."],
};
const tieWords={harmony:['節奏合得上','timing that lines up'],clash:['節奏常對不上','timing that keeps missing'],neutral:['節奏看你們怎麼走',"timing that's up to you two"]};

export function compareBaziCharts(mine,theirs,engine) {
  const myDay=mine?.pillars?.find(p=>p.name==='日柱');
  const theirDay=theirs?.pillars?.find(p=>p.name==='日柱');
  const myStem=mine?.dayMaster, theirStem=theirs?.dayMaster;
  if (!myDay?.branch || !theirDay?.branch || !myStem || !theirStem || !engine?.tenGod) throw new Error('兩張命盤都需要可靠的日柱才能對照。');
  const toward=engine.tenGod(myStem,theirStem), back=engine.tenGod(theirStem,myStem);
  if (!direction[toward] || !direction[back]) throw new Error('這兩張盤暫時無法完成十神對照。');
  const tie=harmony[myDay.branch]===theirDay.branch?'harmony':clash[myDay.branch]===theirDay.branch?'clash':'neutral';
  const pair=(id,values)=>({id,zh:values[0],en:values[1]});
  const stemText=stem=>`${stemEnglish[stem]??stem} (${stem})`;
  return {tie,readings:[pair('toward',direction[toward]),pair('back',direction[back]),pair('rhythm',rhythm[tie])],
    share:{zh:`${myStem} 與 ${theirStem}，${tieWords[tie][0]}。`,en:`${stemText(myStem)} and ${stemText(theirStem)}: ${tieWords[tie][1]}.`},
    note:'只描述兩人的互動傾向，不判斷合不合，也不預測結果。'};
}
