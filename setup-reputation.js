// Reputation sync script — adds missing player×faction rows, never overwrites existing ones.
// Run with: node setup-reputation.js
//
// When to run:
//   - After adding a new faction to the Factions tab
//   - After adding a player directly to the Players tab (bypassing registration)
//   - Any time you want to make sure the Reputation tab is complete
//
// Safe to run anytime — custom reputation values are preserved.

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function readTab(sheets, tabName) {
  var result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: tabName + '!A:Z',
  });
  return result.data.values || [];
}

function rowsToObjects(data) {
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] || ''; });
    return obj;
  });
}

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  var sheets = google.sheets({ version: 'v4', auth });

  // --- Create Reputation tab if it doesn't exist yet ---
  var spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  var existingTabs = spreadsheet.data.sheets.map(function(s) { return s.properties.title; });

  if (existingTabs.indexOf('Reputation') === -1) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Reputation' } } }] }
    });
    // Write the header row on a fresh tab
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reputation!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['hero_name', 'faction_name', 'reputation']] }
    });
    console.log('Created Reputation tab.');
  }

  // --- Read players, factions, and existing reputation rows ---
  var playerRows = await readTab(sheets, 'Players');
  var players = rowsToObjects(playerRows);
  var heroNames = players.map(function(p) { return p.hero_name; }).filter(Boolean);

  var factionRows = await readTab(sheets, 'Factions');
  var factions = rowsToObjects(factionRows);
  var factionNames = factions.map(function(f) { return f.faction_name; }).filter(Boolean);

  var repRows = await readTab(sheets, 'Reputation');
  var existing = new Set();
  if (repRows.length > 1) {
    rowsToObjects(repRows).forEach(function(r) {
      if (r.hero_name && r.faction_name) {
        existing.add(r.hero_name + '|' + r.faction_name);
      }
    });
  }

  console.log('Players: ' + heroNames.join(', '));
  console.log('Factions: ' + factionNames.join(', '));
  console.log('Existing reputation rows: ' + existing.size);

  // --- Find missing combinations and add them as neutral ---
  var newRows = [];
  heroNames.forEach(function(heroName) {
    factionNames.forEach(function(factionName) {
      if (!existing.has(heroName + '|' + factionName)) {
        newRows.push([heroName, factionName, 'neutral']);
      }
    });
  });

  if (newRows.length === 0) {
    console.log('All reputation rows are present. Nothing to add.');
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Reputation!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: newRows }
  });

  console.log('Added ' + newRows.length + ' missing reputation rows (all set to neutral).');
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
