// Netlify Function — replaces Google Apps Script
// Handles all API requests: login, register, getHeroData, getFeed, createPost
// Reads/writes to Google Sheets via service account

const { google } = require('googleapis');
const crypto = require('crypto');

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
// CYCLE HELPERS
// -----------------------------------------------

// Read current cycle number and start timestamp from the Settings tab.
// Returns { cycle: 1, cycleStart: '2026-02-19T...' }
// Falls back to cycle 1 with no start if Settings tab doesn't exist yet.
async function getCurrentCycle(sheets) {
  try {
    var rows = await readTab(sheets, 'Settings');
    var settings = {};
    for (var i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0]) {
        settings[rows[i][0]] = rows[i][1] || '';
      }
    }
    return {
      cycle: parseInt(settings['current_cycle']) || 1,
      cycleStart: settings['cycle_start'] || null
    };
  } catch (e) {
    // Settings tab doesn't exist yet — fail gracefully
    return { cycle: 1, cycleStart: null };
  }
}

// Compute the cycle_id string for a post created right now.
// Format: [cycle].[days].[hours].[10-min-block]
// Example: 1.00.00.0 = Cycle 1, just started
//          1.02.15.3 = Cycle 1, 2 days and 15 hours and 30-39 min since cycle started
function computeCycleId(cycle, cycleStart) {
  if (!cycleStart) return cycle + '.00.00.0';

  var start = new Date(cycleStart);
  var now = new Date();
  var elapsed = Math.max(0, now - start); // milliseconds, clamped to 0

  var totalMinutes = Math.floor(elapsed / (1000 * 60));
  var days = Math.floor(totalMinutes / (60 * 24));
  var hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  var minuteBlock = Math.floor((totalMinutes % 60) / 10); // 0-5

  return cycle + '.' +
    String(days).padStart(2, '0') + '.' +
    String(hours).padStart(2, '0') + '.' +
    minuteBlock;
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

  // Auto-create neutral reputation rows for this new player against all factions
  await addReputationRowsForPlayer(sheets, data.heroName);

  // Auto-create a Characters tab entry (profile_visible = no until DM activates)
  await addCharacterForNewPlayer(sheets, data.heroName, data.username, data.heroClass);

  // Build hero object to return
  var hero = {};
  for (var k = 0; k < headers.length; k++) {
    if (headers[k] !== 'password_hash') {
      hero[headers[k]] = newRow[k];
    }
  }

  return { success: true, hero: hero };
}

// Add neutral reputation rows for a new player against every faction.
// Called automatically on registration. Skips factions the player already has a row for.
async function addReputationRowsForPlayer(sheets, heroName) {
  var factionRows = await readTab(sheets, 'Factions');
  if (factionRows.length < 2) return;
  var factions = rowsToObjects(factionRows);

  // Check what reputation rows already exist for this player
  var repRows = await readTab(sheets, 'Reputation');
  var existing = new Set();
  if (repRows.length > 1) {
    var repObjects = rowsToObjects(repRows);
    repObjects.forEach(function(r) {
      if (r.hero_name === heroName) existing.add(r.faction_name);
    });
  }

  // Append one neutral row per faction that doesn't already have an entry
  var newRows = [];
  factions.forEach(function(f) {
    if (f.faction_name && !existing.has(f.faction_name)) {
      newRows.push([heroName, f.faction_name, 'neutral']);
    }
  });

  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reputation!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: newRows }
    });
  }
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

  // Stamp the current cycle onto this post
  var cycleInfo = await getCurrentCycle(sheets);
  var cycleId = computeCycleId(cycleInfo.cycle, cycleInfo.cycleStart);

  var newRow = [
    data.feed,
    data.posted_by,
    data.posted_by_type || 'character',
    data.title || '',
    data.image_url || '',
    data.body,
    timestamp,
    'yes',
    data.cutout_url || '',
    cycleId
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

  // Stamp the current cycle onto this message
  var cycleInfo = await getCurrentCycle(sheets);
  var cycleId = computeCycleId(cycleInfo.cycle, cycleInfo.cycleStart);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Messages!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [[data.from, data.to, data.body, timestamp, 'no', cycleId]] }
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
// Returns objects: { name, relation } — relation is blank if not set
async function handleGetContacts(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Contacts');
  var heroName = data.heroName;

  var headers = rows.length > 0 ? rows[0] : [];
  var relationCol = headers.indexOf('relation');

  var contacts = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === heroName) {
      var contactName = rows[i][1] || '';
      if (contactName) {
        var relation = (relationCol !== -1 && rows[i][relationCol]) ? rows[i][relationCol] : '';
        contacts.push({ name: contactName, relation: relation });
      }
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

// -----------------------------------------------
// MISSIONS
// -----------------------------------------------

// Get all visible missions with per-player state (available / submitted / resolved).
// For resolved missions, includes the outcome narrative + changes.
// option_weight is NEVER sent to the client — it's only used server-side in submitMission.
async function handleGetMissions(data) {
  var sheets = getSheets();
  var username = data.username;

  // Fetch missions and this player's submissions at the same time
  var results = await Promise.all([
    readTab(sheets, 'Missions'),
    readTab(sheets, 'MissionSubmissions')
  ]);
  var missions = rowsToObjects(results[0]);
  var submissions = rowsToObjects(results[1]);

  // Only show visible missions
  missions = missions.filter(function(m) { return m.visible === 'yes'; });

  // Build a map of mission_id -> submission for this player
  var playerSubs = {};
  submissions.forEach(function(s) {
    if (s.username === username) {
      playerSubs[s.mission_id] = s;
    }
  });

  // Attach state and outcome data to each mission
  var response = missions.map(function(m) {
    var sub = playerSubs[m.mission_id];
    var state = 'available';
    var outcomeData = null;
    var submissionInfo = null;

    if (sub) {
      if (sub.resolved === 'yes') {
        state = 'resolved';
        // dm_override takes priority over auto-computed bucket
        var bucket = (sub.dm_override && sub.dm_override.trim()) ? sub.dm_override.trim() : sub.outcome_bucket;
        if (bucket === 'a' || bucket === 'b' || bucket === 'c') {
          outcomeData = {
            label: m['outcome_' + bucket + '_label'] || 'Outcome',
            narrative: m['outcome_' + bucket + '_narrative'] || '',
            image: m['outcome_' + bucket + '_image'] || '',
            changes: m['outcome_' + bucket + '_changes'] || ''
          };
        }
      } else {
        state = 'submitted';
      }
      submissionInfo = { cycle_id: sub.cycle_id };
    }

    return {
      mission_id: m.mission_id,
      title: m.title,
      description: m.description,
      image_url: m.image_url,
      cycle_id: m.cycle_id,
      state: state,
      submission: submissionInfo,
      outcome: outcomeData
    };
  });

  return { success: true, missions: response };
}

// Get all questions + options for a mission.
// option_weight is stripped — never sent to the client.
async function handleGetMissionQuestions(data) {
  var sheets = getSheets();
  var missionId = data.missionId;

  if (!missionId) {
    return { success: false, error: 'Missing missionId.' };
  }

  var rows = await readTab(sheets, 'MissionQuestions');
  var allRows = rowsToObjects(rows);

  var questions = allRows
    .filter(function(q) { return q.mission_id === missionId; })
    .map(function(q) {
      // Return all fields EXCEPT option_weight
      return {
        mission_id: q.mission_id,
        question_num: q.question_num,
        question_text: q.question_text,
        option_id: q.option_id,
        option_text: q.option_text,
        option_image: q.option_image,
        option_flavor: q.option_flavor,
        option_skill_check: q.option_skill_check || ''
        // option_weight intentionally excluded
      };
    });

  return { success: true, questions: questions };
}

// Record a player's mission answers, compute the outcome bucket, and write to MissionSubmissions.
async function handleSubmitMission(data) {
  var sheets = getSheets();

  if (!data.username || !data.heroName || !data.missionId || !data.answers || data.answers.length === 0) {
    return { success: false, error: 'Missing required fields.' };
  }

  // Prevent duplicate submissions
  var subRows = await readTab(sheets, 'MissionSubmissions');
  var existing = rowsToObjects(subRows);
  var alreadySubmitted = existing.some(function(s) {
    return s.username === data.username && s.mission_id === data.missionId;
  });
  if (alreadySubmitted) {
    return { success: false, error: 'Already submitted.' };
  }

  // Fetch questions to get option_weight values
  var qRows = await readTab(sheets, 'MissionQuestions');
  var allQuestions = rowsToObjects(qRows);
  var missionQuestions = allQuestions.filter(function(q) {
    return q.mission_id === data.missionId;
  });

  // Map option_id -> option_weight
  var weightMap = {};
  missionQuestions.forEach(function(q) {
    if (q.option_id) weightMap[q.option_id] = q.option_weight;
  });

  // Count weights across all answers
  var counts = { a: 0, b: 0, c: 0 };
  data.answers.forEach(function(answerId) {
    var w = weightMap[answerId];
    if (w === 'a') counts.a++;
    else if (w === 'b') counts.b++;
    else if (w === 'c') counts.c++;
  });

  // Majority wins. Ties: a beats b beats c.
  var bucket = 'a';
  if (counts.b > counts.a && counts.b >= counts.c) bucket = 'b';
  else if (counts.c > counts.a && counts.c > counts.b) bucket = 'c';

  var submissionId = 'sub-' + Date.now();
  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  var cycleInfo = await getCurrentCycle(sheets);
  var cycleId = computeCycleId(cycleInfo.cycle, cycleInfo.cycleStart);

  // Pad answers to 5 slots (q1–q5 columns)
  var answers = data.answers.slice(0, 5);
  while (answers.length < 5) answers.push('');

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MissionSubmissions!A:A',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        submissionId,
        data.username,
        data.heroName,
        data.missionId,
        answers[0], answers[1], answers[2], answers[3], answers[4],
        bucket,
        '',    // dm_override — DM fills this in Sheets if needed
        'no',  // resolved — DM changes to 'yes' after review
        cycleId,
        timestamp
      ]]
    }
  });

  return { success: true };
}

