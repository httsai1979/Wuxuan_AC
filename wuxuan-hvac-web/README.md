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
