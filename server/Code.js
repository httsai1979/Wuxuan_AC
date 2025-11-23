/**
 * Wuxuan HVAC - Google Apps Script Backend
 * 
 * APIs:
 * 1. doGet(e):
 *    - action=get_settings: Returns pricing rules and settings.
 *    - action=get_busy_slots&date=YYYY-MM-DD: Returns busy slots for a date.
 * 2. doPost(e):
 *    - action=create_job: Creates a new job (Sheet row, Calendar event, Drive folder).
 *    - action=upload_photo: Uploads a photo to a specific folder.
 *    - action=quote_estimate: Calculates estimate based on server-side rules (for validation/preview).
 */

// --- Configuration ---
const CONFIG = {
    sheetNames: {
        orders: "Orders",
        settings: "Settings",
        pricing: "PricingRules",
        customers: "Customers"
    },
    folderNames: {
        root: "Wuxuan_HVAC_System",
        jobs: "Jobs",
        templates: "Templates",
        exports: "Exports"
    },
    calendarName: "Wuxuan HVAC Schedule"
};

// --- Entry Points ---

function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    try {
        if (action === "get_settings") {
            return successResponse(getSettings());
        } else if (action === "get_busy_slots") {
            return successResponse(getBusySlots(params.date));
        } else {
            return errorResponse("Unknown action: " + action);
        }
    } catch (err) {
        return errorResponse(err.toString());
    }
}

function doPost(e) {
    const params = e.parameter;
    const action = params.action;

    try {
        if (action === "create_job") {
            const data = JSON.parse(e.postData.contents);
            return successResponse(createJob(data));
        } else if (action === "upload_photo") {
            const data = JSON.parse(e.postData.contents);
            return successResponse(uploadPhoto(data));
        } else if (action === "quote_estimate") {
            const data = JSON.parse(e.postData.contents);
            // data.payload should be the form state
            const form = JSON.parse(data.payload);
            return successResponse(calculateEstimate(form));
        } else {
            return errorResponse("Unknown action: " + action);
        }
    } catch (err) {
        return errorResponse(err.toString());
    }
}

// --- Core Functions ---

function getSettings() {
    return {
        status: "ok",
        pricing_rules: getPricingRules(),
        settings: {
            tax_rate: 0.05,
            loyalty_discount: 0.03,
            free_radius_km: 8,
            travel_fee_per_km_min: 15,
            travel_fee_per_km_max: 25,
            travel_fee_min: 200,
            travel_fee_cap: 1500,
            peak_months: [7, 8, 9],
            post_typhoon_coef_min: 0.1,
            post_typhoon_coef_max: 0.2,
            coastal_distance_km: 1.5
        }
    };
}

function getPricingRules() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.sheetNames.pricing);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove headers

    // Expected headers: ID, Label, Min, Max, Unit, Badge, Reason, ConditionType, ConditionValue
    return data.map(row => ({
        id: row[0],
        label: row[1],
        min: Number(row[2]),
        max: Number(row[3]),
        unit: row[4],
        badge: row[5],
        reason: row[6],
        condition_type: row[7],
        condition_value: row[8]
    }));
}

function getBusySlots(dateStr) {
    if (!dateStr) throw new Error("Missing date parameter");

    const calendar = getOrCreateCalendar();
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const events = calendar.getEvents(startOfDay, endOfDay);
    const busySlots = [];

    events.forEach(event => {
        const start = event.getStartTime().getHours();
        const end = event.getEndTime().getHours();

        if (start < 12 && end > 9) busySlots.push("am");
        if (start < 17 && end > 13) busySlots.push("pm");
        if (start < 20 && end > 18) busySlots.push("night");
    });

    return {
        date: dateStr,
        slots: [...new Set(busySlots)]
    };
}