// Get a character's public profile
// If data.heroName is provided, also includes the player's relation to this character (if set).
async function handleGetCharacter(data) {
  var sheets = getSheets();
  var [charRows, contactRows] = await Promise.all([
    readTab(sheets, 'Characters'),
    data.heroName ? readTab(sheets, 'Contacts') : Promise.resolve([]),
  ]);
  var allCharacters = rowsToObjects(charRows);

  var character = allCharacters.find(function(c) {
    return c.character_name === data.characterName && c.profile_visible === 'yes';
  });

  if (!character) {
    return { success: false, error: 'Character not found.' };
  }

  // Strip internal fields — players must not be able to tell player from NPC
  var safe = Object.assign({}, character);
  delete safe.type;
  delete safe.username;

  // If the player's hero name was provided, look up their personal relation to this character
  if (data.heroName && contactRows.length > 0) {
    var contactHeaders = contactRows[0];
    var relationCol = contactHeaders.indexOf('relation');
    if (relationCol !== -1) {
      for (var i = 1; i < contactRows.length; i++) {
        if (contactRows[i][0] === data.heroName && contactRows[i][1] === data.characterName) {
          safe.relation = contactRows[i][relationCol] || '';
          break;
        }
      }
    }
  }

  return { success: true, character: safe };
}

// -----------------------------------------------
// ADMIN HELPERS
// -----------------------------------------------

// Verify that a request includes the correct admin token.
// The token is sha256(ADMIN_PASSWORD). Set ADMIN_PASSWORD in Netlify env vars.
function verifyAdmin(data) {
  if (!process.env.ADMIN_PASSWORD) return false;
  var expected = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
  return data.adminToken === expected;
}

// Convert a 0-based column index to a Sheets column letter (A, B, ..., Z, AA, AB, ...).
// Works up to column ZZ (702 columns) which is far more than we'll ever need.
function colNumToLetter(n) {
  var s = '';
  n = n + 1; // convert to 1-based
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// Create a Characters tab row for a newly registered player.
// Sets profile_visible = no so the DM controls when the character appears in-world.
// Reads actual tab headers so it works even if columns were added via admin portal.
async function addCharacterForNewPlayer(sheets, heroName, username, heroClass) {
  var rows = await readTab(sheets, 'Characters');
  if (rows.length < 1) return; // tab missing, skip silently

  var headers = rows[0];
  var nameCol = headers.indexOf('character_name');

  // Don't duplicate if somehow already exists
  if (nameCol !== -1) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][nameCol] === heroName) return;
    }
  }

  var charData = {
    character_name: heroName,
    type: 'player',
    username: username,
    class: heroClass,
    profile_visible: 'no'
  };

  var newRow = headers.map(function(h) {
    return charData[h] !== undefined ? charData[h] : '';
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Characters!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] }
  });
}

