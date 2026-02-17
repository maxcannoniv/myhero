// Setup script — writes headers and test data to Google Sheets
// Run with: node setup-sheet.js

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

  // Clear the old data first
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Players!A:Z',
  });

  // New headers with 6 skills
  var headers = [
    'username', 'password_hash', 'hero_name', 'class',
    'might', 'agility', 'charm', 'intuition', 'commerce', 'intelligence',
    'followers', 'bank', 'positional_authority', 'faction'
  ];

  // Test player (password is "hero123")
  var testPlayer = [
    'testplayer',
    'c64fadaa840864a4bcc4088910a55a9a86e10fa68be1a4083e2b47bdafe3a2f5',
    'Test Hero',
    'Hero',
    6, 4, 3, 3, 1, 3,
    100, 5000, 1,
    'Independent'
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Players!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers, testPlayer]
    }
  });

  console.log('Headers and test player written to Players tab.');
  console.log('Setup complete!');
}

main().catch(console.error);
