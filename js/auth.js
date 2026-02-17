/* ============================================
   auth.js — Login, Signup, and Session Handling
   ============================================ */

// -----------------------------------------------
// CLASS SKILL DEFAULTS
// 6 skills, 20 points total, scale 1-10, 3 = average
// Players can adjust these before locking in.
// -----------------------------------------------
var MAX_POINTS = 20;
var MAX_SKILL = 10;
var MIN_SKILL = 1;

var CLASS_SKILLS = {
  'Hero': {
    might: 6, agility: 4, charm: 3, intuition: 3, commerce: 1, intelligence: 3
  },
  'Celebrity': {
    might: 1, agility: 3, charm: 6, intuition: 2, commerce: 2, intelligence: 6
  },
  'Politician': {
    might: 1, agility: 1, charm: 6, intuition: 4, commerce: 3, intelligence: 5
  },
  'Sleuth': {
    might: 2, agility: 3, charm: 2, intuition: 6, commerce: 1, intelligence: 6
  },
  'Tycoon': {
    might: 1, agility: 1, charm: 3, intuition: 3, commerce: 7, intelligence: 5
  },
  'Visionary': {
    might: 1, agility: 2, charm: 4, intuition: 5, commerce: 2, intelligence: 6
  },
  'Mogul': {
    might: 1, agility: 1, charm: 4, intuition: 3, commerce: 6, intelligence: 5
  },
  'Mercenary': {
    might: 5, agility: 5, charm: 1, intuition: 3, commerce: 4, intelligence: 2
  },
  'Champion': {
    might: 5, agility: 4, charm: 4, intuition: 2, commerce: 1, intelligence: 4
  },
  'Philanthropist': {
    might: 1, agility: 1, charm: 6, intuition: 4, commerce: 4, intelligence: 4
  }
};

// The current skill allocation being edited during signup
var currentSkills = null;

// -----------------------------------------------
// PASSWORD HASHING
// -----------------------------------------------
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  var hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  return hashHex;
}

// -----------------------------------------------
// SESSION MANAGEMENT
// -----------------------------------------------
function saveSession(username, heroData) {
  sessionStorage.setItem('myhero_username', username);
  sessionStorage.setItem('myhero_hero', JSON.stringify(heroData));
}

function getSession() {
  var username = sessionStorage.getItem('myhero_username');
  var heroJson = sessionStorage.getItem('myhero_hero');
  if (username && heroJson) {
    return { username: username, hero: JSON.parse(heroJson) };
  }
  return null;
}

function clearSession() {
  sessionStorage.removeItem('myhero_username');
  sessionStorage.removeItem('myhero_hero');
}

function requireLogin() {
  if (!getSession()) {
    window.location.href = 'login.html';
  }
}

// -----------------------------------------------
// SKILL EDITOR — lets players adjust points
// -----------------------------------------------
function getTotalPoints(skills) {
  var total = 0;
  var keys = Object.keys(skills);
  for (var i = 0; i < keys.length; i++) {
    total += skills[keys[i]];
  }
  return total;
}

function renderSkillEditor() {
  var grid = document.getElementById('skillEditorGrid');
  var pointsLeft = document.getElementById('pointsRemaining');
  if (!grid || !currentSkills) return;

  var remaining = MAX_POINTS - getTotalPoints(currentSkills);
  pointsLeft.textContent = remaining;

  // Color the remaining points: green if 0, yellow if some left, red if over
  if (remaining === 0) {
    pointsLeft.style.color = 'var(--accent-green)';
  } else if (remaining > 0) {
    pointsLeft.style.color = 'var(--accent-yellow)';
  } else {
    pointsLeft.style.color = 'var(--accent-red)';
  }

  grid.innerHTML = '';

  var skillNames = Object.keys(currentSkills);
  skillNames.forEach(function(skillName) {
    var value = currentSkills[skillName];
    var displayName = skillName.charAt(0).toUpperCase() + skillName.slice(1);

    var row = document.createElement('div');
    row.className = 'skill-editor-row';

    // Minus button
    var minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'skill-btn';
    minusBtn.textContent = '-';
    minusBtn.disabled = (value <= MIN_SKILL);
    minusBtn.addEventListener('click', function() {
      if (currentSkills[skillName] > MIN_SKILL) {
        currentSkills[skillName]--;
        renderSkillEditor();
      }
    });

    // Skill name and value
    var label = document.createElement('div');
    label.className = 'skill-editor-label';
    label.innerHTML = '<span class="skill-editor-name">' + displayName + '</span>' +
      '<span class="skill-editor-val">' + value + '</span>';

    // Plus button
    var plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'skill-btn';
    plusBtn.textContent = '+';
    plusBtn.disabled = (value >= MAX_SKILL || remaining <= 0);
    plusBtn.addEventListener('click', function() {
      var rem = MAX_POINTS - getTotalPoints(currentSkills);
      if (currentSkills[skillName] < MAX_SKILL && rem > 0) {
        currentSkills[skillName]++;
        renderSkillEditor();
      }
    });

    row.appendChild(minusBtn);
    row.appendChild(label);
    row.appendChild(plusBtn);
    grid.appendChild(row);
  });
}

