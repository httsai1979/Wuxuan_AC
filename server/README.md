# Wuxuan HVAC - Backend Deployment Guide

This project uses Google Apps Script (GAS) as the backend. Follow these steps to deploy it.

## 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it `Wuxuan HVAC Database`.

## 2. Open Apps Script
1. In the spreadsheet, click **Extensions** > **Apps Script**.
2. Rename the project to `Wuxuan HVAC Backend`.

## 3. Deploy Code
1. Copy the content of `server/Code.js` from this repository.
2. Paste it into the `Code.gs` file in the Apps Script editor (replace existing code).
3. Save the project (Ctrl+S).

## 4. Run Setup
1. In the toolbar, select the `setup` function from the dropdown.
2. Click **Run**.
3. Grant the necessary permissions (Review Permissions -> Choose Account -> Advanced -> Go to Wuxuan HVAC Backend (unsafe) -> Allow).
   - This script needs access to:
     - Spreadsheets (to save orders)
     - Drive (to create folders and save images)
     - Calendar (to create events)
4. Wait for the execution to complete.

## 5. Deploy as Web App
1. Click **Deploy** > **New deployment**.
2. Click the **Select type** gear icon > **Web app**.
3. Fill in the details:
   - **Description**: `v1`
   - **Execute as**: `Me` (your email)
   - **Who has access**: `Anyone` (This is important for the frontend to access it without login)
4. Click **Deploy**.
5. **Copy the Web App URL**.

## 6. Connect Frontend
1. Open `wuxuan-hvac-web/app.js`.
2. Find the line:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxxx/exec";
   ```
3. Replace the URL with your copied Web App URL.
