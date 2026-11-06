# Progress

> 上限 120 行。「工作日誌」只保留最近 10 筆，舊紀錄移至 `1-Plans/archive/progress-YYYY-MM.md`。
> 計畫細節見 [1-Plans/2-滾動式計畫.md](1-Plans/2-滾動式計畫.md)。

## 目前狀態
- 階段：Phase 1 — 前端雛形 Dashboard Shell（計畫完成，待使用者確認後實作）
- 阻塞：Phase 2（資料模型）需使用者回覆 Open Questions

## 下一步
1. 使用者確認 `1-Plans/3-前端雛形實作計畫.md` → 依 T1–T7 實作
2. 使用者回覆 Open Questions → 展開 Phase 2

## 工作日誌（最新在上，最多 10 筆）
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
