/**
 * 武軒冷氣後端系統 - v4.0 (全中文版)
 * 負責處理訂單、PDF生成、日曆預約、Google Drive 歸檔與報價規則。
 */

// --- 設定 ---
const SCRIPT_VERSION = "v4.0";
const FOLDER_NAME_ROOT = "武軒冷氣_客戶資料庫";

// --- API 處理 ---

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(30000);

    try {
        const params = e.parameter;
        const action = params.action;

        let data = {};
        if (e.postData && e.postData.contents) {
            try {
                data = JSON.parse(e.postData.contents);
            } catch (err) {
                data = e.parameter;
            }
        }

        let result = {};

        switch (action) {
            case "test_connection":
                result = { status: "ok", version: SCRIPT_VERSION, user: Session.getActiveUser().getEmail() };
                break;
            case "setup_system":
                result = runSetup(params);
                break;
            case "get_settings":
                result = getSettings();
                break;
            case "create_job":
                result = createJob(data);
                break;
            case "get_installer_orders":
                result = getInstallerOrders(params);
                break;
            case "update_job_status":
                result = updateJobStatus(data);
                break;
            case "get_order_status":
                result = getOrderStatus(params);
                break;
            case "upload_photo":
                result = uploadPhoto(data);
                break;
            default:
                result = { status: "error", message: "未知動作: " + action };
        }

        return responseJSON(result);

    } catch (error) {
        return responseJSON({ status: "error", message: error.toString(), stack: error.stack });
    } finally {
        lock.releaseLock();
    }
}

function responseJSON(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- 核心功能 ---

function runSetup(params) {
    if (params.passcode !== "8888") return { status: "error", message: "通行碼錯誤" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 建立中文訂單表
    // 欄位: 訂單編號, 狀態, 日期, 時段, 姓名, 電話, 地址, 服務項目, 預估價格(低), 預估價格(高), 備註, 建立時間, 資料夾連結, 攜帶工具, 簽名檔, 訂單PDF, 保固書PDF
    ensureSheet(ss, "訂單管理", ["訂單編號", "狀態", "預約日期", "時段", "客戶姓名", "電話", "地址", "服務項目", "預估價格(低)", "預估價格(高)", "備註", "建立時間", "資料夾連結", "攜帶工具", "簽名檔", "訂單PDF", "保固書PDF"]);

    // 2. 建立報價規則表
    ensureSheet(ss, "報價規則", ["id", "項目名稱", "價格(低)", "價格(高)", "單位", "標籤", "說明", "條件類型", "條件值"]);

    const pSheet = ss.getSheetByName("報價規則");
    if (pSheet.getLastRow() <= 1) {
        const defaults = [
            ["INSTALL_BASE", "標準安裝 (含稅)", 3500, 4500, "次", "基本", "含3m銅管/控制線/真空", "service_type", "install"],
            ["RELOCATE_BASE", "移機-安裝 (含稅)", 3500, 4500, "次", "基本", "含重新擴管/真空", "service_type", "relocate"],
            ["DISMANTLE", "移機-拆機費", 1500, 2500, "次", "拆機", "含冷媒回收", "relocate_mode", "dismantle"],
            ["TRANSPORT", "移機-運費 (基本)", 500, 800, "次", "運費", "花蓮市區內", "relocate_mode", "transport"],
            ["ADD_220V", "電源增設 (220V)", 3500, 6500, "次", "配電", "含無熔絲開關/配線", "no_220v", "true"],
            ["HIGH_ALT", "高空/危險施工", 2000, 4000, "次", "危險", "無立足點/需確保", "high_altitude", "true"],
            ["REPAIR_VISIT", "維修檢測費", 500, 800, "次", "檢測", "車馬費+檢測", "service_type", "repair"],
            ["CLEAN_WALL", "壁掛清洗", 2000, 2500, "次", "清洗", "含藥水/高壓沖洗", "service_type", "clean"]
        ];
        defaults.forEach(r => pSheet.appendRow(r));
    }

    return { status: "success", message: "系統初始化完成 (中文版)" };
}

function ensureSheet(ss, name, headers) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.appendRow(headers);
    }
    return sheet;
}

function getSettings() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pSheet = ss.getSheetByName("報價規則");
    let rules = [];

    if (pSheet) {
        const data = pSheet.getDataRange().getValues();
        // 簡單回傳給前端參考用
        rules = data.slice(1).map(r => ({ id: r[0], label: r[1], min: r[2], max: r[3] }));
    }

    return {
        pricing_rules: rules,
        settings: { tax_rate: 0.00, free_radius_km: 8 }
    };
}

