// setup-missions.js
// Run once: node setup-missions.js
//
// Creates three new tabs in Google Sheets:
//   - Missions         (one row per mission, with all outcome data)
//   - MissionQuestions (one row per answer option)
//   - MissionSubmissions (one row per player submission)
//
// Safe to run multiple times — only creates sheets that don't exist yet,
// and only writes headers if the sheet is empty.

const { google } = require('googleapis');
const credentials = require('./credentials.json');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';

async function setup() {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // --- Check which sheets already exist ---
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

  const needed = ['Missions', 'MissionQuestions', 'MissionSubmissions'];
  const toCreate = needed.filter(name => !existingSheets.includes(name));

  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: toCreate.map(title => ({
          addSheet: { properties: { title } }
        }))
      }
    });
    console.log('Created sheets:', toCreate.join(', '));
  } else {
    console.log('All three sheets already exist.');
  }

  // --- Write headers (only if the sheet is empty) ---

  // Missions headers
  const missionsData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Missions!A1',
  });
  if (!missionsData.data.values) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Missions!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'mission_id', 'title', 'description', 'image_url', 'visible', 'cycle_id',
          'outcome_a_label', 'outcome_a_narrative', 'outcome_a_image', 'outcome_a_changes',
          'outcome_b_label', 'outcome_b_narrative', 'outcome_b_image', 'outcome_b_changes',
          'outcome_c_label', 'outcome_c_narrative', 'outcome_c_image', 'outcome_c_changes'
        ]]
      }
    });
    console.log('Missions: headers written.');

    // Sample mission
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Missions!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'm001',
          'The Repo Job',
          "Mongrel needs a vehicle retrieved before the owner can move it. The job is off the books — no questions asked. You've got 4 hours.",
          '',
          'yes',
          '1.00.00.0',
          // outcome a
          'Played It Straight',
          "You delivered the car and got paid. Mongrel barely looked up, but that's practically a handshake from him.",
          '',
          'bank:+500',
          // outcome b
          'Walked Away',
          "You turned it down. Someone else picked up the call. Mongrel doesn't forget who said no.",
          '',
          'reputation:mongrels-towing:negative',
          // outcome c (blank — not used for this mission)
          '', '', '', ''
        ]]
      }
    });
    console.log('Missions: sample row written.');
  } else {
    console.log('Missions: already has data, skipping.');
  }

  // MissionQuestions headers
  const questionsData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MissionQuestions!A1',
  });
  if (!questionsData.data.values) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MissionQuestions!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'mission_id', 'question_num', 'question_text',
          'option_id', 'option_text', 'option_image', 'option_flavor', 'option_weight'
        ]]
      }
    });
    console.log('MissionQuestions: headers written.');

    // Sample questions for m001 (3 questions, 2 options each)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MissionQuestions!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['m001', '1', 'Mongrel calls. He needs a car brought in tonight. What do you do?',
           '1a', 'Take the job', '', 'Money is money.', 'a'],
          ['m001', '1', 'Mongrel calls. He needs a car brought in tonight. What do you do?',
           '1b', 'Ask what you\'re walking into', '', 'You want to know the risks.', 'b'],

          ['m001', '2', 'The address is in a rough part of town. You arrive after dark.',
           '2a', 'Move fast and quiet', '', 'No witnesses, no problems.', 'a'],
          ['m001', '2', 'The address is in a rough part of town. You arrive after dark.',
           '2b', 'Take your time and scope it first', '', 'Better safe than stuck.', 'b'],

          ['m001', '3', "The car is there. But someone is asleep in the back seat.",
           '3a', 'Take the car anyway', '', "Job's a job.", 'a'],
          ['m001', '3', "The car is there. But someone is asleep in the back seat.",
           '3b', 'Wake them up and tell them to go', '', 'This just got complicated.', 'b'],
        ]
      }
    });
    console.log('MissionQuestions: sample rows written.');
  } else {
    console.log('MissionQuestions: already has data, skipping.');
  }

  // MissionSubmissions headers
  const submissionsData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MissionSubmissions!A1',
  });
  if (!submissionsData.data.values) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MissionSubmissions!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'submission_id', 'username', 'hero_name', 'mission_id',
          'q1_answer', 'q2_answer', 'q3_answer', 'q4_answer',
          'outcome_bucket', 'dm_override', 'resolved', 'cycle_id', 'timestamp'
        ]]
      }
    });
    console.log('MissionSubmissions: headers written.');
  } else {
    console.log('MissionSubmissions: already has data, skipping.');
  }

  console.log('\nDone! Run "git push" when ready to deploy.');
  console.log('\nDM notes for MissionSubmissions:');
  console.log('  - outcome_bucket: auto-computed (a/b/c)');
  console.log('  - dm_override: leave blank to use auto-computed bucket, or write a/b/c to override');
  console.log('  - resolved: change from "no" to "yes" when ready to show outcome to player');
}

setup().catch(console.error);
