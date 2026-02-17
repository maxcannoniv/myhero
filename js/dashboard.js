/* ============================================
   dashboard.js — Terminal Navigation and UI
   ============================================
   Handles the phone-style app grid, opening/closing
   apps, loading hero data, and displaying stats.
   ============================================ */

// -----------------------------------------------
// Make sure the player is logged in.
// If not, this redirects them to the login page.
// -----------------------------------------------
requireLogin();

// -----------------------------------------------
// Get the logged-in player's data from the session
// -----------------------------------------------
const session = getSession();

// -----------------------------------------------
// NAVIGATION — Home screen and app switching
// -----------------------------------------------
// How this works:
// - The home screen shows a grid of app icons
// - Clicking an icon hides the home screen and shows that app full-screen
// - Each app has a "Home" button that takes you back to the grid

const homeScreen = document.getElementById('homeScreen');
const appIcons = document.querySelectorAll('.app-icon');
const appViews = document.querySelectorAll('.app-view');
const homeBtns = document.querySelectorAll('[data-home]');

// Track which feeds have been loaded so we don't re-fetch every time
var feedsLoaded = {};

// Open an app when its icon is tapped
appIcons.forEach(function(icon) {
  icon.addEventListener('click', function() {
    var appName = icon.getAttribute('data-app');
    var appView = document.getElementById('app-' + appName);

    if (appView) {
      // Hide the home screen
      homeScreen.classList.remove('active');
      // Show the app
      appView.classList.add('active');

      // Load feed data if this is a feed app and hasn't been loaded yet
      if (!feedsLoaded[appName] && ['streetview', 'dailydollar', 'myhero', 'bliink'].indexOf(appName) !== -1) {
        loadFeed(appName);
        feedsLoaded[appName] = true;
      }

      // Load inbox when Messages is opened
      if (appName === 'messages') {
        loadInbox();
      }
    }
  });
});

// Go back to home screen when "Home" button is clicked
homeBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    // Hide all app views
    appViews.forEach(function(view) { view.classList.remove('active'); });
    // Show home screen
    homeScreen.classList.add('active');
  });
});

// -----------------------------------------------
// LOGOUT
// -----------------------------------------------
document.getElementById('logoutBtn').addEventListener('click', function() {
  clearSession();
  window.location.href = 'login.html';
});

// -----------------------------------------------
// LOAD HERO DATA
// -----------------------------------------------

function displayHeroProfile(hero) {
  // Status bar — always visible
  document.getElementById('statusHeroName').textContent = hero.hero_name || hero.username || 'Unknown';
  document.getElementById('statusHeroClass').textContent = hero.class || 'Unclassed';

  // Status bar quick stats
  var followers = hero.followers !== undefined ? hero.followers : '—';
  var netWorth = hero.bank !== undefined ? hero.bank : '—';
  document.getElementById('statusFollowers').innerHTML = '&#9733; ' + followers;
  document.getElementById('statusNetWorth').innerHTML = '&#36; ' + netWorth;

  // Profile app — hero identity
  document.getElementById('profileHeroName').textContent = hero.hero_name || 'Unknown Hero';
  document.getElementById('profileHeroClass').textContent = hero.class || 'Unclassed';

  // Aggregate scores (the 4 top-level metrics)
  document.getElementById('aggFollowers').textContent = hero.followers !== undefined ? hero.followers : '—';
  document.getElementById('aggNetWorth').textContent = hero.bank !== undefined ? hero.bank : '—';
  document.getElementById('aggAuthority').textContent = hero.positional_authority !== undefined ? hero.positional_authority : '—';
  document.getElementById('aggClout').textContent = hero.clout !== undefined ? hero.clout : '—';

  // Base skills (the 6 core stats)
  var skills = [
    { label: 'Might', key: 'might' },
    { label: 'Agility', key: 'agility' },
    { label: 'Charm', key: 'charm' },
    { label: 'Intuition', key: 'intuition' },
    { label: 'Commerce', key: 'commerce' },
    { label: 'Intelligence', key: 'intelligence' }
  ];

  var skillsGrid = document.getElementById('skillsGrid');
  skillsGrid.innerHTML = '';

  skills.forEach(function(skill) {
    var value = hero[skill.key] !== undefined ? hero[skill.key] : '—';

    var card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML =
      '<div class="skill-card-value">' + value + '</div>' +
      '<div class="skill-card-label">' + skill.label + '</div>';

    skillsGrid.appendChild(card);
  });
}

