export const DATA_KEY='astrology-web-data-v1';
export const STUDY_KEY='astrology-web-study-v1';
export const CURRENT_CHART_KEY='astrology-web-current-chart-v1';
export const CURRENT_PROFILE_KEY='astrology-web-current-profile-id-v1';

const empty=()=>({version:1,profiles:[],friends:[],activeId:null,selectedFriendId:null});
const validRecord=record=>record&&typeof record.id==='string'&&typeof record.name==='string'&&record.name.trim().length>0&&record.name.length<=40&&record.chart?.placements?.length===10&&record.birth?.date;
export function validateData(data){
  if(!data||data.version!==1||!Array.isArray(data.profiles)||!Array.isArray(data.friends))return false;
  if(!data.profiles.every(validRecord)||!data.friends.every(validRecord))return false;
  const ids=[...data.profiles,...data.friends].map(x=>x.id);
  return new Set(ids).size===ids.length
    &&(data.activeId===null||data.profiles.some(x=>x.id===data.activeId))
    &&(data.selectedFriendId===null||data.friends.some(x=>x.id===data.selectedFriendId));
}
export class AstrologyProfiles {
  constructor(storage){
    this.storage=storage;this.state=empty();this.corrupt=false;this.unavailable=false;
    let raw;
    try{raw=storage.getItem(DATA_KEY);}catch{this.unavailable=true;return;}
    if(raw)try{const parsed=JSON.parse(raw);if(!validateData(parsed))throw Error('corrupt');this.state=parsed;}
    catch{this.corrupt=true;}
  }
  persist(next){
    if(this.corrupt)throw new Error('原有星盤資料無法讀取，為避免覆蓋，請先處理或備份瀏覽器資料。');
    if(!validateData(next))throw new Error('星盤資料格式不完整。');
    try{this.storage.setItem(DATA_KEY,JSON.stringify(next));this.state=next;this.unavailable=false;}
    catch{this.unavailable=true;throw new Error('瀏覽器儲存不可用，資料沒有存下來。');}
  }
  add(kind,name,birth,chart,id){
    if(!['profiles','friends'].includes(kind))throw new Error('人物類型不正確。');
    const trimmed=String(name??'').trim();if(!trimmed||trimmed.length>40)throw new Error('請輸入 1–40 字的稱呼。');
    if(!chart?.placements||!birth?.date)throw new Error('請先完成排盤。');
    const next=structuredClone(this.state),record={id,name:trimmed,birth,chart,createdAt:new Date().toISOString()};
    next[kind].push(record);
    if(kind==='profiles')next.activeId=id;else next.selectedFriendId=id;
    this.persist(next);return record;
  }
  select(kind,id){
    if(!['profiles','friends'].includes(kind))throw new Error('人物類型不正確。');
    if(!this.state[kind].some(x=>x.id===id))throw new Error('找不到這張星盤。');
    const next=structuredClone(this.state);next[kind==='profiles'?'activeId':'selectedFriendId']=id;this.persist(next);
    return next[kind].find(x=>x.id===id);
  }
  remove(kind,id){
    if(!['profiles','friends'].includes(kind))throw new Error('人物類型不正確。');
    const next=structuredClone(this.state);
    next[kind]=next[kind].filter(x=>x.id!==id);
    if(kind==='profiles'&&next.activeId===id)next.activeId=next.profiles[0]?.id??null;
    if(kind==='friends'&&next.selectedFriendId===id)next.selectedFriendId=next.friends[0]?.id??null;
    this.persist(next);return next;
  }
  active(){return this.state.profiles.find(x=>x.id===this.state.activeId)??null;}
  friend(){return this.state.friends.find(x=>x.id===this.state.selectedFriendId)??null;}
  clear(){
    if(this.corrupt)throw new Error('原有資料無法讀取；請先備份或使用瀏覽器的網站資料管理功能。');
    try{this.storage.removeItem(DATA_KEY);this.storage.removeItem(STUDY_KEY);this.state=empty();}
    catch{throw new Error('資料清除失敗，請檢查瀏覽器儲存權限。');}
  }
}
