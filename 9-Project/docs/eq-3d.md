# 地震點雲 3D 檢視器（`9-Project/viz/eq-3d`）

- 技術：Vite + TypeScript strict + three.js + lil-gui；建置輸出 `dist/`，`base` 為 `/viz/eq-3d/`。
- 嵌入方式：Leptos `/history` 頁（`crates/frontend/src/pages/history.rs`）用 iframe 載入 `/viz/eq-3d/index.html`。
  Trunk 在 `crates/frontend/index.html` 用 `copy-dir` 把 `viz/eq-3d/dist` 複製到網站的 `dist/viz/eq-3d`。
- 在 iframe 內會自動隱藏標題；螢幕寬度小於 768px 時，控制面板預設收合，直式畫面的鏡頭會自動拉遠。

## 深度分類與座標軸
- 震源深度分類放在 `src/depthClass.ts`（`DEPTH_CLASSES`），依 CWA 地震百問 14 分為四類：0–30／30–70／70–300／300–700 km。圖例使用 CWA 原色；`pointColor` 只在深色背景看不清楚時才另外指定。
- 規模分類放在 `src/magnitudeClass.ts`，依 CWA 地震百問 33 分為四類：M < 3／3–5／5–7／≥ 7。勾選「依規模分級」後，點大小改為 4 級固定倍率（`sizeScale`），顏色仍代表深度。
- 兩種分類共用 `src/rangeClass.ts` 的 `classOf`／`countByClass`；圖例在 `src/legend.ts`。
- 座標軸放在 `src/layers/axes.ts`：經度標在外框南緣，緯度標在東緣，深度標在西南角的垂直邊。標籤用 three 內建的 `CSS2DRenderer`，會跟著深度倍率移動。

## 本機開發
```powershell
cd 9-Project/viz/eq-3d; pnpm install; pnpm dev        # 單獨開發檢視器：http://localhost:5173/viz/eq-3d/
pnpm build                                            # 給 trunk serve 用：必須先建置，否則 copy-dir 找不到 dist
cd ../../crates/frontend; trunk serve                 # http://127.0.0.1:3000/history
```
- Trunk 不會監看 `viz/` 目錄。重新 `pnpm build` 之後，要儲存一次 `crates/frontend/index.html`，或重啟 `trunk serve`。

## 資料更新（每年或 CWA 資料更新時）
資料檔放在 `public/data/`，要進版控，因為 CI 拿不到未進版控的原始 XML。
1. 把新的 `CWA-EQ-Catalog-YYYY.xml` 放進 `4-資料處理/`。
2. 在 `4-資料處理` 執行：
   - `uv run --no-project cwa_catalog_to_csv.py CWA-EQ-Catalog-YYYY.xml`
   - `uv run --no-project csv_to_point_cloud.py`
3. 在 `9-Project/viz/eq-3d` 執行 `pnpm update-data`，然後 commit `public/data/`。年份滑桿的範圍會自動從資料計算。
- 地形只要產生一次，會直接寫進 `public/data`：`uv run --no-project --with numpy --with pillow build_terrain.py`

## CI
`.github/workflows/deploy-frontend.yml` 的步驟依序為：pnpm 和 Node 22 → 在 eq-3d 執行 `pnpm test` 和 `pnpm build` → `trunk build` → 佈署。
`9-Project/viz/**` 有變更時也會觸發佈署。
