# AI 自主世界：訪客觀察頁交接

- 發布來源：`mm7382/mm7382.github.io` 的 `main` 分支。
- 訪客入口固定：`/ai-world/`（繁中）、`/ai-world/en/`（英文）；完整文章在 `/ai-world/records/`。
- `ai-world/observe/draw.js` 是原本 AIWorldLab 地圖繪製部分的訪客版；`view.js` 不包含主人操作。
- 發布資料只更新 `ai-world/observe/data.json`。格式 `{version:1, worlds:[…]}`，每個世界保留固定 `key`，提供 `zh`、`en`、UTC `saved`、世界時間 `minute`、地圖與人物 `world`、已結算且可公開的 `events`。直接比對已部署檔案的欄名，新增世界不要改掉既有 key。更新資料後觀察頁會讀新快照，不需改入口。
- 讀取源頭使用停止寫入後的快照或 SQLite 唯讀查詢，不呼叫本機 `/state`，不暴露主人頁面、密碼、私有訊息、原始存檔、記憶或提示詞。若上傳對話，先確認內容適合公開；碼錶、角色位置與事件必須來自真正已結算的紀錄。禁止將回放標成即時。
- GitHub Pages 只供訪客讀取，不能推進模擬。若將來做即時，自 Mac 端單向送出白名單資料，為讀者顯示最近更新與停止／失聯狀態，不對外開主人服務；目前尚未啟用自動同步。不要把每次心跳都做成 Git commit，也不要啟動收費 API 當備援。
