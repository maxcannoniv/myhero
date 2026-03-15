// Update script — adds the message: effect to c1-the-proposal outcome_a_changes and outcome_b_changes
// Run with: node update-proposal-outcomes.js
//
// Safe to run anytime. Only modifies the two outcome columns for c1-the-proposal.

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

const SMILES_MESSAGE = "I've sent you the vials. Next - get your first sale. I recommend making a post on Bliink and maybe a classified ad. Let's get rich!";

const NEW_OUTCOME_A = 'contacts:add:Smiles|relation:Smiles:positive|inventory:Peppermint Essential Oil:100:drug|bank:-500|message:Smiles:' + SMILES_MESSAGE;
const NEW_OUTCOME_B = 'contacts:add:Smiles|relation:Smiles:positive|inventory:Peppermint Essential Oil:100:drug|bank:-1000|message:Smiles:' + SMILES_MESSAGE;

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  var sheets = google.sheets({ version: 'v4', auth });

  // Read the Missions tab
  var response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Missions!A:Z',
  });

  var rows = response.data.values || [];
  if (rows.length < 2) {
    console.log('Error: Missions tab is empty or missing headers.');
    return;
  }

  var headers = rows[0];
  var missionIdCol = headers.indexOf('mission_id');
  var outcomeACol = headers.indexOf('outcome_a_changes');
  var outcomeBCol = headers.indexOf('outcome_b_changes');

  if (missionIdCol === -1) { console.log('Error: mission_id column not found.'); return; }
  if (outcomeACol === -1) { console.log('Error: outcome_a_changes column not found.'); return; }
  if (outcomeBCol === -1) { console.log('Error: outcome_b_changes column not found.'); return; }

  // Find the c1-the-proposal row
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

  // Convert column indexes to Sheets letters (A=0, B=1, ...)
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

  var updates = [
    { range: 'Missions!' + colLetter(outcomeACol) + targetRowIndex, values: [[NEW_OUTCOME_A]] },
    { range: 'Missions!' + colLetter(outcomeBCol) + targetRowIndex, values: [[NEW_OUTCOME_B]] },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  });

  console.log('Done! Updated outcome_a_changes and outcome_b_changes for c1-the-proposal.');
  console.log('outcome_a_changes:', NEW_OUTCOME_A);
  console.log('outcome_b_changes:', NEW_OUTCOME_B);
}

main().catch(function(err) {
  console.log('Error:', err.message);
});