function calculateEstimate(form) {
    const rules = getPricingRules();
    const settings = getSettings().settings;

    let minTotal = 0;
    let maxTotal = 0;
    const items = [];
    const factors = [];

    // Helper to check conditions
    const checkCondition = (rule, form) => {
        const type = rule.condition_type;
        const val = rule.condition_value;

        if (type === "always") return true;
        if (type === "service_type") return [val].flat().includes(form.serviceType) || (val.includes(",") && val.split(",").includes(form.serviceType));
        if (type === "no_220v") return form.has_220v === false;
        if (type === "holes") return form.holes > 0;
        if (type === "pipe_extra") return form.pipe_len_total_m > 4;
        if (type === "drain_new") return form.drain_new === true;
        if (type === "no_elevator") return form.has_elevator === false && form.floor >= 3;
        if (type === "high_work") return ["wall", "roof"].includes(form.outdoor_pos);
        if (type === "dismantle") return ["dismantle", "dismantle_and_reinstall"].includes(form.relocate_mode);
        if (type === "recycle") return ["recycle", "dismantle_and_reinstall"].includes(form.relocate_mode);
        if (type === "zone") return form.zone === val;
        if (type === "coast") return form.coastal_flag === true || form.distance_km <= settings.coastal_distance_km || ["wall", "roof"].includes(form.outdoor_pos);
        if (type === "peak") {
            const date = form.date ? new Date(form.date) : new Date();
            return settings.peak_months.includes(date.getMonth() + 1);
        }
        if (type === "night") return form.slot === "night";

        return false;
    };

    const getQuantity = (rule, form) => {
        if (rule.condition_type === "holes") return form.holes || 0;
        if (rule.condition_type === "pipe_extra") return Math.max(0, form.pipe_len_total_m - 4);
        return 1;
    };

    rules.forEach(rule => {
        if (checkCondition(rule, form)) {
            const qty = getQuantity(rule, form);
            const addMin = rule.min * qty;
            const addMax = rule.max * qty;
            minTotal += addMin;
            maxTotal += addMax;

            items.push({
                label: rule.label,
                display: `$${Math.round(addMin)} - $${Math.round(addMax)}`,
                reason: rule.reason
            });
        }
    });

    // Distance Fee
    if ((!form.zone || form.zone === "A") && form.distance_km > settings.free_radius_km) {
        const extraKm = Math.max(0, form.distance_km - settings.free_radius_km);
        const travelMin = Math.max(settings.travel_fee_min, Math.min(settings.travel_fee_cap, extraKm * settings.travel_fee_per_km_min));
        const travelMax = Math.max(settings.travel_fee_min, Math.min(settings.travel_fee_cap, extraKm * settings.travel_fee_per_km_max));
        minTotal += travelMin;
        maxTotal += travelMax;
        items.push({
            label: "距離費",
            display: `$${Math.round(travelMin)} - $${Math.round(travelMax)}`,
            reason: `超出 ${settings.free_radius_km}km`
        });
    }

    // Factors
    let minFactor = 1;
    let maxFactor = 1;

    if (form.post_typhoon) {
        minFactor *= (1 + settings.post_typhoon_coef_min);
        maxFactor *= (1 + settings.post_typhoon_coef_max);
        factors.push({
            label: "颱風後插單",
            display: `${(1 + settings.post_typhoon_coef_min).toFixed(2)}x`,
            reason: "災後加成"
        });
    }

    minTotal *= minFactor;
    maxTotal *= maxFactor;

    return {
        min: Math.round(minTotal / 100) * 100,
        max: Math.round(maxTotal / 100) * 100,
        items: items,
        factors: factors
    };
}

