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
// MESSAGING
// -----------------------------------------------

// Get inbox — list of unique conversations for a player
// Returns the most recent message from each conversation
async function handleGetInbox(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Messages');
  var allMessages = rowsToObjects(rows);
  var heroName = data.heroName;

  // Find all messages to or from this player
  var myMessages = allMessages.filter(function(msg) {
    return msg.from_character === heroName || msg.to_character === heroName;
  });

  // Group by the other person in the conversation
  var threads = {};
  myMessages.forEach(function(msg) {
    var otherPerson = msg.from_character === heroName ? msg.to_character : msg.from_character;
    if (!threads[otherPerson]) {
      threads[otherPerson] = { contact: otherPerson, lastMessage: msg, unread: 0 };
    }
    // Keep the most recent message
    if (new Date(msg.timestamp) > new Date(threads[otherPerson].lastMessage.timestamp)) {
      threads[otherPerson].lastMessage = msg;
    }
    // Count unread messages sent TO this player
    if (msg.to_character === heroName && msg.read !== 'yes') {
      threads[otherPerson].unread++;
    }
  });

  // Convert to array and sort by most recent
  var threadList = Object.values(threads);
  threadList.sort(function(a, b) {
    return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
  });

  return { success: true, threads: threadList };
}

// Get a full conversation thread between two characters
async function handleGetThread(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Messages');
  var allMessages = rowsToObjects(rows);
  var heroName = data.heroName;
  var contactName = data.contactName;

  var thread = allMessages.filter(function(msg) {
    return (msg.from_character === heroName && msg.to_character === contactName) ||
           (msg.from_character === contactName && msg.to_character === heroName);
  });

  // Sort oldest first (conversation order)
  thread.sort(function(a, b) {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  // Mark unread messages as read
  // Find row indices of unread messages TO this player
  var headers = rows[0];
  var fromCol = headers.indexOf('from_character');
  var toCol = headers.indexOf('to_character');
  var readCol = headers.indexOf('read');

  var updates = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][fromCol] === contactName &&
        rows[i][toCol] === heroName &&
        rows[i][readCol] !== 'yes') {
      updates.push({
        range: 'Messages!' + String.fromCharCode(65 + readCol) + (i + 1),
        values: [['yes']]
      });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
  }

  return { success: true, messages: thread };
}

// Send a message
async function handleSendMessage(data) {
  var sheets = getSheets();

  if (!data.from || !data.to || !data.body) {
    return { success: false, error: 'Missing required fields.' };
  }

  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Messages!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [[data.from, data.to, data.body, timestamp, 'no']] }
  });

  // Auto-add to contacts if not already there
  var contactRows = await readTab(sheets, 'Contacts');
  var alreadyContact = false;
  for (var i = 1; i < contactRows.length; i++) {
    if (contactRows[i][0] === data.from && contactRows[i][1] === data.to) {
      alreadyContact = true;
      break;
    }
  }
  if (!alreadyContact) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contacts!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [[data.from, data.to]] }
    });
  }

  return { success: true };
}

// Get a player's contacts list
async function handleGetContacts(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Contacts');
  var heroName = data.heroName;

  var contacts = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === heroName) {
      contacts.push(rows[i][1]);
    }
  }

  return { success: true, contacts: contacts };
}

// Add a contact
async function handleAddContact(data) {
  var sheets = getSheets();

  if (!data.heroName || !data.contactName) {
    return { success: false, error: 'Missing required fields.' };
  }

  // Check if already a contact
  var rows = await readTab(sheets, 'Contacts');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.heroName && rows[i][1] === data.contactName) {
      return { success: true, alreadyExists: true };
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Contacts!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [[data.heroName, data.contactName]] }
  });

  return { success: true };
}

// Get a faction's public profile + member list if members are public
async function handleGetFaction(data) {
  var sheets = getSheets();
  var factionRows = await readTab(sheets, 'Factions');
  var factions = rowsToObjects(factionRows);

  var faction = factions.find(function(f) {
    return f.faction_name === data.factionName;
  });

  if (!faction) {
    return { success: false, error: 'Faction not found.' };
  }

  var result = { success: true, faction: faction };

  // Only include member list if the faction has members_public = yes
  if (faction.members_public === 'yes') {
    var charRows = await readTab(sheets, 'Characters');
    var characters = rowsToObjects(charRows);
    result.members = characters
      .filter(function(c) {
        return c.faction === data.factionName && c.profile_visible === 'yes';
      })
      .map(function(c) { return c.character_name; });
  }

  return result;
}

// Get a character's public profile
async function handleGetCharacter(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Characters');
  var allCharacters = rowsToObjects(rows);

  var character = allCharacters.find(function(c) {
    return c.character_name === data.characterName && c.profile_visible === 'yes';
  });

  if (!character) {
    return { success: false, error: 'Character not found.' };
  }

  return { success: true, character: character };
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
    else if (action === 'getInbox') result = await handleGetInbox(data);
    else if (action === 'getThread') result = await handleGetThread(data);
    else if (action === 'sendMessage') result = await handleSendMessage(data);
    else if (action === 'getContacts') result = await handleGetContacts(data);
    else if (action === 'addContact') result = await handleAddContact(data);
    else if (action === 'getCharacter') result = await handleGetCharacter(data);
    else if (action === 'getFaction') result = await handleGetFaction(data);
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
