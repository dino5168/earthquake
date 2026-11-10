# Progress 歸檔 — 2026-11

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
