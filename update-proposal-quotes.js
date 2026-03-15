// Update script — adds outcome_a_quote, outcome_b_quote, outcome_c_quote columns
// to the Missions tab and sets the values for c1-the-proposal.
// Run with: node update-proposal-quotes.js

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

const QUOTES = {
  a: "It's a deal! Pleasure doing business with you.",
  b: "It's a deal! Pleasure doing business with you.",
  c: "That's too bad, I thought you had what it takes."
};

function colLetter(n) {
  var result = '';
  n = n + 1; // convert 0-based to 1-based
  while (n > 0) {
    var remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  var sheets = google.sheets({ version: 'v4', auth });

  // Read Missions tab
  var response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Missions!1:1000',
  });

  var rows = response.data.values || [];
  if (rows.length < 2) {
    console.log('Error: Missions tab is empty or missing headers.');
    return;
  }

  var headers = rows[0];
  var missionIdCol = headers.indexOf('mission_id');
  if (missionIdCol === -1) { console.log('Error: mission_id column not found.'); return; }

  // Add any missing quote columns to the header row
  var quoteColNames = ['outcome_a_quote', 'outcome_b_quote', 'outcome_c_quote'];
  var updates = [];

  for (var i = 0; i < quoteColNames.length; i++) {
    var colName = quoteColNames[i];
    if (headers.indexOf(colName) === -1) {
      // Append to the end of the header row
      headers.push(colName);
      var newColIdx = headers.length - 1;
      updates.push({
        range: 'Missions!' + colLetter(newColIdx) + '1',
        values: [[colName]]
      });
      console.log('Adding new column: ' + colName + ' at ' + colLetter(newColIdx));
    } else {
      console.log('Column already exists: ' + colName);
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    });
    console.log('Header columns written.');
  }

  // Find c1-the-proposal row
  var targetRowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][missionIdCol] === 'c1-the-proposal') {
      targetRowIndex = i + 1; // Sheets rows are 1-indexed
      break;
    }
  }

  if (targetRowIndex === -1) {
    console.log('Error: c1-the-proposal row not found in Missions tab.');
    return;
  }

  // Write quote values for the proposal row
  var quoteUpdates = [];
  ['a', 'b', 'c'].forEach(function(bucket) {
    var colName = 'outcome_' + bucket + '_quote';
    var colIdx = headers.indexOf(colName);
    if (colIdx !== -1) {
      quoteUpdates.push({
        range: 'Missions!' + colLetter(colIdx) + targetRowIndex,
        values: [[QUOTES[bucket]]]
      });
    }
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: quoteUpdates },
  });

  console.log('Done! Quotes written for c1-the-proposal:');
  console.log('  outcome_a_quote:', QUOTES.a);
  console.log('  outcome_b_quote:', QUOTES.b);
  console.log('  outcome_c_quote:', QUOTES.c);
}

main().catch(function(err) {
  console.log('Error:', err.message);
});