// Add neutral reputation rows for ALL existing players against a newly created faction.
// Called automatically when adminSaveFaction creates a new faction.
async function addReputationRowsForFaction(sheets, factionName) {
  var playerRows = await readTab(sheets, 'Players');
  if (playerRows.length < 2) return;
  var players = rowsToObjects(playerRows);

  // Find which players already have a reputation row for this faction
  var repRows = await readTab(sheets, 'Reputation');
  var existing = new Set();
  if (repRows.length > 1) {
    rowsToObjects(repRows).forEach(function(r) {
      if (r.faction_name === factionName) existing.add(r.hero_name);
    });
  }

  var newRows = [];
  players.forEach(function(p) {
    if (p.hero_name && !existing.has(p.hero_name)) {
      newRows.push([p.hero_name, factionName, 'neutral']);
    }
  });

  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reputation!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: newRows }
    });
  }
}

// -----------------------------------------------
// PLAYER-ACCESSIBLE ENDPOINTS (no admin token needed)
// -----------------------------------------------

// Return all characters where profile_visible = yes (for Bliink cutout picker, etc.)
async function handleGetCharacters(data) {
  var sheets = getSheets();
  var rows = await readTab(sheets, 'Characters');
  var all = rowsToObjects(rows);
  var visible = all.filter(function(c) { return c.profile_visible === 'yes'; });

  // Strip internal fields — players must not be able to tell player from NPC
  visible = visible.map(function(c) {
    var safe = Object.assign({}, c);
    delete safe.type;
    delete safe.username;
    return safe;
  });

  return { success: true, characters: visible };
}

// Return all places from the Places tab (for Bliink background picker)
async function handleGetPlaces(data) {
  var sheets = getSheets();
  try {
    var rows = await readTab(sheets, 'Places');
    return { success: true, places: rowsToObjects(rows) };
  } catch (e) {
    return { success: true, places: [] };
  }
}

// -----------------------------------------------
// ADMIN HANDLERS
// -----------------------------------------------

async function handleAdminLogin(data) {
  var adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) {
    return { success: false, error: 'ADMIN_PASSWORD environment variable is not set.' };
  }
  var expectedHash = crypto.createHash('sha256').update(adminPassword).digest('hex');
  if (data.passwordHash === expectedHash) {
    return { success: true, token: expectedHash };
  }
  return { success: false, error: 'Incorrect password.' };
}

async function handleAdminGetOverview(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var [playerRows, msgRows, subRows, charRows] = await Promise.all([
    readTab(sheets, 'Players'),
    readTab(sheets, 'Messages'),
    readTab(sheets, 'MissionSubmissions'),
    readTab(sheets, 'Characters'),
  ]);

  var playerCount = Math.max(0, playerRows.length - 1);

  // Get NPC names to find unread messages sent to NPCs
  var npcs = new Set();
  if (charRows.length > 1) {
    rowsToObjects(charRows).forEach(function(c) {
      if (c.type === 'npc') npcs.add(c.character_name);
    });
  }

  var unreadNpcMessages = 0;
  if (msgRows.length > 1) {
    rowsToObjects(msgRows).forEach(function(m) {
      if (npcs.has(m.to_character) && m.read !== 'yes') unreadNpcMessages++;
    });
  }

  var pendingMissions = 0;
  if (subRows.length > 1) {
    rowsToObjects(subRows).forEach(function(s) {
      if (s.resolved !== 'yes') pendingMissions++;
    });
  }

  var cycleInfo = await getCurrentCycle(sheets);

  return {
    success: true,
    playerCount: playerCount,
    unreadNpcMessages: unreadNpcMessages,
    pendingMissions: pendingMissions,
    currentCycle: cycleInfo.cycle
  };
}

// Returns all NPC conversations, organized as: NPC → list of threads with other characters.
async function handleAdminGetNPCInbox(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var [charRows, msgRows] = await Promise.all([
    readTab(sheets, 'Characters'),
    readTab(sheets, 'Messages'),
  ]);

  var npcs = new Set();
  if (charRows.length > 1) {
    rowsToObjects(charRows).forEach(function(c) {
      if (c.type === 'npc') npcs.add(c.character_name);
    });
  }

  // For each NPC, build a map of { otherPerson: { messages, unreadCount } }
  var npcMap = {};
  npcs.forEach(function(name) {
    npcMap[name] = { conversations: {}, totalUnread: 0 };
  });

  if (msgRows.length > 1) {
    rowsToObjects(msgRows).forEach(function(m) {
      var npcName = null;
      var otherPerson = null;

      if (npcs.has(m.to_character)) {
        npcName = m.to_character;
        otherPerson = m.from_character;
      } else if (npcs.has(m.from_character)) {
        npcName = m.from_character;
        otherPerson = m.to_character;
      }

      if (!npcName || !otherPerson) return;
      if (!npcMap[npcName]) npcMap[npcName] = { conversations: {}, totalUnread: 0 };

      if (!npcMap[npcName].conversations[otherPerson]) {
        npcMap[npcName].conversations[otherPerson] = { with: otherPerson, messages: [], unreadCount: 0 };
      }

      npcMap[npcName].conversations[otherPerson].messages.push(m);

      // Only count messages sent TO the NPC (not from the NPC) as "unread"
      if (m.to_character === npcName && m.read !== 'yes') {
        npcMap[npcName].conversations[otherPerson].unreadCount++;
        npcMap[npcName].totalUnread++;
      }
    });
  }

  // Sort messages in each thread chronologically, conversations by most recent
  var result = Object.keys(npcMap).map(function(npcName) {
    var npc = npcMap[npcName];
    var convs = Object.values(npc.conversations);
    convs.forEach(function(conv) {
      conv.messages.sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
    });
    convs.sort(function(a, b) {
      var lastA = a.messages[a.messages.length - 1] || {};
      var lastB = b.messages[b.messages.length - 1] || {};
      return new Date(lastB.timestamp) - new Date(lastA.timestamp);
    });
    return { npcName: npcName, conversations: convs, totalUnread: npc.totalUnread };
  });

  result.sort(function(a, b) { return b.totalUnread - a.totalUnread; });
  result = result.filter(function(n) { return n.conversations.length > 0; });

  return { success: true, inbox: result };
}

// Send a message as any NPC. Does not add to Contacts (NPC doesn't have contacts).
async function handleAdminSendMessage(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.from || !data.to || !data.body) {
    return { success: false, error: 'Missing required fields: from, to, body.' };
  }

  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  var cycleInfo = await getCurrentCycle(sheets);
  var cycleId = computeCycleId(cycleInfo.cycle, cycleInfo.cycleStart);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Messages!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [[data.from, data.to, data.body, timestamp, 'no', cycleId]] }
  });

  return { success: true };
}

