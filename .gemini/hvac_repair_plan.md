# HVAC App 功能缺失清單與修復計畫

## 執行摘要
app.js 檔案基本結構完整，但缺少三個關鍵功能：
1. 照片上傳邏輯 (`uploadPhoto` 函數)
2. 表單提交邏輯 (`handleSubmit` 函數)  
3. 新增欄位的資料收集 (brand_model, wall_type, indoor_unit_count)

## 當前檔案狀態
- 總行數：787行
- 主要結構：✅ 完整
- DOM 元素綁定：✅ 完整
- 照片選擇監聽器：✅ 已設置 (第165行)
- 照片上傳函數：❌ **缺失**
- 表單提交函數：❌ **缺失**

## 缺失功能詳情

### 1. uploadPhoto 函數
**位置**：需要在檔案中段加入 (建議在 handlePhotoSelection 之後)
**功能**：
- 將檔案轉成 Base64
- 呼叫後端 `upload_photo` API  
- 傳遞 folder_id, image_type, image_base64

### 2. handleSubmit 函數
**位置**：需要在 handleNext 附近加入
**功能**：
- 收集表單資料
- 呼叫 `create_job` API
- 上傳所有照片
- 顯示成功畫面

### 3. collectFormState 更新
**位置**：找到現有的 collectFormState 函數
**需要加入的欄位**：
```javascript
brand_model: fd.get("brand_model") || "",
wall_type: fd.get("wall_type") || "rc",
indoor_unit_count: fd.get("indoor_unit_count") || "1"
```

## 後端缺失功能

### 1. checkAvailability API
**檔案**：server/Code.js
**需要加入**：
```javascript
function checkAvailability(data) {
  const { date } = data;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('訂單管理');
  if (!sheet) return { status: 'ok', occupied: [] };
  const rows = sheet.getDataRange().getValues();
  const occupied = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowDate = Utilities.formatDate(new Date(row[2]), 'GMT+8', 'yyyy-MM-dd');
    if (rowDate === date && row[1] !== '已取消' && row[1] !== '已完工') {
      occupied.push(row[3]); // slot
    }
  }
  return { status: 'ok', occupied };
}
```

### 2. createJob 更新
需要返回 warranty_url

## 修復步驟 (按順序執行)

1. ✅ 檢查並恢復到乾淨的 app.js 版本
2. ⏺ 更新 DEFAULT_SCRIPT_ID
3. ⏺ 添加 uploadPhoto 函數
4. ⏺ 添加 handleSubmit 函數
5. ⏺ 更新 collectFormState
6. ⏺ 更新 index.html 版本號
7. ⏺ 測試所有功能

## 注意事項
- 不要一次修改太多行
- 每次修復後要檢查語法錯誤
- state.photoQueue 已經在 state 中初始化 (第27行)
- handlePhotoSelection 已經存在並運作正常

## 測試清單
- [ ] 照片選擇功能
- [ ] 照片上傳功能  
- [ ] 表單提交功能
- [ ] 訂單查詢功能
- [ ] 日曆顯示功能
- [ ] 價格計算功能
