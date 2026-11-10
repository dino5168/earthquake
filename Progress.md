# Progress

> 上限 120 行。「工作日誌」只保留最近 10 筆，舊紀錄移至 `1-Plans/archive/progress-YYYY-MM.md`。
> 計畫細節見 [1-Plans/2-滾動式計畫.md](1-Plans/2-滾動式計畫.md)。

## 目前狀態
- 階段：Phase 2 — 資料模型與寫入（Phase 1 已完成並歸檔）
- 阻塞：Phase 2 需使用者回覆計畫中的 Open Questions

## 下一步
1. 使用者回覆 Open Questions（`1-Plans/2-滾動式計畫.md`）→ 展開 Phase 2 任務
   - 最關鍵：感測器資料欄位、寫入方式（建議後端 ingest API）

## 下次開工
- 讀本檔 + `1-Plans/2-滾動式計畫.md` 即可接續；任務單在 `2-Tasks/`
- 本機前端：`cd 9-Project/crates/frontend; trunk serve` → http://127.0.0.1:3000
- 線上：https://earthquake-cm9.pages.dev（push 前端變更自動佈署）

## 工作日誌（最新在上，最多 10 筆）
### 2026-11-10 — 地震點雲 3D 實作計畫（任務：4-資料處理/2-顯示3D.md）
- 計畫書 `1-Plans/4-地震點雲3D實作計畫.md`：three.js 點雲 + DEM 地形面，T1–T7；評估結論可行
- 實測：AWS Terrain Tiles 可下載，含海底地形（−6370～3545 m）；73,729 點單一 draw call
- 決策：`4-資料處理/eq-3d/` 獨立原型（Vite + TS）、不做時間動畫、地形用 AWS Terrain Tiles；待開工 T1
### 2026-11-10 — 地震目錄轉點雲（任務：4-資料處理/1-整理資料成點雲.md）
- `4-資料處理/csv_to_point_cloud.py` + pytest；輸出 `EQHistory.CSV`（73,729 點，依時間排序，已 gitignore）
- 欄位 `x,y,z,origin_time,magnitude_ml`：x=經度、y=緯度（度）、z=-深度（km）；使用者選經緯度原值（水平/垂直單位不同，3D 檢視需自行縮放 z）
### 2026-11-10 — CWA 地震目錄 XML → CSV（任務：1-Plans/3-地震資料處理.md）
- `4-資料處理/cwa_catalog_to_csv.py`（stdlib only）+ pytest 5 tests；1990 輸出 `CSV/CWA-EQ-Catalog-1990.csv`（2451 筆，與 RecordNumber 一致）
- 欄位 snake_case、單位寫入欄名；選填欄位（erz/rms/erh/最小震央距）缺漏輸出空字串；時間保留原始 `+08:00`
- 1990–2025 全部轉檔完成（共 73,729 筆）；時間保留 `+08:00`（使用者決定）
- 原始 XML 與 CSV 輸出加入 `.gitignore`（CSV 可由 XML 重建）
- 欄位說明書 `4-資料處理/EarthquakeHistory.html`；`review_status` F/N/X 意義待向 CWA 查證
### 2026-11-06 — IoT（MQTT）架構比較（任務：3-可行性分析/3-系統架構評估.md）
- 結論：現階段採 DB 推播（SSE）；MQTT 只在高頻/大量裝置/下行控制時引入，且 broker 留內網、前端仍走 SSE
- 文件：`3-可行性分析/4-IoT架構比較.md`
### 2026-11-06 — 即時推播可行性評估（任務：3-可行性分析/1-可行性分析.md）
- 結論可行：PG `LISTEN/NOTIFY`（trigger）→ tokio broadcast → axum SSE → Tunnel → `EventSource`；不需新依賴
- 評估計畫與 PoC P1–P6：`3-可行性分析/2-即時推播評估計畫.md`；建議與 Phase 4 一起做
### 2026-11-06 — Obsidian 顯示 .claude
- Obsidian 不顯示 dot 資料夾 → 建 junction `claude/` → `.claude/`（已 gitignore，新 clone 需重建：`New-Item -ItemType Junction -Path claude -Target .claude`）
### 2026-11-06 — 收工
- 手動觸發一次 Cloudflare 佈署（與 `main` 一致）；停止本機 trunk serve
- 今日完成：Phase 0 骨架、Cloudflare 佈署、Phase 1 前端雛形；待 Phase 2 Open Questions
### 2026-11-06 — Phase 1 驗收（T7）完成
- 線上 https://earthquake-cm9.pages.dev：`/`、`/history`、`/demo/b`、未知路徑皆 200（Pages SPA fallback 生效）
- 深層連結 `/demo/b` 實測：資產載入、標題、父子高亮、群組自動展開正常
- 實作計畫歸檔至 `1-Plans/archive/plan-phase-1-前端雛形實作計畫.md`
### 2026-11-06 — 前端雛形實作 T1–T6
- AppShell/Sidebar/Topbar、NavItem/NavGroup（accordion + collapsed flyout）、Card/StatCard、Dashboard、PlaceholderPage
- 路由：`/` → Dashboard；其餘走 `Routes fallback=MenuRoutePage`（依 MENU 查標題，未知路徑顯示「找不到頁面」）
- leptos-use 0.20 已拆 micro crate，改直接依賴 `leptos-use-storage` / `leptos-use-media-query`
- 瀏覽器實測（含 400px iframe 模擬手機）：收合記憶、flyout、父子高亮、抽屜/遮罩/換頁關閉、404 皆正常，console 無錯誤
- wasm：加 router 後 517 KB → release profile（lto + opt-level z）降至 364 KB（gzip 138 KB）
### 2026-11-06 — 前端雛形實作計畫（任務：2-Tasks/3-前端雛形設計.md）
- 撰寫 `1-Plans/3-前端雛形實作計畫.md`：元件化結構、資料驅動選單、T1–T7 任務
- 決策：建議選單清單 + 1 個測試子選單；< 768px 抽屜；參考圖配色；Lucide icon（leptos_icons）
- 任務備註寫成規則：`.claude/rules/engineering.md`（全域）、`frontend.md`（paths 限定）
- 滾動計畫：Phase 0 歸檔至 `archive/plan-phase-0.md`；新增 Phase 1 前端雛形，原 Phase 1–5 順延
