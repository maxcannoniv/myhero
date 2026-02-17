// Setup script — creates Reputation tab and sets all players to neutral with all factions
// Run with: node setup-reputation.js
//
// Reads current Players and Factions tabs, then writes one row per player×faction = neutral.
// Safe to re-run — clears and rewrites the Reputation tab each time.

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

  // --- Read existing tab list ---
  var spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  var existingTabs = spreadsheet.data.sheets.map(function(s) { return s.properties.title; });

  // --- Create Reputation tab if it doesn't exist ---
  if (existingTabs.indexOf('Reputation') === -1) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Reputation' } } }] }
    });
    console.log('Created Reputation tab.');
  } else {
    console.log('Reputation tab already exists — clearing and rewriting.');
  }

  // --- Read all players ---
  var playerRows = await readTab(sheets, 'Players');
  var players = rowsToObjects(playerRows);
  var heroNames = players.map(function(p) { return p.hero_name; }).filter(Boolean);
  console.log('Players found: ' + heroNames.join(', '));

  // --- Read all factions ---
  var factionRows = await readTab(sheets, 'Factions');
  var factions = rowsToObjects(factionRows);
  var factionNames = factions.map(function(f) { return f.faction_name; }).filter(Boolean);
  console.log('Factions found: ' + factionNames.join(', '));

  // --- Build rows: one per player × faction, all neutral ---
  var rows = [['hero_name', 'faction_name', 'reputation']];
  heroNames.forEach(function(heroName) {
    factionNames.forEach(function(factionName) {
      rows.push([heroName, factionName, 'neutral']);
    });
  });

  // --- Write to Reputation tab (overwrites everything) ---
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Reputation!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  console.log('Done. Wrote ' + (rows.length - 1) + ' reputation rows (' + heroNames.length + ' players × ' + factionNames.length + ' factions).');
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