// -----------------------------------------------
// FEED LOADING AND RENDERING
// -----------------------------------------------

function loadFeed(feedName) {
  var container = document.getElementById('feed-' + feedName);
  if (!container) return;

  // Show loading spinner
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  sheetsGetFeed(feedName).then(function(result) {
    if (result.success && result.posts && result.posts.length > 0) {
      container.innerHTML = '';
      result.posts.forEach(function(post) {
        var el = renderPost(feedName, post);
        container.appendChild(el);
      });
      // Make character names clickable
      makeNamesClickable(container);
    } else {
      container.innerHTML = '<div class="feed-empty">No posts yet.</div>';
    }
  });
}

// Format a timestamp into something readable
function formatDate(timestamp) {
  if (!timestamp) return '';
  var d = new Date(timestamp);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// Render a single post — different style per feed
function renderPost(feedName, post) {
  if (feedName === 'streetview') return renderStreetview(post);
  if (feedName === 'dailydollar') return renderDailyDollar(post);
  if (feedName === 'myhero') return renderMyHero(post);
  if (feedName === 'bliink') return renderBliink(post);
  return document.createElement('div');
}

// --- STREETVIEW: noir blog style ---
function renderStreetview(post) {
  var article = document.createElement('article');
  article.className = 'sv-post';

  var html = '<div class="sv-date">' + formatDate(post.timestamp) + '</div>';
  html += '<h3 class="sv-title">' + (post.title || '') + '</h3>';
  if (post.image_url) {
    html += '<img class="sv-image" src="' + post.image_url + '" alt="">';
  }
  html += '<p class="sv-body">' + (post.body || '') + '</p>';

  article.innerHTML = html;
  return article;
}

// --- DAILY DOLLAR: newspaper style ---
function renderDailyDollar(post) {
  var article = document.createElement('article');
  article.className = 'dd-post';

  var html = '<div class="dd-dateline">' + formatDate(post.timestamp) + '</div>';
  html += '<h3 class="dd-headline">' + (post.title || '') + '</h3>';
  if (post.image_url) {
    html += '<img class="dd-image" src="' + post.image_url + '" alt="">';
  }
  html += '<p class="dd-body">' + (post.body || '') + '</p>';

  article.innerHTML = html;
  return article;
}

// --- MYHERO: job board / Fiverr style ---
function renderMyHero(post) {
  var card = document.createElement('div');
  card.className = 'mh-card';

  var html = '';
  if (post.image_url) {
    html += '<img class="mh-image" src="' + post.image_url + '" alt="">';
  }
  html += '<div class="mh-content">';
  html += '<h3 class="mh-title">' + (post.title || '') + '</h3>';
  html += '<p class="mh-body">' + (post.body || '') + '</p>';
  html += '<div class="mh-meta">';
  html += '<span class="mh-poster">' + (post.posted_by || '') + '</span>';
  html += '<span class="mh-date">' + formatDate(post.timestamp) + '</span>';
  html += '</div></div>';

  card.innerHTML = html;
  return card;
}

// --- BLIINK: Instagram style ---
function renderBliink(post) {
  var card = document.createElement('div');
  card.className = 'bl-post';

  var html = '<div class="bl-header">';
  html += '<span class="bl-username">' + (post.posted_by || 'Anonymous') + '</span>';
  html += '</div>';
  if (post.image_url) {
    html += '<img class="bl-image" src="' + post.image_url + '" alt="">';
  }
  html += '<div class="bl-caption">';
  html += '<span class="bl-username">' + (post.posted_by || '') + '</span> ';
  html += (post.body || '');
  html += '</div>';
  html += '<div class="bl-date">' + formatDate(post.timestamp) + '</div>';

  card.innerHTML = html;
  return card;
}

// -----------------------------------------------
// MESSAGES — Inbox, Threads, Contacts
// -----------------------------------------------

var currentThreadContact = null;

// Load inbox when Messages app is opened
function loadInbox() {
  var heroName = (session && session.hero) ? session.hero.hero_name : null;
  if (!heroName) return;

  var inboxList = document.getElementById('inboxList');
  inboxList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  sheetsGetInbox(heroName).then(function(result) {
    inboxList.innerHTML = '';
    if (result.success && result.threads && result.threads.length > 0) {
      result.threads.forEach(function(thread) {
        var item = document.createElement('div');
        item.className = 'msg-inbox-item';
        if (thread.unread > 0) item.classList.add('msg-unread');

        var preview = thread.lastMessage.body || '';
        if (preview.length > 50) preview = preview.substring(0, 50) + '...';

        item.innerHTML =
          '<div class="msg-inbox-name">' + thread.contact +
          (thread.unread > 0 ? ' <span class="msg-unread-badge">' + thread.unread + '</span>' : '') +
          '</div>' +
          '<div class="msg-inbox-preview">' + preview + '</div>' +
          '<div class="msg-inbox-time">' + formatDate(thread.lastMessage.timestamp) + '</div>';

        item.addEventListener('click', function() {
          openThread(thread.contact);
        });

        inboxList.appendChild(item);
      });
    } else {
      inboxList.innerHTML = '<div class="msg-empty">No messages yet. Discover characters through feeds to start a conversation.</div>';
    }
  });
}

// Open a conversation thread
function openThread(contactName) {
  currentThreadContact = contactName;
  var heroName = session.hero.hero_name;

  // Switch views
  document.getElementById('messagesInbox').style.display = 'none';
  document.getElementById('messagesContacts').style.display = 'none';
  document.getElementById('messagesThread').style.display = 'block';
  document.getElementById('messagesTitlebar').textContent = contactName;

  var threadDiv = document.getElementById('threadMessages');
  threadDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  sheetsGetThread(heroName, contactName).then(function(result) {
    threadDiv.innerHTML = '';
    if (result.success && result.messages) {
      result.messages.forEach(function(msg) {
        var bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        if (msg.from_character === heroName) {
          bubble.classList.add('msg-sent');
        } else {
          bubble.classList.add('msg-received');
        }
        bubble.innerHTML =
          '<div class="msg-bubble-text">' + msg.body + '</div>' +
          '<div class="msg-bubble-time">' + formatDate(msg.timestamp) + '</div>';
        threadDiv.appendChild(bubble);
      });
      // Scroll to bottom
      threadDiv.scrollTop = threadDiv.scrollHeight;
    }
  });
}

// Back to inbox
document.getElementById('threadBackBtn').addEventListener('click', function() {
  document.getElementById('messagesThread').style.display = 'none';
  document.getElementById('messagesInbox').style.display = 'block';
  document.getElementById('messagesTitlebar').textContent = 'Messages';
  currentThreadContact = null;
  loadInbox();
});

// Send a message
document.getElementById('msgSendBtn').addEventListener('click', function() {
  var input = document.getElementById('msgReplyInput');
  var body = input.value.trim();
  if (!body || !currentThreadContact) return;

  var heroName = session.hero.hero_name;
  var sendBtn = document.getElementById('msgSendBtn');
  sendBtn.disabled = true;

  sheetsSendMessage(heroName, currentThreadContact, body).then(function(result) {
    sendBtn.disabled = false;
    if (result.success) {
      input.value = '';
      openThread(currentThreadContact);
    }
  });
});

// Send on Enter key
document.getElementById('msgReplyInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('msgSendBtn').click();
  }
});

