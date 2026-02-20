// process-assets.js — Drop folder processor
// Run with: node process-assets.js
//
// HOW TO USE:
//   1. Drop image files into the right _drop/ subfolder:
//        _drop/characters/   → character profile headshots
//        _drop/cutouts/      → character transparent cutouts (for Bliink)
//        _drop/factions/     → faction banner images
//        _drop/places/       → background scenes for Bliink posts
//
//   2. Name the file after the character, faction, or place.
//      Spaces and capitals are fine — the script handles the rest.
//        e.g.  "Aurora Edge.png"  →  slug: aurora-edge
//              "Mongrel's Towing.png"  →  slug: mongrels-towing
//
//   3. Run: node process-assets.js
//
//   4. git push
//
// The script will:
//   - Move files into assets/ with the correct folder + filename
//   - Update asset_slug in Google Sheets (Characters + Factions tabs)
//   - Update BLIINK_CUTOUTS and BLIINK_BACKGROUNDS in dashboard.js
//   - Clear the _drop/ folders
//   - Print a full summary

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const ASSETS_DIR = path.join(__dirname, 'assets');
const DROP_DIR = path.join(__dirname, '_drop');
const DASHBOARD_JS = path.join(__dirname, 'js', 'dashboard.js');

// -----------------------------------------------
// SLUG HELPERS
// -----------------------------------------------

// Convert a filename to a clean slug
// "Aurora Edge.png"  →  "aurora-edge"
// "Mongrel's Towing.png"  →  "mongrels-towing"
function toSlug(filename) {
  return path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/'/g, '')        // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // spaces and special chars → hyphens
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

// Convert a slug back to a display label
// "aurora-edge"  →  "Aurora Edge"
function slugToLabel(slug) {
  return slug.split('-').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Get the original filename without extension as a display label
// "Aurora Edge.png"  →  "Aurora Edge"
function filenameToLabel(filename) {
  return path.basename(filename, path.extname(filename));
}

// -----------------------------------------------
// FILE HELPERS
// -----------------------------------------------

function getDropFiles(subfolder) {
  var dir = path.join(DROP_DIR, subfolder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function(f) {
    return !f.startsWith('.') && /\.(png|jpg|jpeg|gif|webp)$/i.test(f);
  });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// -----------------------------------------------
// SHEETS HELPERS
// -----------------------------------------------

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

// Set asset_slug for a row in Sheets where a column matches a value
async function setSlugInSheet(sheets, tabName, matchCol, matchVal, slugCol, slugVal) {
  var rows = await readTab(sheets, tabName);
  if (rows.length < 2) return false;

  var headers = rows[0];
  var matchColIdx = headers.indexOf(matchCol);
  var slugColIdx = headers.indexOf(slugCol);

  if (matchColIdx === -1) {
    console.log('  WARNING: column "' + matchCol + '" not found in ' + tabName + ' tab');
    return false;
  }

  if (slugColIdx === -1) {
    // Column doesn't exist yet — add it as a new header
    slugColIdx = headers.length;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: tabName + '!A1:Z1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers.concat([slugCol])] }
    });
    console.log('  Added "' + slugCol + '" column to ' + tabName + ' tab');
  }

  // Find the row that matches
  for (var i = 1; i < rows.length; i++) {
    if ((rows[i][matchColIdx] || '').toLowerCase() === matchVal.toLowerCase()) {
      var colLetter = String.fromCharCode(65 + slugColIdx); // A=65, B=66...
      var cellRef = tabName + '!' + colLetter + (i + 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: cellRef,
        valueInputOption: 'RAW',
        requestBody: { values: [[slugVal]] }
      });
      return true;
    }
  }

  return false; // No matching row found
}

// -----------------------------------------------
// DASHBOARD.JS UPDATER
// -----------------------------------------------

// Update BLIINK_CUTOUTS or BLIINK_BACKGROUNDS array in dashboard.js
function updateDashboardArray(arrayName, newEntry) {
  var content = fs.readFileSync(DASHBOARD_JS, 'utf8');

  // Find the closing bracket of the array
  var arrayStart = content.indexOf('var ' + arrayName + ' = [');
  if (arrayStart === -1) {
    console.log('  WARNING: Could not find ' + arrayName + ' in dashboard.js');
    return false;
  }

  var closingBracket = content.indexOf('];', arrayStart);
  if (closingBracket === -1) return false;

  // Check if this entry already exists
  if (content.indexOf(newEntry.url) !== -1) {
    return false; // Already present
  }

  // Insert new entry before the closing bracket
  var entryLine = '  { label: \'' + newEntry.label + '\', url: \'' + newEntry.url + '\' },\n';
  var updated = content.slice(0, closingBracket) + entryLine + content.slice(closingBracket);
  fs.writeFileSync(DASHBOARD_JS, updated, 'utf8');
  return true;
}

