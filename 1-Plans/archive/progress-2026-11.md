# Progress 歸檔 — 2026-11

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
