// setup-proposal-mission.js
// Run once: node setup-proposal-mission.js
//
// Does three things:
//   1. Adds the option_skill_check column to MissionQuestions header row
//   2. Adds the c1-the-proposal row to the Missions tab
//   3. Adds 9 question rows to MissionQuestions for c1-the-proposal

const { google } = require('googleapis');
const credentials = require('./credentials.json');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';

const SMILES_PROFILE_URL = 'https://myherogame.netlify.app/assets/characters/smiles/profile.webp';

async function setup() {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // -----------------------------------------------
  // STEP 1 — Add option_skill_check to MissionQuestions header row
  // -----------------------------------------------
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MissionQuestions!1:1',
  });

  const currentHeaders = headerRes.data.values ? headerRes.data.values[0] : [];

  if (currentHeaders.includes('option_skill_check')) {
    console.log('MissionQuestions: option_skill_check already exists, skipping.');
  } else {
    // Append the new column header at the end of row 1
    const nextCol = String.fromCharCode(65 + currentHeaders.length); // A=65, so length=8 → 'I'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `MissionQuestions!${nextCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['option_skill_check']] },
    });
    console.log(`MissionQuestions: added option_skill_check at column ${nextCol}.`);
  }

  // -----------------------------------------------
  // STEP 2 — Add c1-the-proposal to Missions tab
  // -----------------------------------------------
  const missionsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Missions!A:A',
  });

  const missionIds = (missionsRes.data.values || []).map(row => row[0]);
  if (missionIds.includes('c1-the-proposal')) {
    console.log('Missions: c1-the-proposal already exists, skipping.');
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Missions!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'c1-the-proposal',
          'Looking for a HERO looking to make some CASH',
          'Are you a self starter? Hard worker? Think you got what it takes to make it big? Boy do I have the opportunity for you!',
          SMILES_PROFILE_URL,
          'yes',
          '1.00.00.0',
          // Outcome A — Sharp Negotiator
          'Sharp Negotiator',
          '"Hell of a negotiator!" Smiles cackles. "Alright, alright — $500 it is. Pleasure doing business with you."',
          '',
          'contacts:add:Smiles|relation:Smiles:positive|inventory:Peppermint Essential Oil:100:drug|bank:-500',
          // Outcome B — In Business
          'In Business',
          '"It\'s a deal! Pleasure doing business with you." Smiles beams.',
          '',
          'contacts:add:Smiles|relation:Smiles:positive|inventory:Peppermint Essential Oil:100:drug|bank:-1000',
          // Outcome C — No Deal
          'No Deal',
          '"That\'s too bad," Smiles says, voice dropping. "I thought you had what it takes."',
          '',
          'contacts:add:Smiles',
        ]],
      },
    });
    console.log('Missions: c1-the-proposal added.');
  }

  // -----------------------------------------------
  // STEP 3 — Add 9 question rows for c1-the-proposal
  // -----------------------------------------------
  const questionsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MissionQuestions!A:A',
  });

  const questionMissionIds = (questionsRes.data.values || []).map(row => row[0]);
  const alreadyHasProposal = questionMissionIds.includes('c1-the-proposal');

  if (alreadyHasProposal) {
    console.log('MissionQuestions: c1-the-proposal rows already exist, skipping.');
  } else {
    // Columns: mission_id, question_num, question_text, option_id, option_text,
    //          option_image, option_flavor, option_weight, option_skill_check
    const q1 = 'Great to meet you! They call me Smiles. I\'ve been searching for a hero like you!';
    const q2 = 'Oh wow, and you seem like you got what it takes to make it big time!';
    const q3 = 'Alright here\'s the deal — the people want peppermint essential oil. I need someone to help me push it. You in?';
    const q4 = 'A pyramid scheme, HA! Listen here — the demand is real. $1000 for 100 vials. What do you say?';

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MissionQuestions!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          // Frame 1
          ['c1-the-proposal', '1', q1, '1a', 'Happy to be of service. How can I help?', '', '', '', ''],
          ['c1-the-proposal', '1', q1, '1b', 'This seems different than I expected…',    '', '', '', ''],
          // Frame 2
          ['c1-the-proposal', '2', q2, '2a', "Thanks, I've worked toward this for a long time!", '', '', '', ''],
          ['c1-the-proposal', '2', q2, '2b', "Enough with the glazing — what's the situation?",  '', '', '', ''],
          // Frame 3
          ['c1-the-proposal', '3', q3, '3a', 'Why do you need a hero for this?',    '', '', '', ''],
          ['c1-the-proposal', '3', q3, '3b', 'Wait, is this a pyramid scheme?',     '', '', '', ''],
          // Frame 4 — these weights determine the actual outcome
          ['c1-the-proposal', '4', q4, '4a', "Hell no, I'm no mark.",                         '', '', 'c', ''],
          ['c1-the-proposal', '4', q4, '4b', "Hell yes, let's get rich!",                      '', '', 'b', ''],
          ['c1-the-proposal', '4', q4, '4c', "$1000? Cut that in half and we got a deal.",     '', '', 'a', 'commerce:5'],
        ],
      },
    });
    console.log('MissionQuestions: 9 rows for c1-the-proposal added.');
  }

  console.log('\nAll done. No git push needed — this only updates Google Sheets.');
}

setup().catch(console.error);