// -----------------------------------------------
// PAGE LOGIC — Only runs on the login/signup page
// -----------------------------------------------
var loginPanel = document.getElementById('loginPanel');
var signupPanel = document.getElementById('signupPanel');

if (loginPanel) {
  // If already logged in, skip to dashboard
  if (getSession()) {
    window.location.href = 'dashboard.html';
  }

  // --- Toggle between login and signup ---
  document.getElementById('showSignup').addEventListener('click', function() {
    loginPanel.style.display = 'none';
    signupPanel.style.display = 'block';
  });

  document.getElementById('showLogin').addEventListener('click', function() {
    signupPanel.style.display = 'none';
    loginPanel.style.display = 'block';
  });

  // --- Class selection: show skill editor ---
  var heroClassSelect = document.getElementById('heroClass');
  var skillEditor = document.getElementById('skillEditor');

  heroClassSelect.addEventListener('change', function() {
    var selectedClass = heroClassSelect.value;

    if (selectedClass && CLASS_SKILLS[selectedClass]) {
      // Copy the default skills so editing doesn't change the defaults
      currentSkills = {};
      var defaults = CLASS_SKILLS[selectedClass];
      var keys = Object.keys(defaults);
      for (var i = 0; i < keys.length; i++) {
        currentSkills[keys[i]] = defaults[keys[i]];
      }
      skillEditor.style.display = 'block';
      renderSkillEditor();
    } else {
      skillEditor.style.display = 'none';
      currentSkills = null;
    }
  });

  // Reset to class defaults button
  document.getElementById('resetSkills').addEventListener('click', function() {
    var selectedClass = heroClassSelect.value;
    if (selectedClass && CLASS_SKILLS[selectedClass]) {
      var defaults = CLASS_SKILLS[selectedClass];
      currentSkills = {};
      var keys = Object.keys(defaults);
      for (var i = 0; i < keys.length; i++) {
        currentSkills[keys[i]] = defaults[keys[i]];
      }
      renderSkillEditor();
    }
  });

  // --- LOGIN FORM ---
  document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    var errorEl = document.getElementById('loginError');
    var btn = document.getElementById('loginBtn');
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;

    errorEl.textContent = '';

    if (!username || !password) {
      errorEl.textContent = 'Please enter both username and password.';
      return;
    }

    btn.textContent = 'Connecting...';
    btn.disabled = true;

    var passwordHash = await hashPassword(password);
    var result = await sheetsLogin(username, passwordHash);

    if (result.success) {
      saveSession(username, result.hero);
      window.location.href = 'dashboard.html';
    } else {
      errorEl.textContent = result.error || 'Login failed. Check your username and password.';
      btn.textContent = 'Enter the City';
      btn.disabled = false;
    }
  });

  // --- SIGNUP FORM ---
  document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    var errorEl = document.getElementById('signupError');
    var btn = document.getElementById('signupBtn');
    var username = document.getElementById('signupUsername').value.trim();
    var password = document.getElementById('signupPassword').value;
    var password2 = document.getElementById('signupPassword2').value;
    var heroName = document.getElementById('heroName').value.trim();
    var heroClass = document.getElementById('heroClass').value;

    errorEl.textContent = '';

    // Validation
    if (!username || !password || !password2 || !heroName || !heroClass) {
      errorEl.textContent = 'Please fill in all fields.';
      return;
    }

    if (username.length < 3) {
      errorEl.textContent = 'Username must be at least 3 characters.';
      return;
    }

    if (password.length < 4) {
      errorEl.textContent = 'Password must be at least 4 characters.';
      return;
    }

    if (password !== password2) {
      errorEl.textContent = 'Passwords do not match.';
      return;
    }

    if (!CLASS_SKILLS[heroClass]) {
      errorEl.textContent = 'Please select a valid class.';
      return;
    }

    if (!currentSkills) {
      errorEl.textContent = 'Please select a class to set your skills.';
      return;
    }

    var totalPoints = getTotalPoints(currentSkills);
    if (totalPoints !== MAX_POINTS) {
      errorEl.textContent = 'You must use exactly ' + MAX_POINTS + ' skill points. You have ' + (MAX_POINTS - totalPoints) + ' remaining.';
      return;
    }

    btn.textContent = 'Creating Hero...';
    btn.disabled = true;

    var passwordHash = await hashPassword(password);

    var result = await sheetsRegister({
      username: username,
      passwordHash: passwordHash,
      heroName: heroName,
      heroClass: heroClass,
      skills: currentSkills
    });

    if (result.success) {
      saveSession(username, result.hero);
      window.location.href = 'dashboard.html';
    } else {
      errorEl.textContent = result.error || 'Signup failed. Try again.';
      btn.textContent = 'Create Hero';
      btn.disabled = false;
    }
  });
}
