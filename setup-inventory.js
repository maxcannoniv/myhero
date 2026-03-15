// Setup script — creates Inventory tab in Google Sheets
// Run with: node setup-inventory.js
//
// This does NOT touch other tabs. Safe to run anytime.

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  var sheets = google.sheets({ version: 'v4', auth });

  // --- Get existing tabs ---
  var spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  var existingTabs = spreadsheet.data.sheets.map(function(s) {
    return s.properties.title;
  });

  // --- Create Inventory tab if it doesn't exist ---
  if (existingTabs.indexOf('Inventory') === -1) {
    console.log('Creating tab: Inventory');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Inventory' } } }] }
    });
  } else {
    console.log('Tab already exists: Inventory');
  }

  // --- Write headers (always overwrites row 1 so headers stay correct) ---
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Inventory!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [['username', 'item_name', 'quantity', 'category']] }
  });
  console.log('Inventory tab: headers written (username, item_name, quantity, category).');

  console.log('Done!');
}

main().catch(console.error);
