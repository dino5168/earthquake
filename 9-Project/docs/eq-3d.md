# 地震點雲 3D 檢視器（`9-Project/viz/eq-3d`）

- 技術：Vite + TypeScript strict + three.js + lil-gui；建置輸出 `dist/`，`base` 為 `/viz/eq-3d/`。
- 兩個頁面（Vite multi-page，`vite.config.ts`）：
  - `/viz/eq-3d/`：台灣，CWA 地震目錄 + 台灣地形（`src/main.ts`）
  - `/viz/eq-3d/usgs/`：全球地球，瀏覽器直接查 USGS（`usgs/index.html`、`src/usgs/`）
- 嵌入方式：Leptos 路由 `/history/taiwan`、`/history/usgs`（`crates/frontend/src/pages/history.rs` 的 `TAIWAN_VIEWER`／`USGS_VIEWER`）用 iframe 載入；舊網址 `/history` 轉址到 `/history/taiwan`。
  Trunk 在 `crates/frontend/index.html` 用 `copy-dir` 把 `viz/eq-3d/dist` 複製到網站的 `dist/viz/eq-3d`。
- 在 iframe 內會自動隱藏標題；螢幕寬度小於 768px 時，控制面板預設收合，直式畫面的鏡頭會自動拉遠。

## 深度分類與座標軸
- 震源深度分類放在 `src/depthClass.ts`（`DEPTH_CLASSES`），依 CWA 地震百問 14 分為四類：0–30／30–70／70–300／300–700 km。圖例使用 CWA 原色；`pointColor` 只在深色背景看不清楚時才另外指定。
- 規模分類放在 `src/magnitudeClass.ts`，依 CWA 地震百問 33 分為四類：M < 3／3–5／5–7／≥ 7。勾選「依規模著色與分級」後，點顏色改為 CWA 規模色帶的連續漸層（`MAGNITUDE_COLOR_STOPS`：M 1／3／5／7 = 綠／藍／橘／紅），點大小改為 4 級固定倍率（`sizeScale`）；深度改由位置和分層線表達。兩組顏色（`color`／`aMagColor`）都放在 GPU，切換時只改 uniform。
- 兩種分類共用 `src/rangeClass.ts` 的 `classOf`／`countByClass`；圖例在 `src/legend.ts`。
- 座標軸放在 `src/layers/axes.ts`：經度標在外框南緣，緯度標在東緣，深度標在西南角的垂直邊。標籤用 three 內建的 `CSS2DRenderer`，會跟著深度倍率移動。
- 格線放在 `src/layers/grid.ts`：海平面（Z=0）有 1° 經緯線，北牆和東牆有經緯度垂直線和深度水平線，由「經緯度與深度格線」切換。格線比地形（`renderOrder` 2）先繪製，所以被地形蓋住時仍會隱約透出。

## USGS 全球地球（`/viz/eq-3d/usgs/`）
- 資料：瀏覽器直接呼叫 USGS FDSN Event API（`src/usgs/query.ts`；對方回 `Access-Control-Allow-Origin: *`），不存檔、不經後端。查詢條件是 UTC 起訖日期（兩端都含）和最小規模，預設是近 30 天、M ≥ 4.5。單次上限 20,000 筆，達上限時狀態列會提示。
- 地球：`src/layers/globe.ts`。半徑 100 個場景單位代表 6371 km；`globePosition` 和 `THREE.SphereGeometry` 用同一套角度定義，所以等距圓柱貼圖會和地震點對齊（有測試）。震源依深度往球心內縮，可調深度倍率。
- 地表貼圖：從 `public/data/globe-terrain.{bin,json}`（全球 0.25° 高程）用 `elevationColor` 著色。產生方式（在 `4-資料處理` 執行一次）：`uv run --no-project --with numpy --with pillow build_terrain.py --region globe`
- 點雲 shader、深度/規模分類與圖例都和台灣頁共用（`createPoints` 接收位置陣列）。

## 本機開發
```powershell
cd 9-Project/viz/eq-3d; pnpm install; pnpm dev        # 單獨開發檢視器：http://localhost:5173/viz/eq-3d/
pnpm build                                            # 給 trunk serve 用：必須先建置，否則 copy-dir 找不到 dist
cd ../../crates/frontend; trunk serve                 # http://127.0.0.1:3000/history/taiwan、/history/usgs
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