// Get all posts including drafts. Includes _row field so adminUpdatePost can target the right row.
async function handleAdminGetAllPosts(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Feeds');
  if (rows.length < 2) return { success: true, posts: [] };

  var headers = rows[0];
  var posts = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
    }
    obj._row = i + 1; // 1-based row number in Sheets (row 1 = header)
    posts.push(obj);
  }

  posts.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  return { success: true, posts: posts };
}

// Create a post from the admin portal. Supports visible=no for drafts.
async function handleAdminCreatePost(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.feed || !data.posted_by || !data.body) {
    return { success: false, error: 'Missing required fields: feed, posted_by, body.' };
  }

  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  var cycleInfo = await getCurrentCycle(sheets);
  var cycleId = computeCycleId(cycleInfo.cycle, cycleInfo.cycleStart);

  var newRow = [
    data.feed,
    data.posted_by,
    data.posted_by_type || 'character',
    data.title || '',
    data.image_url || '',
    data.body,
    timestamp,
    data.visible !== undefined ? data.visible : 'yes',
    data.cutout_url || '',
    cycleId
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feeds!A:A',
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] }
  });

  return { success: true };
}

// Toggle the visible field of a post. data.row = 1-based Sheets row number.
async function handleAdminUpdatePost(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.row || data.visible === undefined) {
    return { success: false, error: 'Missing row or visible field.' };
  }

  var rows = await readTab(sheets, 'Feeds');
  if (rows.length < 1) return { success: false, error: 'Feeds tab not found.' };

  var visibleCol = rows[0].indexOf('visible');
  if (visibleCol === -1) return { success: false, error: 'No visible column in Feeds.' };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feeds!' + colNumToLetter(visibleCol) + data.row,
    valueInputOption: 'RAW',
    requestBody: { values: [[data.visible]] }
  });

  return { success: true };
}

// Get all mission submissions with mission title info for context.
async function handleAdminGetMissionSubmissions(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var [subRows, missionRows] = await Promise.all([
    readTab(sheets, 'MissionSubmissions'),
    readTab(sheets, 'Missions'),
  ]);

  if (subRows.length < 2) return { success: true, submissions: [], missions: [] };

  var headers = subRows[0];
  var submissions = [];
  for (var i = 1; i < subRows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = subRows[i][j] !== undefined ? subRows[i][j] : '';
    }
    obj._row = i + 1;
    submissions.push(obj);
  }

  var missions = rowsToObjects(missionRows);
  return { success: true, submissions: submissions, missions: missions };
}

// Apply pipe-separated outcome_changes string after a mission is resolved.
// Supported effects: bank:+/-N, contacts:add:Name, relation:Name:value,
// inventory:Name:qty:category, reputation:faction-name:value,
// message:From Name:message body text
async function applyMissionOutcomeChanges(sheets, username, heroName, changesStr) {
  var effects = changesStr.split('|');

  for (var i = 0; i < effects.length; i++) {
    var effect = effects[i].trim();
    if (!effect) continue;

    var parts = effect.split(':');
    var type = parts[0];

    if (type === 'bank') {
      var delta = parseInt(parts[1]);
      if (isNaN(delta)) continue;
      var playerRows = await readTab(sheets, 'Players');
      var ph = playerRows[0];
      var puCol = ph.indexOf('username');
      var pbCol = ph.indexOf('bank');
      if (puCol === -1 || pbCol === -1) continue;
      for (var j = 1; j < playerRows.length; j++) {
        if (playerRows[j][puCol] === username) {
          var newBank = (parseInt(playerRows[j][pbCol]) || 0) + delta;
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: { valueInputOption: 'RAW', data: [
              { range: 'Players!' + colNumToLetter(pbCol) + (j + 1), values: [[newBank]] }
            ]}
          });
          break;
        }
      }

    } else if (type === 'contacts' && parts[1] === 'add') {
      var contactName = parts.slice(2).join(':');
      var cRows = await readTab(sheets, 'Contacts');
      var ch = cRows[0];
      var cheroCol = ch.indexOf('hero_name');
      var cnameCol = ch.indexOf('contact_name');
      if (cheroCol === -1 || cnameCol === -1) continue;
      var exists = false;
      for (var j = 1; j < cRows.length; j++) {
        if (cRows[j][cheroCol] === heroName && cRows[j][cnameCol] === contactName) {
          exists = true; break;
        }
      }
      if (!exists) {
        var newRow = ch.map(function(h) {
          if (h === 'hero_name') return heroName;
          if (h === 'contact_name') return contactName;
          return '';
        });
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Contacts!A:A',
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] }
        });
      }

    } else if (type === 'relation') {
      var relCharName = parts[1];
      var relValue = parts[2];
      var rRows = await readTab(sheets, 'Contacts');
      var rh = rRows[0];
      var rheroCol = rh.indexOf('hero_name');
      var rnameCol = rh.indexOf('contact_name');
      var rrelCol = rh.indexOf('relation');
      if (rheroCol === -1 || rnameCol === -1 || rrelCol === -1) continue;
      var targetRelRow = -1;
      for (var j = 1; j < rRows.length; j++) {
        if (rRows[j][rheroCol] === heroName && rRows[j][rnameCol] === relCharName) {
          targetRelRow = j + 1; break;
        }
      }
      if (targetRelRow !== -1) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: [
            { range: 'Contacts!' + colNumToLetter(rrelCol) + targetRelRow, values: [[relValue]] }
          ]}
        });
      }

    } else if (type === 'inventory') {
      var itemName = parts[1];
      var qty = parseInt(parts[2]) || 0;
      var category = parts[3] || '';
      var iRows = await readTab(sheets, 'Inventory');
      if (iRows.length < 1) continue;
      var ih = iRows[0];
      var iuCol = ih.indexOf('username');
      var iiCol = ih.indexOf('item_name');
      var iqCol = ih.indexOf('quantity');
      var icCol = ih.indexOf('category');
      if (iuCol === -1 || iiCol === -1 || iqCol === -1) continue;
      var targetInvRow = -1;
      for (var j = 1; j < iRows.length; j++) {
        if (iRows[j][iuCol] === username && iRows[j][iiCol] === itemName) {
          targetInvRow = j + 1; break;
        }
      }
      if (targetInvRow !== -1) {
        var invData = [{ range: 'Inventory!' + colNumToLetter(iqCol) + targetInvRow, values: [[qty]] }];
        if (icCol !== -1) invData.push({ range: 'Inventory!' + colNumToLetter(icCol) + targetInvRow, values: [[category]] });
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: invData }
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Inventory!A:A',
          valueInputOption: 'RAW',
          requestBody: { values: [[username, itemName, qty, category]] }
        });
      }

    } else if (type === 'reputation') {
      var repFaction = parts[1];
      var repValue = parts[2];
      var repRows = await readTab(sheets, 'Reputation');
      if (repRows.length < 1) continue;
      var reph = repRows[0];
      var repheroCol = reph.indexOf('hero_name');
      var repfactionCol = reph.indexOf('faction_name');
      var reprepCol = reph.indexOf('reputation');
      if (repheroCol === -1 || repfactionCol === -1 || reprepCol === -1) continue;
      var targetRepRow = -1;
      for (var j = 1; j < repRows.length; j++) {
        if (repRows[j][repheroCol] === heroName && repRows[j][repfactionCol] === repFaction) {
          targetRepRow = j + 1; break;
        }
      }
      if (targetRepRow !== -1) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: [
            { range: 'Reputation!' + colNumToLetter(reprepCol) + targetRepRow, values: [[repValue]] }
          ]}
        });
      }

    } else if (type === 'message') {
      // Send an automatic DM from an NPC to the player.
      // Effect format: message:From Name:message body text here
      // parts[1] = sender name, parts.slice(2).join(':') = body (allows colons in body)
      var msgFrom = parts[1];
      var msgBody = parts.slice(2).join(':');
      if (!msgFrom || !msgBody) continue;

      var now = new Date();
      var msgTimestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

      var msgCycleInfo = await getCurrentCycle(sheets);
      var msgCycleId = computeCycleId(msgCycleInfo.cycle, msgCycleInfo.cycleStart);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Messages!A:A',
        valueInputOption: 'RAW',
        requestBody: { values: [[msgFrom, heroName, msgBody, msgTimestamp, 'no', msgCycleId]] }
      });
    }
  }
}