function createJob(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("訂單管理");
    if (!sheet) return { status: "error", message: "請先執行系統初始化 (setup_system)" };

    const jobId = "MX-" + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd") + "-" + Math.floor(Math.random() * 9000 + 1000);

    // 1. 建立 Drive 資料夾
    const folder = getOrCreateJobFolder(jobId, data.name);

    // 2. 推斷工具
    const tools = inferTools(data);

    // 3. 建立日曆
    createCalendarEvent(data, jobId, folder.getUrl(), tools);

    // 4. 產生 PDF
    const pdfUrl = generateOrderPDF(jobId, data, folder);

    // 5. 寫入試算表
    // 欄位: 訂單編號, 狀態, 日期, 時段, 姓名, 電話, 地址, 服務項目, 預估價格(低), 預估價格(高), 備註, 建立時間, 資料夾連結, 攜帶工具, 簽名檔, 訂單PDF, 保固書PDF
    sheet.appendRow([
        jobId,
        "待處理", // Status
        data.date,
        translateSlot(data.slot),
        data.name,
        "'" + data.phone,
        data.address,
        translateService(data.serviceType),
        data.estimate_min,
        data.estimate_max,
        data.notes,
        new Date(),
        folder.getUrl(),
        tools,
        "", // 簽名
        pdfUrl,
        ""  // 保固書
    ]);

    return {
        status: "success",
        job_id: jobId,
        folder_id: folder.getId(),
        folder_url: folder.getUrl(),
        pdf_url: pdfUrl
    };
}

function inferTools(data) {
    const tools = [];
    if (data.high_altitude) tools.push("高空繩索/安全帶");
    if (!data.has_220v) tools.push("配電工具/電鑽");
    if (data.serviceType === "clean") tools.push("清洗機/藥水/水桶");
    if (data.serviceType === "repair") tools.push("檢測儀表/冷媒");
    if (data.outdoor_pos === "dangerous" || data.outdoor_pos === "unsure") tools.push("可能需吊車(待確認)");

    return tools.length > 0 ? tools.join(", ") : "標準工具";
}

function getOrCreateJobFolder(jobId, clientName) {
    const root = DriveApp.getRootFolder();
    let parent = null;

    const parents = root.getFoldersByName(FOLDER_NAME_ROOT);
    if (parents.hasNext()) {
        parent = parents.next();
    } else {
        parent = root.createFolder(FOLDER_NAME_ROOT);
    }

    return parent.createFolder(`${jobId}_${clientName}`);
}

function createCalendarEvent(data, jobId, folderUrl, toolsStr) {
    try {
        const calendar = CalendarApp.getDefaultCalendar();
        const date = new Date(data.date);
        let startTime, endTime;

        if (data.slot === "am") {
            startTime = new Date(date.setHours(9, 0, 0));
            endTime = new Date(date.setHours(12, 0, 0));
        } else if (data.slot === "pm") {
            startTime = new Date(date.setHours(13, 0, 0));
            endTime = new Date(date.setHours(17, 0, 0));
        } else {
            startTime = new Date(date.setHours(18, 0, 0));
            endTime = new Date(date.setHours(20, 0, 0));
        }

        const title = `[${translateService(data.serviceType)}] ${data.name}`;
        const description = `
訂單: ${jobId}
電話: ${data.phone}
地址: ${data.address}
工具: ${toolsStr}
備註: ${data.notes}
資料夾: ${folderUrl}
    `;

        calendar.createEvent(title, startTime, endTime, {
            location: data.address,
            description: description
        });
    } catch (e) {
        console.error("Calendar Error: " + e.toString());
    }
}

function translateService(type) {
    const map = { "install": "新機安裝", "relocate": "冷氣移機", "repair": "維修檢測", "clean": "保養清洗" };
    return map[type] || type;
}

function translateSlot(slot) {
    const map = { "am": "早上 (09-12)", "pm": "下午 (13-17)", "night": "晚上 (18-20)" };
    return map[slot] || slot;
}

function generateOrderPDF(jobId, data, folder) {
    const html = `
    <div style="font-family: 'Microsoft JhengHei', sans-serif; padding: 40px;">
      <h1 style="color: #0891b2;">訂單確認單</h1>
      <p><strong>編號:</strong> ${jobId}</p>
      <p><strong>日期:</strong> ${data.date} (${translateSlot(data.slot)})</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <h3>客戶資料</h3>
      <p>姓名: ${data.name}</p>
      <p>電話: ${data.phone}</p>
      <p>地址: ${data.address}</p>
      
      <h3>服務內容</h3>
      <p>項目: ${translateService(data.serviceType)}</p>
      <p>預估費用: NT$ ${data.estimate_min} - ${data.estimate_max}</p>
      <p>備註: ${data.notes || "無"}</p>
      
      <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <p style="font-size: 12px; color: #64748b;">
          * 此報價為預估值，實際費用依現場施工難度與材料使用量為準。<br>
          * 確定施工前，師傅會再次與您確認最終報價。
        </p>
      </div>
    </div>
  `;

    const blob = Utilities.newBlob(html, "text/html", `${jobId}_訂單.html`);
    const pdf = folder.createFile(blob.getAs("application/pdf")).setName(`${jobId}_訂單.pdf`);
    return pdf.getUrl();
}

