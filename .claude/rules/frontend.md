---
paths:
  - "9-Project/crates/frontend/**"
---

# 前端規則（Leptos CSR）

## 目錄職責（`crates/frontend/src/`）
| 目錄 | 放什麼 | 不放什麼 |
|---|---|---|
| `layout/` | App Shell 骨架（Sidebar、Topbar），全專案只用一次 | 可重用的小元件 |
| `components/` | 通用 UI 元件，只靠 props 驅動 | API 呼叫、地震領域邏輯 |
| `pages/` | 一個路由一個檔；組合元件、取資料 | 可重用的 UI 片段（要抽到 components） |
| `config/` | 靜態設定資料（選單等）+ 純函式 | 元件 |
| `state/` | 全域 UI 狀態，用 `provide_context` / `use_context` | 頁面私有狀態 |

## 規則
- 新增頁面：在 `config/menu.rs` 加一筆，在 `app.rs` 加一條路由。尚未實作的頁面一律用 `PlaceholderPage`。
- 跨 2 層以上要傳的狀態改用 context，不要層層傳 props。
- Icon 一律用 `leptos_icons` + `icondata` 的 Lucide（`icondata::Lu*`），不混用其他 icon 集。
- 顏色、間距、尺寸只能用 `styles/_tokens.scss` 定義的 CSS 變數，禁止在元件 SCSS 寫死色碼。
- 每個元件對應一個 SCSS partial（BEM block 名稱 = 元件名 kebab-case）。
- 純邏輯（比對路徑、格式化等）寫成不依賴 DOM 的函式，並用 `cargo test -p frontend` 測試。
- 完成前執行：`cargo fmt`、`cargo clippy -p frontend --target wasm32-unknown-unknown -- -D warnings`、`trunk build --release`。