// Set dm_override and/or resolved on a mission submission. Identified by submission_id.
async function handleAdminResolveMission(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.submissionId) return { success: false, error: 'Missing submissionId.' };

  var rows = await readTab(sheets, 'MissionSubmissions');
  if (rows.length < 2) return { success: false, error: 'No submissions found.' };

  var headers = rows[0];
  var idCol = headers.indexOf('submission_id');
  var dmOverrideCol = headers.indexOf('dm_override');
  var resolvedCol = headers.indexOf('resolved');
  var usernameCol = headers.indexOf('username');
  var heroNameCol = headers.indexOf('hero_name');
  var missionIdCol = headers.indexOf('mission_id');
  var outcomeBucketCol = headers.indexOf('outcome_bucket');

  if (idCol === -1) return { success: false, error: 'submission_id column not found.' };

  var targetRow = -1;
  var submissionRow = null;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === data.submissionId) {
      targetRow = i + 1;
      submissionRow = rows[i];
      break;
    }
  }

  if (targetRow === -1) return { success: false, error: 'Submission not found.' };

  // Guard: don't re-apply outcome changes if already resolved
  var alreadyResolved = resolvedCol !== -1 && submissionRow[resolvedCol] === 'yes';

  var updates = [];
  if (data.dmOverride !== undefined && dmOverrideCol !== -1) {
    updates.push({
      range: 'MissionSubmissions!' + colNumToLetter(dmOverrideCol) + targetRow,
      values: [[data.dmOverride]]
    });
  }
  if (data.resolved !== undefined && resolvedCol !== -1) {
    updates.push({
      range: 'MissionSubmissions!' + colNumToLetter(resolvedCol) + targetRow,
      values: [[data.resolved]]
    });
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates }
    });
  }

  // Auto-apply outcome changes the first time this submission is resolved
  if (data.resolved === 'yes' && !alreadyResolved && submissionRow) {
    var username = usernameCol !== -1 ? submissionRow[usernameCol] : null;
    var heroName = heroNameCol !== -1 ? submissionRow[heroNameCol] : null;
    var missionId = missionIdCol !== -1 ? submissionRow[missionIdCol] : null;
    // If dm_override is being set in this same call, use that; otherwise read from the row
    var dmOverrideValue = (data.dmOverride !== undefined) ? data.dmOverride
      : (dmOverrideCol !== -1 ? submissionRow[dmOverrideCol] : '');
    var outcomeBucket = (dmOverrideValue && dmOverrideValue !== '')
      ? dmOverrideValue
      : (outcomeBucketCol !== -1 ? submissionRow[outcomeBucketCol] : null);

    if (username && heroName && missionId && outcomeBucket) {
      var missionRows = await readTab(sheets, 'Missions');
      var allMissions = rowsToObjects(missionRows);
      var mission = allMissions.find(function(m) { return m.mission_id === missionId; });
      if (mission) {
        var changesStr = mission['outcome_' + outcomeBucket + '_changes'] || '';
        if (changesStr) {
          await applyMissionOutcomeChanges(sheets, username, heroName, changesStr);
        }
      }
    }
  }

  return { success: true };
}

// Increment current_cycle by 1 and update cycle_start to now.
async function handleAdminAdvanceCycle(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Settings');
  if (rows.length < 2) return { success: false, error: 'Settings tab not configured.' };

  var currentCycleRow = -1;
  var cycleStartRow = -1;
  var currentCycle = 1;

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'current_cycle') {
      currentCycleRow = i + 1;
      currentCycle = parseInt(rows[i][1]) || 1;
    }
    if (rows[i][0] === 'cycle_start') {
      cycleStartRow = i + 1;
    }
  }

  if (currentCycleRow === -1) return { success: false, error: 'current_cycle not found in Settings tab.' };

  var newCycle = currentCycle + 1;
  var newStart = new Date().toISOString();

  var updates = [
    { range: 'Settings!B' + currentCycleRow, values: [[String(newCycle)]] }
  ];
  if (cycleStartRow !== -1) {
    updates.push({ range: 'Settings!B' + cycleStartRow, values: [[newStart]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: updates }
  });

  return { success: true, newCycle: newCycle, newStart: newStart };
}

// Get all players (excluding password_hash).
async function handleAdminGetPlayers(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Players');
  if (rows.length < 2) return { success: true, players: [] };

  var headers = rows[0];
  var players = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] === 'password_hash') continue;
      obj[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
    }
    obj._row = i + 1;
    players.push(obj);
  }

  return { success: true, players: players };
}

