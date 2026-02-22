/* ============================================
   admin.js — myHERO Game Manager
   ============================================
   Handles all Game Manager (DM) tools:
   - Login / auth
   - Dashboard overview
   - NPC Inbox (read + reply)
   - Post Composer (create/publish/draft)
   - Mission Review (override + resolve)
   - Cycle advancement
   - Player stat editor
   - Reputation grid editor
   - Character creator/editor + image upload
   - Faction creator/editor + image upload
   - Places (Bliink backgrounds) manager
   ============================================ */

var ADMIN_TOKEN_KEY = 'myhero_admin_token';
var currentSection = null;

// -----------------------------------------------
// AUTH
// -----------------------------------------------

function getToken() { return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''; }
function setToken(t) { sessionStorage.setItem(ADMIN_TOKEN_KEY, t); }
function clearToken() { sessionStorage.removeItem(ADMIN_TOKEN_KEY); }
function isLoggedIn() { return !!getToken(); }

// SHA-256 via the browser's built-in Web Crypto API
async function hashPassword(password) {
  var buf = new TextEncoder().encode(password);
  var hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(function(b) { return b.toString(16).padStart(2, '0'); })
    .join('');
}

// -----------------------------------------------
// INIT
// -----------------------------------------------

(function init() {
  if (isLoggedIn()) {
    showApp();
    navigateTo('dashboard');
  } else {
    showLogin();
  }

  // Login form
  document.getElementById('adminLoginBtn').addEventListener('click', handleLogin);
  document.getElementById('adminPassword').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
  });

  // Logout
  document.getElementById('adminLogoutBtn').addEventListener('click', function() {
    clearToken();
    showLogin();
  });

  // Sidebar nav
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigateTo(link.getAttribute('data-section'));
    });
  });
})();

async function handleLogin() {
  var password = document.getElementById('adminPassword').value;
  var errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  if (!password) { errorEl.textContent = 'Enter your password.'; return; }

  var hash = await hashPassword(password);
  var result = await adminLogin(hash);

  if (result.success) {
    setToken(result.token);
    document.getElementById('adminPassword').value = '';
    showApp();
    navigateTo('dashboard');
  } else {
    errorEl.textContent = result.error || 'Login failed.';
  }
}

function showLogin() {
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminApp').style.display = 'none';
}

function showApp() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
}

// -----------------------------------------------
// NAVIGATION
// -----------------------------------------------

function navigateTo(section) {
  currentSection = section;

  // Update sidebar active state
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.classList.toggle('active', link.getAttribute('data-section') === section);
  });

  var content = document.getElementById('adminContent');
  content.innerHTML = '<div class="loading-msg">Loading...</div>';

  var loaders = {
    dashboard:  loadDashboard,
    inbox:      loadInbox,
    composer:   loadComposer,
    missions:   loadMissions,
    cycle:      loadCycle,
    players:    loadPlayers,
    reputation: loadReputation,
    characters: loadCharacters,
    factions:   loadFactions,
    places:     loadPlaces,
    assets:     loadAssets,
  };

  if (loaders[section]) loaders[section]();
}

// -----------------------------------------------
// DASHBOARD
// -----------------------------------------------

async function loadDashboard() {
  var result = await adminGetOverview();
  var content = document.getElementById('adminContent');

  if (!result.success) { content.innerHTML = errHtml(result.error); return; }

  content.innerHTML =
    '<h1 class="section-title">Dashboard</h1>' +
    '<div class="stat-grid">' +
      statCard(result.playerCount, 'Active Players', '') +
      statCard(result.unreadNpcMessages, 'Unread NPC Messages', result.unreadNpcMessages > 0 ? 'alert' : 'good') +
      statCard(result.pendingMissions, 'Pending Missions', result.pendingMissions > 0 ? 'alert' : '') +
      statCard('Cycle ' + result.currentCycle, 'Current Cycle', '') +
    '</div>' +
    '<p class="text-muted" style="font-size:0.85rem;">Use the sidebar to manage the game. <strong>Priority actions:</strong> NPC Inbox → Post Composer → Missions.</p>';
}

function statCard(value, label, cssClass) {
  return '<div class="stat-card ' + (cssClass || '') + '">' +
    '<div class="stat-value">' + value + '</div>' +
    '<div class="stat-label">' + label + '</div>' +
    '</div>';
}

// -----------------------------------------------
// NPC INBOX
// -----------------------------------------------

var inboxData = null;
var activeNpc = null;
var activeConvoWith = null;

async function loadInbox() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">NPC Inbox</h1><div class="loading-msg">Loading messages...</div>';

  var result = await adminGetNPCInbox();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">NPC Inbox</h1>' + errHtml(result.error); return; }

  inboxData = result.inbox;
  renderInboxLayout();
}

function renderInboxLayout() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">NPC Inbox</h1><div class="inbox-layout"><div class="inbox-npc-list" id="npcList"></div><div class="inbox-thread-area" id="inboxThreadArea"><div class="loading-msg" style="padding:40px">Select an NPC to view conversations.</div></div></div>';

  var npcList = document.getElementById('npcList');

  if (!inboxData || inboxData.length === 0) {
    npcList.innerHTML = '<div class="inbox-npc-no-convs">No NPC conversations yet.</div>';
    return;
  }

  inboxData.forEach(function(npc) {
    var item = document.createElement('div');
    item.className = 'inbox-npc-item' + (activeNpc === npc.npcName ? ' active' : '');
    item.innerHTML =
      '<span class="inbox-npc-name">' + escHtml(npc.npcName) + '</span>' +
      (npc.totalUnread > 0 ? '<span class="badge badge-unread">' + npc.totalUnread + '</span>' : '');
    item.addEventListener('click', function() {
      activeNpc = npc.npcName;
      activeConvoWith = npc.conversations.length > 0 ? npc.conversations[0].with : null;
      renderInboxLayout(); // re-render to update active class
      renderNpcThread();
    });
    npcList.appendChild(item);
  });

  if (activeNpc) renderNpcThread();
}

