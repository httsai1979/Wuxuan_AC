/**
 * Wuxuan HVAC Backend - v3.0 (Stable)
 * Handles Orders, PDF Generation, Calendar, Drive, and Pricing Rules.
 */

// --- CONFIGURATION ---
const SCRIPT_VERSION = "v3.0";
const FOLDER_NAME_ROOT = "Wuxuan_HVAC_Data";

// --- API HANDLERS ---

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    // Wait up to 30 seconds for other processes to finish.
    lock.tryLock(30000);

    try {
        // 1. Parse Parameters
        const params = e.parameter;
        const action = params.action;

        // 2. Parse Body (for POST)
        let data = {};
        if (e.postData && e.postData.contents) {
            try {
                data = JSON.parse(e.postData.contents);
            } catch (err) {
                // If parsing fails, maybe it's form data or raw
                data = e.parameter;
            }
        }

        // 3. Route Actions
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
                result = { status: "error", message: "Unknown action: " + action };
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

// --- CORE FUNCTIONS ---

function runSetup(params) {
    if (params.passcode !== "8888") return { status: "error", message: "Invalid passcode" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ensure Sheets Exist
    ensureSheet(ss, "Orders", ["Job ID", "Status", "Date", "Slot", "Name", "Phone", "Address", "Service", "Details", "Price Min", "Price Max", "Notes", "Created At", "Folder URL", "Tools Needed", "Signature URL", "PDF URL", "Warranty URL"]);
    ensureSheet(ss, "PricingRules", ["id", "label", "min", "max", "unit", "badge", "reason", "condition_type", "condition_value"]);

    // 2. Seed Pricing Rules if empty
    const pSheet = ss.getSheetByName("PricingRules");
    if (pSheet.getLastRow() <= 1) {
        const defaults = [
            ["INSTALL_BASE", "標準安裝 (含稅)", 3500, 4500, "once", "BASE", "含3m銅管/控制線/真空", "service_type", "install"],
            ["RELOCATE_BASE", "移機-安裝 (含稅)", 3500, 4500, "once", "BASE", "含重新擴管/真空", "service_type", "relocate"],
            ["DISMANTLE", "移機-拆機費", 1500, 2500, "once", "DISMANTLE", "含冷媒回收", "relocate_mode", "dismantle"],
            ["TRANSPORT", "移機-運費 (基本)", 500, 800, "once", "MOVE", "花蓮市區內", "relocate_mode", "transport"],
            ["ADD_220V", "電源增設 (220V)", 3500, 6500, "once", "POWER", "含無熔絲開關/配線", "no_220v", "true"],
            ["HOLE_WASH", "洗孔 (磚/RC)", 800, 1200, "per_hole", "HOLE", "8吋以下標準孔", "holes", "true"],
            ["PIPE_OVER", "超長管線 (/m)", 400, 500, "per_meter", "PIPE", "超出標準3m", "pipe_extra", "true"],
            ["DRAIN_PUMP", "排水器安裝", 1500, 2500, "once", "DRAIN", "含排水器與配管", "drain_new", "true"],
            ["NO_ELEVATOR", "無電梯樓層費", 500, 1000, "per_floor", "CARRY", "3F起算/每層", "no_elevator", "true"],
            ["HIGH_ALT", "高空/危險施工", 2000, 4000, "once", "DANGER", "無立足點/需確保", "high_altitude", "true"],
            ["CRANE", "吊車費用 (趟)", 3000, 6000, "once", "CRANE", "特殊地形/重物", "crane_needed", "true"],
            ["RECYCLE_OLD", "舊機回收 (含拆)", 500, 1000, "once", "RECYCLE", "新機安裝時同步", "recycle_old", "true"],
            ["ZONE_B", "車馬費 (新城/壽豐)", 300, 500, "once", "TRAVEL", "Zone B", "zone", "B"],
            ["ZONE_C", "車馬費 (鳳林/光復)", 600, 900, "once", "TRAVEL", "Zone C", "zone", "C"],
            ["ZONE_D", "車馬費 (玉里/富里)", 1200, 1800, "once", "TRAVEL", "Zone D", "zone", "D"],
            ["COASTAL", "沿海防蝕處理", 1500, 2500, "once", "COAST", "防鏽噴塗/不鏽鋼架", "coast", "true"],
            ["REPAIR_VISIT", "維修檢測費", 500, 800, "once", "VISIT", "車馬費+檢測", "service_type", "repair"],
            ["CLEAN_WALL", "壁掛清洗", 2000, 2500, "once", "CLEAN", "含藥水/高壓沖洗", "service_type", "clean"]
        ];
        defaults.forEach(r => pSheet.appendRow(r));
    }

    return { status: "success", message: "System initialized." };
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
    const pSheet = ss.getSheetByName("PricingRules");
    let rules = [];

    if (pSheet) {
        const data = pSheet.getDataRange().getValues();
        const headers = data[0];
        for (let i = 1; i < data.length; i++) {
            let rule = {};
            headers.forEach((h, idx) => rule[h] = data[i][idx]);
            rules.push(rule);
        }
    }

    return {
        pricing_rules: rules,
        settings: {
            tax_rate: 0.00,
            free_radius_km: 8
        }
    };
}

function createJob(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Orders");
    if (!sheet) return { status: "error", message: "System not initialized. Please run setup." };

    const jobId = "MX-" + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd") + "-" + Math.floor(Math.random() * 9000 + 1000);

    // 1. Create Drive Folder
    const folder = getOrCreateJobFolder(jobId, data.name);

    // 2. Infer Tools
    const tools = inferTools(data);

    // 3. Create Calendar Event
    createCalendarEvent(data, jobId, folder.getUrl(), tools);

    // 4. Generate PDF
    const pdfUrl = generateOrderPDF(jobId, data, folder);

    // 5. Save to Sheet
    // Headers: Job ID, Status, Date, Slot, Name, Phone, Address, Service, Details, Price Min, Price Max, Notes, Created At, Folder URL, Tools Needed, Signature URL, PDF URL, Warranty URL
    sheet.appendRow([
        jobId,
        "Pending",
        data.date,
        data.slot,
        data.name,
        "'" + data.phone,
        data.address,
        data.serviceType,
        JSON.stringify(data), // Store full details JSON for reference
        data.estimate_min,
        data.estimate_max,
        data.notes,
        new Date(),
        folder.getUrl(),
        tools,
        "", // Signature
        pdfUrl,
        ""  // Warranty
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
    if (data.holes > 0) tools.push("洗孔機");
    if (data.floor >= 3 && !data.has_elevator) tools.push("人力搬運裝備");
    if (data.crane_needed) tools.push("吊車 (需預約)");
    if (data.high_altitude) tools.push("高空繩索/安全帶");
    if (!data.has_220v) tools.push("配電工具/電鑽");
    if (data.drain_new) tools.push("排水管/加壓器");
    if (data.outdoor_pos === "roof") tools.push("落地架/搬運繩");
    if (data.serviceType === "clean") tools.push("清洗機/藥水/水桶");
    if (data.serviceType === "repair") tools.push("檢測儀表/冷媒");

    return tools.join(", ");
}

function getOrCreateJobFolder(jobId, clientName) {
    const root = DriveApp.getRootFolder();
    let parent = null;

    // Try to find or create root data folder
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
訂單編號: ${jobId}
電話: ${data.phone}
地址: ${data.address}
服務: ${translateService(data.serviceType)}
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
    const map = { "install": "新機安裝", "relocate": "移機", "repair": "維修", "clean": "保養" };
    return map[type] || type;
}

function generateOrderPDF(jobId, data, folder) {
    const html = `
    <div style="font-family: sans-serif; padding: 40px;">
      <h1 style="color: #0891b2;">訂單確認單</h1>
      <p><strong>編號:</strong> ${jobId}</p>
      <p><strong>日期:</strong> ${data.date} (${data.slot})</p>
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

    const blob = Utilities.newBlob(html, "text/html", `${jobId}_Order.html`);
    const pdf = folder.createFile(blob.getAs("application/pdf")).setName(`${jobId}_Order.pdf`);
    return pdf.getUrl();
}

function updateJobStatus(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.job_id) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex === -1) return { status: "error", message: "Job not found" };

    // Update Status
    if (data.status) {
        sheet.getRange(rowIndex, 2).setValue(data.status);
    }

    // Handle Signature
    if (data.signature_base64) {
        const folder = DriveApp.getFolderById(rows[rowIndex - 1][13].split("id=")[1] || rows[rowIndex - 1][13].split("/folders/")[1]); // Extract ID from URL
        const blob = Utilities.newBlob(Utilities.base64Decode(data.signature_base64.split(",")[1]), "image/png", "signature.png");
        const file = folder.createFile(blob);
        sheet.getRange(rowIndex, 16).setValue(file.getUrl());
    }

    // Generate Warranty if Completed
    let warrantyUrl = "";
    if (data.status === "Completed") {
        const folderUrl = rows[rowIndex - 1][13];
        // Try to extract ID, or just search by name if URL parsing is tricky
        // Simplified: Assume we can get folder by ID from URL for now, or search
        // Better: Store Folder ID in sheet? For now, use search or URL parsing
        let folder;
        try {
            const id = folderUrl.match(/[-\w]{25,}/)[0];
            folder = DriveApp.getFolderById(id);
        } catch (e) {
            folder = getOrCreateJobFolder(data.job_id, rows[rowIndex - 1][4]);
        }

        warrantyUrl = generateWarrantyPDF(data.job_id, rows[rowIndex - 1], folder);
        sheet.getRange(rowIndex, 18).setValue(warrantyUrl);
    }

    return { status: "success", warranty_url: warrantyUrl };
}

function generateWarrantyPDF(jobId, rowData, folder) {
    const html = `
    <div style="padding: 40px; border: 4px double #0891b2; font-family: sans-serif;">
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
        <p><strong>聯絡電話:</strong> 09xx-xxx-xxx</p>
        <p><strong>簽署:</strong> <span style="font-family: cursive;">James Tsai</span></p>
      </div>
    </div>
  `;

    const blob = Utilities.newBlob(html, "text/html", `${jobId}_Warranty.html`);
    const pdf = folder.createFile(blob.getAs("application/pdf")).setName(`${jobId}_Warranty.pdf`);
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
    if (params.passcode !== "8888") return { status: "error", message: "Invalid passcode" };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    if (!sheet) return { status: "ok", orders: [] };

    const data = sheet.getDataRange().getValues();
    const orders = [];
    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Only show pending or in-progress
        if (row[1] !== "Completed" && row[1] !== "Cancelled") {
            orders.push({
                job_id: row[0],
                status: row[1],
                date: Utilities.formatDate(new Date(row[2]), "GMT+8", "yyyy-MM-dd"),
                slot: row[3],
                name: row[4],
                phone: row[5].replace("'", ""),
                address: row[6],
                service: translateService(row[7]),
                notes: row[11],
                tools: row[14],
                pdf_url: row[16]
            });
        }
    }
    // Sort by date
    orders.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { status: "ok", orders: orders };
}

function getOrderStatus(params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    if (!sheet) return { status: "not_found" };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Check Phone (fuzzy match) and Job ID
        if (row[0] === params.job_id && String(row[5]).includes(params.phone)) {
            return {
                status: "found",
                job_id: row[0],
                order_status: row[1],
                date: Utilities.formatDate(new Date(row[2]), "GMT+8", "yyyy-MM-dd"),
                slot: row[3],
                service: translateService(row[7]),
                address: row[6],
                pdf_url: row[16],
                warranty_url: row[17]
            };
        }
    }
    return { status: "not_found" };
}
