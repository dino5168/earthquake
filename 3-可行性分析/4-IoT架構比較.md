# 架構比較：IoT Server（MQTT）vs DB 推播（SSE）

> 任務：[3-系統架構評估.md](3-系統架構評估.md)
> 對照：[2-即時推播評估計畫.md](2-即時推播評估計畫.md)（以下稱方案 A）
> 日期：2026-11-06

## 兩個方案
**方案 A：DB 推播（現行評估）**
```
採集程式 ─INSERT─▶ PostgreSQL ─NOTIFY─▶ backend ─SSE─▶ Tunnel ─▶ Browser
```

**方案 B：IoT Server（MQTT broker，例：Mosquitto / EMQX）**
```
儀器/採集程式 ─publish─▶ MQTT broker ─┬─(subscribe)─▶ 寫入服務 ─▶ PostgreSQL
                                      └─MQTT over WebSocket─▶ Tunnel ─▶ Browser
```

## 比較
| 面向 | A：DB 推播 | B：IoT Server |
|---|---|---|
| 新增元件 | 無（PG trigger + axum 內建 SSE） | broker、寫入服務、前端 MQTT client |
| 前端即時性 | 秒級（commit 後才推） | 毫秒級（publish 即推） |
| **資料一致性** | DB 是唯一真實來源；`NOTIFY` 在 commit 後才送出，畫面上的資料一定已經入庫 | 雙路徑：broker 推到前端與寫入 DB 互相獨立，寫入失敗時前端仍會顯示，造成畫面與歷史對不上 |
| 斷線補資料 | `Last-Event-ID` 從 DB 補送（與歷史查詢共用查詢） | 需另外處理：retained message 只保留最後一筆，補洞仍要回頭查 DB API |
| 前端實作 | 瀏覽器原生 `EventSource` | Rust/WASM 沒有成熟的 MQTT client（`rumqttc` 不支援 wasm），只能 JS interop（MQTT.js），bundle 增加 |
| 對外安全面 | 只對外開唯讀 HTTP API | broker 要暴露給瀏覽器：需 ACL、唯讀帳號，而帳密會出現在前端（等於公開），攻擊面變大 |
| Cloudflare Tunnel | 一般 HTTP，無特殊需求 | 瀏覽器只能走 MQTT over WebSocket；原生 MQTT（TCP 1883）經 Tunnel 時 client 端要裝 cloudflared，瀏覽器做不到 |
| 維運 | 一個 backend 行程 | 多了 broker 的部署、監控、持久化設定 |
| 適合的資料量 | 每小時～每秒級、儀器數十台內 | 高頻（波形、Hz 級）、上千台裝置 |
| 下行控制（遠端設定儀器） | 不支援（需要時再加 WebSocket） | 原生支援（雙向 topic） |
| 裝置離線緩衝 | 由採集程式自行處理 | QoS 1/2 + persistent session 內建 |

## 結論：現階段選方案 A
目前的需求是：每小時一筆、儀器數量少、已有一隻後端程式寫 DB、前端只讀。方案 B 的優勢（毫秒延遲、海量裝置、下行控制、QoS）都用不上，卻要付出三個實際成本：
1. **一致性變差**：雙路徑造成畫面與歷史資料可能不一致，而這是監測系統最不能接受的。
2. **broker 暴露到公網**：違反「內網只走 Tunnel、只開必要 API」的原則。
3. **前端多一套 JS 依賴**：要多做 JS interop，打破 Rust 全端與 `shared` crate 共用 DTO 的一致性。

## 何時改走 IoT（觸發條件）
出現以下任一情況，就在**寫入端**引入 MQTT broker：
- 儀器本身只支援 MQTT 輸出（無法改成寫 DB／呼叫 API）
- 取樣頻率提高到秒級以下（例：要即時看波形）
- 裝置增加到數百台以上，或裝置分散在多個內網、需要離線緩衝
- 需要從網頁下達儀器控制指令

即使改了，也**建議 broker 只留在內網**：
```
儀器 ─MQTT─▶ broker（內網）─▶ backend subscribe ─INSERT─▶ PostgreSQL
                                      └─ 寫入成功後 ─SSE─▶ Tunnel ─▶ Browser
```
- 前端、SSE、補送邏輯都不用改；改的只有 backend 的資料來源（`PgListener` 換成 MQTT subscriber，Rust 有 `rumqttc`）。
- 維持「先入庫再推播」的一致性，broker 也不必對外暴露。

因此方案 A 不是死路：它是方案 B 的前端與持久層，日後可以平滑升級。