function renderNpcThread() {
  var threadArea = document.getElementById('inboxThreadArea');
  if (!threadArea) return;

  var npcInfo = inboxData.find(function(n) { return n.npcName === activeNpc; });
  if (!npcInfo) return;

  // Build conversation tab buttons
  var tabsHtml = '<div class="inbox-convo-tabs">';
  npcInfo.conversations.forEach(function(conv) {
    var isActive = conv.with === activeConvoWith;
    var unreadBadge = conv.unreadCount > 0 ? '<span class="tab-unread">' + conv.unreadCount + '</span>' : '';
    tabsHtml += '<button class="convo-tab' + (isActive ? ' active' : '') + '" data-with="' + escHtml(conv.with) + '">' + escHtml(conv.with) + unreadBadge + '</button>';
  });
  tabsHtml += '</div>';

  // Build message thread
  var activeConv = npcInfo.conversations.find(function(c) { return c.with === activeConvoWith; });
  var messagesHtml = '<div class="inbox-messages" id="inboxMessages">';
  if (activeConv) {
    activeConv.messages.forEach(function(msg) {
      var isSent = msg.from_character === activeNpc;
      messagesHtml +=
        '<div class="inbox-msg ' + (isSent ? 'inbox-msg-sent' : 'inbox-msg-received') + '">' +
        escHtml(msg.body) +
        '<div class="inbox-msg-meta">' + escHtml(msg.from_character) + ' · ' + (msg.timestamp || '') + '</div>' +
        '</div>';
    });
  }
  messagesHtml += '</div>';

  // Reply area
  var replyHtml =
    '<div class="inbox-reply-area">' +
    '<textarea class="inbox-reply-input" id="inboxReplyInput" rows="2" placeholder="Reply as ' + escHtml(activeNpc) + '..."></textarea>' +
    '<div style="display:flex;flex-direction:column;gap:6px;">' +
    '<button class="btn-primary btn-small" id="inboxSendBtn">Send</button>' +
    '</div>' +
    '</div>';

  threadArea.innerHTML =
    '<div class="inbox-thread-header">Viewing as: <strong>' + escHtml(activeNpc) + '</strong></div>' +
    tabsHtml +
    messagesHtml +
    (activeConvoWith ? replyHtml : '');

  // Scroll to bottom
  var msgEl = document.getElementById('inboxMessages');
  if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;

  // Mark messages from this player to this NPC as read (silently — don't block the UI)
  if (activeConvoWith && activeNpc) {
    adminMarkNpcMessagesRead(activeNpc, activeConvoWith).then(function(result) {
      if (result.success && result.marked > 0) {
        // Update unread counts in local inboxData so the sidebar reflects the change
        var npc = inboxData && inboxData.find(function(n) { return n.npcName === activeNpc; });
        if (npc) {
          var conv = npc.conversations.find(function(c) { return c.with === activeConvoWith; });
          if (conv) {
            npc.totalUnread = Math.max(0, npc.totalUnread - conv.unreadCount);
            conv.unreadCount = 0;
          }
        }
        // Re-render the NPC list to update badge counts
        var npcList = document.getElementById('npcList');
        if (npcList && inboxData) {
          npcList.querySelectorAll('.inbox-npc-item').forEach(function(item) {
            var nameEl = item.querySelector('.inbox-npc-name');
            if (nameEl && nameEl.textContent === activeNpc) {
              var badge = item.querySelector('.badge-unread');
              if (badge) badge.remove();
            }
          });
        }
      }
    });
  }

  // Conversation tab clicks
  threadArea.querySelectorAll('.convo-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      activeConvoWith = tab.getAttribute('data-with');
      renderNpcThread();
    });
  });

  // Send button
  var sendBtn = document.getElementById('inboxSendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async function() {
      var input = document.getElementById('inboxReplyInput');
      var body = input.value.trim();
      if (!body || !activeNpc || !activeConvoWith) return;

      sendBtn.disabled = true;
      sendBtn.textContent = '...';

      var result = await adminSendMessage(activeNpc, activeConvoWith, body);
      if (result.success) {
        input.value = '';
        // Reload inbox data and re-render
        var fresh = await adminGetNPCInbox();
        if (fresh.success) {
          inboxData = fresh.inbox;
          renderNpcThread();
        }
      } else {
        alert('Send failed: ' + result.error);
      }
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    });
  }
}

// -----------------------------------------------
// POST COMPOSER
// -----------------------------------------------

async function loadComposer() {
  var content = document.getElementById('adminContent');

  // Fetch characters and factions in parallel for the "posted_by" picker
  var [charResult, factionResult, postsResult] = await Promise.all([
    adminGetAllCharacters(),
    adminGetFactions(),
    adminGetAllPosts()
  ]);

  var characters = (charResult.success && charResult.characters) ? charResult.characters : [];
  var factions = (factionResult.success && factionResult.factions) ? factionResult.factions : [];
  var posts = (postsResult.success && postsResult.posts) ? postsResult.posts : [];

  // Build posted_by options (characters + factions)
  var posterOptions = '<option value="">-- Select who is posting --</option>';
  posterOptions += '<optgroup label="Characters">';
  characters.forEach(function(c) { posterOptions += '<option value="' + escAttr(c.character_name) + '">' + escHtml(c.character_name) + ' (' + escHtml(c.type || 'npc') + ')</option>'; });
  posterOptions += '</optgroup><optgroup label="Factions">';
  factions.forEach(function(f) { posterOptions += '<option value="' + escAttr(f.faction_name) + '">' + escHtml(f.faction_name) + '</option>'; });
  posterOptions += '</optgroup>';

  content.innerHTML =
    '<h1 class="section-title">Post Composer</h1>' +

    '<div class="two-col">' +

    // Left: create form
    '<div>' +
    '<div class="admin-form">' +
    '<div class="form-section-title">Create Post</div>' +
    '<div class="form-row"><label>Feed</label>' +
    '<select id="cFeed" class="form-select">' +
    '<option value="myhero">myHERO (Jobs &amp; Announcements — appears below missions)</option>' +
    '<option value="bliink">Bliink</option>' +
    '<option value="todaystidbit">The Times Today</option>' +
    '<option value="dailydollar">Daily Dollar</option>' +
    '<option value="streetview">Streetview</option>' +
    '</select></div>' +
    '<div class="form-row"><label>Posted By</label><select id="cPostedBy" class="form-select">' + posterOptions + '</select></div>' +
    '<div class="form-row"><label>Posted By Type</label>' +
    '<select id="cPostedByType" class="form-select"><option value="character">character</option><option value="faction">faction</option><option value="anonymous">anonymous</option></select>' +
    '</div>' +
    '<div class="form-row"><label>Title <span class="text-muted">(optional)</span></label><input id="cTitle" class="form-input" placeholder="Headline or job title..."></div>' +
    '<div class="form-row"><label>Body</label><textarea id="cBody" class="form-textarea" rows="5" placeholder="Post content. Use [Name] for clickable character links."></textarea></div>' +
    '<div class="form-row"><label>Image URL <span class="text-muted">(optional)</span></label><input id="cImageUrl" class="form-input" placeholder="https://..."></div>' +
    '<div class="form-row"><label>Publish</label>' +
    '<select id="cVisible" class="form-select"><option value="yes">Publish now (visible = yes)</option><option value="no">Save as draft (visible = no)</option></select>' +
    '</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" id="composerSubmitBtn">Create Post</button>' +
    '</div>' +
    '<div id="composerStatus" class="status-msg"></div>' +
    '</div>' +
    '</div>' +

    // Right: recent posts list
    '<div>' +
    '<div class="form-section-title">Recent Posts</div>' +
    '<div class="posts-list" id="adminPostsList">' +
    buildPostsList(posts.slice(0, 30)) +
    '</div>' +
    '</div>' +

    '</div>'; // .two-col

  document.getElementById('composerSubmitBtn').addEventListener('click', handleCreatePost);

  // Auto-fill Posted By Type based on which optgroup the selected name belongs to
  document.getElementById('cPostedBy').addEventListener('change', function() {
    var sel = this;
    var selectedOption = sel.options[sel.selectedIndex];
    var optgroup = selectedOption.parentElement;
    if (optgroup && optgroup.tagName === 'OPTGROUP') {
      var typeSelect = document.getElementById('cPostedByType');
      if (optgroup.label === 'Characters') typeSelect.value = 'character';
      else if (optgroup.label === 'Factions') typeSelect.value = 'faction';
    }
  });

  // Publish/unpublish buttons (delegated)
  document.getElementById('adminPostsList').addEventListener('click', async function(e) {
    if (e.target.classList.contains('toggle-visible-btn')) {
      var row = parseInt(e.target.getAttribute('data-row'));
      var current = e.target.getAttribute('data-visible');
      var newVisible = current === 'yes' ? 'no' : 'yes';
      e.target.disabled = true;
      var result = await adminUpdatePost(row, newVisible);
      if (result.success) {
        e.target.setAttribute('data-visible', newVisible);
        e.target.textContent = newVisible === 'yes' ? 'Unpublish' : 'Publish';
        e.target.className = 'toggle-visible-btn ' + (newVisible === 'yes' ? 'btn-danger btn-small' : 'btn-green btn-small');
      } else {
        alert('Update failed: ' + result.error);
      }
      e.target.disabled = false;
    }
  });
}

