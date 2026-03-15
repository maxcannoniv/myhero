// One-time script: fix Smiles mission data in Google Sheets
// Updates MissionQuestions rows and Missions outcome quote columns.
// Run with: node fix-smiles-mission.js
// Safe to run multiple times — reads first, then only updates matching rows.

const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';

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

  // ----- STEP 1: Find the Smiles mission in the Missions tab -----
  console.log('\n=== Reading Missions tab ===');
  var missionsData = await readTab(sheets, 'Missions');
  if (missionsData.length < 2) {
    console.error('ERROR: Missions tab is empty or missing.');
    process.exit(1);
  }
  var mHeaders = missionsData[0];
  console.log('Columns:', mHeaders.join(', '));

  // Find column indices we need
  var mMissionIdCol = mHeaders.indexOf('mission_id');
  var mTitleCol = mHeaders.indexOf('title');
  var mOutcomeAQuoteCol = mHeaders.indexOf('outcome_a_quote');
  var mOutcomeBQuoteCol = mHeaders.indexOf('outcome_b_quote');
  var mOutcomeCQuoteCol = mHeaders.indexOf('outcome_c_quote');

  if (mMissionIdCol === -1) { console.error('ERROR: mission_id column not found in Missions tab'); process.exit(1); }
  if (mTitleCol === -1) { console.error('ERROR: title column not found in Missions tab'); process.exit(1); }

  // List all missions so we can confirm which one is Smiles
  console.log('\nAll missions found:');
  var smilesMissionId = null;
  var smilesMissionsRowIndex = null;
  for (var i = 1; i < missionsData.length; i++) {
    var row = missionsData[i];
    var id = row[mMissionIdCol] || '';
    var title = row[mTitleCol] || '';
    console.log('  Row ' + (i + 1) + ': mission_id="' + id + '" title="' + title + '"');
    // Identify Smiles mission by title containing "Smiles" or id containing "smiles"
    if (id.toLowerCase().includes('smiles') || title.toLowerCase().includes('smiles')) {
      smilesMissionId = id;
      smilesMissionsRowIndex = i;
    }
  }

  if (!smilesMissionId) {
    // Fall back to the known mission_id
    var fallback = 'c1-the-proposal';
    console.log('\nCould not auto-detect Smiles mission by name. Falling back to known mission_id: "' + fallback + '"');
    for (var i = 1; i < missionsData.length; i++) {
      if ((missionsData[i][mMissionIdCol] || '').trim() === fallback) {
        smilesMissionId = fallback;
        smilesMissionsRowIndex = i;
        break;
      }
    }
    if (!smilesMissionId) {
      console.error('ERROR: mission_id "' + fallback + '" also not found. Missions in sheet:', missionsData.slice(1).map(r => r[mMissionIdCol]).join(', '));
      process.exit(1);
    }
  }
  console.log('\nDetected Smiles mission: mission_id="' + smilesMissionId + '" at Missions row ' + (smilesMissionsRowIndex + 1));

  // ----- STEP 2: Read MissionQuestions tab -----
  console.log('\n=== Reading MissionQuestions tab ===');
  var mqData = await readTab(sheets, 'MissionQuestions');
  if (mqData.length < 2) {
    console.error('ERROR: MissionQuestions tab is empty or missing.');
    process.exit(1);
  }
  var mqHeaders = mqData[0];
  console.log('Columns:', mqHeaders.join(', '));

  var mqMissionIdCol = mqHeaders.indexOf('mission_id');
  var mqQNumCol     = mqHeaders.indexOf('question_num');
  var mqQTextCol    = mqHeaders.indexOf('question_text');
  var mqOptionIdCol = mqHeaders.indexOf('option_id');
  var mqOptionTextCol   = mqHeaders.indexOf('option_text');
  var mqOptionFlavorCol = mqHeaders.indexOf('option_flavor');
  var mqOptionWeightCol = mqHeaders.indexOf('option_weight');
  var mqSkillCheckCol   = mqHeaders.indexOf('option_skill_check');

  if (mqMissionIdCol === -1 || mqQNumCol === -1) {
    console.error('ERROR: Required columns missing from MissionQuestions tab');
    process.exit(1);
  }

  // Find all rows for this mission
  console.log('\nMissionQuestions rows for mission_id="' + smilesMissionId + '":');
  var missionRows = []; // { rowIndex, data }
  for (var i = 1; i < mqData.length; i++) {
    var row = mqData[i];
    if ((row[mqMissionIdCol] || '').trim() === smilesMissionId.trim()) {
      missionRows.push({ rowIndex: i, row: row });
      console.log('  Row ' + (i + 1) + ': q=' + row[mqQNumCol] + ' option_id=' + (row[mqOptionIdCol] || '') +
        ' option_text="' + (row[mqOptionTextCol] || '') + '"' +
        ' option_weight="' + (row[mqOptionWeightCol] || '') + '"' +
        ' option_flavor="' + (row[mqOptionFlavorCol] || '') + '"');
    }
  }

  if (missionRows.length === 0) {
    console.error('\nERROR: No MissionQuestions rows found for mission_id="' + smilesMissionId + '".');
    process.exit(1);
  }

  // The mission has 4 questions. The plan's "Q1/Q2" map to actual Q3/Q4.
  // Q3 = "why do you need a hero / pyramid scheme" (2 options, need option_flavor added)
  // Q4 = the final decision (3 options, weights are swapped and need fixing)
  var q3Rows = missionRows.filter(r => String(r.row[mqQNumCol]).trim() === '3');
  var q4Rows = missionRows.filter(r => String(r.row[mqQNumCol]).trim() === '4');

  console.log('\nQ3 rows found: ' + q3Rows.length + ', Q4 rows found: ' + q4Rows.length);

  if (q3Rows.length < 2) {
    console.error('ERROR: Expected 2 Q3 rows. Found ' + q3Rows.length + '. Cannot continue safely.');
    process.exit(1);
  }
  if (q4Rows.length < 3) {
    console.error('ERROR: Expected 3 Q4 rows. Found ' + q4Rows.length + '. Cannot continue safely.');
    process.exit(1);
  }

  // Sort by option_id
  q3Rows.sort((a, b) => (a.row[mqOptionIdCol] || '').localeCompare(b.row[mqOptionIdCol] || ''));
  q4Rows.sort((a, b) => (a.row[mqOptionIdCol] || '').localeCompare(b.row[mqOptionIdCol] || ''));

  var q3a = q3Rows[0]; // "Why do you need a hero for this?" — needs flavor
  var q3b = q3Rows[1]; // "Wait, is this a pyramid scheme?" — needs flavor
  var q4a = q4Rows[0]; // "Hell no, I'm no mark." — weight=c (already correct)
  var q4b = q4Rows[1]; // "Hell yes, let's get rich!" — weight currently b, should be a
  var q4c = q4Rows[2]; // "$1000? Cut that in half" — weight currently a, should be b + commerce:5

  // ----- STEP 3: Apply all updates -----
  console.log('\n=== Applying updates ===');

  // Q3 question_text — only set if blank
  var q3CurrentQText = q3a.row[mqQTextCol] || '';
  if (!q3CurrentQText) {
    console.log('Q3 question_text is blank — setting it');
    await setCell(sheets, 'MissionQuestions', q3a.rowIndex, mqQTextCol,
      "So... what exactly does this job involve?");
  } else {
    console.log('Q3 question_text already set: "' + q3CurrentQText + '" — leaving as-is');
  }

  // Q3-A: option_text (preserve existing), add option_flavor, weight stays blank
  console.log('\nUpdating Q3-A (option_flavor)...');
  await setCell(sheets, 'MissionQuestions', q3a.rowIndex, mqOptionFlavorCol,
    "I can't meet this huge demand alone! $1000 for 100 vials. What do you say?");
  await setCell(sheets, 'MissionQuestions', q3a.rowIndex, mqOptionWeightCol, '');

  // Q3-B: option_text (preserve existing), add option_flavor, weight stays blank
  console.log('\nUpdating Q3-B (option_flavor)...');
  await setCell(sheets, 'MissionQuestions', q3b.rowIndex, mqOptionFlavorCol,
    "A pyramid scheme, HA! Listen here - the demand is real I'm telling you. $1000 for 100 vials. What do you say?");
  await setCell(sheets, 'MissionQuestions', q3b.rowIndex, mqOptionWeightCol, '');

  // Q4 question_text (set on first Q4 row — all Q4 options share same question)
  console.log('\nUpdating Q4 question_text...');
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqQTextCol,
    "$1000 for 100 vials. What do you say?");

  // Q4-A: weight=c (already correct per read), option_text tweak, no skill check
  console.log('\nUpdating Q4-A (weight=c, no skill check)...');
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqOptionTextCol,
    "Hell no buddy, I'm no mark!");
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqOptionWeightCol, 'c');
  await setCell(sheets, 'MissionQuestions', q4a.rowIndex, mqSkillCheckCol, '');

  // Q4-B: weight was b, should be a
  console.log('\nUpdating Q4-B (weight: b → a, no skill check)...');
  await setCell(sheets, 'MissionQuestions', q4b.rowIndex, mqOptionWeightCol, 'a');
  await setCell(sheets, 'MissionQuestions', q4b.rowIndex, mqSkillCheckCol, '');

  // Q4-C: weight was a, should be b; add commerce:5 skill check
  console.log('\nUpdating Q4-C (weight: a → b, skill check: commerce:5)...');
  await setCell(sheets, 'MissionQuestions', q4c.rowIndex, mqOptionWeightCol, 'b');
  await setCell(sheets, 'MissionQuestions', q4c.rowIndex, mqSkillCheckCol, 'commerce:5');

  // ----- STEP 4: Update Missions tab outcome quotes -----
  console.log('\n=== Updating Missions outcome quotes ===');

  // If quote columns don't exist yet, append them to the header row
  if (mOutcomeAQuoteCol === -1) {
    console.log('outcome_a_quote column not found — adding quote columns to Missions header row...');
    var currentHeaderLen = mHeaders.length;
    mOutcomeAQuoteCol = currentHeaderLen;
    mOutcomeBQuoteCol = currentHeaderLen + 1;
    mOutcomeCQuoteCol = currentHeaderLen + 2;
    // Write the three new column headers
    await setCell(sheets, 'Missions', 0, mOutcomeAQuoteCol, 'outcome_a_quote');
    await setCell(sheets, 'Missions', 0, mOutcomeBQuoteCol, 'outcome_b_quote');
    await setCell(sheets, 'Missions', 0, mOutcomeCQuoteCol, 'outcome_c_quote');
  }

  await setCell(sheets, 'Missions', smilesMissionsRowIndex, mOutcomeAQuoteCol,
    "It's a deal! Pleasure doing business with you");
  await setCell(sheets, 'Missions', smilesMissionsRowIndex, mOutcomeBQuoteCol,
    "It's a deal! Pleasure doing business with you");
  await setCell(sheets, 'Missions', smilesMissionsRowIndex, mOutcomeCQuoteCol,
    "That's too bad, I thought you had what it takes");

  console.log('\n=== Done! All updates applied. ===');
  console.log('\nVerification checklist:');
  console.log('  1. Open mission → Q1 bubble shows opening line');
  console.log('  2. Tap Q1-A → bubble: "I can\'t meet this huge demand alone!..." → Q2 renders');
  console.log('  3. Tap Q1-B → bubble: "A pyramid scheme, HA!..." → Q2 renders');
  console.log('  4. Q2-C grays out for players with commerce < 5');
  console.log('  5. Pick Q2-A (weight=c) → resolve → "That\'s too bad..."');
  console.log('  6. Pick Q2-B (weight=a) → resolve → "It\'s a deal!"');
  console.log('  7. Pick Q2-C (weight=b, commerce≥5) → resolve → "It\'s a deal!"');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
