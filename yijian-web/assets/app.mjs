import { cast, topicCase, coinThrow } from "./engine.mjs";
import { createStore } from "./storage.mjs";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const zh = (v) => (typeof v === "object" ? (v?.["zh-Hant"] ?? "") : (v ?? ""));
const paragraphs = (v) =>
  String(v ?? "")
    .split("\n\n")
    .filter(Boolean)
    .map((x) => `<p>${esc(x)}</p>`)
    .join("");
const store = createStore();
const cached = new Map();
const data = (name) => {
  if (!cached.has(name))
    cached.set(
      name,
      fetch(`/yijian-web/assets/data/${name}.json`)
        .then((r) => {
          if (!r.ok) throw Error("內容暫時無法載入，請重新整理後再試。");
          return r.json();
        })
        .catch((e) => {
          cached.delete(name);
          throw e;
        }),
    );
  return cached.get(name);
};
const names = ["初", "二", "三", "四", "五", "上"];
const lineName = (i, bit) =>
  i === 0
    ? "初" + (bit ? "九" : "六")
    : i === 5
      ? "上" + (bit ? "九" : "六")
      : (bit ? "九" : "六") + names[i];
const diagram = (bits, moving = []) =>
  `<div class="hexagram" role="img" aria-label="由下往上：${[...bits].map((b) => (b === "1" ? "陽" : "陰")).join("")}">${[
    ...bits,
  ]
    .map(
      (b, i) =>
        `<span class="line ${b === "1" ? "yang" : "yin"} ${moving.includes(i) ? "moving" : ""}"><i></i><i></i></span>`,
    )
    .reverse()
    .join("")}</div>`;
const hexLink = (h) =>
  `<a href="/yijian-web/hexagrams/${h.number}/">第 ${h.number} 卦・${esc(h.name)}</a>`;
const search = $("#hex-search");
if (search)
  search.addEventListener("input", () => {
    let count = 0;
    for (const item of $$("[data-search]")) {
      item.hidden = !item.dataset.search.includes(search.value.trim());
      if (!item.hidden) count++;
    }
    $("#search-status").textContent = `找到 ${count} 卦`;
  });
for (const q of $$("[data-question]"))
  for (const button of $$("button", q))
    button.addEventListener("click", () => {
      for (const b of $$("button", q))
        b.setAttribute("aria-pressed", String(b === button));
      $(".feedback", q).textContent =
        (button.dataset.correct === "true" ? "答對了。" : "再想一想。") +
        button.dataset.explanation;
      q.dataset.answered = button.dataset.correct;
    });
