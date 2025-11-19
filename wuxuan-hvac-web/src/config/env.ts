const {
  VITE_SHEET_ID,
  VITE_CALENDAR_ID,
  VITE_APPS_SCRIPT_URL,
  VITE_DRIVE_ROOT_ID,
  VITE_ADMIN_KEY,
} = import.meta.env;

export const HVAC_ENV = {
  sheetId: VITE_SHEET_ID,
  calendarId: VITE_CALENDAR_ID,
  appsScriptUrl: VITE_APPS_SCRIPT_URL,
  driveRootId: VITE_DRIVE_ROOT_ID,
  adminKey: VITE_ADMIN_KEY,
};

console.log('[HVAC_ENV]', HVAC_ENV);
