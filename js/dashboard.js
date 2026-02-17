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