function source(h) {
  const s = h.sourceVersion;
  return `<p class="source">來源：<a href="${esc(s.pageURL)}">${esc(s.primarySource)}</a>；${esc(s.revision)}；取得日期 ${esc(s.retrievedDate)}。<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>。</p>`;
}
function lineDetail(l, title) {
  return `<section><h3>${title}：${esc(l.original)}</h3>${paragraphs(l.ancientContext)}${paragraphs(l.plainLanguage)}${paragraphs(l.lifeTranslation)}${paragraphs(l.reflectionPrompt)}</section>`;
}
async function showResult(values, topic, save = false) {
  const result = $("#result");
  try {
    const [corpus, guidance] = await Promise.all([
      data("hexagrams"),
      data("topic-guidance"),
    ]);
    const r = cast(values, corpus);
    const get = (n) => corpus.hexagrams.find((h) => h.number === n);
    const base = get(r.hexagramNumber),
      changed = get(r.changedHexagramNumber),
      primary = get(r.reading.primaryHexagramNumber);
    const special =
      r.reading.kind === "useNineOrSix"
        ? primary.number === 1
          ? primary.useNine
          : primary.useSix
        : null;
    const entry =
      guidance.hexagrams[String(primary.number)]?.topics?.[topic]?.[
        topicCase(r.reading)
      ];
    let body = `<section><p class="eyebrow">本次解讀</p><h2>${esc(base.name)}${changed ? " → " + esc(changed.name) : "・無動爻"}</h2><div class="split"><div><h3>本卦</h3>${diagram(base.linesBinary, r.movingLineIndices)}${hexLink(base)}</div>${changed ? `<div><h3>之卦</h3>${diagram(changed.linesBinary)}${hexLink(changed)}</div>` : ""}</div><p>由初爻到上爻：${values.join("、")}。動爻：${r.movingLineIndices.length ? r.movingLineIndices.map((i) => `第 ${i + 1} 爻`).join("、") : "無"}。</p><p class="notice">${esc(r.reading.ruleName)}</p><h3>主讀：${esc(primary.name)}</h3>${paragraphs(primary.coreMessage)}${paragraphs(primary.trendReason)}</section>`;
    if (special)
      body += `<section><h3>${esc(special.original)}</h3>${paragraphs(special.plainLanguage)}${paragraphs(special.lifeTranslation)}</section>`;
    else if (r.reading.indices.length)
      body += r.reading.indices
        .map((i, n) =>
          lineDetail(
            primary.lines.find((l) => l.index === i),
            n === 0 ? "主讀爻" : "次讀爻",
          ),
        )
        .join("");
    else
      body += `<section><h3>卦辭與白話</h3>${paragraphs(primary.originalJudgment)}${paragraphs(primary.ancientContext)}${paragraphs(primary.plainLanguage)}${paragraphs(primary.judgmentGuidance)}</section>`;
    body += `<section><h3>所選主題的反思</h3>${entry ? "<h4>現在的狀況</h4>" + paragraphs(entry.situation) + "<h4>建議怎麼做</h4>" + paragraphs(entry.advice) + "<h4>別做什麼</h4>" + paragraphs(entry.avoid) : paragraphs(primary.topicRules[topic] ?? primary.topicRules.general)}</section>`;
    if (changed)
      body += `<section><h3>${r.reading.secondaryHexagramNumber ? "次讀卦辭" : "之卦補充"}：${esc(changed.name)}</h3>${paragraphs(changed.originalJudgment)}${paragraphs(changed.plainLanguage)}${hexLink(changed)}</section>`;
    body += `<details><summary>查看本卦全部六爻</summary>${base.lines.map((l) => lineDetail(l, "第 " + (l.index + 1) + " 爻")).join("")}</details>${source(primary)}`;
    if (save) {
      const ok = store.add({ values: [...values], topic });
      body += `<p class="notice">${ok ? "已保存在目前瀏覽器。最多保留最近 100 筆，可到「我的紀錄」查看或清除。" : esc(store.error)}</p>`;
    }
    result.innerHTML = body;
    result.focus();
    return r;
  } catch (e) {
    if (result) result.innerHTML = `<p role="alert">${esc(e.message)}</p>`;
    return null;
  }
}
if ($("#cast-form")) {
  let values = [];
  let busy = false;
  const throwButton = $("#throw-coins");
  const redraw = () => {
    $("#cast-lines").innerHTML = `<div class="cast-board" aria-label="由下往上完成六爻">${[5, 4, 3, 2, 1, 0]
      .map((i) => {
        const v = values[i], filled = v !== undefined;
        return `<div class="cast-slot${filled ? " is-filled" : ""}${i === values.length - 1 ? " is-new" : ""}"><small>第 ${i + 1} 爻</small><span class="cast-stroke">${filled ? (v % 2 ? "━━━━━" : "━━　━━") : "· · ·"}</span><em>${filled ? `${lineName(i, v % 2)} · ${v}${v === 6 || v === 9 ? " 動爻" : ""}` : "待擲"}</em></div>`;
      }).join("")}</div>`;
    throwButton.textContent =
      values.length === 6 ? "六爻已完成" : `擲第${["一", "二", "三", "四", "五", "六"][values.length]}爻`;
    throwButton.disabled = values.length === 6 || busy;
    $("#throw-status").textContent = `已完成 ${values.length} / 6 爻`;
  };
  throwButton.addEventListener("click", async () => {
    if (busy || values.length === 6) return;
    try {
      values.push(coinThrow());
      busy = true;
      redraw();
      if (values.length === 6)
        await showResult(values, $("#topic").value, true);
    } catch (e) {
      $("#cast-error").textContent = "無法產生銅錢結果，請使用自己擲出的數字。";
    } finally {
      busy = false;
      redraw();
    }
  });
  $("#reset-cast").addEventListener("click", () => {
    if (busy) return;
    values = [];
    $("#result").innerHTML = "";
    $("#cast-error").textContent = "";
    $("#manual-values").value = "";
    redraw();
    throwButton.focus();
  });
  $("#cast-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const input = $("#manual-values").value.trim();
    if (!/^[6-9](?:[\s,，]+[6-9]){5}$/.test(input)) {
      $("#cast-error").textContent =
        "請填入六個數字，每個只能是 6、7、8 或 9，並用空格分隔。";
      return;
    }
    $("#cast-error").textContent = "";
    values = input.split(/[\s,，]+/).map(Number);
    busy = true;
    redraw();
    await showResult(values, $("#topic").value, true);
    busy = false;
    redraw();
  });
  $("#topic").addEventListener("change", () => {
    if (values.length === 6 && !busy)
      showResult(values, $("#topic").value, false);
  });
  redraw();
}
const trigrams = [
  ["111", "乾・天"],
  ["000", "坤・地"],
  ["100", "震・雷"],
  ["011", "巽・風"],
  ["010", "坎・水"],
  ["101", "離・火"],
  ["001", "艮・山"],
  ["110", "兌・澤"],
];
for (const host of $$(".interactive")) {
  const payload = JSON.parse($(".activity-data", host).textContent),
    root = $(".activity-root", host),
    a = payload.data;
  root.innerHTML = '<p class="status">練習載入中…</p>';
  data("hexagrams")
    .then((corpus) => {
      const get = (bits) =>
          corpus.hexagrams.find((h) => h.linesBinary === bits),
        byId = (n) => corpus.hexagrams.find((h) => h.number === n);
      const describe = (bits) => {
        const h = get(bits);
        return `${diagram(bits)}<p>${hexLink(h)}；下卦 ${trigrams.find((t) => t[0] === bits.slice(0, 3))[1]}，上卦 ${trigrams.find((t) => t[0] === bits.slice(3))[1]}。</p>`;
      };
      if (payload.kind === "reading") {
        const original = byId(a.number).linesBinary;
        let bits = original;
        const action = a.interaction.kind;
        root.innerHTML = `<div class="activity-diagram">${describe(bits)}</div><button type="button" class="activity-action">${action === "flipLine" ? "翻面第 " + (a.interaction.line + 1) + " 爻" : "交換上下卦"}</button> <button type="button" class="activity-reset quiet">還原</button><p class="feedback" role="status"></p>`;
        const update = () => {
          $(".activity-diagram", root).innerHTML = describe(bits);
          $(".feedback", root).textContent = `目前是 ${get(bits).name}卦。`;
        };
        $(".activity-action", root).onclick = () => {
          bits =
            action === "flipLine"
              ? [...bits]
                  .map((b, i) =>
                    i === a.interaction.line ? (b === "1" ? "0" : "1") : b,
                  )
                  .join("")
              : bits.slice(3) + bits.slice(0, 3);
          update();
        };
        $(".activity-reset", root).onclick = () => {
          bits = original;
          update();
        };
      } else if (a.kind === "toggleLines") {
        let bits = "111111";
        root.innerHTML =
          '<div class="line-controls">' +
          [0, 1, 2, 3, 4, 5]
            .map(
              (i) =>
                `<button type="button" data-line="${i}" aria-pressed="true">${lineName(i, 1)} ━━━━━</button>`,
            )
            .join("") +
          '</div><p class="feedback" role="status"></p>';
        for (const b of $$("button", root))
          b.onclick = () => {
            const i = Number(b.dataset.line);
            bits = [...bits]
              .map((v, n) => (n === i ? (v === "1" ? "0" : "1") : v))
              .join("");
            b.textContent = `${lineName(i, +bits[i])} ${bits[i] === "1" ? "━━━━━" : "━━　━━"}`;
            b.setAttribute("aria-pressed", String(bits[i] === "1"));
            $(".feedback", root).textContent =
              `第 ${i + 1} 爻現在是${lineName(i, +bits[i])}；全卦是${get(bits).name}。`;
          };
      } else if (a.kind === "buildHalves") {
        root.innerHTML =
          ["lower", "upper"]
            .map(
              (part, i) =>
                `<label class="field"><span>${i ? "上卦" : "下卦"}</span><select data-half="${part}" aria-label="${i ? "上卦" : "下卦"}">${trigrams.map((t) => `<option value="${t[0]}">${t[1]}</option>`).join("")}</select></label>`,
            )
            .join("") +
          '<div class="activity-diagram"></div><p class="feedback" role="status"></p>';
        const update = () => {
          const bits =
            $("[data-half=lower]", root).value +
            $("[data-half=upper]", root).value;
          $(".activity-diagram", root).innerHTML = describe(bits);
          $(".feedback", root).textContent = a.targetHexagram
            ? get(bits).number === a.targetHexagram
              ? "答對了，下乾上坤就是泰。"
              : "目前是" + get(bits).name + "；再試試組出泰卦。"
            : "任何上下卦組合，都對應六十四卦之一。";
        };
        $$("select", root).forEach((s) => (s.onchange = update));
        update();
      } else if (a.kind === "pickLine") {
        root.innerHTML =
          '<div class="line-controls">' +
          a.lineValues
            .map(
              (v, i) =>
                `<button type="button" data-line="${i}">${lineName(i, v % 2)}：${v}</button>`,
            )
            .join("") +
          '</div><p class="feedback" role="status"></p>';
        for (const b of $$("button", root))
          b.onclick = () => {
            $(".feedback", root).textContent =
              +b.dataset.line === a.targetLine
                ? "答對了！9 是老陽，第二爻會由陽變陰。"
                : "這一爻不動；請找出數字是 6 或 9 的爻。";
          };
      } else if (a.kind === "predictChange") {
        const r = cast(a.lineValues, corpus);
        root.innerHTML =
          "<h3>本卦</h3>" +
          diagram(byId(r.hexagramNumber).linesBinary, r.movingLineIndices) +
          '<div class="stack">' +
          a.candidateHexagrams
            .map(
              (n) =>
                `<button type="button" class="quiet" data-candidate="${n}">${n}・${esc(byId(n).name)}</button>`,
            )
            .join("") +
          '</div><p class="feedback" role="status"></p><div class="prediction-result"></div>';
        for (const b of $$("button", root))
          b.onclick = () => {
            const correct = +b.dataset.candidate === r.changedHexagramNumber;
            $(".feedback", root).textContent = correct
              ? "答對了。第二爻由陽變陰，其他五爻不變，得到同人。"
              : "再比較一次：只有紅色的第二爻翻面，其他爻保持不變。";
            $(".prediction-result", root).innerHTML = correct
              ? describe(byId(r.changedHexagramNumber).linesBinary)
              : "";
          };
      } else if (a.kind === "compare") {
        const r = cast(a.lineValues, corpus);
        root.innerHTML = `<div class="split"><div><h3>本卦</h3>${describe(byId(r.hexagramNumber).linesBinary)}</div><div><h3>之卦</h3>${describe(byId(r.changedHexagramNumber).linesBinary)}</div></div><p>${esc(r.reading.ruleName)}</p>`;
        const lines = $$(".hexagram", root)[0];
        lines.outerHTML = diagram(
          byId(r.hexagramNumber).linesBinary,
          r.movingLineIndices,
        );
      } else if (a.kind === "choose") root.innerHTML = "";
      else throw Error("這個練習目前無法載入。");
    })
    .catch((e) => {
      root.innerHTML = `<p role="alert">${esc(e.message)}</p>`;
    });
}
const progress = store.read();
for (const el of $$("[data-progress]"))
  if (progress.completed.includes(el.dataset.progress))
    el.textContent = "　已完成";
