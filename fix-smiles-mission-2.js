// One-time script: add Q4 option_flavors and clear Q4 question_text for c1-the-proposal
// Run with: node fix-smiles-mission-2.js
// Safe to run multiple times — only overwrites the targeted cells.

const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const MISSION_ID = 'c1-the-proposal';

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

function colLetter(n) {
  var letter = '';
  n = n + 1;
  while (n > 0) {
    var rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

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

  console.log('\n=== Reading MissionQuestions tab ===');
  var mqData = await readTab(sheets, 'MissionQuestions');
  if (mqData.length < 2) {
    console.error('ERROR: MissionQuestions tab is empty or missing.');
    process.exit(1);
  }

  var mqHeaders = mqData[0];
  console.log('Columns:', mqHeaders.join(', '));

  var mqMissionIdCol   = mqHeaders.indexOf('mission_id');
  var mqQNumCol        = mqHeaders.indexOf('question_num');
  var mqQTextCol       = mqHeaders.indexOf('question_text');
  var mqOptionIdCol    = mqHeaders.indexOf('option_id');
  var mqOptionTextCol  = mqHeaders.indexOf('option_text');
  var mqOptionFlavorCol = mqHeaders.indexOf('option_flavor');

  if (mqMissionIdCol === -1 || mqQNumCol === -1) {
    console.error('ERROR: Required columns (mission_id, question_num) not found.');
    process.exit(1);
  }
  if (mqOptionFlavorCol === -1) {
    console.error('ERROR: option_flavor column not found. Run fix-smiles-mission.js first to add it.');
    process.exit(1);
  }

  // Collect all rows for this mission
  var missionRows = [];
  for (var i = 1; i < mqData.length; i++) {
    var row = mqData[i];
    if ((row[mqMissionIdCol] || '').trim() === MISSION_ID) {
      missionRows.push({ rowIndex: i, row: row });
    }
  }

  if (missionRows.length === 0) {
    console.error('ERROR: No rows found for mission_id="' + MISSION_ID + '".');
    process.exit(1);
  }

  console.log('\nRows found for "' + MISSION_ID + '": ' + missionRows.length);
  missionRows.forEach(function(r) {
    console.log('  Row ' + (r.rowIndex + 1) + ': q=' + (r.row[mqQNumCol] || '') +
      ' option_id=' + (r.row[mqOptionIdCol] || '') +
      ' option_text="' + (r.row[mqOptionTextCol] || '') + '"' +
      ' question_text="' + (r.row[mqQTextCol] || '') + '"' +
      ' option_flavor="' + (r.row[mqOptionFlavorCol] || '') + '"');
  });

  // Isolate Q4 rows
  var q4Rows = missionRows.filter(function(r) {
    return String(r.row[mqQNumCol]).trim() === '4';
  });

  console.log('\nQ4 rows found: ' + q4Rows.length);
  if (q4Rows.length < 3) {
    console.error('ERROR: Expected 3 Q4 rows. Found ' + q4Rows.length + '. Cannot continue safely.');
    process.exit(1);
  }

  // Sort by option_id so 4a, 4b, 4c are in order
  q4Rows.sort(function(a, b) {
    return (a.row[mqOptionIdCol] || '').localeCompare(b.row[mqOptionIdCol] || '');
  });

  var q4a = q4Rows[0]; // option_id 4a — "Hell no buddy, I'm no mark!"
  var q4b = q4Rows[1]; // option_id 4b — "Hell yes, let's get rich!"
  var q4c = q4Rows[2]; // option_id 4c — "$1000? Cut that in half..."

  console.log('\nQ4 options identified:');
  console.log('  4a: "' + (q4a.row[mqOptionTextCol] || '') + '"');
  console.log('  4b: "' + (q4b.row[mqOptionTextCol] || '') + '"');
  console.log('  4c: "' + (q4c.row[mqOptionTextCol] || '') + '"');

  console.log('\n=== Applying updates ===');

  // Clear Q4 question_text (so the JS bubble guard skips overwriting the flavor)
  console.log('\nClearing Q4 question_text...');
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqQTextCol, '');

  // Q4-A: "Hell no" → NPC says "That's too bad..."
  console.log('\nSetting option_flavor on Q4-A...');
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqOptionFlavorCol,
    "That's too bad, I thought you had what it takes");

  // Q4-B: "Hell yes" → NPC says "It's a deal!"
  console.log('\nSetting option_flavor on Q4-B...');
  await setCell(sheets, 'MissionQuestions', q4b.rowIndex, mqOptionFlavorCol,
    "It's a deal! Pleasure doing business with you");

  // Q4-C: "$1000? Cut that in half" → NPC says "It's a deal!"
  console.log('\nSetting option_flavor on Q4-C...');
  await setCell(sheets, 'MissionQuestions', q4c.rowIndex, mqOptionFlavorCol,
    "It's a deal! Pleasure doing business with you");

  console.log('\n=== Done! ===');
  console.log('\nVerification checklist:');
  console.log('  1. Q3-A: tap "Why do you need a hero?" → bubble shows "I can\'t meet this huge demand alone!..."');
  console.log('  2. Q4 renders → bubble stays on Q3-A\'s flavor text (does NOT reset to Q4 question)');
  console.log('  3. Tap Q4-A ("Hell no buddy") → bubble: "That\'s too bad, I thought you had what it takes" → confirm screen');
  console.log('  4. Tap Q4-B ("Hell yes") → bubble: "It\'s a deal! Pleasure doing business with you" → confirm screen');
  console.log('  5. Tap Q4-C (commerce ≥ 5) → bubble: "It\'s a deal! Pleasure doing business with you" → confirm screen');
}

main().catch(function(err) {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