function createJob(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordersSheet = ss.getSheetByName(CONFIG.sheetNames.orders);

    // Server-side validation/calculation
    const estimate = calculateEstimate(data);
    data.estimate_min = estimate.min;
    data.estimate_max = estimate.max;
    data.estimate_items = JSON.stringify(estimate.items);

    const jobId = "JOB-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");

    const rootFolder = getOrCreateFolder(CONFIG.folderNames.root);
    const jobsFolder = getOrCreateSubFolder(rootFolder, CONFIG.folderNames.jobs);
    const jobFolder = jobsFolder.createFolder(`${jobId}_${data.name}`);

    const calendar = getOrCreateCalendar();
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

    const eventTitle = `[${data.serviceType}] ${data.name} - ${data.zone}`;
    const eventDesc = `
    Job ID: ${jobId}
    Phone: ${data.phone}
    Address: ${data.address}
    Service: ${data.serviceType}
    Notes: ${data.notes}
    Folder: ${jobFolder.getUrl()}
    Estimate: ${estimate.min} - ${estimate.max}
    `;

    calendar.createEvent(eventTitle, startTime, endTime, { description: eventDesc });

    // Generate PDF Quote
    const templatesFolder = getOrCreateSubFolder(rootFolder, CONFIG.folderNames.templates);
    const templateFile = getTemplateFile(templatesFolder);
    let pdfUrl = "";
    if (templateFile) {
        pdfUrl = createQuotePdf(data, jobId, jobFolder, templateFile);
    }

    // Save to Sheet
    ordersSheet.appendRow([
        jobId,
        new Date(),
        data.name,
        data.phone,
        data.address,
        data.date,
        data.slot,
        data.serviceType,
        data.zone,
        data.notes,
        jobFolder.getUrl(),
        pdfUrl,
        estimate.min,
        estimate.max
    ]);

    return {
        job_id: jobId,
        folder_id: jobFolder.getId(),
        folder_url: jobFolder.getUrl(),
        pdf_url: pdfUrl,
        message: "Job created successfully"
    };
}

function uploadPhoto(data) {
    if (!data.folder_id || !data.image_base64) throw new Error("Missing folder_id or image_base64");

    const folder = DriveApp.getFolderById(data.folder_id);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.image_base64.split(',')[1]), "image/jpeg", `${data.image_type}.jpg`);
    const file = folder.createFile(blob);

    return {
        status: "ok",
        file_url: file.getUrl()
    };
}

function createQuotePdf(data, jobId, jobFolder, templateFile) {
    const tempDoc = templateFile.makeCopy(`Quote_${jobId}`, jobFolder);
    const doc = DocumentApp.openById(tempDoc.getId());
    const body = doc.getBody();

    body.replaceText("{{JobId}}", jobId);
    body.replaceText("{{Date}}", new Date().toLocaleDateString());
    body.replaceText("{{Name}}", data.name);
    body.replaceText("{{Phone}}", data.phone);
    body.replaceText("{{Address}}", data.address);
    body.replaceText("{{Service}}", data.serviceType);
    body.replaceText("{{EstimateMin}}", data.estimate_min || "0");
    body.replaceText("{{EstimateMax}}", data.estimate_max || "0");

    let itemsText = "";
    if (data.estimate_items) {
        try {
            const items = JSON.parse(data.estimate_items);
            items.forEach(item => {
                itemsText += `- ${item.label}: ${item.display}\n`;
            });
        } catch (e) {
            itemsText = "Details not available";
        }
    }
    body.replaceText("{{Items}}", itemsText);

    doc.saveAndClose();

    const pdfBlob = tempDoc.getAs(MimeType.PDF);
    const pdfFile = jobFolder.createFile(pdfBlob);

    tempDoc.setTrashed(true);

    return pdfFile.getUrl();
}

function getTemplateFile(folder) {
    const files = folder.getFiles();
    if (files.hasNext()) return files.next();
    return null;
}

// --- Helper Functions ---

function successResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: message }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateCalendar() {
    const calendars = CalendarApp.getCalendarsByName(CONFIG.calendarName);
    if (calendars.length > 0) return calendars[0];
    return CalendarApp.createCalendar(CONFIG.calendarName);
}

function getOrCreateFolder(name) {
    const folders = DriveApp.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(name);
}

function getOrCreateSubFolder(parent, name) {
    const folders = parent.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return parent.createFolder(name);
}