// Update specific stat columns for a player. data.updates = { field: value, ... }.
async function handleAdminUpdatePlayer(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.username || !data.updates) return { success: false, error: 'Missing username or updates.' };

  var rows = await readTab(sheets, 'Players');
  if (rows.length < 2) return { success: false, error: 'No players found.' };

  var headers = rows[0];
  var usernameCol = headers.indexOf('username');

  var targetRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][usernameCol] && rows[i][usernameCol].toString().toLowerCase() === data.username.toLowerCase()) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) return { success: false, error: 'Player not found.' };

  var updates = [];
  Object.keys(data.updates).forEach(function(field) {
    if (field === 'password_hash') return; // never allow this via admin endpoint
    var colIdx = headers.indexOf(field);
    if (colIdx !== -1) {
      updates.push({
        range: 'Players!' + colNumToLetter(colIdx) + targetRow,
        values: [[data.updates[field]]]
      });
    }
  });

  if (updates.length === 0) return { success: false, error: 'No valid fields to update.' };

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: updates }
  });

  return { success: true };
}

// Get all reputation rows plus faction names and player names for building the grid.
async function handleAdminGetReputation(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var [repRows, factionRows, playerRows] = await Promise.all([
    readTab(sheets, 'Reputation'),
    readTab(sheets, 'Factions'),
    readTab(sheets, 'Players'),
  ]);

  var reputation = rowsToObjects(repRows);
  var factions = rowsToObjects(factionRows).map(function(f) { return f.faction_name; }).filter(Boolean);
  var players = rowsToObjects(playerRows).map(function(p) { return p.hero_name; }).filter(Boolean);

  return { success: true, reputation: reputation, factions: factions, players: players };
}

// Update (or create) a single player × faction reputation row.
async function handleAdminUpdateReputation(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.heroName || !data.factionName || !data.reputation) {
    return { success: false, error: 'Missing heroName, factionName, or reputation.' };
  }

  var rows = await readTab(sheets, 'Reputation');
  if (rows.length < 1) return { success: false, error: 'Reputation tab not found.' };

  var headers = rows[0];
  var heroCol = headers.indexOf('hero_name');
  var factionCol = headers.indexOf('faction_name');
  var repCol = headers.indexOf('reputation');

  if (heroCol === -1 || factionCol === -1 || repCol === -1) {
    return { success: false, error: 'Missing required columns in Reputation tab.' };
  }

  var targetRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][heroCol] === data.heroName && rows[i][factionCol] === data.factionName) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    // Row doesn't exist — append it
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reputation!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [[data.heroName, data.factionName, data.reputation]] }
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reputation!' + colNumToLetter(repCol) + targetRow,
      valueInputOption: 'RAW',
      requestBody: { values: [[data.reputation]] }
    });
  }

  return { success: true };
}

// Get all player-NPC relations for a given character (admin only).
// Returns all Contacts rows where contact_name matches and relation is non-blank.
async function handleAdminGetRelations(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };
  if (!data.characterName) return { success: false, error: 'Missing characterName.' };

  var sheets = getSheets();
  var [contactRows, playerRows] = await Promise.all([
    readTab(sheets, 'Contacts'),
    readTab(sheets, 'Players'),
  ]);

  // Get list of player hero names for the "add relation" dropdown
  var playerHeaders = playerRows.length > 0 ? playerRows[0] : [];
  var heroNameCol = playerHeaders.indexOf('hero_name');
  var players = [];
  if (heroNameCol !== -1) {
    for (var p = 1; p < playerRows.length; p++) {
      var hn = playerRows[p][heroNameCol] || '';
      if (hn) players.push(hn);
    }
  }

  if (contactRows.length < 2) return { success: true, relations: [], players: players };

  var headers = contactRows[0];
  var heroCol = headers.indexOf('hero_name');
  var contactCol = headers.indexOf('contact_name');
  var relationCol = headers.indexOf('relation');
  var notesCol = headers.indexOf('dm_notes');

  if (heroCol === -1 || contactCol === -1 || relationCol === -1) {
    return { success: true, relations: [], players: players };
  }

  var relations = [];
  for (var i = 1; i < contactRows.length; i++) {
    if (contactRows[i][contactCol] === data.characterName && contactRows[i][relationCol]) {
      relations.push({
        heroName: contactRows[i][heroCol] || '',
        relation: contactRows[i][relationCol] || '',
        dmNotes: notesCol !== -1 ? (contactRows[i][notesCol] || '') : '',
      });
    }
  }

  return { success: true, relations: relations, players: players };
}

// Set (or clear) a player's relation to a character (admin only).
// If the player-character pair doesn't exist in Contacts, a new row is appended (auto-adds contact).
// If relation is '' (empty string), clears the relation but leaves the contact row.
async function handleAdminSetRelation(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };
  if (!data.heroName || !data.characterName) {
    return { success: false, error: 'Missing heroName or characterName.' };
  }

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Contacts');
  if (rows.length < 1) return { success: false, error: 'Contacts tab not found.' };

  var headers = rows[0];
  var heroCol = headers.indexOf('hero_name');
  var contactCol = headers.indexOf('contact_name');
  var relationCol = headers.indexOf('relation');
  var notesCol = headers.indexOf('dm_notes');

  if (heroCol === -1 || contactCol === -1 || relationCol === -1) {
    return { success: false, error: 'Contacts tab is missing relation column. Add it in row 1 first.' };
  }

  // Find existing row for this hero-character pair
  var targetRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][heroCol] === data.heroName && rows[i][contactCol] === data.characterName) {
      targetRow = i + 1; // 1-based Sheets row number
      break;
    }
  }

  if (targetRow === -1) {
    // Row doesn't exist — append new row (this also adds the contact)
    var newRow = headers.map(function(h) {
      if (h === 'hero_name') return data.heroName;
      if (h === 'contact_name') return data.characterName;
      if (h === 'relation') return data.relation || '';
      if (h === 'dm_notes') return data.dmNotes || '';
      return '';
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contacts!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] },
    });
  } else {
    // Row exists — update relation and dm_notes in-place
    var updates = [
      {
        range: 'Contacts!' + colNumToLetter(relationCol) + targetRow,
        values: [[data.relation || '']],
      },
    ];
    if (notesCol !== -1) {
      updates.push({
        range: 'Contacts!' + colNumToLetter(notesCol) + targetRow,
        values: [[data.dmNotes || '']],
      });
    }
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    });
  }

  return { success: true };
}

// Get all characters including hidden ones (profile_visible=no).
async function handleAdminGetAllCharacters(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Characters');
  return { success: true, characters: rowsToObjects(rows) };
}

