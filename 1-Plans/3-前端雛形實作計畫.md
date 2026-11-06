# 前端雛形實作計畫 — Dashboard Shell

> 任務：[[3-前端雛形設計]]　所屬階段：Phase 1（見 [[2-滾動式計畫]]）
> 冷資料：實作期間參考，完成後歸檔至 `archive/`。

## 1. 目標與範圍
依參考畫面完成 Dashboard 外框（App Shell），之後各功能頁面都套在這個外框裡。

| 項目 | 範圍內 | 範圍外（之後的階段） |
|---|---|---|
| 左側選單 | 展開／收合、目前頁面高亮、紅點 badge、一個測試用子選單 | 權限控管哪些項目可見 |
| 頂部工具列 | ☰ 切換鈕、頁面標題、右側使用者 icon 佔位 | 登入、通知 |
| 頁面 | 儀表板放卡片佔位；其他頁共用「建置中」頁 | 真實資料、圖表 |
| RWD | ≥ 768px 用桌機版（展開／收合）；< 768px 改為抽屜 + 遮罩 | 平板專屬版面 |
| 主題 | 參考圖配色，顏色全部用 CSS 變數 | 深色模式切換 |

## 2. 技術選型（不重造輪子）
| 需求 | 選用 | 理由 |
|---|---|---|
| 路由 | `leptos_router` 0.8 | 官方套件，用來判斷目前頁面高亮 |
| Icon | `leptos_icons` 0.7 + `icondata`（只開 `lucide` feature） | inline SVG，只編譯用到的 icon；Lucide 線條風格與參考圖一致；不依賴 CDN 或字型檔 |
| localStorage、media query | `leptos-use` 0.20（只開需要的 feature） | 記住收合狀態、偵測窄螢幕，不自己寫 web-sys 膠水碼 |
| 樣式 | SCSS（Trunk 內建 dart-sass）+ CSS 變數 | 不需要 Node 工具鏈；用 partial 依元件拆檔 |

不採用 UI 元件庫（thaw、leptonic）：它們的 Fluent／Material 風格和參考圖差異大，要覆寫的樣式比自己寫還多。

## 3. 選單（資料驅動）
選單定義在 `config/menu.rs`，是一份靜態陣列，`Sidebar` 依資料渲染。之後增減頁面只需要改這一份陣列，再加一行路由。

| 項目 | 路徑 | Lucide icon | 備註 |
|---|---|---|---|
| 儀表板 | `/` | LayoutDashboard | |
| 即時監測 | `/realtime` | Activity | |
| 歷史查詢 | `/history` | History | |
| 感測器管理 | `/sensors` | RadioTower | |
| 告警事件 | `/alerts` | BellRing | 紅點 badge 示範 |
| 報表 | `/reports` | ChartColumn | |
| 子選單測試 | `/demo` | FlaskConical | 子項：子頁 A `/demo/a`、子頁 B `/demo/b` |
| 系統設定 | `/settings` | Settings | |

（實際的 `icondata` 常數名稱實作時再確認，例如 `LuChartColumn`。）

```rust
pub struct MenuEntry {
    pub label: &'static str,
    pub path: &'static str,
    pub icon: icondata::Icon,
    pub badge: bool,
    pub children: &'static [MenuEntry],
}
```

### 子選單行為
- **展開模式**：點擊群組項目會展開或收起子項目（accordion），右側 › 旋轉 90°。
- **收合模式**：滑鼠移到 icon 上，右側彈出浮動子選單（flyout），裡面有群組標題和子項目。
- 目前頁面是某個子項目時，它的父項目也要高亮；展開模式下群組自動展開。

## 4. 目錄與元件（依功能分類）
```
crates/frontend/
  index.html                  link scss 入口
  styles/
    main.scss                 只做 @use
    _tokens.scss              CSS 變數：色彩、間距、側欄寬度、z-index
    _base.scss                reset、字型
    layout/  _app-shell.scss _sidebar.scss _topbar.scss
    components/ _nav.scss _card.scss _icon-button.scss
  src/
    main.rs                   只做 mount
    app.rs                    Router + 路由表
    config/menu.rs            選單資料 + 純函式（is_active 等）
    state/layout_state.rs     LayoutState（collapsed、mobile_open）以 context 提供
    layout/                   版面骨架（全專案只用一次）
      app_shell.rs  sidebar.rs  topbar.rs
    components/               通用元件（不含地震領域知識）
      nav_item.rs  nav_group.rs  card.rs  stat_card.rs  icon_button.rs
    pages/                    一個路由一個檔
      dashboard.rs  placeholder.rs
```

