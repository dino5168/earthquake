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
