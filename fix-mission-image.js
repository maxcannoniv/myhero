// One-time script: fix c1-the-proposal image_url in Google Sheets
// Updates the Missions tab image_url to point at the correct mission image.
// Run with: node fix-mission-image.js
// Safe to run multiple times — reads first, then only updates the matching row.

const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const MISSION_ID = 'c1-the-proposal';
const NEW_IMAGE_URL = 'https://myherogame.netlify.app/assets/missions/c1-the-proposal/proposal.webp';

// ---- Auth ----
function getSheets() {
  var creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
  var auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ---- Helpers ----
async function readTab(sheets, tabName) {
  var result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: tabName + '!A:Z',
  });
  return result.data.values || [];
}

// Convert 0-based column index to Sheets column letter (A, B, ..., Z, AA, ...)
function colLetter(n) {
  var letter = '';
  n = n + 1; // 1-based
  while (n > 0) {
    var rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// Update a single cell. rowIndex is 0-based (0 = header row).
async function setCell(sheets, tabName, rowIndex, colIndex, value) {
  var range = tabName + '!' + colLetter(colIndex) + (rowIndex + 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  });
  console.log('  SET ' + range + ' = "' + value + '"');
}

// ---- Main ----
async function main() {
  var sheets = getSheets();

  console.log('\n=== Reading Missions tab ===');
  var missionsData = await readTab(sheets, 'Missions');
  if (missionsData.length < 2) {
    console.error('ERROR: Missions tab is empty or missing.');
    process.exit(1);
  }

  var headers = missionsData[0];
  console.log('Columns:', headers.join(', '));

  var missionIdCol = headers.indexOf('mission_id');
  var imageUrlCol  = headers.indexOf('image_url');

  if (missionIdCol === -1) {
    console.error('ERROR: mission_id column not found in Missions tab');
    process.exit(1);
  }
  if (imageUrlCol === -1) {
    console.error('ERROR: image_url column not found in Missions tab');
    process.exit(1);
  }

  // Find the c1-the-proposal row
  var targetRowIndex = null;
  console.log('\nAll missions found:');
  for (var i = 1; i < missionsData.length; i++) {
    var row = missionsData[i];
    var id = (row[missionIdCol] || '').trim();
    var currentImageUrl = row[imageUrlCol] || '';
    console.log('  Row ' + (i + 1) + ': mission_id="' + id + '" image_url="' + currentImageUrl + '"');
    if (id === MISSION_ID) {
      targetRowIndex = i;
    }
  }

  if (targetRowIndex === null) {
    console.error('\nERROR: mission_id "' + MISSION_ID + '" not found in Missions tab.');
    process.exit(1);
  }

  var currentUrl = (missionsData[targetRowIndex][imageUrlCol] || '').trim();
  console.log('\nFound "' + MISSION_ID + '" at row ' + (targetRowIndex + 1));
  console.log('  Current image_url: "' + currentUrl + '"');
  console.log('  New image_url:     "' + NEW_IMAGE_URL + '"');

  if (currentUrl === NEW_IMAGE_URL) {
    console.log('\nimage_url is already correct — no update needed.');
    return;
  }

  console.log('\n=== Applying update ===');
  await setCell(sheets, 'Missions', targetRowIndex, imageUrlCol, NEW_IMAGE_URL);

  console.log('\n=== Done! ===');
  console.log('\nVerification checklist:');
  console.log('  1. Open mission overlay → image frame shows the mission scene (not Smiles profile)');
  console.log('  2. Tap through questions → image stays on mission scene (no option_image overrides set)');
  console.log('  3. After DM resolves → outcome screen also shows mission scene image');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