function updateJobStatus(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單管理");
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.job_id) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex === -1) return { status: "error", message: "找不到訂單" };

    // 更新狀態
    if (data.status) {
        const statusMap = { "Arrived": "已到達", "Installing": "施工中", "Completed": "已完工" };
        sheet.getRange(rowIndex, 2).setValue(statusMap[data.status] || data.status);
    }

    // 處理簽名
    if (data.signature_base64) {
        const folderUrl = rows[rowIndex - 1][12]; // 資料夾連結在第 13 欄 (index 12)
        let folder;
        try {
            const id = folderUrl.match(/[-\w]{25,}/)[0];
            folder = DriveApp.getFolderById(id);
        } catch (e) {
            folder = DriveApp.getRootFolder(); // Fallback
        }

        const blob = Utilities.newBlob(Utilities.base64Decode(data.signature_base64.split(",")[1]), "image/png", "signature.png");
        const file = folder.createFile(blob);
        sheet.getRange(rowIndex, 15).setValue(file.getUrl()); // 簽名檔在第 15 欄
    }

    // 完工生成保固書
    let warrantyUrl = "";
    if (data.status === "Completed") {
        const folderUrl = rows[rowIndex - 1][12];
        let folder;
        try {
            const id = folderUrl.match(/[-\w]{25,}/)[0];
            folder = DriveApp.getFolderById(id);
        } catch (e) {
            folder = DriveApp.getRootFolder();
        }

        warrantyUrl = generateWarrantyPDF(data.job_id, rows[rowIndex - 1], folder);
        sheet.getRange(rowIndex, 17).setValue(warrantyUrl); // 保固書在第 17 欄
    }

    return { status: "success", warranty_url: warrantyUrl };
}

function generateWarrantyPDF(jobId, rowData, folder) {
    const html = `
    <div style="padding: 40px; border: 4px double #0891b2; font-family: 'Microsoft JhengHei', sans-serif;">
      <h1 style="text-align: center; color: #0891b2;">保固證明書</h1>
      <div style="margin: 30px 0;">
        <p><strong>訂單編號:</strong> ${jobId}</p>
        <p><strong>客戶姓名:</strong> ${rowData[4]}</p>
        <p><strong>施工地址:</strong> ${rowData[6]}</p>
        <p><strong>完工日期:</strong> ${Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")}</p>
      </div>
      <hr>
      <div style="margin: 30px 0;">
        <h3>保固條款</h3>
        <ul>
          <li><strong>施工保固 (1年)</strong>: 包含冷媒管路氣密、排水管路暢通、室內外機固定架穩固。</li>
          <li><strong>設備保固</strong>: 依原廠規定辦理 (通常全機 3-7 年)，請保留原廠保證書。</li>
        </ul>
        <p style="color: #ef4444; font-size: 12px;">* 天災、人為損壞或非本公司施工範圍不在此限。</p>
      </div>
      
      <div style="margin-top: 60px; text-align: right;">
        <p><strong>承攬單位:</strong> 武軒冷氣工程</p>
        <p><strong>簽署:</strong> 武軒冷氣</p>
      </div>
    </div>
  `;

    const blob = Utilities.newBlob(html, "text/html", `${jobId}_保固書.html`);
    const pdf = folder.createFile(blob.getAs("application/pdf")).setName(`${jobId}_保固書.pdf`);
    return pdf.getUrl();
}

function uploadPhoto(data) {
    try {
        const folder = DriveApp.getFolderById(data.folder_id);
        const base64Data = data.image_base64.includes("base64,")
            ? data.image_base64.split("base64,")[1]
            : data.image_base64;

        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/jpeg", `${data.image_type}_${Date.now()}.jpg`);
        folder.createFile(blob);
        return { status: "success" };
    } catch (e) {
        return { status: "error", message: e.toString() };
    }
}

function getInstallerOrders(params) {
    if (params.passcode !== "8888") return { status: "error", message: "通行碼錯誤" };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單管理");
    if (!sheet) return { status: "ok", orders: [] };

    const data = sheet.getDataRange().getValues();
    const orders = [];
    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // 狀態在第 2 欄 (index 1)
        if (row[1] !== "已完工" && row[1] !== "已取消") {
            orders.push({
                job_id: row[0],
                status: row[1],
                date: Utilities.formatDate(new Date(row[2]), "GMT+8", "yyyy-MM-dd"),
                slot: row[3],
                name: row[4],
                phone: row[5].replace("'", ""),
                address: row[6],
                service: row[7], // 已經是中文
                notes: row[10],
                tools: row[13],
                pdf_url: row[15]
            });
        }
    }
    orders.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { status: "ok", orders: orders };
}

function getOrderStatus(params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單管理");
    if (!sheet) return { status: "not_found" };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === params.job_id && String(row[5]).includes(params.phone)) {
            return {
                status: "found",
                job_id: row[0],
                order_status: row[1],
                date: Utilities.formatDate(new Date(row[2]), "GMT+8", "yyyy-MM-dd"),
                slot: row[3],
                service: row[7],
                address: row[6],
                pdf_url: row[15],
                warranty_url: row[16]
            };
        }
    }
    return { status: "not_found" };
}