// New message — show contacts
document.getElementById('msgNewBtn').addEventListener('click', function() {
  var heroName = session.hero.hero_name;
  document.getElementById('messagesInbox').style.display = 'none';
  document.getElementById('messagesContacts').style.display = 'block';
  document.getElementById('messagesTitlebar').textContent = 'New Message';

  var contactsList = document.getElementById('contactsList');
  contactsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  sheetsGetContacts(heroName).then(function(result) {
    contactsList.innerHTML = '';
    if (result.success && result.contacts && result.contacts.length > 0) {
      document.getElementById('noContactsMsg').style.display = 'none';
      result.contacts.forEach(function(name) {
        var item = document.createElement('div');
        item.className = 'msg-contact-item';
        item.textContent = name;
        item.addEventListener('click', function() {
          document.getElementById('messagesContacts').style.display = 'none';
          openThread(name);
        });
        contactsList.appendChild(item);
      });
    } else {
      document.getElementById('noContactsMsg').style.display = 'block';
    }
  });
});

// Back from contacts
document.getElementById('contactsBackBtn').addEventListener('click', function() {
  document.getElementById('messagesContacts').style.display = 'none';
  document.getElementById('messagesInbox').style.display = 'block';
  document.getElementById('messagesTitlebar').textContent = 'Messages';
});

// -----------------------------------------------
// CHARACTER PROFILE POPUP
// -----------------------------------------------

var charPopupOverlay = document.getElementById('charPopupOverlay');
var currentPopupCharacter = null;

