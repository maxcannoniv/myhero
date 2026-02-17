function doPost(e) {
  var request = JSON.parse(e.postData.contents);
  var action = request.action;
  var data = request.data;
  var result;

  if (action === 'login') {
    result = handleLogin(data.username, data.passwordHash);
  } else if (action === 'getHeroData') {
    result = handleGetHeroData(data.username);
  } else if (action === 'register') {
    result = handleRegister(data);
  } else if (action === 'getFeed') {
    result = handleGetFeed(data.feed);
  } else if (action === 'createPost') {
    result = handleCreatePost(data);
  } else {
    result = { success: false, error: 'Unknown action: ' + action };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(username, passwordHash) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');

  if (!sheet) {
    return { success: false, error: 'Players sheet not found.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var usernameCol = headers.indexOf('username');
  var passwordCol = headers.indexOf('password_hash');

  if (usernameCol === -1 || passwordCol === -1) {
    return { success: false, error: 'Sheet is missing required columns.' };
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    if (row[usernameCol].toString().toLowerCase() === username.toLowerCase()) {
      if (row[passwordCol] === passwordHash) {
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

function handleGetHeroData(username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');

  if (!sheet) {
    return { success: false, error: 'Players sheet not found.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var usernameCol = headers.indexOf('username');

  if (usernameCol === -1) {
    return { success: false, error: 'Sheet is missing username column.' };
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    if (row[usernameCol].toString().toLowerCase() === username.toLowerCase()) {
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

function handleRegister(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');

  if (!sheet) {
    return { success: false, error: 'Players sheet not found.' };
  }

  var sheetData = sheet.getDataRange().getValues();
  var headers = sheetData[0];
  var usernameCol = headers.indexOf('username');

  // Check if username already exists
  for (var i = 1; i < sheetData.length; i++) {
    if (sheetData[i][usernameCol].toString().toLowerCase() === data.username.toLowerCase()) {
      return { success: false, error: 'Username already taken.' };
    }
  }

  // --- Class starting defaults ---
  // Followers: set per class
  var CLASS_FOLLOWERS = {
    'Hero': 100, 'Celebrity': 1000, 'Politician': 100, 'Sleuth': 100,
    'Tycoon': 100, 'Visionary': 100, 'Mogul': 1000, 'Mercenary': 100,
    'Champion': 1000, 'Philanthropist': 500
  };

  // Authority: letter tier per class (F = nobody, D = minor position, E = low-level recognition)
  var CLASS_AUTHORITY = {
    'Hero': 'F', 'Celebrity': 'F', 'Politician': 'E', 'Sleuth': 'F',
    'Tycoon': 'F', 'Visionary': 'F', 'Mogul': 'E', 'Mercenary': 'F',
    'Champion': 'F', 'Philanthropist': 'E'
  };

  // Bank: $3000 base + $1000 per commerce point above 3
  var commerce = (data.skills && data.skills.commerce) ? data.skills.commerce : 3;
  var startingBank = 3000 + (Math.max(0, commerce - 3) * 1000);

  var startingFollowers = CLASS_FOLLOWERS[data.heroClass] || 100;
  var startingAuthority = CLASS_AUTHORITY[data.heroClass] || 'F';

  // Build the new row in the same order as the headers
  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    var col = headers[j];

    if (col === 'username') {
      newRow.push(data.username);
    } else if (col === 'password_hash') {
      newRow.push(data.passwordHash);
    } else if (col === 'hero_name') {
      newRow.push(data.heroName);
    } else if (col === 'class') {
      newRow.push(data.heroClass);
    } else if (col === 'followers') {
      newRow.push(startingFollowers);
    } else if (col === 'bank') {
      newRow.push(startingBank);
    } else if (col === 'positional_authority') {
      newRow.push(startingAuthority);
    } else if (col === 'faction') {
      newRow.push('Independent');
    } else if (data.skills && data.skills[col] !== undefined) {
      newRow.push(data.skills[col]);
    } else {
      newRow.push('');
    }
  }

  // Add the new row to the sheet
  sheet.appendRow(newRow);

  // Build hero object to return (without password)
  var hero = {};
  for (var k = 0; k < headers.length; k++) {
    if (headers[k] !== 'password_hash') {
      hero[headers[k]] = newRow[k];
    }
  }

  return { success: true, hero: hero };
}

function handleGetFeed(feedName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feeds');

  if (!sheet) {
    return { success: false, error: 'Feeds sheet not found.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var posts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var post = {};
    for (var j = 0; j < headers.length; j++) {
      post[headers[j]] = row[j];
    }

    // Only return posts for the requested feed that are visible
    if (post.feed === feedName && post.visible === 'yes') {
      posts.push(post);
    }
  }

  // Sort by timestamp, newest first
  posts.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return { success: true, posts: posts };
}

function handleCreatePost(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feeds');

  if (!sheet) {
    return { success: false, error: 'Feeds sheet not found.' };
  }

  // Validate required fields
  if (!data.feed || !data.posted_by || !data.body) {
    return { success: false, error: 'Missing required fields.' };
  }

  // Bliink posts require an image
  if (data.feed === 'bliink' && !data.image_url) {
    return { success: false, error: 'Bliink posts require an image.' };
  }

  // Build the timestamp
  var now = new Date();
  var timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  // Append the new post
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

  sheet.appendRow(newRow);

  return { success: true };
}
