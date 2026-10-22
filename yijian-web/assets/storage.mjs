const KEY = "yijian-free-web-v1";
const empty = () => ({ completed: [], history: [] });
function valid(v) {
  return (
    v &&
    Array.isArray(v.completed) &&
    v.completed.every((x) => typeof x === "string") &&
    Array.isArray(v.history) &&
    v.history.every(
      (x) =>
        x &&
        Array.isArray(x.values) &&
        x.values.length === 6 &&
        x.values.every((n) => [6, 7, 8, 9].includes(n)) &&
        typeof x.topic === "string" &&
        typeof x.date === "string",
    )
  );
}
export function createStore(provider = () => localStorage) {
  let error = "";
  const read = () => {
    try {
      const raw = provider().getItem(KEY);
      if (!raw) {
        error = "";
        return empty();
      }
      const data = JSON.parse(raw);
      if (!valid(data)) throw Error();
      error = "";
      return data;
    } catch {
      error =
        "此瀏覽器無法讀取紀錄，或紀錄已損毀。你仍可使用所有工具；可在此清除舊紀錄後重試。";
      return empty();
    }
  };
  const save = (data) => {
    try {
      provider().setItem(KEY, JSON.stringify(data));
      error = "";
      return true;
    } catch {
      error = "此瀏覽器目前無法保存紀錄。解讀仍可使用，但關閉頁面後不會保留。";
      return false;
    }
  };
  return {
    get error() {
      return error;
    },
    read,
    complete(id) {
      const data = read();
      if (error) return false;
      data.completed = [...new Set([...data.completed, id])];
      return save(data);
    },
    add(entry) {
      const data = read();
      if (error) return false;
      data.history.unshift({ ...entry, date: new Date().toISOString() });
      data.history = data.history.slice(0, 100);
      return save(data);
    },
    clear() {
      try {
        provider().removeItem(KEY);
        error = "";
        return true;
      } catch {
        error = "無法清除紀錄，請在瀏覽器設定中清除本站資料。";
        return false;
      }
    },
  };
}
