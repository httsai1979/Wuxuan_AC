# 武軒冷氣／水電預約 Web App (MVP)

本專案依據《武軒企業社｜花蓮冷氣／水電服務 APP 規格書 v2.0》建立，採用純 HTML、Tailwind CSS (CDN) 與原生 JavaScript。

## 快速啟動
1. 進入專案目錄：
   ```bash
   cd /workspace/Wuxuan_AC/wuxuan-hvac-web
   ```
2. 啟動簡易伺服器：
   ```bash
   python -m http.server 8080
   ```
3. 於瀏覽器開啟 [http://127.0.0.1:8080](http://127.0.0.1:8080) 預覽，依序測試首頁、估價精靈、預約成功頁與三圖上傳流程。

## 主要功能
- 首頁四卡 (新機安裝／冷氣移機／維修檢測／FAQ) 與骨架。
- Wizard 4 步 (空間、施工條件、聯絡＋時段、確認) 與欄位驗證。
- 固定底部估價面板：顯示估價區間、明細、加價原因，以及 220V / 電梯切換與管線 3–6m Slider。
- 假 Apps Script API 串接，採用 `fetch + URLSearchParams`，若連線失敗會回退為本地模擬資料。
- 送出預約後顯示工單資訊、Google Calendar 寫入結果與三張照片上傳。
- 基礎 PWA：`manifest.webmanifest`、`sw.js` 提供首頁快取與離線提示。

## 檔案結構
- `index.html`：主畫面與 UI 架構。
- `app.js`：互動邏輯、表單狀態、估價引擎與 API 呼叫。
- `manifest.webmanifest`：PWA 設定。
- `sw.js`：Service Worker (Stale-While-Revalidate)。

> 注意：`APPS_SCRIPT_URL` 目前為假網址，請自行更新成正式 Apps Script 部署網址。

## Settings（Google Sheet 推薦欄位）
| key | 建議值 | 說明 |
| --- | --- | --- |
| `tax_rate` | `0.05` | 5% 營業稅，前端估價也提供含稅切換 |
| `peak_months` | `[7,8,9]` | 7–9 月為旺季，會觸發 PEAK 項目 |
| `coastal_distance_km` | `1.5` | 距離海 1.5km 內視為沿海腐蝕帶 |
| `sla_initial_response_hours` | `48` | 48 小時內回覆 |
| `sla_visit_days` | `3` | 3 個工作天內到場 |
| `sla_emergency_note` | `地震/颱風後視實際狀況彈性調整` | 給前後台共用 |

`travel_fee_rules` 可儲存在單一儲存格（JSON 字串）：

```json
{
  "zone_map": {
    "A": ["花蓮市", "吉安鄉"],
    "B": ["新城鄉", "壽豐鄉"],
    "C": ["鳳林鎮", "光復鄉"],
    "D": ["豐濱鄉", "玉里鎮", "富里鄉", "卓溪鄉"]
  },
  "km_ranges": [
    { "max": 10, "fee": 0 },
    { "max": 30, "fee_per_km": 8 },
    { "max": 80, "fee_per_km": 10 }
  ]
}
```

Drive 相關設定：

| key | value |
| --- | --- |
| `drive_root_id` | `<你的 HVAC 根資料夾 ID>` |
| `folders.jobs` | `Jobs` |
| `folders.templates` | `Templates` |
| `folders.exports` | `Exports` |
| `folders.logs` | `Logs` |

## PricingRules（花蓮版示例）
| rule_id | scope | item_id | name | unit | base_min | base_max | condition | badge |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `HLN-ZONE-B` | install | TRAVEL | 區域出車費（Zone B） | 次 | 300 | 400 | `zone == "B"` | TRAVEL |
| `HLN-ZONE-C` | install | TRAVEL | 區域出車費（Zone C） | 次 | 500 | 700 | `zone == "C"` | TRAVEL |
| `HLN-ZONE-D` | install | TRAVEL | 區域出車費（Zone D） | 次 | 800 | 1200 | `zone == "D"` | TRAVEL |
| `HLN-COAST` | install | COAST | 沿海防蝕建議包 | 式 | 600 | 900 | `coastal_flag == true` | COAST |
| `HLN-PEAK` | all | PEAK | 旺季工作加價 | 次 | 300 | 500 | `month in peak_months` | PEAK |
| `HLN-NIGHT` | all | OFFHOUR | 夜間時段加價 | 次 | 400 | 600 | `slot == "night"` | OFFHOUR |
| `PIPE-EXTRA` | install | PIPE | 冷媒管線超長（每米） | 米 | 250 | 350 | `pipe_len_total_m > 4`（僅計超出 4m） | PIPE |

## InfoCards（i 資訊說明）
- **i-220v**：為什麼需要 220V 獨立回路？→ 提醒啟動電流、跳電、電線過熱與壓縮機壽命，並說明若無預留需由合格電工增設；FAQ：如何確認有無獨立回路／若不做會有什麼風險？
- **i-drain**：排水與加壓排水器 → 冷凝水坡度、走天花板或室內機較低時需加壓，避免回流水與滴水；FAQ：怎麼判斷需要／是否影響裝潢？
- **i-wall**：牆體材質與打孔 → RC/磚/輕隔間差異、粉塵隔離、防水封孔與鑽石刀具；FAQ：會不會傷到鋼筋／噪音粉塵如何準備？
- **i-outdoor**：室外機位置與固定 → 陽台、外牆、屋頂優缺點與防墜、防颱；FAQ：外牆如何防掉落／屋頂是否需額外許可？
- **i-coast**：沿海防蝕 → 花蓮鹽害、建議使用不鏽鋼支架、化學錨栓、防蝕塗層；FAQ：距離海多近需要做／可自行取消嗎？
- **i-changeorder**：變更單機制 → 現場與預約不同時列出項目、金額、理由並電子簽名；FAQ：如何通知／簽名後多久更新？
- **i-warranty**：保固與償件範圍 → 施工瑕疵保固、不保項目（天災、外力、非獨立回路、排水遭破壞）、償件上限＝工程金額並需佐證；FAQ：保固期多久／天災損害如何協助？

## 報價單與保固卡模板
可在 `quote_template_html`、`warranty_template_html` 欄位存放下列結構：

### 報價單（Quote）
1. **抬頭區**：武軒企業社（蔡武軒）、統編、電話、LINE、地址、報價單編號、日期、有效期限。
2. **客戶資訊**：屋主姓名、電話、安裝地址（含樓層/電梯）。
3. **工程概況**：服務類型、品牌/型號/噸數、室內機數量、預計施工日期與時段。
4. **估價明細表**：每列含名稱、白話說明、數量、單價、小計；TRAVEL/COAST/PEAK/OFFHOUR/PIPE 等徽章須顯示。
5. **合計區**：小計、稅額、總計、付款方式與節點（完工付款/訂金）。
6. **說明與 i 索引**：說明依預約資料與照片估算，若有差異需變更單；列出 i-220v、i-drain、i-coast、i-changeorder。

### 保固卡（Warranty）
1. **抬頭**：武軒企業社冷氣安裝保固卡 + Logo/聯絡方式。
2. **工程資訊**：屋主姓名、電話、地址、完工日期、保固起迄、品牌/型號/室內機位置。
3. **保固範圍**：施工瑕疵（配管滲漏、固定不牢等）保固年限與處理方式。
4. **不在保固內**：天災（地震、颱風、鹽害）、外力撞擊、非獨立回路、排水遭破壞等。
5. **償件原則**：上限＝本次工程金額，需提供照片/報告/材料紀錄。
6. **處理流程與聯絡方式**，並附上 i-warranty、i-220v、i-drain、i-coast 索引。

## Google Calendar 事件規範
- **事件標題**：`[安裝/移機/維修] 屋主姓名 - 品牌/噸數 - 區域（例：吉安）`。
- **描述（多行 key:value）**：
  - 客戶姓名 / 聯絡電話 / 施工地址
  - 樓層 / 電梯
  - 服務類型、品牌/型號/噸數、室內機數量與位置
  - 牆體材質、室外機位置、估計管線長度
  - 排水方式（自然 / 加壓排水器建議）
  - 沿海防蝕建議（是/否）
  - 照片連結（指向 Drive photos 資料夾）
  - 工單編號

## SLA 條款（FAQ 與網站共用）
- 回覆時效：一般狀況 48 小時內以電話或訊息回覆屋主。
- 到場時效：一般狀況 3 個工作天內安排到府；重大天災或全區停電會另行公告。
- 緊急狀況優先：若冷媒大量外洩、室內明顯漏水、用電異常等，將優先排程並主動通知。

## UAT Checklist（Google Sheet 可直接貼上）
| 編號 | 測試場景 | 步驟簡述 | 預期結果 | 是否通過 | 備註 |
| --- | --- | --- | --- | --- | --- |
| 1 | 花蓮市 3 樓有電梯夜間安裝 | 線上預約 + 看估價 + 成功頁 | 出現 OFFHOUR 徽章；TRAVEL = 0；可下載報價單 |  |  |
| 2 | 壽豐沿海 5 樓無電梯 | 預約 + 上傳照片 + 選白天 | 出現 TRAVEL + COAST 徽章；提示沿海防蝕建議 |  |  |
| 3 | 鳳林長距離 + 管線 8 米 | 預約 + 寫 8 米 | PIPE 超長 4 米被計價；TRAVEL 顯示 Zone C |  |  |
| 4 | 現場變更（需加壓排水器） | 師傅端開變更單 + 屋主簽名 | 變更單列出項目與理由；屋主能看到簽名與總價更新 |  |  |
| 5 | 完工後寄送報告與保固卡 | 師傅完成 SOP 打卡並送出完工 | 屋主收到含完工報告 + 保固卡 PDF 的 Email |  |  |
| 6 | 屋主「我的工單」重看資料 | 屋主用電話+工單ID登入 | 能看到估價明細、變更紀錄、照片清單、報價單與保固下載 |  |  |
