const KEY = 'shilai.bazi.profiles.v1';

export function createBaziProfileBook(storage = globalThis.localStorage) {
  let state = {version:1,records:[],activeId:null};
  let persistent = true;
  let warning = '';
  try {
    const raw = storage.getItem(KEY);
    if (raw) {
      const decoded = JSON.parse(raw);
      if (decoded?.version !== 1 || !Array.isArray(decoded.records) ||
          decoded.records.some(item => typeof item?.id !== 'string' || typeof item?.name !== 'string' || typeof item?.birth !== 'object')) {
        throw new Error('damaged');
      }
      state = {version:1,records:decoded.records,activeId:decoded.activeId};
    }
  } catch {
    persistent = false;
    warning = '先前的人物資料讀取失敗，或瀏覽器不允許儲存。這次變更只會留到關閉頁面；原資料不會被覆寫。';
  }
  function persist() {
    if (!persistent) return;
    try { storage.setItem(KEY,JSON.stringify(state)); }
    catch {
      persistent = false;
      warning = '瀏覽器無法儲存人物資料。這次變更只會留到關閉頁面。';
    }
  }
  const copy = value => structuredClone(value);
  return {
    get persistent() {return persistent},
    get warning() {return warning},
    list() {return state.records.map(copy)},
    active() {return copy(state.records.find(item=>item.id===state.activeId)??null)},
    save(name,birth,id=null,activate=true) {
      const label=String(name??'').trim();
      if (!label) throw new Error('請填寫名字或暱稱。');
      if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(String(birth.birthDate??''))) throw new Error('請填寫有效出生日期。');
      const existing=id?state.records.findIndex(item=>item.id===id):-1;
      const saved={id:existing>=0?id:crypto.randomUUID(),name:label,birth:copy(birth)};
      if (existing>=0) state.records[existing]=saved;
      else state.records.push(saved);
      if (activate || !state.activeId) state.activeId=saved.id;
      persist(); return copy(saved);
    },
    select(id) {
      if (!state.records.some(item=>item.id===id)) throw new Error('找不到這位人物。');
      state.activeId=id; persist(); return this.active();
    },
    remove(id) {
      const count=state.records.length;
      state.records=state.records.filter(item=>item.id!==id);
      if (state.records.length===count) return false;
      if (state.activeId===id) state.activeId=state.records[0]?.id??null;
      persist(); return true;
    },
    clear() {
      state={version:1,records:[],activeId:null};
      try {storage.removeItem(KEY);persistent=true;warning='';}
      catch {persistent=false;warning='瀏覽器無法清除已儲存的人物資料，請檢查瀏覽器設定。';}
    },
  };
}
