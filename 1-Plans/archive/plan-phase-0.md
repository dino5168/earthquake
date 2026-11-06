# Phase 0 — 專案骨架（已完成 2026-11-06）

目標：可建置的前後端骨架、文件與版控就緒。

- [x] 建立 CLAUDE.md / Progress.md / 滾動式計畫與歸檔規則
- [x] 9-Project Cargo workspace：`shared` / `backend` / `frontend`
- [x] backend：axum `/api/health`、env config、CORS、sqlx lazy pool
- [x] frontend：Leptos CSR 最小頁面 + Trunk 設定
- [x] Cloudflare Tunnel 設定範本
- [x] git init 並 push 至 GitHub
- [x] 安裝 `trunk`（`cargo install trunk --locked`）並驗證 `trunk build`
- [x] （插單）前端佈署：GitHub Actions → Cloudflare Pages `earthquake`（https://earthquake-cm9.pages.dev）
