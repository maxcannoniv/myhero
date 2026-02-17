// Netlify Function — replaces Google Apps Script
// Handles all API requests: login, register, getHeroData, getFeed, createPost
// Reads/writes to Google Sheets via service account

const { google } = require('googleapis');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';

// Get Google Sheets client using service account credentials
// stored in Netlify environment variable
function getSheets() {
  var creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  var auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Helper — read all data from a tab
async function readTab(sheets, tabName) {
  var result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: tabName + '!A:Z',
  });
  return result.data.values || [];
}

// Helper — turn rows into objects using headers
function rowsToObjects(data) {
  if (data.length < 2) return [];
  var headers = data[0];
  var objects = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j] !== undefined ? data[i][j] : '';
    }
    objects.push(obj);
  }
  return objects;
}

// -----------------------------------------------
// HANDLERS
// -----------------------------------------------

async function handleLogin(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Players');
  if (rows.length < 2) return { success: false, error: 'No players found.' };

  var headers = rows[0];
  var usernameCol = headers.indexOf('username');
  var passwordCol = headers.indexOf('password_hash');

  if (usernameCol === -1 || passwordCol === -1) {
    return { success: false, error: 'Sheet is missing required columns.' };
  }

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[usernameCol].toString().toLowerCase() === data.username.toLowerCase()) {
      if (row[passwordCol] === data.passwordHash) {
        var hero = {};
        for (var j = 0; j < headers.length; j++) {
          if (headers[j] !== 'password_hash') {
            hero[headers[j]] = row[j];
          }
        }
        return { success: true, hero: hero };
      } else {
        return { success: false, error: 'Incorrect password.' };
      }
    }
  }

  return { success: false, error: 'Username not found.' };
}

async function handleGetHeroData(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Players');
  if (rows.length < 2) return { success: false, error: 'No players found.' };

  var headers = rows[0];
  var usernameCol = headers.indexOf('username');

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[usernameCol].toString().toLowerCase() === data.username.toLowerCase()) {
      var hero = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j] !== 'password_hash') {
          hero[headers[j]] = row[j];
        }
      }
      return { success: true, hero: hero };
    }
  }

  return { success: false, error: 'Hero not found.' };
}

async function handleRegister(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Players');
  var headers = rows[0];
  var usernameCol = headers.indexOf('username');

  // Check if username exists
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][usernameCol].toString().toLowerCase() === data.username.toLowerCase()) {
      return { success: false, error: 'Username already taken.' };
    }
  }

  // Class starting defaults
  var CLASS_FOLLOWERS = {
    'Hero': 100, 'Celebrity': 1000, 'Politician': 100, 'Sleuth': 100,
    'Tycoon': 100, 'Visionary': 100, 'Mogul': 1000, 'Mercenary': 100,
    'Champion': 1000, 'Philanthropist': 500
  };

  var CLASS_AUTHORITY = {
    'Hero': 'F', 'Celebrity': 'F', 'Politician': 'E', 'Sleuth': 'F',
    'Tycoon': 'F', 'Visionary': 'F', 'Mogul': 'E', 'Mercenary': 'F',
    'Champion': 'F', 'Philanthropist': 'E'
  };

  var commerce = (data.skills && data.skills.commerce) ? data.skills.commerce : 3;
  var startingBank = 3000 + (Math.max(0, commerce - 3) * 1000);
  var startingFollowers = CLASS_FOLLOWERS[data.heroClass] || 100;
  var startingAuthority = CLASS_AUTHORITY[data.heroClass] || 'F';

  // Build row in header order
  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    var col = headers[j];
    if (col === 'username') newRow.push(data.username);
    else if (col === 'password_hash') newRow.push(data.passwordHash);
    else if (col === 'hero_name') newRow.push(data.heroName);
    else if (col === 'class') newRow.push(data.heroClass);
    else if (col === 'followers') newRow.push(startingFollowers);
    else if (col === 'bank') newRow.push(startingBank);
    else if (col === 'positional_authority') newRow.push(startingAuthority);
    else if (col === 'faction') newRow.push('Independent');
    else if (data.skills && data.skills[col] !== undefined) newRow.push(data.skills[col]);
    else newRow.push('');
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Players!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] }
  });

  // Build hero object to return
  var hero = {};
  for (var k = 0; k < headers.length; k++) {
    if (headers[k] !== 'password_hash') {
      hero[headers[k]] = newRow[k];
    }
  }

  return { success: true, hero: hero };
}

async function handleGetFeed(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Feeds');
  var allPosts = rowsToObjects(rows);

  var posts = allPosts.filter(function(post) {
    return post.feed === data.feed && post.visible === 'yes';
  });

  // Sort newest first
  posts.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return { success: true, posts: posts };
}

async function handleCreatePost(data) {
  var sheets = getSheets();

  if (!data.feed || !data.posted_by || !data.body) {
    return { success: false, error: 'Missing required fields.' };
  }

  if (data.feed === 'bliink' && !data.image_url) {
    return { success: false, error: 'Bliink posts require an image.' };
  }

  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  var newRow = [
    data.feed,
    data.posted_by,
    data.posted_by_type || 'character',
    data.title || '',
    data.image_url || '',
    data.body,
    timestamp,
    'yes'
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feeds!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] }
  });

  return { success: true };
}

// -----------------------------------------------
// MAIN HANDLER — routes requests to the right function
// -----------------------------------------------

exports.handler = async function(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed.' })
    };
  }

  try {
    var request = JSON.parse(event.body);
    var action = request.action;
    var data = request.data;
    var result;

    if (action === 'login') result = await handleLogin(data);
    else if (action === 'getHeroData') result = await handleGetHeroData(data);
    else if (action === 'register') result = await handleRegister(data);
    else if (action === 'getFeed') result = await handleGetFeed(data);
    else if (action === 'createPost') result = await handleCreatePost(data);
    else result = { success: false, error: 'Unknown action: ' + action };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: false, error: 'Server error. Try again.' })
    };
  }
};
