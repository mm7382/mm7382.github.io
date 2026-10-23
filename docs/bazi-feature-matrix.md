# 八字來源對照與 B1 驗收

來源凍結：2026-10-23；逐檔 SHA-256 見 [bazi-source-manifest.json](bazi-source-manifest.json)。原生專案含使用者未提交變更，因此 commit 不能單獨重建當時內容。網站捆綁的計算核心另有成品雜湊。原生專案維持唯讀。

| 原 App 現有能力 | 來源 | 網頁切片 | B1 狀態 |
| --- | --- | --- | --- |
| 國曆／農曆、閏月、1900–2100 日期驗證 | `src/engine.mjs` `normalizeProfile` | B1 | 已接原引擎、測例通過 |
| 精確時間／十二時辰／未知時間 | `src/engine.mjs`、`ios/App/Engine.swift` | B1 | 已接；未知時辰只顯示三柱，日柱明示待核對 |
| 出生地 IANA 時區與歷史夏令時間 | `ios/App/Engine.swift`、`ios/Shared/Models.swift` | B1 | 精確時間在非台灣時區先換為 UTC+8；跳空與重複時段要求核對；只知時辰不推定精確瞬間 |
| 四柱、晚子時換日、節氣月界 | `src/engine.mjs` `calculate` | B1 | 已接原引擎；公開例盤、晚子時固定測例通過 |
| 五行、十神與地支主氣 | `ios/App/ChartPlainReading.swift`、`src/engine.mjs` `tenGod` | B1 | 已顯示名稱與表面八字計數，不導出強弱／缺行吉凶 |
| 命盤白話、十年大運、流年／月報 | `ios/App/ShilaiChartView.swift`、`ios/App/ChartPlainReading.swift`、`ios/App/MonthlyReport.swift`、`src/engine.mjs` | B2／B5 | 已接原引擎、雙語白話與月報來源文案；今日練習答題紀錄可在月報回顧 |
| 今日、每日小測、未來七日與工作／感情／財務領域 | `ios/App/DailyQuiz.swift`、`src/engine.mjs`、`src/copy/home-advice.mjs` | B2／B5 | 已完成日期與領域切換、來源分層、小測固定選項；原擇時吉凶規則仍未驗證，不當成網站推薦 |
| 20 堂課，穩定 ID F01–F03、P01–P17、來源與圖解 | `ios/App/BaziCourses.json`、`ios/App/CourseStudy.swift` | B3 | 已完成二十堂完整雙語頁、四十二題、圖解、來源與學習紀錄；對照報告見 `bazi-course-parity.md` |
| 人物簿、多命盤、合盤、筆記與複習 | `ios/App/FriendBook.swift`、`ios/App/BaziSynastry.swift`、`ios/App/CourseStudy.swift` | B4 | 已完成本機保存、切換、雙人對照、筆記匯出與清除；合成雙人與停用儲存測試通過 |

B5 已將公開頁改為可索引；複習本仍 `noindex`。第三方授權聲明與原生計算核心一起保留。發布前仍需完成正式 HTTPS 與個人網站入口驗證。

**對照測試縫**：`calculateBaziChart(profile, engine)` 是網站公開計算介面。固定真值來自原 App `test/engine.test.mjs` 的公開例盤及農曆／晚子時測例；跨日期與農曆跨時區案例沿用 `ios/DailyFortuneTests/BirthInputEngineTests.swift` 的既有真值。時區換算依 `ios/App/Engine.swift` 合約。網站不以自行推算的結果作預期值。
