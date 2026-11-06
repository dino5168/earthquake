# 軟體工程規則（全專案適用）

## 重用優先，不重造輪子
1. 先找專案內既有的元件或函式。
2. 再找成熟套件，條件：維護活躍、型別完整、體積合理。只開需要的 feature。
3. 都沒有才自己寫。自寫的通用邏輯要放在可重用的位置（見「依功能分類」）。
- 同樣的邏輯出現第 2 次就抽出共用；只用一次的不預先抽象（YAGNI）。

## 功能性與簡單性的平衡
- 先求能讀懂，再求彈性。設計模式只在能降低「當前」複雜度時才引入。
- 用資料驅動取代重複的程式碼。例如選單和路由用設定陣列，而不是複製貼上的元件。

## 規模上限（超過就重構）
- 函式／元件超過 **200 行**：必須拆分。
- 單一檔案超過 **400 行**：考慮拆成子模組。
- 巢狀超過 4 層：改用 early return 或抽出函式。

## 依功能分類
- 模組依「功能職責」分目錄，例如 `layout/`、`components/`、`pages/`、`config/`、`state/`（前端），`routes/`、`db/`（後端）。
- 通用元件不得含業務（地震）領域知識；領域邏輯放在使用它的頁面或模組。

## 命名規則
| 對象 | 規則 | 例 |
|---|---|---|
| Rust 檔案、模組 | snake_case，檔名要等於主要型別或元件名 | `stat_card.rs` ↔ `StatCard` |
| Rust 型別、元件 | PascalCase | `NavGroup`, `LayoutState` |
| Rust 函式、變數 | snake_case，動詞開頭 | `is_active`, `toggle_sidebar` |
| CSS class | kebab-case + BEM | `.sidebar__item--active` |
| SCSS partial | `_<block>.scss`，對應 BEM block | `_sidebar.scss` |
| 路由路徑 | kebab-case 英文 | `/sensor-detail` |
| localStorage key | `eq.<area>.<name>` | `eq.sidebar.collapsed` |
