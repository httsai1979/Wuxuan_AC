/**
 * Wuxuan HVAC - Google Apps Script Backend
 * 
 * APIs:
 * 1. doGet(e):
 *    - action=get_settings: Returns pricing rules and settings.
 *    - action=get_busy_slots&date=YYYY-MM-DD: Returns busy slots for a date.
 * 2. doPost(e):
 *    - action=create_job: Creates a new job (Sheet row, Calendar event, Drive folder).
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
    calendarName: "Wuxuan HVAC Schedule" // Will try to find or create this calendar
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
        message: "Settings loaded from backend"
    };
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

function createJob(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordersSheet = ss.getSheetByName(CONFIG.sheetNames.orders);

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
/**
 * Wuxuan HVAC - Google Apps Script Backend
 * 
 * APIs:
 * 1. doGet(e):
 *    - action=get_settings: Returns pricing rules and settings.
 *    - action=get_busy_slots&date=YYYY-MM-DD: Returns busy slots for a date.
 * 2. doPost(e):
 *    - action=create_job: Creates a new job (Sheet row, Calendar event, Drive folder).
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
    calendarName: "Wuxuan HVAC Schedule" // Will try to find or create this calendar
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
        message: "Settings loaded from backend"
    };
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

function createJob(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordersSheet = ss.getSheetByName(CONFIG.sheetNames.orders);

    const jobId = "JOB-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");

    const rootFolder = getOrCreateFolder(CONFIG.folderNames.root);
    const jobsFolder = getOrCreateSubFolder(rootFolder, CONFIG.folderNames.jobs);
    const jobFolder = jobsFolder.createFolder(`${ jobId }_${ data.name }`);

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

    const eventTitle = `[${ data.serviceType }] ${ data.name } - ${ data.zone } `;
    const eventDesc = `
    Job ID: ${ jobId }
    Phone: ${ data.phone }
    Address: ${ data.address }
    Service: ${ data.serviceType }
    Notes: ${ data.notes }
    Folder: ${ jobFolder.getUrl() }
    `;

    calendar.createEvent(eventTitle, startTime, endTime, { description: eventDesc });

  // 4. Generate PDF Quote
  const templatesFolder = getOrCreateSubFolder(rootFolder, CONFIG.folderNames.templates);
  const templateFile = getTemplateFile(templatesFolder);
  let pdfUrl = "";
  if (templateFile) {
    pdfUrl = createQuotePdf(data, jobId, jobFolder, templateFile);
  }

  // 5. Save to Sheet
  // Headers: JobID, CreatedAt, Name, Phone, Address, Date, Slot, Service, Zone, Notes, FolderURL, PDFURL
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
    pdfUrl
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
  // data: { folder_id, image_type, image_base64 }
  if (!data.folder_id || !data.image_base64) throw new Error("Missing folder_id or image_base64");
  
  const folder = DriveApp.getFolderById(data.folder_id);
  const blob = Utilities.newBlob(Utilities.base64Decode(data.image_base64.split(',')[1]), "image/jpeg", `${ data.image_type }.jpg`);
  const file = folder.createFile(blob);
  
  return {
    status: "ok",
    file_url: file.getUrl()
  };
}

function createQuotePdf(data, jobId, jobFolder, templateFile) {
  const tempDoc = templateFile.makeCopy(`Quote_${ jobId } `, jobFolder);
  const doc = DocumentApp.openById(tempDoc.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText("{{JobId}}", jobId);
  body.replaceText("{{Date}}", new Date().toLocaleDateString());
  body.replaceText("{{Name}}", data.name);
  body.replaceText("{{Phone}}", data.phone);
  body.replaceText("{{Address}}", data.address);
  body.replaceText("{{Service}}", data.serviceType);
  body.replaceText("{{EstimateMin}}", data.estimate_min || "0");
  body.replaceText("{{EstimateMax}}", data.estimate_max || "0");
  
  // Parse items if available
  let itemsText = "";
  if (data.estimate_items) {
    try {
      const items = JSON.parse(data.estimate_items);
      items.forEach(item => {
        itemsText += `- ${ item.label }: ${ item.display } \n`;
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
        ordersSheet.appendRow(["Job ID", "Created At", "Name", "Phone", "Address", "Date", "Slot", "Service", "Zone", "Notes", "Folder URL", "PDF URL"]);
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
        body.appendParagraph("Estimate: ${{ EstimateMin }} - ${{ EstimateMax }}");
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