function openCharacterPopup(characterName) {
  var heroName = (session && session.hero) ? session.hero.hero_name : null;
  // Don't open popup for yourself
  if (characterName === heroName) return;

  charPopupOverlay.style.display = 'flex';
  document.getElementById('charPopupName').textContent = 'Loading...';
  document.getElementById('charPopupClass').textContent = '';
  document.getElementById('charPopupFaction').textContent = '';
  document.getElementById('charPopupBio').textContent = '';
  document.getElementById('charPopupStatus').textContent = '';
  document.getElementById('charPopupAvatar').textContent = '?';

  sheetsGetCharacter(characterName).then(function(result) {
    if (result.success && result.character) {
      var c = result.character;
      currentPopupCharacter = c.character_name;
      document.getElementById('charPopupName').textContent = c.character_name;
      document.getElementById('charPopupClass').textContent = c.class || '';
      document.getElementById('charPopupFaction').textContent = c.faction || 'Independent';
      document.getElementById('charPopupBio').textContent = c.bio || '';
      document.getElementById('charPopupAvatar').textContent = c.character_name.charAt(0).toUpperCase();
    } else {
      document.getElementById('charPopupName').textContent = characterName;
      document.getElementById('charPopupBio').textContent = 'No profile found.';
      currentPopupCharacter = characterName;
    }
  });
}

// Close popup
document.getElementById('charPopupClose').addEventListener('click', function() {
  charPopupOverlay.style.display = 'none';
  currentPopupCharacter = null;
});

charPopupOverlay.addEventListener('click', function(e) {
  if (e.target === charPopupOverlay) {
    charPopupOverlay.style.display = 'none';
    currentPopupCharacter = null;
  }
});

// Send message from popup
document.getElementById('charSendMsgBtn').addEventListener('click', function() {
  if (!currentPopupCharacter) return;
  charPopupOverlay.style.display = 'none';

  // Open messages app and thread
  var allViews = document.querySelectorAll('.app-view');
  allViews.forEach(function(v) { v.classList.remove('active'); });
  homeScreen.classList.remove('active');
  document.getElementById('app-messages').classList.add('active');

  openThread(currentPopupCharacter);
});

// Add contact from popup
document.getElementById('charAddContactBtn').addEventListener('click', function() {
  if (!currentPopupCharacter) return;
  var heroName = session.hero.hero_name;
  var statusEl = document.getElementById('charPopupStatus');

  sheetsAddContact(heroName, currentPopupCharacter).then(function(result) {
    if (result.success) {
      if (result.alreadyExists) {
        statusEl.textContent = 'Already in your contacts.';
      } else {
        statusEl.textContent = 'Added to contacts!';
      }
    }
  });
});

// -----------------------------------------------
// CLICKABLE CHARACTER NAMES IN FEEDS
// -----------------------------------------------

// Make posted_by names clickable in feed posts
// Called after feeds render — wraps character names in clickable spans
function makeNamesClickable(container) {
  // Find all elements with character names
  var nameEls = container.querySelectorAll('.bl-username, .mh-poster, .dd-dateline');
  // For Bliink, the username in the header is the clickable one
  var bliinkHeaders = container.querySelectorAll('.bl-header .bl-username');
  bliinkHeaders.forEach(function(el) {
    var name = el.textContent.trim();
    if (name && name !== 'Anonymous') {
      el.classList.add('clickable-name');
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        openCharacterPopup(name);
      });
    }
  });

  // For myHERO poster names
  var mhPosters = container.querySelectorAll('.mh-poster');
  mhPosters.forEach(function(el) {
    var name = el.textContent.trim();
    if (name && name !== 'Anonymous' && name !== 'myHERO' && name !== 'Daily Dollar') {
      el.classList.add('clickable-name');
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        openCharacterPopup(name);
      });
    }
  });
}

// -----------------------------------------------
// BLIINK — Post Creation
// -----------------------------------------------

// Preset images — players pick from these
var BLIINK_PRESETS = [
  { label: 'City Skyline', url: 'https://placehold.co/600x600/1a1a2e/f5c518?text=CITY+SKYLINE' },
  { label: 'Downtown', url: 'https://placehold.co/600x600/16213e/4fc3f7?text=DOWNTOWN' },
  { label: 'The Docks', url: 'https://placehold.co/600x600/0f3460/a0a0b0?text=THE+DOCKS' },
  { label: 'Night Out', url: 'https://placehold.co/600x600/2a1a2e/bb86fc?text=NIGHT+OUT' },
  { label: 'Training', url: 'https://placehold.co/600x600/1a2e1a/00c853?text=TRAINING' },
  { label: 'On the Job', url: 'https://placehold.co/600x600/2e2a1a/f5c518?text=ON+THE+JOB' },
  { label: 'Selfie', url: 'https://placehold.co/600x600/1a1a2e/e94560?text=SELFIE' },
  { label: 'Meetup', url: 'https://placehold.co/600x600/1a2e2e/4fc3f7?text=MEETUP' },
  { label: 'Victory', url: 'https://placehold.co/600x600/2e1a1a/f5c518?text=VICTORY' }
];