function buildPostsList(posts) {
  if (!posts || posts.length === 0) return '<div class="empty-state">No posts yet.</div>';
  return posts.map(function(p) {
    var isVisible = p.visible === 'yes';
    return '<div class="post-item">' +
      '<div class="post-item-info">' +
      '<div class="post-item-feed">' + escHtml(p.feed || '') + ' · ' + escHtml((p.timestamp || '').substring(0, 10)) + ' <span class="badge ' + (isVisible ? 'badge-yes' : 'badge-no') + '">' + (isVisible ? 'live' : 'draft') + '</span></div>' +
      '<div class="post-item-title">' + escHtml(p.title || p.body.substring(0, 60)) + '</div>' +
      '<div class="post-item-by">by ' + escHtml(p.posted_by || '') + '</div>' +
      '</div>' +
      '<div class="post-item-actions">' +
      '<button class="toggle-visible-btn ' + (isVisible ? 'btn-danger btn-small' : 'btn-green btn-small') + '" data-row="' + p._row + '" data-visible="' + escAttr(p.visible) + '">' + (isVisible ? 'Unpublish' : 'Publish') + '</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

async function handleCreatePost() {
  var statusEl = document.getElementById('composerStatus');
  statusEl.textContent = '';
  statusEl.className = 'status-msg';

  var postData = {
    feed:           document.getElementById('cFeed').value,
    posted_by:      document.getElementById('cPostedBy').value,
    posted_by_type: document.getElementById('cPostedByType').value,
    title:          document.getElementById('cTitle').value.trim(),
    body:           document.getElementById('cBody').value.trim(),
    image_url:      document.getElementById('cImageUrl').value.trim(),
    visible:        document.getElementById('cVisible').value,
  };

  if (!postData.posted_by) { showStatus('composerStatus', 'Select who is posting.', false); return; }
  if (!postData.body) { showStatus('composerStatus', 'Body cannot be empty.', false); return; }

  var btn = document.getElementById('composerSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  var result = await adminCreatePost(postData);
  btn.disabled = false;
  btn.textContent = 'Create Post';

  if (result.success) {
    showStatus('composerStatus', 'Post created!', true);
    document.getElementById('cTitle').value = '';
    document.getElementById('cBody').value = '';
    document.getElementById('cImageUrl').value = '';
    // Refresh posts list
    var fresh = await adminGetAllPosts();
    if (fresh.success) {
      document.getElementById('adminPostsList').innerHTML = buildPostsList((fresh.posts || []).slice(0, 30));
    }
  } else {
    showStatus('composerStatus', result.error || 'Failed to create post.', false);
  }
}

// -----------------------------------------------
// MISSIONS
// -----------------------------------------------

async function loadMissions() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Mission Review</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetMissionSubmissions();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Mission Review</h1>' + errHtml(result.error); return; }

  var submissions = result.submissions || [];
  var missions = result.missions || [];

  // Build a lookup: mission_id → title
  var missionTitles = {};
  missions.forEach(function(m) { missionTitles[m.mission_id] = m.title || m.mission_id; });

  // Group submissions by mission
  var byMission = {};
  submissions.forEach(function(s) {
    var mid = s.mission_id;
    if (!byMission[mid]) byMission[mid] = [];
    byMission[mid].push(s);
  });

  var html = '<h1 class="section-title">Mission Review</h1>';

  if (submissions.length === 0) {
    html += '<div class="empty-state">No mission submissions yet.</div>';
    content.innerHTML = html;
    return;
  }

  Object.keys(byMission).forEach(function(mid) {
    html += '<div class="mission-group"><div class="mission-group-title">' + escHtml(missionTitles[mid] || mid) + '</div>';
    byMission[mid].forEach(function(s) {
      var bucket = s.dm_override || s.outcome_bucket || '?';
      var answers = [s.q1_answer, s.q2_answer, s.q3_answer, s.q4_answer].filter(Boolean).join(', ');
      html +=
        '<div class="submission-row" id="sub-' + escAttr(s.submission_id) + '">' +
        '<div class="submission-row-header">' +
        '<div class="submission-player">' + escHtml(s.hero_name || s.username) + '</div>' +
        '<span class="badge ' + (s.resolved === 'yes' ? 'badge-resolved' : 'badge-pending') + '">' + (s.resolved === 'yes' ? 'Resolved' : 'Pending') + '</span>' +
        '</div>' +
        '<div class="submission-answers">Answers: ' + escHtml(answers || 'none') + ' &nbsp;|&nbsp; Auto bucket: <strong>' + escHtml(s.outcome_bucket || '?') + '</strong></div>' +
        '<div class="submission-controls">' +
        '<select class="form-select" style="width:auto;padding:4px 8px;font-size:0.8rem;" id="override-' + escAttr(s.submission_id) + '">' +
        '<option value="">-- No override --</option>' +
        '<option value="a"' + (s.dm_override === 'a' ? ' selected' : '') + '>Outcome A</option>' +
        '<option value="b"' + (s.dm_override === 'b' ? ' selected' : '') + '>Outcome B</option>' +
        '<option value="c"' + (s.dm_override === 'c' ? ' selected' : '') + '>Outcome C</option>' +
        '</select>' +
        '<button class="btn-green btn-small resolve-btn" data-id="' + escAttr(s.submission_id) + '" data-resolved="' + escAttr(s.resolved) + '">' +
        (s.resolved === 'yes' ? 'Mark Unresolved' : 'Mark Resolved') +
        '</button>' +
        '<span class="status-msg" id="status-' + escAttr(s.submission_id) + '"></span>' +
        '</div>' +
        '</div>';
    });
    html += '</div>';
  });

  content.innerHTML = html;

  // Wire up resolve buttons
  content.querySelectorAll('.resolve-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = btn.getAttribute('data-id');
      var currentResolved = btn.getAttribute('data-resolved');
      var newResolved = currentResolved === 'yes' ? 'no' : 'yes';
      var overrideEl = document.getElementById('override-' + id);
      var dmOverride = overrideEl ? overrideEl.value : '';

      btn.disabled = true;
      var result = await adminResolveMission(id, dmOverride, newResolved);
      if (result.success) {
        btn.setAttribute('data-resolved', newResolved);
        btn.textContent = newResolved === 'yes' ? 'Mark Unresolved' : 'Mark Resolved';
        var statusEl = document.getElementById('status-' + id);
        if (statusEl) { statusEl.textContent = 'Saved!'; statusEl.className = 'status-msg status-ok'; setTimeout(function() { statusEl.textContent = ''; }, 2000); }
      } else {
        alert('Failed: ' + result.error);
      }
      btn.disabled = false;
    });
  });
}

