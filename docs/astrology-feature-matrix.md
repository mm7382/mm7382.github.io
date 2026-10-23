# 星座原 App 與網頁版對照

來源快照：2026-10-23；原生 commit 與逐檔雜湊見 [astrology-source-manifest.json](astrology-source-manifest.json)。原生專案保持唯讀。

| 原 App 現有能力 | 原生來源 | 網頁切片 | 現況 |
| --- | --- | --- | --- |
| 十星黃經與逆行，Astronomy Engine 2.1.19 | `Core/Calculation/Ephemeris.swift`、`Vendor/AstronomyEngine` | A1 | 已移植同版 JS 引擎及原生 EQJ→ECT 位置路徑；100 組原生 golden 命盤的星體黃經逐項對照通過，逆行測例通過 |
| 出生地歷史時區與夏令時間 | `Core/Calculation/BirthTimeResolver.swift` | A1 | IANA 出生地時區；100 組跨年代／十時區對照通過；春季跳時沿用原生順延、秋季重複時沿用原生較早時刻，介面提示 |
| ASC、MC、十二宮與極緯 fallback | `Core/Calculation/EarthOrientation.swift`、`Houses.swift`、`NatalChartCalculator.swift` | A1 | 100 組原生 golden 的角度與宮頭對照通過；極緯改整宮制並顯示原因 |
| 五大相位與原有容許度 | `Core/Calculation/AspectCalculator.swift`、`Shared/Calculation/OrbTable.swift` | A1 | 已按原生五類與 8°／6°／4° 容許度計算；部分盤逐時標記待確認 |
| 未知出生時間的部分盤 | `Core/Calculation/PartialChartCalculator.swift` | A1 | 整個出生地當地日取 25 點；上升、天頂和宮位保持空白；跨星座顯示雙候選。原生黃經與當日 DST 測例通過 |
| 本命導讀、今日與七日行運 | `App/Chart/ChartSummaryView.swift`、`Core/Calculation/TransitCalculator.swift`、`DailyAdvisor.swift`、`Shared/Content/Rules.swift` | A2 | 原 App 本命閱讀引導與日月上升事實已接；103 條核准規則及原文輸出、5 條未核准規則排除；完整／部分盤各 8 天的行運候選與四主題逐句對照原生編譯器通過。日期切換與 390px 手機操作通過 |
| 36 堂課、圖解、練習與筆記 | `Shared/Content/Lessons.swift`、`LessonLibrary.swift`、`Lesson01…36.swift` | A3 | 36 堂核准原文全部轉出，中英文共 72 個課程頁；96 個概念段落、74 題練習、來源及圖解保留；個人盤觀察與本機筆記可用 |
| 人物管理、合盤與分享 | `ProfileStore.swift`、`SynastryCalculator.swift` | A4 | 本機多盤與朋友簿、雙向宮位疊合、完整／部分盤相位對照及手動分享預覽已做；三種組合逐項對照原生編譯結果。原生尚未核准的 `SynastryCopy` 詮釋文案未公開，僅列客觀盤面資料 |
| 搜尋入口與個人網站公開 | 網站規格 | A5 | 正式站已公開；76 個星座公開網址列入 sitemap，課程雙語、FAQ 與 AI 摘要入口可讀；私人複習頁保留 noindex；個人網站四款入口已在手機正式頁核對 |

數值基準：原生 `Tests/Golden/benchmark-100.json`，100 組包含 1900–2024 年、十個時區、極緯與未知時間；網頁測試逐項比較十星黃經、十二宮宮頭、ASC／MC，容差小於 0.00015°（原生 golden 四捨五入至 0.0001°）。
