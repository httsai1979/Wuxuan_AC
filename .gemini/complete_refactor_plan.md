# HVAC App 完整重構計畫（選項B）

## 📋 重構範圍

### Phase 1: 核心功能補全 ⚡
1. ✅ **照片上傳系統**
   - 前端照片選擇與預覽
   - Base64 轉換
   - 照片壓縮（Canvas API）
   - 上傳至 Google Drive
   
2. ✅ **表單提交流程**
   - 資料驗證
   - API 呼叫
   - 錯誤處理
   - 成功畫面

3. ✅ **新欄位整合**
   - brand_model（品牌型號）
   - wall_type（牆體材質）
   - indoor_unit_count（室內機數量）

### Phase 2: 進階功能 🚀
4. ✅ **日曆可用性檢查**
   - 後端 checkAvailability API
   - 前端日期禁用邏輯
   - 即時更新

5. ✅ **離線支援**
   - Service Worker 註冊
   - 快取策略
   - 離線表單儲存
   - 自動重試機制

6. ✅ **Email 通知系統**
   - 訂單確認信
   - 完工通知
   - 保固書寄送

### Phase 3: 優化與測試 ⚡
7. ✅ **效能優化**
   - 程式碼分割
   - 懶加載
   - 圖片壓縮

8. ✅ **完整測試**
   - 單元測試
   - 整合測試
   - E2E 測試

## 🎯 實作順序

### Step 1: 前端核心功能 (app.js)
```javascript
// 1.1 照片壓縮函數
function compressImage(file, maxWidth = 1920, quality = 0.8)

// 1.2 照片上傳函數  
async function uploadPhoto(file, type, folderId)

// 1.3 表單提交函數
async function handleSubmit()

// 1.4 更新 collectFormState
// 加入新欄位收集
```

### Step 2: 後端 API 擴充 (Code.js)
```javascript
// 2.1 日曆可用性檢查
function checkAvailability(data)

// 2.2 Email 通知
function sendOrderConfirmation(data)
function sendCompletionNotice(data)

// 2.3 更新 createJob
// 回傳 warranty_url
```

### Step 3: 離線支援
```javascript
// 3.1 建立 service-worker.js
// 3.2 快取策略實作
// 3.3 離線表單儲存
```

### Step 4: 測試檔案
```javascript
// 4.1 __tests__/app.test.js
// 4.2 jest.config.js
// 4.3 jest.setup.js
```

## 📁 檔案結構（完成後）

```
wuxuan-hvac-web/
├── index.html (✅ 已存在，需微調)
├── installer.html (✅ 已存在)
├── app.js (🔧 需大幅擴充)
├── installer.js (✅ 已存在，需微調)
├── service-worker.js (❌ 新建)
├── manifest.json (❌ 新建，PWA 支援)
└── __tests__/
    └── app.test.js (❌ 新建)

server/
├── Code.js (🔧 需擴充)
└── README.md (✅ 已存在)

package.json (🔧 需更新)
jest.config.js (❌ 新建)
jest.setup.js (❌ 新建)
```

## 🔧 詳細實作內容

### 1. 照片壓縮 (app.js)
```javascript
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 2. 離線支援 (service-worker.js)
```javascript
const CACHE_NAME = 'hvac-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/installer.html',
  '/installer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### 3. Email 通知 (Code.js)
```javascript
function sendOrderConfirmation(data) {
  const subject = `【武軒冷氣】訂單確認 - ${data.job_id}`;
  const body = `
親愛的 ${data.name} 您好：

您的預約已成功建立！

訂單編號：${data.job_id}
預約日期：${data.date} ${data.slot}
服務項目：${data.serviceType}
地址：${data.address}

我們的師傅會準時到達，感謝您的信任！

武軒冷氣團隊
  `;
  
  MailApp.sendEmail({
    to: data.phone + '@example.com', // 需要實際 email
    subject: subject,
    body: body
  });
}
```

## ⏱ 預估時間
- Phase 1: 2-3 小時
- Phase 2: 3-4 小時  
- Phase 3: 2-3 小時
- **總計**: 7-10 小時

## 🚦 執行檢查點
- [ ] Phase 1.1 完成 - 照片壓縮測試通過
- [ ] Phase 1.2 完成 - 照片上傳測試通過
- [ ] Phase 1.3 完成 - 表單提交測試通過
- [ ] Phase 2.1 完成 - 日曆可用性測試通過
- [ ] Phase 2.2 完成 - 離線模式測試通過
- [ ] Phase 2.3 完成 - Email 發送測試通過
- [ ] Phase 3 完成 - 全部測試通過

## 📌 注意事項
1. 每個 Phase 完成後都要測試
2. 確保向後兼容性
3. 保留原有功能不變
4. 文件同步更新
5. Git commit 以 Phase 為單位

---
**準備開始執行！** 🚀
