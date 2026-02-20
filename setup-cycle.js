// Setup script — creates the Cycle/Settings system in Google Sheets
// Run with: node setup-cycle.js
//
// What this does:
//   1. Creates a Settings tab (if it doesn't exist)
//   2. Writes current_cycle = 1 and cycle_start = now into Settings
//   3. Adds a cycle_id column header to the Feeds tab
//   4. Adds a cycle_id column header to the Messages tab
//
// Safe to re-run — checks before creating or overwriting.

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

  // --- Create Settings tab if it doesn't exist ---
  if (existingTabs.indexOf('Settings') === -1) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Settings' } } }]
      }
    });
    console.log('Created Settings tab.');
  } else {
    console.log('Settings tab already exists.');
  }

  // --- Write Settings headers and initial cycle data ---
  // key  | value
  // current_cycle | 1
  // cycle_start   | 2026-02-19T00:00:00.000Z  (set to now)
  var cycleStart = new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        ['key', 'value'],
        ['current_cycle', '1'],
        ['cycle_start', cycleStart],
      ]
    }
  });
  console.log('Settings tab: current_cycle=1, cycle_start=' + cycleStart);

  // --- Add cycle_id column to Feeds tab (if not already there) ---
  var feedRows = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feeds!1:1',  // just the header row
  });
  var feedHeaders = (feedRows.data.values && feedRows.data.values[0]) ? feedRows.data.values[0] : [];

  if (feedHeaders.indexOf('cycle_id') === -1) {
    // Write 'cycle_id' into the next empty column of the header row
    var nextCol = indexToColLetter(feedHeaders.length); // 0-based length = next index
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Feeds!' + nextCol + '1',
      valueInputOption: 'RAW',
      requestBody: { values: [['cycle_id']] }
    });
    console.log('Feeds tab: added cycle_id header at column ' + nextCol + '.');
  } else {
    console.log('Feeds tab: cycle_id header already exists.');
  }

  // --- Add cycle_id column to Messages tab (if not already there) ---
  var msgRows = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Messages!1:1',
  });
  var msgHeaders = (msgRows.data.values && msgRows.data.values[0]) ? msgRows.data.values[0] : [];

  if (msgHeaders.indexOf('cycle_id') === -1) {
    var nextMsgCol = indexToColLetter(msgHeaders.length);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Messages!' + nextMsgCol + '1',
      valueInputOption: 'RAW',
      requestBody: { values: [['cycle_id']] }
    });
    console.log('Messages tab: added cycle_id header at column ' + nextMsgCol + '.');
  } else {
    console.log('Messages tab: cycle_id header already exists.');
  }

  console.log('\nDone! Cycle system is ready.');
  console.log('To advance the cycle: edit current_cycle in the Settings tab and update cycle_start to now.');
}

// Convert a 0-based column index to a spreadsheet column letter (0 = A, 25 = Z, 26 = AA, etc.)
function indexToColLetter(index) {
  var letter = '';
  index = index + 1; // convert to 1-based
  while (index > 0) {
    var remainder = (index - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

main().catch(console.error);