// Create or update a character. Ensures profile_url and cutout_url columns exist.
async function handleAdminSaveCharacter(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.character_name) return { success: false, error: 'Missing character_name.' };

  var rows = await readTab(sheets, 'Characters');
  if (rows.length < 1) return { success: false, error: 'Characters tab not found.' };

  var headers = rows[0].slice(); // copy so we can mutate

  // Ensure profile_url column exists
  if (headers.indexOf('profile_url') === -1) {
    var newIdx = headers.length;
    headers.push('profile_url');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Characters!' + colNumToLetter(newIdx) + '1',
      valueInputOption: 'RAW',
      requestBody: { values: [['profile_url']] }
    });
  }

  // Ensure cutout_url column exists
  if (headers.indexOf('cutout_url') === -1) {
    var newIdx2 = headers.length;
    headers.push('cutout_url');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Characters!' + colNumToLetter(newIdx2) + '1',
      valueInputOption: 'RAW',
      requestBody: { values: [['cutout_url']] }
    });
  }

  // Find existing row
  var nameCol = headers.indexOf('character_name');
  var targetRow = -1;
  if (nameCol !== -1) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][nameCol] === data.character_name) {
        targetRow = i + 1;
        break;
      }
    }
  }

  if (targetRow === -1) {
    // New character — build row in header order
    var newRow = headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Characters!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] }
    });
  } else {
    // Update existing — only update fields provided in data
    var updates = [];
    headers.forEach(function(h, idx) {
      if (data[h] !== undefined) {
        updates.push({ range: 'Characters!' + colNumToLetter(idx) + targetRow, values: [[data[h]]] });
      }
    });
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: updates }
      });
    }
  }

  return { success: true };
}

// Get all factions.
async function handleAdminGetFactions(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Factions');
  return { success: true, factions: rowsToObjects(rows) };
}

// Create or update a faction. Ensures banner_url column exists.
// On create: auto-adds neutral reputation rows for all existing players.
async function handleAdminSaveFaction(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.faction_name) return { success: false, error: 'Missing faction_name.' };

  var rows = await readTab(sheets, 'Factions');
  if (rows.length < 1) return { success: false, error: 'Factions tab not found.' };

  var headers = rows[0].slice();

  // Ensure banner_url column exists
  if (headers.indexOf('banner_url') === -1) {
    var bannerIdx = headers.length;
    headers.push('banner_url');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Factions!' + colNumToLetter(bannerIdx) + '1',
      valueInputOption: 'RAW',
      requestBody: { values: [['banner_url']] }
    });
  }

  var nameCol = headers.indexOf('faction_name');
  var targetRow = -1;
  var isNew = false;

  if (nameCol !== -1) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][nameCol] === data.faction_name) {
        targetRow = i + 1;
        break;
      }
    }
  }

  if (targetRow === -1) {
    isNew = true;
    var newRow = headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Factions!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] }
    });
    // Auto-add neutral reputation rows for all existing players
    await addReputationRowsForFaction(sheets, data.faction_name);
  } else {
    var updates = [];
    headers.forEach(function(h, idx) {
      if (data[h] !== undefined) {
        updates.push({ range: 'Factions!' + colNumToLetter(idx) + targetRow, values: [[data[h]]] });
      }
    });
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: updates }
      });
    }
  }

  return { success: true, isNew: isNew };
}

// Upload an image to imgbb. Receives base64 string, returns public URL.
async function handleAdminUploadImage(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  if (!data.imageBase64) return { success: false, error: 'Missing imageBase64.' };

  var apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) return { success: false, error: 'IMGBB_API_KEY environment variable is not set.' };

  var params = new URLSearchParams();
  params.append('key', apiKey);
  params.append('image', data.imageBase64);
  if (data.imageName) params.append('name', data.imageName.replace(/\.[^.]+$/, '')); // strip extension

  var response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: params
  });

  var result = await response.json();

  if (result.success && result.data && result.data.url) {
    return { success: true, url: result.data.url };
  }

  var errMsg = (result.error && result.error.message) ? result.error.message : 'Upload failed';
  return { success: false, error: 'imgbb: ' + errMsg };
}

// Get all places from the Places tab.
async function handleAdminGetPlaces(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  try {
    var rows = await readTab(sheets, 'Places');
    return { success: true, places: rowsToObjects(rows) };
  } catch (e) {
    return { success: true, places: [] };
  }
}

// Create Characters tab entries for any registered player who doesn't have one yet.
// Useful for players who signed up before the auto-create feature was added.
async function handleAdminSyncPlayers(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  var [playerRows, charRows] = await Promise.all([
    readTab(sheets, 'Players'),
    readTab(sheets, 'Characters'),
  ]);

  if (playerRows.length < 2) return { success: true, created: 0 };

  var players = rowsToObjects(playerRows);
  var charHeaders = charRows.length > 0 ? charRows[0] : [];
  var nameCol = charHeaders.indexOf('character_name');

  // Build set of existing hero names in Characters tab
  var existingNames = new Set();
  if (nameCol !== -1) {
    for (var i = 1; i < charRows.length; i++) {
      if (charRows[i][nameCol]) existingNames.add(charRows[i][nameCol]);
    }
  }

  var created = 0;
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    if (p.hero_name && !existingNames.has(p.hero_name)) {
      await addCharacterForNewPlayer(sheets, p.hero_name, p.username, p.class);
      created++;
    }
  }

  return { success: true, created: created };
}

// Mark all messages from a given player to a given NPC as read.
// Called when the admin opens that NPC's conversation in the inbox.
async function handleAdminMarkNpcMessagesRead(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.npcName || !data.fromPlayer) {
    return { success: false, error: 'Missing npcName or fromPlayer.' };
  }

  var rows = await readTab(sheets, 'Messages');
  if (rows.length < 2) return { success: true, marked: 0 };

  var headers = rows[0];
  var fromCol = headers.indexOf('from_character');
  var toCol = headers.indexOf('to_character');
  var readCol = headers.indexOf('read');

  if (fromCol === -1 || toCol === -1 || readCol === -1) {
    return { success: false, error: 'Messages tab missing required columns.' };
  }

  var updates = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][fromCol] === data.fromPlayer &&
        rows[i][toCol] === data.npcName &&
        rows[i][readCol] !== 'yes') {
      updates.push({
        range: 'Messages!' + colNumToLetter(readCol) + (i + 1),
        values: [['yes']]
      });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates }
    });
  }

  return { success: true, marked: updates.length };
}

// Create or update a place in the Places tab. Creates header row if tab is empty.
async function handleAdminSavePlace(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };

  var sheets = getSheets();
  if (!data.slug || !data.label) return { success: false, error: 'Missing slug or label.' };

  var rows;
  try {
    rows = await readTab(sheets, 'Places');
  } catch (e) {
    return { success: false, error: 'Places tab does not exist. Create it in Google Sheets with header row: slug, label, background_url' };
  }

  // If empty tab, write header row first
  if (!rows || rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Places!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['slug', 'label', 'background_url']] }
    });
    rows = [['slug', 'label', 'background_url']];
  }

  var headers = rows[0];
  var slugCol = headers.indexOf('slug');
  var targetRow = -1;

  if (slugCol !== -1) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][slugCol] === data.slug) {
        targetRow = i + 1;
        break;
      }
    }
  }

  var newRow = headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; });

  if (targetRow === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Places!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] }
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Places!A' + targetRow,
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] }
    });
  }

  return { success: true };
}