if ($("#complete-lesson")) {
  const id = $("[data-lesson]").dataset.lesson;
  $("#lesson-status").textContent = progress.completed.includes(id)
    ? "這堂課已完成。"
    : store.error;
  $("#complete-lesson").onclick = () => {
    $("#lesson-status").textContent = store.complete(id)
      ? "已保存本課完成進度。"
      : store.error;
  };
}
async function renderRecords() {
  const history = $("#saved-history");
  if (!history) return;
  const saved = store.read();
  $("#storage-status").textContent = store.error;
  try {
    const [lessons, corpus] = await Promise.all([
      data("lessons"),
      data("hexagrams"),
    ]);
    $("#saved-progress").innerHTML = saved.completed.length
      ? "<ul>" +
        lessons.lessons
          .filter((l) => saved.completed.includes(l.id))
          .map(
            (l) =>
              `<li><a href="/yijian-web/lessons/${l.order}/">${esc(zh(l.title))}</a>・已完成</li>`,
          )
          .join("") +
        "</ul>"
      : '<p>還沒有完成紀錄。<a href="/yijian-web/lessons/">從第一堂開始</a></p>';
    history.innerHTML = saved.history.length
      ? saved.history
          .map((x, i) => {
            const r = cast(x.values, corpus),
              h = corpus.hexagrams.find((h) => h.number === r.hexagramNumber);
            return `<div class="history-item"><p>${esc(new Date(x.date).toLocaleString("zh-TW"))} · ${esc(h.name)}卦</p><button type="button" data-history="${i}" class="quiet">查看第 ${i + 1} 筆解讀</button></div>`;
          })
          .join("")
      : '<p>還沒有起卦紀錄。<a href="/yijian-web/cast/">免費起卦</a></p>';
    for (const b of $$("[data-history]"))
      b.onclick = () => {
        const x = saved.history[+b.dataset.history];
        showResult(x.values, x.topic, false);
      };
  } catch (e) {
    history.innerHTML = `<p role="alert">${esc(e.message)}</p>`;
  }
}
if ($("#clear-records")) {
  $("#clear-records").onclick = () => {
    $("#clear-confirm").hidden = false;
    $("#confirm-clear").focus();
  };
  $("#cancel-clear").onclick = () => {
    $("#clear-confirm").hidden = true;
    $("#clear-records").focus();
  };
  $("#confirm-clear").onclick = async () => {
    const ok = store.clear();
    $("#clear-confirm").hidden = true;
    if (ok) $("#result").innerHTML = "";
    await renderRecords();
    $("#storage-status").textContent = ok
      ? "已清除全部紀錄與進度。"
      : store.error;
    $("#clear-records").focus();
  };
  renderRecords();
}