// -----------------------------------------------
// CYCLE
// -----------------------------------------------

async function loadCycle() {
  var content = document.getElementById('adminContent');
  var result = await adminGetOverview();

  var cycleNum = result.success ? result.currentCycle : '?';

  content.innerHTML =
    '<h1 class="section-title">Cycle</h1>' +
    '<div class="cycle-display">' +
    '<div class="cycle-label">Current Cycle</div>' +
    '<div class="cycle-number">' + cycleNum + '</div>' +
    '<div class="cycle-label" style="margin-bottom:20px;margin-top:4px">Advance to cycle ' + (parseInt(cycleNum) + 1 || '?') + '</div>' +
    '<div class="cycle-warning">Advancing the cycle updates the cycle number and resets the in-universe clock. Do this <strong>after</strong> resolving all pending missions and applying stat changes.</div>' +
    '<button class="btn-primary" id="advanceCycleBtn" style="width:100%;font-size:1.1rem;">Advance Cycle &rarr;</button>' +
    '<div id="cycleStatus" class="status-msg"></div>' +
    '</div>';

  document.getElementById('advanceCycleBtn').addEventListener('click', async function() {
    if (!confirm('Advance to cycle ' + (parseInt(cycleNum) + 1) + '? This cannot be undone.')) return;

    var btn = document.getElementById('advanceCycleBtn');
    btn.disabled = true;
    btn.textContent = 'Advancing...';

    var result = await adminAdvanceCycle();
    if (result.success) {
      showStatus('cycleStatus', 'Advanced to Cycle ' + result.newCycle + '. Started: ' + new Date(result.newStart).toLocaleString(), true);
      btn.textContent = 'Cycle ' + result.newCycle + ' Started';
      document.querySelector('.cycle-number').textContent = result.newCycle;
    } else {
      showStatus('cycleStatus', result.error, false);
      btn.disabled = false;
      btn.textContent = 'Advance Cycle →';
    }
  });
}

// -----------------------------------------------
// PLAYERS
// -----------------------------------------------

async function loadPlayers() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Players</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetPlayers();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Players</h1>' + errHtml(result.error); return; }

  var players = result.players || [];

  var html =
    '<h1 class="section-title">Players</h1>' +
    '<p class="section-subtitle">Edit stats, then click Save for that player.</p>' +
    '<div style="overflow-x:auto;">' +
    '<table class="data-table">' +
    '<thead><tr>' +
    '<th>Hero</th><th>Class</th>' +
    '<th>Might</th><th>Agility</th><th>Charm</th><th>Intuition</th><th>Commerce</th><th>Intelligence</th>' +
    '<th>Followers</th><th>Bank</th><th>Authority</th><th>Clout</th>' +
    '<th></th>' +
    '</tr></thead><tbody>';

  players.forEach(function(p) {
    html += '<tr id="player-row-' + escAttr(p.username) + '">' +
      '<td><strong>' + escHtml(p.hero_name || '') + '</strong><br><span class="text-muted" style="font-size:0.75rem;">' + escHtml(p.username || '') + '</span></td>' +
      '<td>' + escHtml(p.class || '') + '</td>' +
      statInput(p, 'might') + statInput(p, 'agility') + statInput(p, 'charm') +
      statInput(p, 'intuition') + statInput(p, 'commerce') + statInput(p, 'intelligence') +
      statInput(p, 'followers') + statInput(p, 'bank') +
      '<td><input class="stat-input" style="width:50px;" data-field="positional_authority" data-username="' + escAttr(p.username) + '" value="' + escAttr(p.positional_authority || '') + '"></td>' +
      statInput(p, 'clout') +
      '<td><button class="btn-primary btn-small save-player-btn" data-username="' + escAttr(p.username) + '">Save</button>' +
      '<span class="status-msg" id="player-status-' + escAttr(p.username) + '" style="font-size:0.75rem;margin-left:6px;"></span></td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  content.innerHTML = html;

  content.querySelectorAll('.save-player-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var username = btn.getAttribute('data-username');
      var inputs = content.querySelectorAll('[data-username="' + username + '"]');
      var updates = {};
      inputs.forEach(function(inp) { updates[inp.getAttribute('data-field')] = inp.value; });

      btn.disabled = true;
      var result = await adminUpdatePlayer(username, updates);
      var statusEl = document.getElementById('player-status-' + username);
      if (result.success) {
        statusEl.textContent = 'Saved!';
        statusEl.className = 'status-msg status-ok';
      } else {
        statusEl.textContent = result.error;
        statusEl.className = 'status-msg status-err';
      }
      setTimeout(function() { statusEl.textContent = ''; }, 2500);
      btn.disabled = false;
    });
  });
}

function statInput(player, field) {
  return '<td><input class="stat-input" data-field="' + field + '" data-username="' + escAttr(player.username) + '" value="' + escAttr(String(player[field] || '')) + '"></td>';
}

// -----------------------------------------------
// REPUTATION
// -----------------------------------------------

