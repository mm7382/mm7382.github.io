/** Values are ordered bottom to top. Corpus uses the original app's King Wen mapping. */
export function cast(values, corpus) {
  if (
    !Array.isArray(values) ||
    values.length !== 6 ||
    values.some((v) => ![6, 7, 8, 9].includes(v))
  )
    throw new Error("請提供由初爻至上爻的六個數字（6、7、8、9）。");
  const hs = Array.isArray(corpus) ? corpus : corpus.hexagrams;
  const identify = (bits) => {
    const h = hs.find((h) => h.linesBinary === bits);
    if (!h) throw new Error("卦象資料不完整，請重新載入。");
    return h.number;
  };
  const movingLineIndices = values.flatMap((v, i) =>
    v === 6 || v === 9 ? [i] : [],
  );
  const hexagramNumber = identify(values.map((v) => v % 2).join(""));
  const changedHexagramNumber = movingLineIndices.length
    ? identify(values.map((v) => (v === 6 ? 1 : v === 9 ? 0 : v % 2)).join(""))
    : 0;
  let kind,
    indices = [],
    primaryHexagramNumber = hexagramNumber,
    secondaryHexagramNumber = 0,
    ruleName;
  const still = [0, 1, 2, 3, 4, 5].filter(
    (i) => !movingLineIndices.includes(i),
  );
  switch (movingLineIndices.length) {
    case 0:
      kind = "baseHexagramJudgment";
      ruleName = "零動爻：讀本卦卦辭";
      break;
    case 1:
      kind = "baseHexagramLine";
      indices = [...movingLineIndices];
      ruleName = "一動爻：讀本卦該爻辭";
      break;
    case 2:
      kind = "baseHexagramTwoLines";
      indices = [...movingLineIndices].reverse();
      ruleName = "二動爻：讀本卦兩爻辭，以上爻為主";
      break;
    case 3:
      kind = "bothHexagramJudgments";
      secondaryHexagramNumber = changedHexagramNumber;
      ruleName = "三動爻：讀本卦與之卦卦辭，本卦為主";
      break;
    case 4:
      kind = "changedHexagramTwoLines";
      indices = still;
      primaryHexagramNumber = changedHexagramNumber;
      ruleName = "四動爻：讀之卦兩不變爻辭，以下爻為主";
      break;
    case 5:
      kind = "changedHexagramLine";
      indices = still;
      primaryHexagramNumber = changedHexagramNumber;
      ruleName = "五動爻：讀之卦唯一不變爻辭";
      break;
    case 6:
      if (hexagramNumber === 1 || hexagramNumber === 2) {
        kind = "useNineOrSix";
        ruleName = hexagramNumber === 1 ? "六動爻：乾用九" : "六動爻：坤用六";
      } else {
        kind = "changedHexagramJudgment";
        primaryHexagramNumber = changedHexagramNumber;
        ruleName = "六動爻：讀之卦卦辭";
      }
      break;
  }
  return {
    hexagramNumber,
    changedHexagramNumber,
    movingLineIndices,
    reading: {
      kind,
      primaryHexagramNumber,
      secondaryHexagramNumber,
      indices,
      ruleName,
    },
  };
}
export function topicCase(reading) {
  return reading.kind === "useNineOrSix"
    ? reading.primaryHexagramNumber === 1
      ? "useNine"
      : "useSix"
    : reading.indices.length
      ? "line" + (reading.indices[0] + 1)
      : "judgment";
}
/** Three independent fair coins: 6/9 have probability 1/8, 7/8 have probability 3/8. */
export function coinThrow(
  random = () => crypto.getRandomValues(new Uint8Array(1))[0],
) {
  return [0, 1, 2].reduce((s) => s + 2 + (random() & 1), 0);
}