// -----------------------------------------------
// INVENTORY HANDLERS
// -----------------------------------------------

// Player-facing: get inventory items for a player (quantity > 0 only)
async function handleGetInventory(data) {
  if (!data.username) return { success: false, error: 'Missing username.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Inventory');
  var items = rowsToObjects(rows);

  var result = items.filter(function(item) {
    return item.username === data.username && parseInt(item.quantity) > 0;
  }).map(function(item) {
    return { item_name: item.item_name, quantity: item.quantity, category: item.category };
  });

  return { success: true, items: result };
}

// Admin-facing: get inventory items for a player (admin-gated)
async function handleAdminGetInventory(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };
  if (!data.username) return { success: false, error: 'Missing username.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Inventory');
  var items = rowsToObjects(rows);

  var result = items.filter(function(item) {
    return item.username === data.username && parseInt(item.quantity) > 0;
  }).map(function(item) {
    return { item_name: item.item_name, quantity: item.quantity, category: item.category };
  });

  return { success: true, items: result };
}

// Admin-facing: add, update, or soft-delete an inventory item
// If quantity <= 0 and row exists: zero out the quantity (soft-delete)
// If quantity > 0 and row exists: update quantity and category in-place
// If quantity > 0 and row doesn't exist: append new row
async function handleAdminSetInventory(data) {
  if (!verifyAdmin(data)) return { success: false, error: 'Unauthorized.' };
  if (!data.username || !data.item_name) return { success: false, error: 'Missing username or item_name.' };

  var sheets = getSheets();
  var rows = await readTab(sheets, 'Inventory');

  if (rows.length < 1) return { success: false, error: 'Inventory tab missing. Run setup-inventory.js first.' };

  var headers = rows[0];
  var usernameCol = headers.indexOf('username');
  var itemCol = headers.indexOf('item_name');
  var qtyCol = headers.indexOf('quantity');
  var catCol = headers.indexOf('category');

  if (usernameCol === -1 || itemCol === -1 || qtyCol === -1 || catCol === -1) {
    return { success: false, error: 'Inventory tab is missing required columns.' };
  }

  var quantity = parseInt(data.quantity) || 0;
  var category = data.category || 'misc';

  // Find existing row
  var targetRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][usernameCol] === data.username && rows[i][itemCol] === data.item_name) {
      targetRow = i + 1; // 1-based row number for Sheets API
      break;
    }
  }

  if (targetRow !== -1) {
    // Row exists — update quantity (and category) in-place
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: 'Inventory!' + colNumToLetter(qtyCol) + targetRow, values: [[quantity]] },
          { range: 'Inventory!' + colNumToLetter(catCol) + targetRow, values: [[category]] }
        ]
      }
    });
  } else if (quantity > 0) {
    // Row doesn't exist — append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [[data.username, data.item_name, quantity, category]] }
    });
  }
  // If quantity <= 0 and row doesn't exist, nothing to do

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
    else if (action === 'getInbox') result = await handleGetInbox(data);
    else if (action === 'getThread') result = await handleGetThread(data);
    else if (action === 'sendMessage') result = await handleSendMessage(data);
    else if (action === 'getContacts') result = await handleGetContacts(data);
    else if (action === 'addContact') result = await handleAddContact(data);
    else if (action === 'getCharacter') result = await handleGetCharacter(data);
    else if (action === 'getFaction') result = await handleGetFaction(data);
    else if (action === 'getMissions') result = await handleGetMissions(data);
    else if (action === 'getMissionQuestions') result = await handleGetMissionQuestions(data);
    else if (action === 'submitMission') result = await handleSubmitMission(data);
    // Player-accessible endpoints (no admin token)
    else if (action === 'getCharacters') result = await handleGetCharacters(data);
    else if (action === 'getPlaces') result = await handleGetPlaces(data);
    // Admin endpoints (all require adminToken)
    else if (action === 'adminLogin') result = await handleAdminLogin(data);
    else if (action === 'adminGetOverview') result = await handleAdminGetOverview(data);
    else if (action === 'adminGetNPCInbox') result = await handleAdminGetNPCInbox(data);
    else if (action === 'adminSendMessage') result = await handleAdminSendMessage(data);
    else if (action === 'adminGetAllPosts') result = await handleAdminGetAllPosts(data);
    else if (action === 'adminCreatePost') result = await handleAdminCreatePost(data);
    else if (action === 'adminUpdatePost') result = await handleAdminUpdatePost(data);
    else if (action === 'adminGetMissionSubmissions') result = await handleAdminGetMissionSubmissions(data);
    else if (action === 'adminResolveMission') result = await handleAdminResolveMission(data);
    else if (action === 'adminAdvanceCycle') result = await handleAdminAdvanceCycle(data);
    else if (action === 'adminGetPlayers') result = await handleAdminGetPlayers(data);
    else if (action === 'adminUpdatePlayer') result = await handleAdminUpdatePlayer(data);
    else if (action === 'adminGetReputation') result = await handleAdminGetReputation(data);
    else if (action === 'adminUpdateReputation') result = await handleAdminUpdateReputation(data);
    else if (action === 'adminGetRelations') result = await handleAdminGetRelations(data);
    else if (action === 'adminSetRelation') result = await handleAdminSetRelation(data);
    else if (action === 'adminGetAllCharacters') result = await handleAdminGetAllCharacters(data);
    else if (action === 'adminSaveCharacter') result = await handleAdminSaveCharacter(data);
    else if (action === 'adminGetFactions') result = await handleAdminGetFactions(data);
    else if (action === 'adminSaveFaction') result = await handleAdminSaveFaction(data);
    else if (action === 'adminUploadImage') result = await handleAdminUploadImage(data);
    else if (action === 'adminGetPlaces') result = await handleAdminGetPlaces(data);
    else if (action === 'adminSavePlace') result = await handleAdminSavePlace(data);
    else if (action === 'adminSyncPlayers') result = await handleAdminSyncPlayers(data);
    else if (action === 'adminMarkNpcMessagesRead') result = await handleAdminMarkNpcMessagesRead(data);
    else if (action === 'getInventory') result = await handleGetInventory(data);
    else if (action === 'adminGetInventory') result = await handleAdminGetInventory(data);
    else if (action === 'adminSetInventory') result = await handleAdminSetInventory(data);
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