// --- Setup Function (Run once) ---
function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create Sheets
    Object.values(CONFIG.sheetNames).forEach(name => {
        if (!ss.getSheetByName(name)) {
            ss.insertSheet(name);
        }
    });

    // Setup Headers for Orders
    const ordersSheet = ss.getSheetByName(CONFIG.sheetNames.orders);
    if (ordersSheet.getLastRow() === 0) {
        ordersSheet.appendRow(["Job ID", "Created At", "Name", "Phone", "Address", "Date", "Slot", "Service", "Zone", "Notes", "Folder URL", "PDF URL", "Est Min", "Est Max"]);
    }

    // Setup Pricing Rules
    const pricingSheet = ss.getSheetByName(CONFIG.sheetNames.pricing);
    if (pricingSheet.getLastRow() === 0) {
        pricingSheet.appendRow(["ID", "Label", "Min", "Max", "Unit", "Badge", "Reason", "ConditionType", "ConditionValue"]);

        const defaultRules = [
            ["BASE_INSTALL", "基礎安裝(含3m)", 2500, 3500, "once", "BASE", "含銅管/保溫/配線/支架與測試", "service_type", "install,relocate"],
            ["ADD_220V", "新增 220V 插座", 3000, 6000, "once", "POWER", "配電盤餘裕、拉線距離", "no_220v", "true"],
            ["HOLE_STD", "牆體打孔", 800, 1200, "per_hole", "WALL", "牆厚/材質差異", "holes", "true"],
            ["PIPE_EXTRA", "冷媒管線超長（每米）", 250, 350, "per_meter", "PIPE", "超出 4m 部分", "pipe_extra", "true"],
            ["DRAIN_NEW", "排水新拉", 1000, 2000, "once", "DRAIN", "依坡度、距離", "drain_new", "true"],
            ["NO_ELEVATOR", "無電梯搬運", 500, 1500, "once", "LABOR", "3F 以上", "no_elevator", "true"],
            ["HIGH_WORK", "高空/屋頂作業", 1000, 5000, "once", "HIGH", "外牆或屋頂", "high_work", "true"],
            ["DISMANTLE", "舊機拆除", 1000, 2000, "once", "RELOCATE", "冷媒回收/拆卸", "dismantle", "true"],
            ["RECYCLE", "舊機回收", 300, 600, "once", "RECYCLE", "報廢登記", "recycle", "true"],
            ["HLN_ZONE_B", "區域出車費（Zone B）", 300, 400, "once", "TRAVEL", "新城/壽豐", "zone", "B"],
            ["HLN_ZONE_C", "區域出車費（Zone C）", 500, 700, "once", "TRAVEL", "鳳林/光復", "zone", "C"],
            ["HLN_ZONE_D", "區域出車費（Zone D）", 800, 1200, "once", "TRAVEL", "豐濱/玉里等", "zone", "D"],
            ["HLN_COAST", "沿海防蝕建議包", 600, 900, "once", "COAST", "不鏽鋼支架/防蝕", "coast", "true"],
            ["HLN_PEAK", "旺季工作加價", 300, 500, "once", "PEAK", "7-9月", "peak", "true"],
            ["HLN_NIGHT", "夜間時段加價", 400, 600, "once", "OFFHOUR", "18:00後", "night", "true"]
        ];

        defaultRules.forEach(rule => pricingSheet.appendRow(rule));
    }

    // Create Drive Folders
    const root = getOrCreateFolder(CONFIG.folderNames.root);
    let templatesFolder;
    Object.values(CONFIG.folderNames).forEach(name => {
        if (name !== CONFIG.folderNames.root) {
            const folder = getOrCreateSubFolder(root, name);
            if (name === CONFIG.folderNames.templates) templatesFolder = folder;
        }
    });

    // Create Default Template if empty
    if (templatesFolder && !templatesFolder.getFiles().hasNext()) {
        const doc = DocumentApp.create("Quote Template");
        const body = doc.getBody();
        body.appendParagraph("Wuxuan HVAC Quote").setHeading(DocumentApp.ParagraphHeading.HEADING1);
        body.appendParagraph("Job ID: {{JobId}}");
        body.appendParagraph("Date: {{Date}}");
        body.appendParagraph("Customer: {{Name}} / {{Phone}}");
        body.appendParagraph("Address: {{Address}}");
        body.appendHorizontalRule();
        body.appendParagraph("Service: {{Service}}");
        body.appendParagraph("Estimate: ${{EstimateMin}} - ${{EstimateMax}}");
        body.appendParagraph("Items:");
        body.appendParagraph("{{Items}}");
        body.appendHorizontalRule();
        body.appendParagraph("Thank you for choosing Wuxuan HVAC.");
        doc.saveAndClose();

        // Move to templates folder
        const file = DriveApp.getFileById(doc.getId());
        file.moveTo(templatesFolder);
    }

    Logger.log("Setup complete!");
}
