# Progress

> 上限 120 行。「工作日誌」只保留最近 10 筆，舊紀錄移至 `1-Plans/archive/progress-YYYY-MM.md`。
> 計畫細節見 [1-Plans/2-滾動式計畫.md](1-Plans/2-滾動式計畫.md)。

## 目前狀態
- 主線：Phase 2 — 資料模型與寫入（Phase 1 已完成並歸檔），**阻塞**中，等使用者回覆 Open Questions
- 支線（11-10 完成）：CWA 地震目錄 1990–2025 → CSV → 3D 點雲，已上線 https://earthquake-cm9.pages.dev/history
- 支線（11-10 完成）：點雲改用 CWA 震源深度四分類配色，並加上經緯度與深度座標軸；可切換成依規模漸層著色、大小分級（CWA 色帶）；可顯示經緯度與深度格線

## 下一步
1. 使用者回覆 Open Questions（`1-Plans/2-滾動式計畫.md`）→ 展開 Phase 2 任務
   - 最關鍵：感測器資料欄位、寫入方式（建議後端 ingest API）
2. 待確認的小事項：
   - `review_status` F/N/X 的意義（向 CWA 查證）
3. 滾動式計畫尚未納入 11-10 的支線成果；下次規劃時把 `/history` 3D 和 Phase 3/4 的關係補進去

## 下次開工
- 讀本檔 + `1-Plans/2-滾動式計畫.md` 即可接續；任務單在 `2-Tasks/`、`1-Plans/`、`4-資料處理/`
- 本機前端：先 `cd 9-Project/viz/eq-3d; pnpm build`，再 `cd ../../crates/frontend; trunk serve` → http://127.0.0.1:3000（見 `9-Project/docs/eq-3d.md`）
- 3D 檢視器單獨開發：`cd 9-Project/viz/eq-3d; pnpm dev` → http://localhost:5173/viz/eq-3d/
- 線上：https://earthquake-cm9.pages.dev（push 前端或 `viz/` 的變更會自動佈署）

