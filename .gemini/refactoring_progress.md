# 🎯 HVAC App 完整重構執行摘要

## ✅ 已完成的修改

### 1. DEFAULT_SCRIPT_ID 更新 ✓
- 檔案：`wuxuan-hvac-web/app.js` 第1行
- 舊值：`AKfycbxo6oYTNU68XXS-dbrhdYKJ2jYJ2XIj8wcw2TNgTTUDbb5Jx5cozTPQpnGL4eGMbwSmTQ`
- 新值：`AKfycbyf1SqN5D8sXk-mtoIs4QZZwwsmZuKDOKMQikaPE8TeQJzoOtRncpNS065Zkosf2hlirg`

### 2. collectFormState 更新 ✓
- 檔案：`wuxuan-hvac-web/app.js` 第461-486行
- 新增欄位：
  - `brand_model`: 品牌型號
  - `wall_type`: 牆體材質 (預設 "rc")
  - `indoor_unit_count`: 室內機數量 (預設 "1")
- 移除重複欄位：
  - `origin_address` (重複)
  - `relocate_mode` (重複)
  - `repair_desc` (重複)

## 📋 待完成的修改

### 3. 照片處理函數 (優先度：🔴 高)
**插入位置**：第487行（collectFormState 之後）

需要加入的函數（按順序）：
1. `compressImage(file, maxWidth, quality)` - 照片壓縮
2. `handlePhotoSelection(type, fileList)` - 照片選擇處理
3. `uploadPhoto(file, type, folderId)` - 照片上傳

**預估行數**：約 150 行

### 4. 表單提交函數 (優先度：🔴 高)
**插入位置**：照片處理函數之後

需要加入的函數：
- `handleSubmit()` - 完整的表單提交流程
  - 資料收集
  - 訂單建立
  - 照片上傳
  - 成功畫面

**預估行數**：約 40 行

### 5. 日曆可用性檢查 (優先度：🟡 中)
**修改位置**：現有的 `renderCalendar` 函數

需要：
- 呼叫後端 `check_availability` API
- 標示已占用日期
- 禁用過去日期

**預估行數**：修改現有函數，約 +30 行

### 6. Service Worker 註冊 (優先度：🟢 低)
**插入位置**：`init()` 函數最後

需要：
- 註冊 Service Worker
- 錯誤處理

**預估行數**：約 10 行

### 7. Module Exports (優先度：🟢 低)
**插入位置**：檔案最後

需要：
- 匯出所有關鍵函數供測試使用

**預估行數**：約 15 行

## 🔧 後端需要的修改

### server/Code.js

#### 1. checkAvailability API (優先度：🟡 中)
```javascript
function checkAvailability(data) {
  // 檢查指定日期的時段占用情況
  // 回傳：{ status: 'ok', occupied: { '2025-01-15': ['am', 'pm'], ... } }
}
```

#### 2. createJob 更新 (優先度：🔴 高)
需要確保回傳：
- `job_id`
- `folder_id`
- `pdf_url`
- `warranty_url` ← **需要加入**

#### 3. handleRequest 更新 (優先度：🟡 中)
在 switch-case 中加入：
```javascript
case "check_availability":
  result = checkAvailability(params);
  break;
```

## 📊 進度追蹤

| Phase | 功能 | 狀態 | 完成度 |
|-------|------|------|--------|
| 1.1 | DEFAULT_SCRIPT_ID | ✅ 完成 | 100% |
| 1.2 | collectFormState 更新 | ✅ 完成 | 100% |
| 1.3 | 照片處理函數 | ⏳ 待執行 | 0% |
| 1.4 | 表單提交函數 | ⏳ 待執行 | 0% |
| 2.1 | 日曆可用性檢查 | ⏳ 待執行 | 0% |
| 2.2 | Service Worker | ⏳ 待執行 | 0% |
| 2.3 | Module Exports | ⏳ 待執行 | 0% |
| 3.1 | 後端 API 更新 | ⏳ 待執行 | 0% |
| 3.2 | 整合測試 | ⏳ 待執行 | 0% |

**總體完成度**: 22% (2/9 項目)

## 🎯 下一步建議

### 選項A：繼續逐一整合 (穩健但耗時)
- 一次加入一個函數
- 每次都完整測試
- 最小化風險

### 選項B：批次整合 (快速但風險較高)
- 一次加入多個函數
- 完成後統一測試
- 需要更仔細的 code review

### 選項C：創建完整新版本 (推薦 ✅)
- 基於當前版本創建完整的新 app.js
- 包含所有功能
- 一次性替換
- 完整測試後部署

## 📝 建議：選項C

由於：
1. 需要加入的程式碼量較大（約 250 行）
2. 多次小修改容易出錯
3. 完整版本更容易測試和維護

我建議創建一個完整的新版本 app.js，包含：
- 所有現有功能
- 所有新功能
- 完整測試
- 詳細註解

## ⏱ 預估時間
- 選項A：2-3小時
- 選項B：1-2小時
- 選項C：1小時
