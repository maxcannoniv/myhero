// Asset sync checker — scans assets/ folders and cross-references Google Sheets
// Run with: node sync-assets.js
//
// Reports:
//   - Which character assets exist and whether asset_slug is set in Sheets
//   - Which faction assets exist and whether asset_slug is set in Sheets
//   - Which place assets exist (for reference — used as Bliink backgrounds)
//   - Characters/factions in Sheets that have no assets yet
//
// Does NOT modify anything. Read-only.

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const ASSETS_DIR = path.join(__dirname, 'assets');

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

function getSlugsInFolder(folderName) {
  var fullPath = path.join(ASSETS_DIR, folderName);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath).filter(function(name) {
    return fs.statSync(path.join(fullPath, name)).isDirectory();
  });
}

function getFilesInSlugFolder(folderName, slug) {
  var fullPath = path.join(ASSETS_DIR, folderName, slug);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath).filter(function(f) { return !f.startsWith('.'); });
}

function section(title) {
  console.log('\n' + '='.repeat(50));
  console.log('  ' + title);
  console.log('='.repeat(50));
}

function ok(msg)   { console.log('  ✓  ' + msg); }
function warn(msg) { console.log('  ⚠  ' + msg); }
function info(msg) { console.log('     ' + msg); }

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  var sheets = google.sheets({ version: 'v4', auth });

  // --- Read Sheets ---
  var charRows = await readTab(sheets, 'Characters');
  var characters = rowsToObjects(charRows);

  var factionRows = await readTab(sheets, 'Factions');
  var factions = rowsToObjects(factionRows);

  // --- CHARACTER ASSETS ---
  section('CHARACTER ASSETS  (assets/characters/)');
  info('Expected files: profile.png, cutout.png');

  var charSlugs = getSlugsInFolder('characters');
  var charSlugSet = new Set(charSlugs);

  // Check each character in Sheets
  characters.forEach(function(c) {
    if (!c.character_name) return;
    var slug = c.asset_slug;
    if (!slug) {
      warn(c.character_name + ' — no asset_slug set in Sheets');
    } else if (!charSlugSet.has(slug)) {
      warn(c.character_name + ' — asset_slug is "' + slug + '" but folder assets/characters/' + slug + '/ does not exist');
    } else {
      var files = getFilesInSlugFolder('characters', slug);
      var hasProfile = files.indexOf('profile.png') !== -1;
      var hasCutout = files.indexOf('cutout.png') !== -1;
      var status = c.character_name + ' (' + slug + ')';
      ok(status);
      info('profile.png: ' + (hasProfile ? 'YES' : 'MISSING'));
      info('cutout.png:  ' + (hasCutout ? 'YES' : 'missing (needed for Bliink composing)'));
    }
  });

  // Check for slug folders that aren't referenced in Sheets
  charSlugs.forEach(function(slug) {
    var match = characters.find(function(c) { return c.asset_slug === slug; });
    if (!match) {
      warn('assets/characters/' + slug + '/ exists but no character in Sheets has asset_slug="' + slug + '"');
    }
  });

  // --- FACTION ASSETS ---
  section('FACTION ASSETS  (assets/factions/)');
  info('Expected file: banner.png');

  var factionSlugs = getSlugsInFolder('factions');
  var factionSlugSet = new Set(factionSlugs);

  factions.forEach(function(f) {
    if (!f.faction_name) return;
    var slug = f.asset_slug;
    if (!slug) {
      warn(f.faction_name + ' — no asset_slug set in Sheets');
    } else if (!factionSlugSet.has(slug)) {
      warn(f.faction_name + ' — asset_slug is "' + slug + '" but folder assets/factions/' + slug + '/ does not exist');
    } else {
      var files = getFilesInSlugFolder('factions', slug);
      var hasBanner = files.indexOf('banner.png') !== -1;
      ok(f.faction_name + ' (' + slug + ')');
      info('banner.png: ' + (hasBanner ? 'YES' : 'MISSING'));
    }
  });

  factionSlugs.forEach(function(slug) {
    var match = factions.find(function(f) { return f.asset_slug === slug; });
    if (!match) {
      warn('assets/factions/' + slug + '/ exists but no faction in Sheets has asset_slug="' + slug + '"');
    }
  });

  // --- PLACE ASSETS ---
  section('PLACE ASSETS  (assets/places/)');
  info('Used as backgrounds in Bliink posts. No Sheets reference needed.');

  var placeSlugs = getSlugsInFolder('places');
  if (placeSlugs.length === 0) {
    info('No place assets yet.');
  } else {
    placeSlugs.forEach(function(slug) {
      var files = getFilesInSlugFolder('places', slug);
      ok(slug + ' — files: ' + files.join(', '));
    });
  }

  // --- SUMMARY ---
  section('WORKFLOW REMINDER');
  info('New character image:  assets/characters/{slug}/profile.png');
  info('New character cutout: assets/characters/{slug}/cutout.png');
  info('New faction image:    assets/factions/{slug}/banner.png');
  info('New place/background: assets/places/{slug}/background.png');
  info('');
  info('After adding files: set asset_slug in Sheets, then git push.');
  info('Run this script anytime to check what is wired up vs missing.');
  console.log('');
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