## 工作日誌（最新在上，最多 10 筆）
### 2026-11-10 — 地震點雲：經緯度與深度格線（任務：1-Plans/10-經緯度格線.md）
- 新增 `layers/grid.ts`：在海平面（Z=0）畫 1° 經緯線格線；在北牆和東牆畫經緯度垂直線，以及深度 30／70／100／200／300 km 水平線，會跟著深度倍率縮放
- 控制面板新增「經緯度與深度格線」checkbox，預設顯示（使用者決定）；格線放北牆＋東牆、間距 1°（使用者決定）
- 格線比半透明地形先繪製，並關閉 depthWrite，所以在「地形浮於點雲上」時仍隱約可見，也不會遮住點雲
- vitest 39 tests、tsc 與 build 都通過；本機瀏覽器驗收格線位置正確
### 2026-11-10 — 地震點雲：規模色帶著色，並移除圖片點雲測試（任務：1-Plans/9-顏色分類.md）
- 參考設計是 CWA 地震百問 33 的規模色帶（`1-Plans/images/地震規模色帶.png`）
- 勾選「依規模著色與分級」後，點顏色依規模連續漸層（M 1／3／5／7 = 綠／藍／橘／紅，使用者選連續漸層），大小維持 4 級；深度改由位置和分層線表達，深度圖例改標「篩選」並淡化色塊
- 兩組顏色都存在 GPU 上，切換時不必重建 buffer；圖例新增水平色帶與 M 3／5／7 刻度
- 圖片點雲測試全部移除：檢視器圖層與解析程式、`5-3D點雲/`（含未進版控的照片）、本機 `image-cloud.csv`、相關 gitignore；計畫 6 移到 `1-Plans/archive/`
- vitest 35 tests 與 build 都通過；本機瀏覽器驗收時 console 無錯誤
### 2026-11-10 — 地震點雲：規模分級（任務：1-Plans/8-芮氏規模.md）
- 計畫書寫在任務單內；評估可行，只改 `9-Project/viz/eq-3d`
- 「地震點」新增 checkbox「依規模分級」：勾選後點大小改為 CWA 規模 4 級（倍率 0.6／1／2.5／6），顏色仍代表深度（使用者決定）
- 圖例新增「規模分類（大小）」區塊，各級筆數為 0／72,254／1,465／10；不加類別顯示開關，沿用最小規模滑桿（使用者決定）
- 重構：`rangeClass.ts` 改為共用分類函式，深度和規模兩種分類都使用；圖例抽到 `legend.ts`
- vitest 35 tests 與 build 都通過；本機瀏覽器驗收時 console 無錯誤
### 2026-11-10 — 地震點雲：深度分類與座標軸（任務：1-Plans/7-地震點雲修改.md）
- 計畫書寫在任務單內；評估可行，只改 `9-Project/viz/eq-3d`
- 深度分類 `src/depthClass.ts`：使用 CWA 地震百問 14 的配色（使用者給的 faqdetail/34 是規模分類）。深層地震的點雲改用較亮的 `#60a5fa`，圖例仍用原色 `#1e3a8a`（使用者決定）
- 點雲顏色改為 4 類離散色，移除連續漸層；控制面板可依類別顯示或隱藏；圖例顯示各類筆數（50,472／14,068／9,187／2）
- 座標軸 `src/layers/axes.ts`（CSS2DRenderer）：南緣標經度、東緣標緯度、西南角標深度，另有 30／70／300 km 分層線；外框維持 320 km
- vitest 26 tests 與 build 都通過；本機瀏覽器驗收時 console 無錯誤
### 2026-11-10 — 圖片轉 3D 點雲測試（任務：5-3D點雲/1-圖片點雲測試.md）
- 計畫 `1-Plans/6-圖片點雲測試實作計畫.md`；原圖 girl.png 不使用，改用大衛像
- `5-3D點雲/image_to_cloud.py`：Depth Anything V2 → 在深度圖上做 Otsu 去背 → 經緯度與深度 → `image-cloud.csv`（16,809 點）
- 檢視器新增「圖片點雲（測試）」圖層；資料檔 gitignore，所以線上不會出現（只在本機測試，使用者決定）
- Blender MCP：已連線，但 3D 生成服務都沒開、addon 版本過舊，方案 B 暫緩
- 結論：測試可用，暫停在本機。限制：只有正面、前後起伏是推估值（參數 30 km）、原圖解析度低、去背依賴深度差；後續可選 360°（方案 B）或上線（先確認授權）
### 2026-11-10 — 點雲整合進網站 /history 實作計畫（任務：1-Plans/5-將地震點雲放到正是網站.md）
- 計畫書 `1-Plans/5-地震點雲整合網站實作計畫.md`：評估可行，T1–T6
- 決策：iframe 嵌入 `/viz/eq-3d/`、3D 填滿整頁、資料（約 4.7 MB）進 git；eq-3d 搬到 `9-Project/viz/eq-3d`；CI 加入 Node／pnpm
- T1–T5 完成：eq-3d 搬到 `9-Project/viz/eq-3d`（base `/viz/eq-3d/`，資料進 git）；`HistoryPage` iframe；Trunk copy-dir；CI 加 pnpm/Node
- 本機驗收：桌機與 400px 寬度都正常，console 無錯誤；手機寬度時控制面板預設收合、鏡頭自動拉遠；年份範圍改為從資料計算
- 流程文件：`9-Project/docs/eq-3d.md`
- T6 線上驗收通過：https://earthquake-cm9.pages.dev/history（iframe 指向 `/viz/eq-3d/`，避免 Pages 的 308 轉址）
### 2026-11-10 — 地震點雲 3D 原型 T1–T6 完成（`4-資料處理/eq-3d/`）
- `build_terrain.py`：AWS Terrarium z7 → 601×701 Int16 網格（EPSG:3857 → 4326 重採樣）；玉山 3616 m、花蓮外海 −3707 m
- Vite 8 + TS 7 strict + three 0.187 + lil-gui；vitest 9 tests、pytest 18 tests、`pnpm build` 通過，console 無錯誤
- 與參考圖差異的調整：地形放大 10 倍後海底 −64 km 會吞掉淺層點 → 預設「地形浮於點雲上」（最深海床對齊 y=0）
- 啟動：`cd 4-資料處理/eq-3d; pnpm install; pnpm dev`；T7 使用者確認，暫不調整
### 2026-11-10 — 地震點雲 3D 實作計畫（任務：4-資料處理/2-顯示3D.md）
- 計畫書 `1-Plans/4-地震點雲3D實作計畫.md`：three.js 點雲 + DEM 地形面，T1–T7；評估結論可行
- 實測：AWS Terrain Tiles 可下載，含海底地形（−6370～3545 m）；73,729 點單一 draw call
- 決策：`4-資料處理/eq-3d/` 獨立原型（Vite + TS）、不做時間動畫、地形用 AWS Terrain Tiles；待開工 T1
### 2026-11-10 — 地震目錄轉點雲（任務：4-資料處理/1-整理資料成點雲.md）
- `4-資料處理/csv_to_point_cloud.py` + pytest；輸出 `EQHistory.CSV`（73,729 點，依時間排序，已 gitignore）
- 欄位 `x,y,z,origin_time,magnitude_ml`：x=經度、y=緯度（度）、z=-深度（km）；使用者選經緯度原值（水平/垂直單位不同，3D 檢視需自行縮放 z）
### 2026-11-10 — CWA 地震目錄 XML → CSV（任務：1-Plans/3-地震資料處理.md）
- `4-資料處理/cwa_catalog_to_csv.py`（stdlib only）+ pytest 5 tests；1990 輸出 `CSV/CWA-EQ-Catalog-1990.csv`（2451 筆，與 RecordNumber 一致）
- 欄位 snake_case、單位寫入欄名；選填欄位（erz/rms/erh/最小震央距）缺漏輸出空字串；時間保留原始 `+08:00`
- 1990–2025 全部轉檔完成（共 73,729 筆）；時間保留 `+08:00`（使用者決定）
- 原始 XML 與 CSV 輸出加入 `.gitignore`（CSV 可由 XML 重建）
- 欄位說明書 `4-資料處理/EarthquakeHistory.html`；`review_status` F/N/X 意義待向 CWA 查證
