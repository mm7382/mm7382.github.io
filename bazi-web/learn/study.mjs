const STUDY_KEY = 'shilai.bazi.study.v1';
const REVIEW_KEY = 'shilai.bazi.review.v1';
const INTERVALS = [1, 3, 7];

function nextDay(date, count) {
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
  return due.toISOString();
}

export function createStudyStore(storage = globalThis.localStorage, clock = () => new Date()) {
  let persistent = true;
  let warning = '';
  const load = key => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('damaged');
      return parsed;
    } catch {
      persistent = false;
      warning = '先前的學習資料讀取失敗，或瀏覽器不允許儲存。這次的變更只會留到關閉頁面。';
      return {};
    }
  };
  const entries = load(STUDY_KEY);
  const review = load(REVIEW_KEY);
  const persist = (key, value) => {
    if (!persistent) return;
    try { storage.setItem(key, JSON.stringify(value)); }
    catch {
      persistent = false;
      warning = '瀏覽器無法儲存學習資料。這次的變更只會留到關閉頁面。';
    }
  };
  const entry = id => ({note:typeof entries[id]?.note === 'string' ? entries[id].note : '',
    read:entries[id]?.read === true,
    reviewDate:typeof entries[id]?.reviewDate === 'string' ? entries[id].reviewDate : null});
  const keyFor = (lessonId, questionId) => `${lessonId}.${questionId}`;
  const reviewEntry = (lessonId, questionId) => review[keyFor(lessonId,questionId)] ?? null;
  const put = (lessonId, patch) => {
    entries[lessonId] = {...entry(lessonId), ...patch};
    persist(STUDY_KEY, entries);
  };
  return {
    get persistent() { return persistent; },
    get warning() { return warning; },
    entry,
    entries() { return Object.entries(entries).map(([id]) => ({id,...entry(id)})); },
    saveNote(id, note) { put(id, {note:String(note)}); },
    markRead(id) { put(id, {read:true}); },
    schedule(id, days) { put(id, {reviewDate:days ? nextDay(clock(), days) : null}); },
    exportNotes() { return Object.keys(entries).sort().filter(id => entry(id).note).map(id => `## ${id}\n\n${entry(id).note}`).join('\n\n'); },
    clearAll() {
      for (const id of Object.keys(entries)) delete entries[id];
      for (const id of Object.keys(review)) delete review[id];
      try { storage.removeItem(STUDY_KEY); storage.removeItem(REVIEW_KEY); persistent = true; warning = ''; }
      catch { persistent = false; warning = '瀏覽器無法清除已儲存的學習資料，請檢查瀏覽器設定。'; }
    },
    reviewEntry,
    recordFirstAnswer(lessonId, questionId, correct) {
      if (correct || reviewEntry(lessonId,questionId)) return;
      review[keyFor(lessonId,questionId)] = {lessonId,questionId,stage:0,due:nextDay(clock(),INTERVALS[0])};
      persist(REVIEW_KEY,review);
    },
    recordReview(lessonId, questionId, correct, at = clock()) {
      const key = keyFor(lessonId,questionId);
      const item = review[key];
      if (!item) return;
      const stage = correct ? item.stage + 1 : 0;
      if (stage >= INTERVALS.length) delete review[key];
      else review[key] = {...item,stage,due:nextDay(at,INTERVALS[stage])};
      persist(REVIEW_KEY,review);
    },
    dueQuestions(at = clock()) {
      const end = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1).getTime();
      return Object.values(review).filter(item => item && typeof item.due === 'string' && Date.parse(item.due) < end)
        .sort((a,b) => a.due.localeCompare(b.due) || keyFor(a.lessonId,a.questionId).localeCompare(keyFor(b.lessonId,b.questionId)));
    },
  };
}