// -----------------------------------------------
// MAIN
// -----------------------------------------------

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  var sheets = google.sheets({ version: 'v4', auth });

  var processed = 0;
  var skipped = 0;
  var sheetUpdates = 0;
  var dashboardUpdates = 0;
  var warnings = [];

  // --- CHARACTERS (profile headshots) ---
  var charFiles = getDropFiles('characters');
  if (charFiles.length > 0) {
    console.log('\n── Characters (' + charFiles.length + ' file' + (charFiles.length !== 1 ? 's' : '') + ')');
  }
  for (var i = 0; i < charFiles.length; i++) {
    var file = charFiles[i];
    var label = filenameToLabel(file);
    var slug = toSlug(file);
    var src = path.join(DROP_DIR, 'characters', file);
    var destDir = path.join(ASSETS_DIR, 'characters', slug);
    var dest = path.join(destDir, 'profile.png');

    ensureDir(destDir);
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
    console.log('  ✓ ' + label + ' → assets/characters/' + slug + '/profile.png');

    // Update Sheets
    var found = await setSlugInSheet(sheets, 'Characters', 'character_name', label, 'asset_slug', slug);
    if (found) {
      console.log('    Sheets: asset_slug set to "' + slug + '" for ' + label);
      sheetUpdates++;
    } else {
      warnings.push('No character named "' + label + '" found in Sheets — add asset_slug manually');
    }

    processed++;
  }

  // --- CUTOUTS ---
  var cutoutFiles = getDropFiles('cutouts');
  if (cutoutFiles.length > 0) {
    console.log('\n── Cutouts (' + cutoutFiles.length + ' file' + (cutoutFiles.length !== 1 ? 's' : '') + ')');
  }
  for (var j = 0; j < cutoutFiles.length; j++) {
    var cfile = cutoutFiles[j];
    var clabel = filenameToLabel(cfile);
    var cslug = toSlug(cfile);
    var csrc = path.join(DROP_DIR, 'cutouts', cfile);
    var cdestDir = path.join(ASSETS_DIR, 'characters', cslug);
    var cdest = path.join(cdestDir, 'cutout.png');

    ensureDir(cdestDir);
    fs.copyFileSync(csrc, cdest);
    fs.unlinkSync(csrc);
    console.log('  ✓ ' + clabel + ' → assets/characters/' + cslug + '/cutout.png');

    // Add to BLIINK_CUTOUTS in dashboard.js
    var added = updateDashboardArray('BLIINK_CUTOUTS', {
      label: clabel,
      url: '/assets/characters/' + cslug + '/cutout.png'
    });
    if (added) {
      console.log('    dashboard.js: added to BLIINK_CUTOUTS');
      dashboardUpdates++;
    } else {
      console.log('    dashboard.js: already in BLIINK_CUTOUTS');
    }

    processed++;
  }

  // --- FACTIONS ---
  var factionFiles = getDropFiles('factions');
  if (factionFiles.length > 0) {
    console.log('\n── Factions (' + factionFiles.length + ' file' + (factionFiles.length !== 1 ? 's' : '') + ')');
  }
  for (var k = 0; k < factionFiles.length; k++) {
    var ffle = factionFiles[k];
    var flabel = filenameToLabel(ffle);
    var fslug = toSlug(ffle);
    var fsrc = path.join(DROP_DIR, 'factions', ffle);
    var fdestDir = path.join(ASSETS_DIR, 'factions', fslug);
    var fdest = path.join(fdestDir, 'banner.png');

    ensureDir(fdestDir);
    fs.copyFileSync(fsrc, fdest);
    fs.unlinkSync(fsrc);
    console.log('  ✓ ' + flabel + ' → assets/factions/' + fslug + '/banner.png');

    // Update Sheets
    var ffound = await setSlugInSheet(sheets, 'Factions', 'faction_name', flabel, 'asset_slug', fslug);
    if (ffound) {
      console.log('    Sheets: asset_slug set to "' + fslug + '" for ' + flabel);
      sheetUpdates++;
    } else {
      warnings.push('No faction named "' + flabel + '" found in Sheets — add asset_slug manually');
    }

    processed++;
  }

  // --- PLACES ---
  var placeFiles = getDropFiles('places');
  if (placeFiles.length > 0) {
    console.log('\n── Places (' + placeFiles.length + ' file' + (placeFiles.length !== 1 ? 's' : '') + ')');
  }
  for (var p = 0; p < placeFiles.length; p++) {
    var pfile = placeFiles[p];
    var plabel = filenameToLabel(pfile);
    var pslug = toSlug(pfile);
    var psrc = path.join(DROP_DIR, 'places', pfile);
    var pdestDir = path.join(ASSETS_DIR, 'places', pslug);
    var pdest = path.join(pdestDir, 'background.png');

    ensureDir(pdestDir);
    fs.copyFileSync(psrc, pdest);
    fs.unlinkSync(psrc);
    console.log('  ✓ ' + plabel + ' → assets/places/' + pslug + '/background.png');

    // Add to BLIINK_BACKGROUNDS in dashboard.js
    var padded = updateDashboardArray('BLIINK_BACKGROUNDS', {
      label: plabel,
      url: '/assets/places/' + pslug + '/background.png'
    });
    if (padded) {
      console.log('    dashboard.js: added to BLIINK_BACKGROUNDS');
      dashboardUpdates++;
    } else {
      console.log('    dashboard.js: already in BLIINK_BACKGROUNDS');
    }

    processed++;
  }

  // --- SUMMARY ---
  console.log('\n' + '='.repeat(50));
  if (processed === 0) {
    console.log('  No files found in _drop/ folders. Nothing to do.');
  } else {
    console.log('  Processed:        ' + processed + ' file' + (processed !== 1 ? 's' : ''));
    console.log('  Sheets updated:   ' + sheetUpdates + ' row' + (sheetUpdates !== 1 ? 's' : ''));
    console.log('  dashboard.js:     ' + dashboardUpdates + ' entr' + (dashboardUpdates !== 1 ? 'ies' : 'y') + ' added');
    if (warnings.length > 0) {
      console.log('\n  Warnings:');
      warnings.forEach(function(w) { console.log('  ⚠  ' + w); });
    }
    console.log('\n  Next step: git add -A && git push');
  }
  console.log('='.repeat(50) + '\n');
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
