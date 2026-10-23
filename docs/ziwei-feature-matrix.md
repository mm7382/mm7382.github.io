# 紫微原 App 與網頁版對照

來源凍結：2026-10-23；版本與逐檔雜湊見 [ziwei-source-manifest.json](ziwei-source-manifest.json)。原生專案有既存未提交變動，本批工作保持唯讀。

| 原 App 現有能力 | 原生來源 | 網頁切片 | 現況 |
| --- | --- | --- | --- |
| 國曆／農曆、閏月、1900–2100 範圍與日期拒絕 | `src/engine.mjs`、`ios/Shared/ZiweiBirthInput.swift` | Z1 | 已接原生凍結引擎；一般、農曆、錯誤閏月與非法日期對照通過 |
| 已知時間／只知時辰／未知時辰午時暫定 | `src/engine.mjs`、`ios/Shared/ZiweiHomeState.swift`、`ios/App/Engine.swift` | Z1 | 已接；未知狀態不改寫，計算副本暫用 12:00，盤面顯著標示非確定結果 |
| 十二宮、命身宮、14 主星、輔星、四化、亮度與大限年齡 | `src/engine.mjs`、`ios/Shared/ZiweiBoard.swift`、`ios/Shared/Models.swift` | Z1 | 已以原引擎資料畫 4×4 宮位盤；手機改雙欄可讀卡，逐宮展開保留全部星曜與標記 |
| 已有宮位／星曜閱讀與來源分層 | `ios/Shared/ZiweiReading.swift`、`ios/Shared/ZiweiAnalysisPresentation.swift`、`ios/Shared/ZiweiContent.swift` | Z2 | 待移植；核心 `interpretationStatus` 為 `unsupported`，網站不可改稱已有吉凶判讀 |
| 大限、流年、小限、流月與逐日宮位事實 | `src/engine.mjs` 的 `timeLayers`、`timeLayersByDay`、`dailyTransits` | Z2 | 待移植；分清盤面位置與事件預測 |
| 36 堂既有完整教材、圖解、練習、來源 | `ios/Shared/ZiweiContent.swift`、`ZiweiLearningPresentation.swift` | Z3 | 源碼 `ZiweiLessonLibrary.baseLessons` 列出 36 堂，待完整轉出與對照 |
| 人物簿、切換、合盤與學習筆記 | `ios/App/ProfileStore.swift`、`ios/Shared/ZiweiSynastry.swift`、`ios/Shared/ZiweiLearningNotes.swift` | Z4 | 待移植 |
| 搜尋入口、全課公開與個人網站入口 | 網站規格 | Z5 | 本頁目前 `noindex` 預覽；Z5 全部驗收後才發布 |

**真值縫**：網站 `calculateZiweiChart(profile, engine, targetDate)` 對原生捆綁的 `ios/Shared/engine.js` 呼叫 `calculateJSON`；固定測例沿用原 App `test/engine.test.mjs` 與 `test/ziwei-full-stars.test.mjs`。網頁只呈現 `result.ziwei` 的盤面合約，不把原研究用的事項吉凶、分數或未驗證推薦顯示給使用者。