var selectedPresetUrl = null;

// Build the preset image grid
var presetGrid = document.getElementById('bliinkPresetGrid');
if (presetGrid) {
  BLIINK_PRESETS.forEach(function(preset) {
    var tile = document.createElement('div');
    tile.className = 'bl-preset-tile';
    tile.innerHTML = '<img src="' + preset.url + '" alt="' + preset.label + '">' +
      '<span>' + preset.label + '</span>';

    tile.addEventListener('click', function() {
      // Deselect all, select this one
      var allTiles = presetGrid.querySelectorAll('.bl-preset-tile');
      allTiles.forEach(function(t) { t.classList.remove('selected'); });
      tile.classList.add('selected');
      selectedPresetUrl = preset.url;

      // Show preview
      var preview = document.getElementById('bliinkSelectedPreview');
      var previewImg = document.getElementById('bliinkPreviewImg');
      previewImg.src = preset.url;
      preview.style.display = 'block';
    });

    presetGrid.appendChild(tile);
  });
}

// Show/hide the composer
var bliinkNewPostBtn = document.getElementById('bliinkNewPostBtn');
var bliinkComposer = document.getElementById('bliinkComposer');
var bliinkCancelBtn = document.getElementById('bliinkCancelBtn');

if (bliinkNewPostBtn) {
  bliinkNewPostBtn.addEventListener('click', function() {
    bliinkComposer.style.display = 'block';
    bliinkNewPostBtn.style.display = 'none';
  });
}

if (bliinkCancelBtn) {
  bliinkCancelBtn.addEventListener('click', function() {
    resetBliinkComposer();
  });
}

function resetBliinkComposer() {
  bliinkComposer.style.display = 'none';
  bliinkNewPostBtn.style.display = 'block';
  document.getElementById('bliinkCaption').value = '';
  document.getElementById('bliinkPostError').textContent = '';
  document.getElementById('bliinkSelectedPreview').style.display = 'none';
  selectedPresetUrl = null;
  var allTiles = presetGrid.querySelectorAll('.bl-preset-tile');
  allTiles.forEach(function(t) { t.classList.remove('selected'); });
}

// Submit a Bliink post
var bliinkPostBtn = document.getElementById('bliinkPostBtn');
if (bliinkPostBtn) {
  bliinkPostBtn.addEventListener('click', function() {
    var caption = document.getElementById('bliinkCaption').value.trim();
    var errorEl = document.getElementById('bliinkPostError');
    errorEl.textContent = '';

    if (!selectedPresetUrl) {
      errorEl.textContent = 'Pick an image first.';
      return;
    }
    if (!caption) {
      errorEl.textContent = 'Write a caption.';
      return;
    }

    var heroName = (session && session.hero) ? (session.hero.hero_name || session.username) : 'Unknown';

    bliinkPostBtn.textContent = 'Posting...';
    bliinkPostBtn.disabled = true;

    sheetsCreatePost({
      feed: 'bliink',
      posted_by: heroName,
      posted_by_type: 'character',
      title: '',
      image_url: selectedPresetUrl,
      body: caption
    }).then(function(result) {
      bliinkPostBtn.textContent = 'Post';
      bliinkPostBtn.disabled = false;

      if (result.success) {
        resetBliinkComposer();
        // Reload the feed to show the new post
        feedsLoaded['bliink'] = false;
        loadFeed('bliink');
      } else {
        errorEl.textContent = result.error || 'Failed to post. Try again.';
      }
    });
  });
}

// -----------------------------------------------
// LOAD HERO DATA
// -----------------------------------------------

// Load hero data — first from session, then try refreshing from Sheets
if (session && session.hero) {
  displayHeroProfile(session.hero);

  // Also try to get fresh data from Sheets in the background
  sheetsGetHeroData(session.username).then(function(result) {
    if (result.success && result.hero) {
      saveSession(session.username, result.hero);
      displayHeroProfile(result.hero);
    }
  });
}
