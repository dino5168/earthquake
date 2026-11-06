# 十方地震監測網 — Project Instructions

> 本檔是每次 session 自動載入的「熱資料」，上限 **150 行**。細節放外部文件並以連結引用。

## 專案概要
- 目標：監測地震前兆資料；感測器每小時寫入資料，前端查詢歷史資料。
- 系統目標：[1-Plans/1-地震監測網.md](1-Plans/1-地震監測網.md)
- 滾動式計畫：[1-Plans/2-滾動式計畫.md](1-Plans/2-滾動式計畫.md)
- 進度紀錄：[Progress.md](Progress.md)
- 任務單：`2-Tasks/`（使用者下達的工作指令）

## 架構
```
Browser ──▶ Cloudflare Pages (Leptos CSR / WASM)
   │
   └─ fetch /api ──▶ Cloudflare Tunnel (cloudflared, 內網主機主動外連)
                         └─▶ Rust backend (axum) ──▶ PostgreSQL (內網)
感測器 ──(每小時)──▶ 寫入 PostgreSQL（寫入路徑待定，見計畫 Open Questions）
```
- 內網不開 inbound port，一律經 Cloudflare Tunnel 對外。
- 前後端共用 DTO 放 `shared` crate，避免型別漂移。

## 目錄
```
9-Project/                 Cargo workspace（前後端程式碼）
  crates/shared/           前後端共用 DTO（serde）
  crates/backend/          axum + sqlx + tokio
    migrations/            sqlx migrations
  crates/frontend/         Leptos CSR，trunk 建置 → Cloudflare Pages
  deploy/cloudflared/      Tunnel 設定範本
  docs/                    API / DB schema 等細節文件
scripts/                   維運腳本（如文件大小檢查）
```

## 常用指令（於 `9-Project/` 執行，PowerShell）
- 後端檢查/測試：`cargo check -p backend; cargo test -p backend -p shared`
- 後端啟動：`cargo run -p backend`（需 `.env`，參考 `.env.example`）
- 前端開發：`cd crates/frontend; trunk serve`
- 前端建置：`cd crates/frontend; trunk build --release`（輸出 `dist/`）
- 前端佈署：push `main`（frontend/shared 有變更）→ GitHub Actions `.github/workflows/deploy-frontend.yml` → Cloudflare Pages 專案 `earthquake`（https://earthquake-cm9.pages.dev）。secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- 文件大小檢查：`powershell -ExecutionPolicy Bypass -File scripts/check-docs-size.ps1`（於 repo 根目錄）

## 開發規則
- Rust：`cargo fmt` + `cargo clippy -- -D warnings` 必須通過；public API 加 doc comment。
- 錯誤處理：library 層 `thiserror`，禁止在非測試程式碼使用 `unwrap()`。
- Secret 一律走環境變數（`.env` 不進版控）。
- DB：時間欄位一律 `timestamptz`（UTC）；migration 只增不改。
- 每個工作段落結束：更新 `Progress.md` → commit → push（`origin main`）。
- Commit message 使用 Conventional Commits（`feat:`, `fix:`, `docs:`, `chore:`）。

## Token 節省：文件分層與歸檔規則
| 層級 | 檔案 | 上限 | 讀取時機 |
|---|---|---|---|
| 熱 | `CLAUDE.md` | 150 行 | 自動載入 |
| 溫 | `Progress.md` | 120 行 | session 開始時讀 |
| 溫 | `1-Plans/2-滾動式計畫.md` | 200 行 | 規劃/切換階段時讀 |
| 冷 | `1-Plans/archive/*`、`9-Project/docs/*` | 無 | 需要時才讀 |

歸檔規則（超過上限時立即執行，或 `scripts/check-docs-size.ps1` 回報超標時）：
1. **Progress.md**：「工作日誌」只保留最近 10 筆，較舊者整段移到 `1-Plans/archive/progress-YYYY-MM.md`。
2. **滾動式計畫**：階段完成後，該階段細項移到 `1-Plans/archive/plan-phase-N.md`，原處只留 1–3 行摘要。
3. **CLAUDE.md**：只留規則與指標；任何超過 10 行的細節（API 規格、schema、部署步驟）移到 `9-Project/docs/` 並以連結引用。
4. 冷資料不主動讀取，只在任務需要時查閱。
