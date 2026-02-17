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