async function loadReputation() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Reputation</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetReputation();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Reputation</h1>' + errHtml(result.error); return; }

  var players = result.players || [];
  var factions = result.factions || [];
  var reputation = result.reputation || [];

  // Build lookup: hero_name+faction_name → reputation value
  var repLookup = {};
  reputation.forEach(function(r) { repLookup[r.hero_name + '|||' + r.faction_name] = r.reputation; });

  var REP_VALUES = ['hostile', 'negative', 'neutral', 'positive', 'ally'];

  var html =
    '<h1 class="section-title">Reputation</h1>' +
    '<p class="section-subtitle">Changes auto-save on dropdown selection.</p>' +
    '<div class="rep-grid-wrapper"><table class="rep-grid"><thead><tr><th>Player</th>';

  factions.forEach(function(f) { html += '<th>' + escHtml(f) + '</th>'; });
  html += '</tr></thead><tbody>';

  players.forEach(function(heroName) {
    html += '<tr><td class="player-col">' + escHtml(heroName) + '</td>';
    factions.forEach(function(factionName) {
      var current = repLookup[heroName + '|||' + factionName] || 'neutral';
      html += '<td><select class="rep-select rep-' + current + '" data-hero="' + escAttr(heroName) + '" data-faction="' + escAttr(factionName) + '">';
      REP_VALUES.forEach(function(v) {
        html += '<option value="' + v + '"' + (v === current ? ' selected' : '') + '>' + v + '</option>';
      });
      html += '</select></td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table></div><div id="repStatus" class="status-msg" style="margin-top:12px;"></div>';
  content.innerHTML = html;

  content.querySelectorAll('.rep-select').forEach(function(sel) {
    sel.addEventListener('change', async function() {
      var heroName = sel.getAttribute('data-hero');
      var factionName = sel.getAttribute('data-faction');
      var newRep = sel.value;

      // Update color class
      sel.className = 'rep-select rep-' + newRep;

      var result = await adminUpdateReputation(heroName, factionName, newRep);
      var statusEl = document.getElementById('repStatus');
      if (result.success) {
        statusEl.textContent = heroName + ' × ' + factionName + ' → ' + newRep;
        statusEl.className = 'status-msg status-ok';
      } else {
        statusEl.textContent = result.error;
        statusEl.className = 'status-msg status-err';
      }
      setTimeout(function() { statusEl.textContent = ''; }, 2500);
    });
  });
}

// -----------------------------------------------
// CHARACTERS
// -----------------------------------------------

var editingCharacter = null;

async function loadCharacters() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Characters</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetAllCharacters();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Characters</h1>' + errHtml(result.error); return; }

  renderCharactersView(result.characters || []);
}

function renderCharactersView(characters) {
  var content = document.getElementById('adminContent');

  // Split into players and NPCs for visual grouping
  var playerChars = characters.filter(function(c) { return c.type === 'player'; });
  var npcChars = characters.filter(function(c) { return c.type !== 'player'; });

  function buildCard(c) {
    var isHidden = c.profile_visible !== 'yes';
    var isPlayer = c.type === 'player';
    var borderStyle = isPlayer ? 'border-left: 3px solid var(--accent-green);' : '';
    return '<div class="roster-card ' + (isHidden ? 'roster-card-hidden' : '') + '" data-char="' + escAttr(c.character_name) + '" style="' + borderStyle + '">' +
      (isPlayer ? '<div style="font-size:0.6rem;font-weight:700;color:var(--accent-green);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">PLAYER</div>' : '') +
      '<div class="roster-card-name">' + escHtml(c.character_name) + (isHidden ? ' <span style="font-size:0.7rem;opacity:0.7;">(hidden)</span>' : '') + '</div>' +
      (isPlayer && c.username ? '<div style="font-size:0.7rem;color:var(--text-muted);">@' + escHtml(c.username) + '</div>' : '') +
      '<div class="roster-card-sub">' + escHtml(c.faction_role || c.faction || '') + '</div>' +
      '<div class="roster-card-type ' + (isPlayer ? 'roster-card-player' : 'roster-card-npc') + '">' + escHtml(c.class || '') + '</div>' +
      '</div>';
  }

  var cardsHtml = '<div class="roster-grid">';
  cardsHtml += '<div class="roster-card" id="newCharBtn" style="display:flex;align-items:center;justify-content:center;min-height:90px;border-style:dashed;"><span style="font-size:1.5rem;color:var(--accent-yellow);">+ New Character</span></div>';

  if (playerChars.length > 0) {
    cardsHtml += '<div style="grid-column:1/-1;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent-green);padding:4px 0 2px;">Player Characters (' + playerChars.length + ')</div>';
    playerChars.forEach(function(c) { cardsHtml += buildCard(c); });
    cardsHtml += '<div style="grid-column:1/-1;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent-blue);padding:8px 0 2px;">NPCs (' + npcChars.length + ')</div>';
  }
  npcChars.forEach(function(c) { cardsHtml += buildCard(c); });
  cardsHtml += '</div>';

  // Sync button — creates Characters entries for players who registered before auto-create was added
  var syncHtml = '<div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;">' +
    '<button class="btn-secondary btn-small" id="syncPlayersBtn">Sync Players → Characters</button>' +
    '<span class="status-msg" id="syncStatus" style="font-size:0.8rem;"></span>' +
    '</div>';

  var formHtml = editingCharacter !== null ? buildCharacterForm(editingCharacter) : '<div class="empty-state">Click a character to edit, or click + New Character.</div>';

  content.innerHTML =
    '<h1 class="section-title">Characters</h1>' +
    syncHtml +
    '<div class="two-col">' +
    '<div>' + cardsHtml + '</div>' +
    '<div id="charFormArea">' + formHtml + '</div>' +
    '</div>';

  document.getElementById('syncPlayersBtn').addEventListener('click', async function() {
    var btn = document.getElementById('syncPlayersBtn');
    btn.disabled = true;
    btn.textContent = 'Syncing...';
    var result = await adminSyncPlayers();
    btn.disabled = false;
    btn.textContent = 'Sync Players → Characters';
    if (result.success) {
      var msg = result.created > 0
        ? result.created + ' player character(s) created. Refreshing...'
        : 'All players already have character entries.';
      showStatus('syncStatus', msg, true);
      if (result.created > 0) {
        var fresh = await adminGetAllCharacters();
        if (fresh.success) renderCharactersView(fresh.characters || []);
      }
    } else {
      showStatus('syncStatus', result.error, false);
    }
  });

  document.getElementById('newCharBtn').addEventListener('click', function() {
    editingCharacter = {};
    document.getElementById('charFormArea').innerHTML = buildCharacterForm({});
    wireCharacterForm();
  });

  content.querySelectorAll('[data-char]').forEach(function(card) {
    card.addEventListener('click', function() {
      var name = card.getAttribute('data-char');
      editingCharacter = characters.find(function(c) { return c.character_name === name; }) || {};
      document.getElementById('charFormArea').innerHTML = buildCharacterForm(editingCharacter);
      wireCharacterForm();
    });
  });

  if (editingCharacter !== null) wireCharacterForm();
}

function buildCharacterForm(c) {
  var isNew = !c.character_name;
  return '<div class="admin-form">' +
    '<div class="form-section-title">' + (isNew ? 'New Character' : 'Edit: ' + escHtml(c.character_name)) + '</div>' +
    formField('character_name', 'Character Name', c.character_name, 'text', isNew ? '' : 'disabled') +
    '<div class="form-row-inline">' +
    formFieldInline('type', 'Type', c.type, 'select', 'npc,player') +
    formFieldInline('class', 'Class', c.class, 'select', 'Hero,Celebrity,Politician,Sleuth,Tycoon,Visionary,Mogul,Mercenary,Champion,Philanthropist') +
    '</div>' +
    (c.type === 'player' && c.username ? '<div class="form-row"><label>Linked Account</label><input class="form-input" value="' + escAttr(c.username) + '" disabled style="opacity:0.6;cursor:default;"></div>' : '') +
    formField('faction', 'Faction', c.faction, 'text') +
    formField('faction_role', 'Faction Role', c.faction_role, 'text') +
    formField('bio', 'Bio', c.bio, 'textarea') +
    '<div class="form-row-inline">' +
    formFieldInline('profile_visible', 'Profile Visible', c.profile_visible, 'select', 'yes,no') +
    formFieldInline('asset_slug', 'Asset Slug', c.asset_slug, 'text') +
    '</div>' +

    '<div class="form-section-title">Images (from admin upload)</div>' +
    formField('profile_url', 'Profile Image URL', c.profile_url, 'text') +
    formField('cutout_url', 'Cutout URL (for Bliink)', c.cutout_url, 'text') +

    '<div class="form-section-title">Upload New Image</div>' +
    '<div class="form-row-inline">' +
    '<div class="form-row" style="flex:1"><label>Profile Image</label>' + uploadWidget('charProfileUpload', 'charProfileUrl', 'profile_url') + '</div>' +
    '<div class="form-row" style="flex:1"><label>Cutout Image</label>' + uploadWidget('charCutoutUpload', 'charCutoutUrl', 'cutout_url') + '</div>' +
    '</div>' +

    '<div class="btn-row">' +
    '<button class="btn-primary" id="saveCharBtn">' + (isNew ? 'Create Character' : 'Save Changes') + '</button>' +
    '</div>' +
    '<div id="charStatus" class="status-msg"></div>' +
    '</div>';
}

function wireCharacterForm() {
  wireUploadWidget('charProfileUpload', 'charProfileUrl', 'profile_url');
  wireUploadWidget('charCutoutUpload', 'charCutoutUrl', 'cutout_url');

  var saveBtn = document.getElementById('saveCharBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async function() {
    var data = collectFormValues(['character_name', 'type', 'class', 'faction', 'faction_role', 'bio', 'profile_visible', 'asset_slug', 'profile_url', 'cutout_url']);

    if (!data.character_name) { showStatus('charStatus', 'Character name is required.', false); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    var result = await adminSaveCharacter(data);
    if (result.success) {
      showStatus('charStatus', 'Saved!', true);
      editingCharacter = data;
      var fresh = await adminGetAllCharacters();
      if (fresh.success) renderCharactersView(fresh.characters || []);
    } else {
      showStatus('charStatus', result.error, false);
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  });
}

// -----------------------------------------------
// FACTIONS
// -----------------------------------------------

var editingFaction = null;

async function loadFactions() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Factions</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetFactions();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Factions</h1>' + errHtml(result.error); return; }

  renderFactionsView(result.factions || []);
}

function renderFactionsView(factions) {
  var content = document.getElementById('adminContent');

  var cardsHtml = '<div class="roster-grid">';
  cardsHtml += '<div class="roster-card" id="newFactionBtn" style="display:flex;align-items:center;justify-content:center;min-height:90px;border-style:dashed;"><span style="font-size:1.5rem;color:var(--accent-yellow);">+ New Faction</span></div>';
  factions.forEach(function(f) {
    cardsHtml +=
      '<div class="roster-card" data-faction="' + escAttr(f.faction_name) + '">' +
      '<div class="roster-card-name">' + escHtml(f.faction_name) + '</div>' +
      '<div class="roster-card-sub">Leader: ' + escHtml(f.leader || 'None') + '</div>' +
      '<div class="roster-card-type text-muted">Power: ' + escHtml(String(f.power_multiplier || 1)) + '</div>' +
      '</div>';
  });
  cardsHtml += '</div>';

  var formHtml = editingFaction !== null ? buildFactionForm(editingFaction) : '<div class="empty-state">Click a faction to edit, or click + New Faction.</div>';

  content.innerHTML =
    '<h1 class="section-title">Factions</h1>' +
    '<div class="two-col">' +
    '<div>' + cardsHtml + '</div>' +
    '<div id="factionFormArea">' + formHtml + '</div>' +
    '</div>';

  document.getElementById('newFactionBtn').addEventListener('click', function() {
    editingFaction = {};
    document.getElementById('factionFormArea').innerHTML = buildFactionForm({});
    wireFactionForm();
  });

  content.querySelectorAll('[data-faction]').forEach(function(card) {
    card.addEventListener('click', function() {
      var name = card.getAttribute('data-faction');
      editingFaction = factions.find(function(f) { return f.faction_name === name; }) || {};
      document.getElementById('factionFormArea').innerHTML = buildFactionForm(editingFaction);
      wireFactionForm();
    });
  });

  if (editingFaction !== null) wireFactionForm();
}

function buildFactionForm(f) {
  var isNew = !f.faction_name;
  return '<div class="admin-form">' +
    '<div class="form-section-title">' + (isNew ? 'New Faction' : 'Edit: ' + escHtml(f.faction_name)) + '</div>' +
    formField('faction_name', 'Faction Name', f.faction_name, 'text', isNew ? '' : 'disabled') +
    formField('description', 'Description', f.description, 'textarea') +
    '<div class="form-row-inline">' +
    formFieldInline('leader', 'Leader (character name)', f.leader, 'text') +
    formFieldInline('power_multiplier', 'Power Multiplier', f.power_multiplier || '1', 'text') +
    '</div>' +
    formFieldInline('members_public', 'Members Public', f.members_public, 'select', 'yes,no') +
    formField('asset_slug', 'Asset Slug', f.asset_slug, 'text') +
    formField('banner_url', 'Banner Image URL', f.banner_url, 'text') +

    '<div class="form-section-title">Upload Banner Image</div>' +
    '<div class="form-row">' + uploadWidget('factionBannerUpload', 'factionBannerUrl', 'banner_url') + '</div>' +

    '<div class="btn-row">' +
    '<button class="btn-primary" id="saveFactionBtn">' + (isNew ? 'Create Faction' : 'Save Changes') + '</button>' +
    '</div>' +
    '<div id="factionStatus" class="status-msg"></div>' +
    '</div>';
}

function wireFactionForm() {
  wireUploadWidget('factionBannerUpload', 'factionBannerUrl', 'banner_url');

  var saveBtn = document.getElementById('saveFactionBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async function() {
    var data = collectFormValues(['faction_name', 'description', 'leader', 'power_multiplier', 'members_public', 'asset_slug', 'banner_url']);

    if (!data.faction_name) { showStatus('factionStatus', 'Faction name is required.', false); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    var result = await adminSaveFaction(data);
    if (result.success) {
      var msg = 'Saved!';
      if (result.isNew) msg += ' Neutral reputation rows added for all existing players.';
      showStatus('factionStatus', msg, true);
      editingFaction = data;
      var fresh = await adminGetFactions();
      if (fresh.success) renderFactionsView(fresh.factions || []);
    } else {
      showStatus('factionStatus', result.error, false);
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  });
}

// -----------------------------------------------
// PLACES
// -----------------------------------------------

var editingPlace = null;

async function loadPlaces() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Places</h1><div class="loading-msg">Loading...</div>';

  var result = await adminGetPlaces();
  if (!result.success) { content.innerHTML = '<h1 class="section-title">Places</h1>' + errHtml(result.error); return; }

  renderPlacesView(result.places || []);
}

function renderPlacesView(places) {
  var content = document.getElementById('adminContent');

  var placesHtml = '<div class="places-grid">' +
    '<div class="place-card" id="newPlaceBtn" style="display:flex;align-items:center;justify-content:center;min-height:110px;border:2px dashed rgba(255,255,255,0.2);border-radius:8px;cursor:pointer;">' +
    '<span style="font-size:1.3rem;color:var(--accent-yellow);">+ New Place</span></div>';

  places.forEach(function(p) {
    placesHtml +=
      '<div class="place-card" data-slug="' + escAttr(p.slug) + '">' +
      (p.background_url ? '<img class="place-card-img" src="' + escAttr(p.background_url) + '" alt="" loading="lazy">' : '<div class="place-card-img" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);">No Image</div>') +
      '<div class="place-card-label">' + escHtml(p.label || '') + '</div>' +
      '<div class="place-card-slug">' + escHtml(p.slug || '') + '</div>' +
      '</div>';
  });
  placesHtml += '</div>';

  var formHtml = editingPlace !== null ? buildPlaceForm(editingPlace) : '<div class="empty-state">Click a place to edit, or click + New Place.</div>';

  content.innerHTML =
    '<h1 class="section-title">Places</h1>' +
    '<p class="section-subtitle">Bliink background scenes. Players see these in the post composer.</p>' +
    '<div class="two-col">' +
    '<div>' + placesHtml + '</div>' +
    '<div id="placeFormArea">' + formHtml + '</div>' +
    '</div>';

  document.getElementById('newPlaceBtn').addEventListener('click', function() {
    editingPlace = {};
    document.getElementById('placeFormArea').innerHTML = buildPlaceForm({});
    wirePlaceForm();
  });

  content.querySelectorAll('[data-slug]').forEach(function(card) {
    card.addEventListener('click', function() {
      var slug = card.getAttribute('data-slug');
      editingPlace = places.find(function(p) { return p.slug === slug; }) || {};
      document.getElementById('placeFormArea').innerHTML = buildPlaceForm(editingPlace);
      wirePlaceForm();
    });
  });

  if (editingPlace !== null) wirePlaceForm();
}

function buildPlaceForm(p) {
  var isNew = !p.slug;
  return '<div class="admin-form">' +
    '<div class="form-section-title">' + (isNew ? 'New Place' : 'Edit: ' + escHtml(p.label || p.slug)) + '</div>' +
    formField('slug', 'Slug (lowercase, hyphens only)', p.slug, 'text', isNew ? '' : 'disabled') +
    formField('label', 'Label (display name)', p.label, 'text') +
    formField('background_url', 'Background Image URL', p.background_url, 'text') +
    '<div class="form-section-title">Upload Background Image</div>' +
    '<div class="form-row">' + uploadWidget('placeBgUpload', 'placeBgUrl', 'background_url') + '</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" id="savePlaceBtn">' + (isNew ? 'Create Place' : 'Save Changes') + '</button>' +
    '</div>' +
    '<div id="placeStatus" class="status-msg"></div>' +
    '</div>';
}

function wirePlaceForm() {
  wireUploadWidget('placeBgUpload', 'placeBgUrl', 'background_url');

  var saveBtn = document.getElementById('savePlaceBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async function() {
    var data = collectFormValues(['slug', 'label', 'background_url']);

    if (!data.slug || !data.label) { showStatus('placeStatus', 'Slug and label are required.', false); return; }
    if (!/^[a-z0-9-]+$/.test(data.slug)) { showStatus('placeStatus', 'Slug must be lowercase letters, numbers, and hyphens only.', false); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    var result = await adminSavePlace(data);
    if (result.success) {
      showStatus('placeStatus', 'Saved!', true);
      editingPlace = data;
      var fresh = await adminGetPlaces();
      if (fresh.success) renderPlacesView(fresh.places || []);
    } else {
      showStatus('placeStatus', result.error, false);
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  });
}

// -----------------------------------------------
// ASSETS
// -----------------------------------------------

async function loadAssets() {
  var content = document.getElementById('adminContent');
  content.innerHTML = '<h1 class="section-title">Assets</h1><div class="loading-msg">Loading...</div>';

  var [charResult, factionResult, placesResult] = await Promise.all([
    adminGetAllCharacters(),
    adminGetFactions(),
    adminGetPlaces(),
  ]);

  var characters = (charResult.success && charResult.characters) ? charResult.characters : [];
  var factions = (factionResult.success && factionResult.factions) ? factionResult.factions : [];
  var places = (placesResult.success && placesResult.places) ? placesResult.places : [];

  // Build asset lists for each category
  var profileAssets = [];
  var cutoutAssets = [];
  characters.forEach(function(c) {
    var name = c.character_name || '(unnamed)';
    var profileUrl = c.profile_url || (c.asset_slug ? '/assets/characters/' + c.asset_slug + '/profile.webp' : '');
    var cutoutUrl = c.cutout_url || (c.asset_slug ? '/assets/characters/' + c.asset_slug + '/cutout.webp' : '');
    if (profileUrl) profileAssets.push({ name: name, url: profileUrl });
    if (cutoutUrl) cutoutAssets.push({ name: name + ' (cutout)', url: cutoutUrl });
  });

  var bannerAssets = [];
  factions.forEach(function(f) {
    var name = f.faction_name || '(unnamed)';
    var bannerUrl = f.banner_url || (f.asset_slug ? '/assets/factions/' + f.asset_slug + '/banner.png' : '');
    if (bannerUrl) bannerAssets.push({ name: name, url: bannerUrl });
  });

  var bgAssets = [];
  places.forEach(function(p) {
    if (p.background_url) bgAssets.push({ name: p.label || p.slug || '(unnamed)', url: p.background_url });
  });

  function buildAssetSection(title, assets) {
    if (assets.length === 0) return '<div class="form-section-title">' + title + '</div><div class="empty-state" style="margin-bottom:24px;">None configured yet.</div>';
    var html = '<div class="form-section-title">' + title + ' (' + assets.length + ')</div>';
    html += '<div class="asset-gallery">';
    assets.forEach(function(a) {
      html += '<div class="asset-card">' +
        '<div class="asset-card-name">' + escHtml(a.name) + '</div>' +
        '<div class="asset-url-row">' +
        '<span class="asset-url-text" title="' + escAttr(a.url) + '">' + escHtml(a.url.length > 40 ? '...' + a.url.slice(-40) : a.url) + '</span>' +
        '<button class="btn-secondary btn-small copy-url-btn" data-url="' + escAttr(a.url) + '">Copy</button>' +
        '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  content.innerHTML =
    '<h1 class="section-title">Assets</h1>' +
    '<p class="section-subtitle">All images available for use in posts, characters, and factions. Click Copy to get the URL.</p>' +
    '<div id="assetsContainer">' +
    buildAssetSection('Place Backgrounds', bgAssets) +
    buildAssetSection('Character Profiles', profileAssets) +
    buildAssetSection('Character Cutouts', cutoutAssets) +
    buildAssetSection('Faction Banners', bannerAssets) +
    '</div>' +
    '<div id="copyToast" style="display:none;position:fixed;bottom:24px;right:24px;background:var(--accent-green);color:#000;padding:10px 18px;border-radius:6px;font-weight:700;font-size:0.85rem;z-index:999;">Copied!</div>';

  // Copy URL buttons — listener on assetsContainer (recreated on each visit) rather than
  // the persistent content div, so handlers don't stack up across navigations.
  document.getElementById('assetsContainer').addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-url-btn')) {
      var url = e.target.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(function() {
        var toast = document.getElementById('copyToast');
        if (toast) {
          toast.style.display = 'block';
          setTimeout(function() { toast.style.display = 'none'; }, 1800);
        }
      });
    }
  });
}

// -----------------------------------------------
// IMAGE UPLOAD WIDGET
// -----------------------------------------------

// Renders the upload widget HTML (file input + upload button + preview)
// inputId: the file input element id
// statusId: element that shows the final URL
// fieldId: the form field id that gets populated with the URL
function uploadWidget(inputId, statusId, fieldId) {
  return '<div class="image-upload-area">' +
    '<input type="file" id="' + inputId + '" accept="image/*">' +
    '<button class="btn-secondary btn-small" id="' + inputId + 'Btn">Upload to imgbb</button>' +
    '<img id="' + inputId + 'Preview" class="image-preview" src="" alt="">' +
    '<div id="' + statusId + '" class="upload-url-display"></div>' +
    '</div>';
}

// Wire up the file input + upload button for an upload widget
function wireUploadWidget(inputId, statusId, fieldId) {
  var fileInput = document.getElementById(inputId);
  var uploadBtn = document.getElementById(inputId + 'Btn');
  var preview = document.getElementById(inputId + 'Preview');
  var statusEl = document.getElementById(statusId);

  if (!fileInput || !uploadBtn) return;

  var pendingBase64 = null;
  var pendingName = null;

  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      var dataUrl = e.target.result;
      pendingBase64 = dataUrl.split(',')[1]; // strip the "data:image/...;base64," prefix
      pendingName = file.name;

      if (preview) {
        preview.src = dataUrl;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  uploadBtn.addEventListener('click', async function() {
    if (!pendingBase64) { alert('Select an image file first.'); return; }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    if (statusEl) statusEl.textContent = '';

    var result = await adminUploadImage(pendingBase64, pendingName);

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload to imgbb';

    if (result.success) {
      if (statusEl) statusEl.textContent = result.url;
      // Populate the corresponding URL form field
      var urlField = document.getElementById(fieldId);
      if (urlField) urlField.value = result.url;
    } else {
      if (statusEl) statusEl.textContent = 'Upload failed: ' + result.error;
    }
  });
}

// -----------------------------------------------
// FORM HELPERS
// -----------------------------------------------

function formField(id, label, value, type, extra) {
  var val = value || '';
  var extraAttr = extra || '';
  if (type === 'textarea') {
    return '<div class="form-row"><label>' + label + '</label><textarea id="' + id + '" class="form-textarea" ' + extraAttr + '>' + escHtml(String(val)) + '</textarea></div>';
  }
  if (type === 'select') {
    // Not used for standard formField — use formFieldInline for selects
    return '<div class="form-row"><label>' + label + '</label><input id="' + id + '" class="form-input" value="' + escAttr(String(val)) + '" ' + extraAttr + '></div>';
  }
  return '<div class="form-row"><label>' + label + '</label><input id="' + id + '" class="form-input" value="' + escAttr(String(val)) + '" ' + extraAttr + '></div>';
}

function formFieldInline(id, label, value, type, options) {
  var val = value || '';
  if (type === 'select' && options) {
    var optHtml = options.split(',').map(function(o) {
      return '<option value="' + escAttr(o) + '"' + (o === val ? ' selected' : '') + '>' + escHtml(o) + '</option>';
    }).join('');
    return '<div class="form-row"><label>' + label + '</label><select id="' + id + '" class="form-select">' + optHtml + '</select></div>';
  }
  return '<div class="form-row"><label>' + label + '</label><input id="' + id + '" class="form-input" value="' + escAttr(String(val)) + '"></div>';
}

// Collect form field values by ID into an object
function collectFormValues(fields) {
  var data = {};
  fields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  return data;
}

// -----------------------------------------------
// UTILITIES
// -----------------------------------------------

function showStatus(elementId, message, isSuccess) {
  var el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = 'status-msg ' + (isSuccess ? 'status-ok' : 'status-err');
  if (isSuccess) setTimeout(function() { el.textContent = ''; el.className = 'status-msg'; }, 3000);
}

function errHtml(msg) {
  return '<div class="status-msg status-err">' + escHtml(msg || 'Unknown error') + '</div>';
}

// Escape HTML special characters (prevents XSS when rendering user data)
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escape for use inside HTML attribute values
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
