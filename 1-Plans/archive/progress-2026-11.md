# Progress 歸檔 — 2026-11

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

### 2026-11-06 — 前端佈署 Cloudflare Pages（任務：2-Tasks/2-Cloudflare-佈署.md）
- GitHub Actions `deploy-frontend.yml`：trunk build → wrangler pages deploy
- Pages 專案 `earthquake`，網址 https://earthquake-cm9.pages.dev（`earthquake` 已被占用，自動加後綴）
- 踩雷：誤用 Global API Key 導致 auth 10000/6111；需用 API Token（Account → Cloudflare Pages → Edit）

### 2026-11-06 — 安裝 trunk
- 全域安裝 trunk 0.22.1；`trunk build --release` 成功（wasm 約 64 KB）

### 2026-11-06 — 專案初始化（任務：2-Tasks/1-開始.md）
- 建立 CLAUDE.md、Progress.md、1-Plans/2-滾動式計畫.md 與文件分層/歸檔規則
- 建立 `9-Project` Cargo workspace（shared / backend / frontend）與 Cloudflare Tunnel 範本
- 新增 `scripts/check-docs-size.ps1` 檢查文件行數上限
- 驗證：`cargo test`（5 tests pass）、`clippy -D warnings`、`fmt`、frontend `cargo check --target wasm32-unknown-unknown` 皆通過
- 環境：新增 wasm32 target，rustup stable 更新 1.93 → 1.95（wasm std 版本需一致）
- git init，push 至 https://github.com/dino5168/earthquake