| 元件 | 職責 | 主要 props |
|---|---|---|
| `AppShell` | 排版骨架：Sidebar + Topbar + `<Outlet/>`；提供 LayoutState context | — |
| `Sidebar` | Logo + 依 `MENU` 渲染 NavItem／NavGroup；依狀態切換 class | — |
| `Topbar` | ☰ 切換鈕（桌機切換收合；手機開啟抽屜）、標題 | — |
| `NavItem` | 單一連結：icon、label、badge、高亮；收合時用 `title` 顯示提示 | `entry: &'static MenuEntry` |
| `NavGroup` | 有子項目的群組：accordion 或 flyout | `entry: &'static MenuEntry` |
| `IconButton` | 方形 icon 按鈕（☰ 及之後的工具列按鈕） | `icon`, `label`, `on_click`, `variant` |
| `Card` | 白底卡片容器 | `title: Option`, `children` |
| `StatCard` | 數值卡（標題 + 數值 + 副標） | `title`, `value`, `hint` |
| `PlaceholderPage` | 共用的「建置中」頁，避免 7 個幾乎相同的空頁 | `title` |

### 狀態設計
- `LayoutState { collapsed: Signal<bool>, mobile_open: RwSignal<bool> }`，由 `AppShell` 透過 `provide_context` 提供，避免層層傳 props。
- `collapsed` 存在 localStorage（key `eq.sidebar.collapsed`），重新整理後保留。
- 判斷模式用 `use_media_query("(max-width: 767px)")`；切換頁面時自動關閉手機抽屜。

## 5. 視覺規格（取自參考圖）
| Token | 值 | 用途 |
|---|---|---|
| `--sidebar-bg` | `#0f1b2d`（深藍） | 側欄背景 |
| `--sidebar-fg` | `#c5cbd6` | 選單文字和 icon |
| `--accent` | `#4f7cff` | 高亮文字、☰ 按鈕底色 |
| `--badge` | `#ff4d6d` | 紅點 |
| `--content-bg` | `#f3f4f7` | 內容區底色 |
| `--sidebar-w` / `--sidebar-w-collapsed` | `260px` / `64px` | 側欄寬度 |
| 轉場 | `width 200ms ease` | 展開／收合動畫 |

Logo：用 `Activity` icon 加「十方地震監測網」字樣。收合時只顯示 icon。參考圖只參考版型結構，不沿用它的品牌或圖像。

## 6. 任務拆分（每項完成後各自 commit）
| # | 任務 | 完成條件 |
|---|---|---|
| T1 | 依賴 + SCSS 管線 + tokens/base | `trunk build` 通過，畫面套用底色 |
| T2 | `config/menu.rs`、`state/layout_state.rs` + 單元測試 | `cargo test -p frontend`：路徑不重複、`is_active` 能正確比對子路徑 |
| T3 | `AppShell`、`Sidebar`、`Topbar`，含展開／收合 | 桌機可以切換，重新整理後保留狀態 |
| T4 | `NavItem`、`NavGroup`（accordion 和 flyout）、高亮、badge | 子選單在兩種模式下都正常 |
| T5 | RWD 抽屜 + 遮罩 | < 768px 抽屜能開關；點遮罩或切換頁面會關閉 |
| T6 | `Card`、`StatCard`、`Dashboard`、`PlaceholderPage`、路由表 | 8 個路由都能進入 |
| T7 | 驗收：fmt、clippy、test、瀏覽器實測（展開、收合、手機），佈署後直接開深層連結 | 線上直接開 `/history` 不會 404 |

## 7. 風險與備註
- **深層連結**：Cloudflare Pages 在沒有 `404.html` 時會自動退回 SPA fallback，T7 要實測確認。
- **flyout 被裁切**：側欄如果設 `overflow: auto`，flyout 會被裁掉。flyout 要改用 `position: fixed`，或把捲動放在內層容器。
- **wasm 體積**：只開 lucide 和需要的 leptos-use feature，release 建置後要確認大小沒有異常膨脹（目前約 64 KB）。
