# MyHERO — Project Context for Claude

## What This Is

An asynchronous multiplayer social-strategy RPG played through a web dashboard. ~10 friends play as heroes in a city. The DM (Max) runs the game manually — reviewing actions, writing NPC content, updating stats in Google Sheets.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks). Comic book visual theme (Bangers font, bold colors, panel borders).
- **Database:** Google Sheets (spreadsheet ID: `1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc`)
- **Backend:** Netlify Functions (serverless). Single function at `netlify/functions/api.js` handles all API requests. Auto-deploys with git push.
- **Admin/Dev Access:** Google Service Account. Credentials stored as `GOOGLE_CREDENTIALS` environment variable on Netlify. Local `credentials.json` in project root (in .gitignore, never commit).
- **Hosting:** Netlify — live at https://myherogame.netlify.app, auto-deploys from GitHub (github.com/maxcannoniv/myhero)
- **Legacy:** Google Apps Script was the original backend but has been fully replaced by Netlify Functions. `google-apps-script-clean.js` is kept in repo for reference but is no longer active.

## Key Files

**Player-facing:**
- `index.html` — Landing page (in-universe "Emergency Alert" from the Mayor)
- `classes.html` — Class/archetype showcase ("Roles We Need Most")
- `login.html` — Login + signup with skill point allocation
- `dashboard.html` — Player terminal (phone-style app launcher with 9 apps)
- `css/style.css` — All styling (comic book theme, per-feed styles, messages, character + faction popups)
- `js/auth.js` — Login, signup, password hashing, session management, class skill data
- `js/sheets.js` — API communication layer (calls Netlify Functions). Includes both player API calls and admin API calls.
- `js/dashboard.js` — Terminal navigation, feed rendering (5 distinct styles), Bliink posting + compositing (backgrounds + cutouts loaded dynamically from Sheets), messaging (inbox/threads/contacts), character + faction popups, clickable names, `[Name]` syntax

**Admin portal (DM only — not linked from player pages):**
- `admin.html` — Game Manager portal. Login-gated. Requires `ADMIN_PASSWORD` env var on Netlify.
- `css/admin.css` — Admin portal styles (dark theme, sidebar layout, tables, forms)
- `js/admin.js` — All admin logic: auth, 11 sections (Dashboard, NPC Inbox, Post Composer, Missions, Cycle, Players, Reputation, Characters, Factions, Places, Assets)

**Backend:**
- `netlify/functions/api.js` — **The backend**. Handles all API actions: player routes (login, register, getHeroData, getFeed, createPost, getInbox, getThread, sendMessage, getContacts, addContact, getCharacter, getFaction, getMissions, getMissionQuestions, submitMission, getCharacters, getPlaces) + admin routes (adminLogin, adminGetOverview, adminGetNPCInbox, adminSendMessage, adminGetAllPosts, adminCreatePost, adminUpdatePost, adminGetMissionSubmissions, adminResolveMission, adminAdvanceCycle, adminGetPlayers, adminUpdatePlayer, adminGetReputation, adminUpdateReputation, adminGetAllCharacters, adminSaveCharacter, adminGetFactions, adminSaveFaction, adminUploadImage, adminGetPlaces, adminSavePlace, adminSyncPlayers, adminMarkNpcMessagesRead). All admin routes verified by `verifyAdmin()`.
- `netlify.toml` — Netlify config (publish dir, functions dir, esbuild bundler)

**Setup scripts (run once or as needed):**
- `setup-sheet.js` — Node script to set up Players tab
- `setup-new-tabs.js` — Creates Characters and Factions tabs with initial NPC/faction data
- `setup-feeds.js` — Creates Feeds tab with sample posts
- `setup-messages.js` — Creates Messages and Contacts tabs
- `setup-reputation.js` — Fills missing Reputation rows (player × faction = neutral). Safe to run after adding new factions — additive only, never overwrites custom values.
- `process-assets.js` — Drop folder processor. Move image files into `_drop/` subfolders, run this script, it slugifies, moves to `assets/`, updates Sheets asset_slug column.
- `sync-assets.js` — Read-only asset checker. Cross-references `assets/` folders vs. Sheets. Run to see what's missing or mismatched.

**Other:**
- `google-apps-script-clean.js` — Legacy Apps Script code (no longer active, kept for reference)
- `credentials.json` — Service account key (in .gitignore, never commit)

## Game Design

### Skills (6 total, scale 1-10, 3 = average person, 20 starting points)
- **Might** — combat, physical power, endurance, intimidation
- **Agility** — speed, reflexes, stealth, acrobatics
- **Charm** — persuasion, negotiation, public presence, performance
- **Intuition** — reading people, spotting danger, investigation, gut feeling
- **Commerce** — money, deals, market leverage, resource acquisition
- **Intelligence** — knowledge, tech, hacking, analysis, strategic planning

### Aggregate Scores (derived, NOT skills — displayed prominently on profile)
- **Followers** — social following (tied to Bliink activity)
- **Bank** — money/currency (was "net worth")
- **Authority** — positional power, rank, official standing
- **Clout** — weighted factional influence across all factions (faction standing × faction power multiplier)

### In-Universe Framing
- **myHERO** is an in-world app (like Upwork/Fiverr/Uber for hero jobs), NOT the name of the whole game
- The **dashboard** is a "terminal" — a phone-style device with apps
- All feeds (myHERO, Bliink, The Times Today, Streetview, Daily Dollar, Messages, Profile, Inventory, Notebook) are presented as individual apps on the 3×3 terminal home screen

### Characters
- A **character** can be created by a player (player character) or by the DM (NPC)
- NPCs and player characters are presented identically — players cannot tell who is real
- Characters appear in feeds, messages, and missions the same way regardless of type

### Factions (known so far)

**Streetview** — An off-the-books, noir-inspired group of investigators. Not associated with myHERO. Operates in the shadows. Think Batman meets McGruff the Crime Dog. Their public face is the Streetview blog.
- **Leader: Bloodhound** — Sleuth archetype. McGruff the Crime Dog + The Question inspired. Has a super-smell ability. Face is never seen — shadows and concealment hint at hound-like features. Capable fighter. Operates like a private eye. Lead writer of the Streetview blog.

**Mongrel's Towing** — A towing company that doubles as low-level bounty hunters and repo men. Low-level villains.
- **Leader: Mongrel** — Dog the Bounty Hunter inspired. Runs the operation.
- **Dozer** — Mongrel's right-hand man. Brute-type big man bruiser.

**myHERO** — The officially sanctioned superhero organization. More details TBD.

**Wednesday Wealth Investor's Club** — A low-level investors club that meets on Wednesdays. Most members are neutral/decent, but a few are unscrupulous. Partly funded by Cornerstone Holdings (the members don't all know this). No leader created yet.

**Cornerstone Holdings** — A powerful holding company operating behind the scenes. Invests in construction, a security company, and is a secret part-owner of Mongrel's Towing (not publicly known). Uses the Wednesday Wealth club to funnel money.
- **Leader: Head Honcho** — Tycoon archetype. The power behind it all. Everything is leverage. (profile_visible: no — hidden from players initially)

### Inventory System
- Players have an **inventory** that holds two types of things: **items** and **notes**
- **Items** — objects, tools, currency items, rewards, etc.
- **Notes** — secret content items. Each note has a `content_id` pointing to hidden content in Sheets (text + images). Clicking a note opens a popup overlay showing the secret content. Creates **asymmetric information** — only the holder can see it.
- **Note delivery flow:** NPC sends a message → player saves the message as a note → note appears in inventory → player can click to view secret content anytime
- Notes enable hidden pages/clues/intel that only specific players can access
- Security is "good enough for friends" — content is loaded by ID, no ID = no access

### Classes (10 archetypes, each has recommended skill defaults, players can redistribute)
Hero, Celebrity, Politician, Sleuth, Tycoon, Visionary, Mogul, Mercenary, Champion, Philanthropist

### Feeds / Apps on Dashboard
- **myHERO** — Jobs, missions, hero activity
- **Bliink** — Social media feed (like Instagram)
- **Streetview** — Bloodhound's investigator blog (DM-written)
- **Daily Dollar** — Financial/news feed, WSJ-inspired (DM-written)
- **The Times Today** — Local community newspaper, broadsheet style. For city-wide updates all players should see. Feed key in Sheets: `todaystidbit`. Icon label: "The Times"
- **Messages** — Private comms between characters
- **Profile** — Hero stats, inventory, bank

### Missions
- Branching choose-your-own-adventure style (up to 5 questions, 2-3 choices each, no going back)
- Answers recorded to Sheets for DM review
- DM manually updates stats after review (automation later)
- 3 initial missions, each player picks 1

### Asset System

All visual assets live under `assets/` in the repo. Netlify serves them as static files — no image hosting needed. Run `node sync-assets.js` anytime to check what's wired up vs. missing.

**Folder structure:**
```
assets/
  characters/{slug}/
    profile.png     ← headshot shown in character popup
    cutout.png      ← transparent PNG for Bliink post composing
  factions/{slug}/
    banner.png      ← image shown in faction popup
  places/{slug}/
    background.png  ← background scene for Bliink posts
```

**Slug naming convention:** always lowercase, hyphens for spaces (e.g. `head-honcho`, `mongrels-towing`). Never use capitals or spaces in slug names — folder names must match exactly.

**How it works — two parallel systems:**

*Local file assets (original system — still active):*
- Characters tab in Sheets has `asset_slug` column → frontend builds path `/assets/characters/{slug}/profile.png`
- Factions tab in Sheets has `asset_slug` column → frontend builds path `/assets/factions/{slug}/banner.png`
- If `asset_slug` is blank, popups fall back to a text initial placeholder

*Admin portal image URLs (new system):*
- Characters tab now also has `profile_url` and `cutout_url` columns — direct image URLs (e.g. from imgbb)
- Factions tab now also has `banner_url` column — direct URL shown as banner image in faction popup
- Places tab in Sheets stores Bliink backgrounds: columns `slug`, `label`, `background_url`
- `profile_url` takes priority over `asset_slug` path in the character popup
- Bliink backgrounds load from the Places tab; cutouts load from characters with `cutout_url` set
- Both systems fall back gracefully: if `profile_url` is blank, falls back to `asset_slug` path; if Places tab is empty, falls back to hardcoded backgrounds

**IMAGE SIZE WARNING — read before adding any asset:**
Raw image files from AI generators, design tools, or phone cameras are typically 2–5 MB each. Netlify serves them at full resolution — the browser downloads the whole file every time it loads that image in a feed or popup. At that size, loading multiple images simultaneously (e.g. opening Bliink, viewing several character popups, or loading the admin Assets page) can consume hundreds of MB of browser memory and crash the tab.

**Target: under 200 KB per image before committing.** This is roughly 15–20× smaller than a raw file. Quality is barely affected at 80% compression.

**How to compress (required before step 4):**
1. Go to [squoosh.app](https://squoosh.app) — free, no install, runs in your browser
2. Drag in your image
3. On the right panel, change the format dropdown to **WebP** (WebP supports transparency, so use it for cutouts too — not PNG)
4. Drag the quality slider to **~80%** — watch the file size in the bottom bar drop
5. Click the download arrow — save the compressed file
6. Replace the original file in `assets/` with the compressed version before running `git push`

**Cutout-specific compression settings (confirmed):** WebP format, resize width to **650px**, quality ~80%. Width reduction is more effective than quality reduction for hitting the 200 KB target on cutouts. 650px is plenty — cutouts are never displayed at full resolution in the Bliink composer.

**Re-compressing already-processed assets (no drop folder needed):**
If a file is already in the correct `assets/` subfolder and just needs to be smaller:
1. Drag the file from Finder into squoosh.app
2. Adjust width (650px for cutouts) and quality (~80%) until file size is under 200 KB
3. Download the compressed file, rename it to match the original (e.g. `cutout.webp`)
4. Drag it back into the same folder in Finder, replacing the old file
5. Git push — no need to re-run `process-assets.js`

**Workflow for new assets (use this every time):**
1. Name the file after the character/faction/place. Spaces and capitals are fine — the script handles the rest.
   - e.g. `Aurora Edge.png` → slug `aurora-edge`
2. Drop it into the right `_drop/` subfolder:
   - `_drop/characters/` → profile headshots
   - `_drop/cutouts/` → transparent PNGs for Bliink compositing
   - `_drop/factions/` → faction banner images
   - `_drop/places/` → background scenes for Bliink posts
3. Run: `node process-assets.js`
   - Moves files to correct `assets/` location with standardized filename
   - Updates `asset_slug` in Characters or Factions tab in Sheets (creates column if missing)
   - Clears the `_drop/` folder
   - Prints a summary and warnings for any Sheets mismatches
4. **Compress the output files** before pushing — see IMAGE SIZE WARNING above. Open the files now sitting in `assets/` in squoosh.app and replace them with compressed versions.
5. Git push → Netlify auto-deploys
6. Optionally run `node sync-assets.js` to verify everything is wired up

**Existing assets that still need compression:** bloodhound, mongrel, dozer, aurora-edge, smiles (profiles + cutouts), mongrels-towing-yard (background). All are currently 2–3.4 MB. Use squoosh.app to bring each under 200 KB before the next major push.

**Characters with assets (profile + cutout):** bloodhound, mongrel, dozer, aurora-edge, smiles
**Places with assets:** mongrels-towing-yard

### Player Mystery
Players don't know which characters are NPCs and which are real players. All characters are presented the same way in feeds and messages.

## Google Sheets Structure

**Tab: Players** — Columns: username, password_hash, hero_name, class, might, agility, charm, intuition, commerce, intelligence, followers, bank, positional_authority, clout

**Tab: Characters** — All characters (player + NPC). Columns: character_name, type (player/npc), username (blank for NPCs), class, bio, faction, faction_role, profile_visible, asset_slug, profile_url, cutout_url. `faction_role` is a short description of the character's position within their faction (e.g. "Owner of Mongrel's Towing", "Private Eye"). `asset_slug` is a lowercase identifier used to locate local assets in `assets/characters/{slug}/`. `profile_url` and `cutout_url` are optional direct image URLs (e.g. from imgbb); if set, they take priority over the asset_slug path.
**Tab: Factions** — Columns: faction_name, description, power_multiplier, leader, members_public (yes/no — controls whether the member list is shown in the faction popup), asset_slug (lowercase slug for local banner image), banner_url (optional direct image URL for faction popup banner — takes priority over asset_slug path)
**Tab: Places** — Bliink background scenes. Columns: slug (lowercase, hyphens), label (display name shown in composer), background_url (direct image URL). Loaded dynamically into the Bliink post composer. Falls back to hardcoded list if empty.
**Tab: Reputation** — Columns: hero_name, faction_name, reputation (hostile/negative/neutral/positive/ally). One row per player per faction. Will control visibility features in the future.

**Reputation maintenance routines:**
- **New player registers** → handled automatically by `handleRegister` in `api.js`. Neutral rows are added for all factions at signup. No manual action needed.
- **New faction added** → Use the Factions section in the admin portal. Reputation rows are created automatically for all existing players when the faction is saved. If adding directly to Sheets instead, run `node setup-reputation.js` afterward (additive only, never overwrites).
- **New character added** → no action needed. Reputation is player×faction only; NPC characters don't get reputation rows.

**Character auto-creation on registration:**
When a player registers, a Characters tab row is automatically created for their hero (`type: player`, `profile_visible: no`). The DM activates the character by flipping `profile_visible` to `yes` in the admin portal Characters section when ready. Until then, the character exists in Sheets but is invisible to all players. The `type` and `username` fields are never sent to the player-facing API — players cannot tell which characters are real people vs. NPCs.
**Tab: Inventory** — Per-player items and notes. Columns: username, item_name, type (item/note), content_id (for notes), description
**Tab: NoteContent** — Secret content for notes. Columns: content_id, title, body_text, image_url. Only loaded when a player with the note clicks it.
**Tab: Feeds** — All feed posts (all feeds in one tab). Columns: feed, posted_by, posted_by_type (character/faction/anonymous), title, image_url, body, timestamp, visible (yes/no), cutout_url (optional — character cutout layered over image_url in Bliink posts), cycle_id (format: `1.00.00.0` — cycle number + days/hours/10-min-block since cycle start)
**Tab: Messages** — All messages. Columns: from_character, to_character, body, timestamp, read (yes/no), cycle_id
**Tab: Settings** — Game-wide configuration. Columns: key, value. Current rows: `current_cycle` (integer), `cycle_start` (ISO timestamp). Updated automatically when DM clicks "Advance Cycle" in the admin portal.
**Tab: Contacts** — Player contact lists. Columns: hero_name, contact_name
**Tab: Missions** — Mission cards shown in the myHERO feed. Columns: mission_id, title, description, image_url, visible, cycle_id, outcome_a_label, outcome_a_narrative, outcome_a_image, outcome_a_changes, outcome_b_*, outcome_c_*
**Tab: MissionQuestions** — One row per answer option. Columns: mission_id, question_num, question_text, option_id, option_text, option_image, option_flavor, option_weight (a/b/c — hidden from players)
**Tab: MissionSubmissions** — One row per player per mission. Columns: submission_id, username, hero_name, mission_id, q1_answer–q5_answer, outcome_bucket (auto-computed), dm_override, resolved (yes/no), cycle_id, timestamp

## Game Manager Reference

Everything the GM needs to do to run the game. Items marked **[DONE]** are handled by the admin portal at `/admin.html`. Items marked **[MANUAL]** still require direct Sheets editing. Items marked **[PARTIALLY DONE]** are in the portal but have gaps.

---

### Cycle Management

**Advancing a Cycle** — do this when player actions have been reviewed and outcomes decided.
1. Go to `/admin.html` → Cycle section → click "Advance Cycle"
   - This increments `current_cycle` and writes a new `cycle_start` timestamp automatically
2. Write a Cycle Summary post in The Times Today (use the Post Composer section)
> **[DONE]** — Cycle advancement is handled by the admin portal.

**Reviewing a Cycle** — before closing, review what happened:
- Go to admin portal → Missions → review player submissions and resolve outcomes
- Go to admin portal → NPC Inbox → check for player-to-NPC conversations that need responses
- Check the Bliink feed (as a player or in the Post Composer list) for player posts
- Decide stat/reputation consequences and apply them (see Stat Management and Reputation Management)

---

### Content Creation

Feed posts can be created in two ways:

**Preferred: Admin portal Post Composer** (`/admin.html` → Post Composer)
- Select feed, posted_by character, title, body, optional image URL
- Toggle publish now vs. save as draft
- Timestamp and cycle_id are auto-filled
- Existing posts are listed with Publish/Unpublish toggle buttons

**Manual fallback: Sheets** (still works, column order matters)
- Fill: `feed`, `posted_by`, `posted_by_type`, `title`, `image_url`, `body`, `timestamp`, `visible`, `cutout_url`, `cycle_id`
- `timestamp` format: `YYYY-MM-DD HH:MM`. `cycle_id` format: `1.00.00.0`

| Feed | Sheet `feed` value | Style | Notes |
|------|--------------------|-------|-------|
| myHERO | `myhero` | Job board card | Hero jobs, missions, announcements |
| Bliink | `bliink` | Instagram | Needs `image_url`. Optional `cutout_url` for character compositing. |
| The Times Today | `todaystidbit` | Broadsheet newspaper | City-wide updates. Use for Cycle Summaries. |
| Daily Dollar | `dailydollar` | WSJ newspaper | Financial/economic city news |
| Streetview | `streetview` | Noir blog | Bloodhound's anonymous investigator posts |

**`[Name]` syntax** — write `[Mongrel]` anywhere in `body` and it renders as a clickable character link in all feeds.

**Posted By Type** auto-fills when you select a name: picking from the Characters group sets type to `character`; picking from Factions sets `faction`. You can override manually. The myHERO feed option posts to the "Jobs & Announcements" section that appears below the mission cards.

> **[DONE]** — Post Composer is in the admin portal.

---

### NPC Messaging

**Preferred: Admin portal NPC Inbox** (`/admin.html` → NPC Inbox)
1. Select the NPC sender from the left panel
2. Select the player recipient (conversation tab)
3. Type message + click Send
- Timestamp and cycle_id are auto-filled. Message appears in player's inbox immediately.
- Opening a conversation automatically marks that player's messages to the NPC as read; unread badge in the sidebar updates immediately.

**Manual fallback: Sheets**
- Open `Messages` tab → add row: `from_character`, `to_character`, `body`, `timestamp` (`YYYY-MM-DD HH:MM`), `read` = `no`, `cycle_id`

> **[DONE]** — NPC Inbox is in the admin portal.

---

### Character Management

**When a player registers**, a Characters row is automatically created for them (`type: player`, `profile_visible: no`). You'll see their hero name appear in the Characters section of the admin portal, labeled as `player` type. Fill in their bio, faction, and image when ready, then flip `profile_visible` to `yes` to make them visible in-world.

**Preferred: Admin portal Characters section** (`/admin.html` → Characters)
- Player characters appear automatically after signup — labeled with a green "PLAYER" badge, green left border, their @username, and grouped separately from NPCs at the top of the roster
- Click any character card to open its edit form (name, class, bio, faction, faction_role, profile_visible, profile_url, cutout_url)
- Click "Add New Character" to create an NPC manually
- Toggle `profile_visible` to reveal or hide a character from players
- Paste a direct image URL into `profile_url` or `cutout_url` to set images without local file management
- **Sync Players button** — if players registered before the auto-create feature was added, click "Sync Players → Characters" to retroactively create their Characters tab entries
- Each character card shows `● profile` / `● cutout` status indicators (green = set, gray = missing) — quick visual scan to see who still needs images added

**Add local image assets for a character (existing workflow — still works):**
1. Drop the image into `_drop/characters/` (profile headshot) or `_drop/cutouts/` (transparent PNG)
2. Run `node process-assets.js`
3. Run `git push` to deploy

> **[DONE]** — Character editor is in the admin portal.

---

### Faction Management

**Preferred: Admin portal Factions section** (`/admin.html` → Factions)
- Click any faction card to open its edit form (name, description, power_multiplier, leader, members_public, banner_url)
- Click "Add New Faction" to create one — reputation rows for all existing players are created automatically
- Paste a direct image URL into `banner_url` to show a banner in the faction popup

**Manual fallback: Sheets**
- Open `Factions` tab → add/edit row
- **After adding a new faction via Sheets:** run `node setup-reputation.js` to create neutral reputation rows for all existing players (skip this and existing players have no row for that faction)

> **[DONE]** — Faction editor is in the admin portal.

---

### Reputation Management

Reputation is stored in the `Reputation` tab. One row per player per faction. Values: `hostile`, `negative`, `neutral`, `positive`, `ally`.

**Preferred: Admin portal Reputation section** (`/admin.html` → Reputation)
- Player × faction grid with a dropdown per cell
- Change any standing — auto-saves on change

**Manual fallback: Sheets**
- Open `Reputation` tab → find the row (hero_name + faction_name) → change the `reputation` value

Do this after cycle resolution when player actions have earned or lost favor.

> **[DONE]** — Reputation editor is in the admin portal.

---

### Stat Management

Player stats live in the `Players` tab. Update these after cycle resolution.

**Skills** — scale 1–10. 3 = average person. 20 starting points.
**Aggregate scores** — `followers` (number), `bank` (dollars), `positional_authority` (letter tier: F, E, D, C, B, A, S, SS), `clout` (manual for now — formula TBD).

**Preferred: Admin portal Players section** (`/admin.html` → Players)
- All players listed in a table with editable stat fields per row
- Click Save on a player row to batch-update all their stats in one call

**Manual fallback: Sheets**
- Edit directly in `Players` tab (columns: might, agility, charm, intuition, commerce, intelligence, followers, bank, positional_authority, clout)

> **[DONE]** — Stat editor is in the admin portal.

---

### Inventory Management

*(Not yet in admin portal — use Sheets directly for now)*

**Give a player an item:**
1. Open the `Inventory` tab
2. Add a row: `username` = player username, `item_name` = name, `type` = `item`, `content_id` = blank, `description` = short description

**Give a player a note (secret content):**
1. First create the note content: open `NoteContent` tab → add row with `content_id` (unique, hard-to-guess string — e.g. `sv-clue-001`), `title`, `body_text`, `image_url` (optional)
2. Then add to Inventory tab: `username`, `item_name`, `type` = `note`, `content_id` = the ID you just created, `description`

> **[MANUAL]** — Note creation spans two tabs linked by ID — easy to get wrong. Admin portal will handle this in a future phase (see Phase 3.12 in ROADMAP.md).

---

### Asset Management

**Adding new images (characters, factions, places):**
1. Name the file naturally (spaces and caps are fine): e.g. `Head Honcho.png`
2. Drop into the correct `_drop/` subfolder:
   - `_drop/characters/` → character profile headshots
   - `_drop/cutouts/` → transparent PNGs for Bliink compositing
   - `_drop/factions/` → faction banner images
   - `_drop/places/` → background scenes for Bliink composer
3. Run `node process-assets.js` — slugifies, moves to `assets/`, updates Sheets and dashboard.js
4. Run `git push` to deploy
5. Optionally run `node sync-assets.js` to verify

> **[MANUAL for now]** — Asset processing requires local terminal access and a git push. Low priority to automate.

---

### Mission Management

Missions live in three Sheets tabs: `Missions`, `MissionQuestions`, `MissionSubmissions`.

**Write a new mission:**
1. Open the `Missions` tab → add a row:
   - `mission_id` — unique string, e.g. `m002`
   - `title`, `description`, `image_url` — shown on the mission card
   - `visible` — `yes` to publish, `no` to hide/draft
   - `cycle_id` — use current cycle format, e.g. `1.00.00.0`
   - Outcome columns (fill at least a and b, c is optional):
     - `outcome_a_label` — short label shown at top of outcome screen (e.g. "Played It Straight")
     - `outcome_a_narrative` — the story text players read when resolved
     - `outcome_a_image` — optional image URL for the outcome screen
     - `outcome_a_changes` — plain text stat changes (e.g. `bank:+500, reputation:mongrels-towing:positive`). Applied manually by DM.
2. Open the `MissionQuestions` tab → add rows (one row per answer option):
   - `mission_id` — must match the Missions tab
   - `question_num` — number the questions starting at 1. All options for the same question share the same number.
   - `question_text` — the question shown to the player
   - `option_id` — unique per option, e.g. `1a`, `1b`, `2a`, `2b`
   - `option_text` — the tappable button text the player sees
   - `option_image` — optional. If set, swaps the background image when this option is tapped
   - `option_flavor` — optional. One-line text shown briefly after tapping (e.g. "You've got standards.")
   - `option_weight` — `a`, `b`, or `c`. Hidden from players. The outcome with the most votes wins.

**Review a cycle's submissions:**

**Preferred: Admin portal Missions section** (`/admin.html` → Missions)
- All missions listed; click to see player submissions for that mission
- Each submission shows the player's answers and the auto-computed outcome bucket
- Set `dm_override` (a/b/c) to override the computed bucket
- Click "Resolve" to flip `resolved = yes` — player can now see their outcome

**Manual fallback: Sheets**
1. Open `MissionSubmissions` tab — each row is one player's answers
2. `outcome_bucket` is auto-computed. `dm_override` overrides it if set.
3. Change `resolved` from `no` to `yes` when ready for the player to see the outcome

**Apply stat changes manually:**
- Read the `outcome_a_changes` (or b/c) string from the Missions tab for the player's bucket
- Update `Players` tab (bank, followers, skills, etc.) and `Reputation` tab as needed (see Stat Management and Reputation Management above)

> **[PARTIALLY DONE]** — Missions reviewer is in the admin portal. Stat-change auto-apply is not yet built (Phase 3.7 in ROADMAP.md).

---

### Player Support

**Reset a player's password** — not yet in admin portal:
1. Generate a SHA-256 hash of the new password (use a browser-based tool or the signup page's hashing logic)
2. Open the `Players` tab → find the player row → update `password_hash`

> **[MANUAL]** — Simple but infrequent. Admin portal will handle this in a future phase (Phase 3.13 in ROADMAP.md).

---

### Summary: Admin Portal Status

| Task | Status | Section in portal |
|------|--------|-------------------|
| **NPC messaging** | ✓ Done | NPC Inbox |
| **Feed post composer** | ✓ Done | Post Composer |
| **Cycle advancement** | ✓ Done | Cycle |
| **Stat editor** | ✓ Done | Players |
| **Reputation editor** | ✓ Done | Reputation |
| **Character creator/editor** | ✓ Done | Characters |
| **Faction creator/editor** | ✓ Done | Factions |
| **Mission reviewer** | ✓ Done | Missions |
| **Bliink backgrounds (Places)** | ✓ Done | Places |
| **Asset gallery (image bank)** | ✓ Done | Assets |
| **Inventory/note giver** | Not built | Phase 3.12 |
| **Mission stat-change auto-apply** | Not built | Phase 3.7 |
| **Password reset** | Not built | Phase 3.13 |
| **In-portal image uploads (imgbb)** | Not built | Phase 3.15 |

---

## Current State (as of 2026-02-24)

**What's built and working:**
- Full login/signup flow with class selection and skill allocation
- Phone-style terminal dashboard with 9 apps in a 3×3 grid (row 1: myHERO, Bliink, The Times; row 2: Daily Dollar, Streetview, Messages; row 3: Profile, Inventory, Notebook)
- 5 live feeds with distinct visual styles: Streetview (noir), Daily Dollar (WSJ), myHERO (job board), Bliink (Instagram), The Times Today (broadsheet newspaper)
- Bliink posting with CSS-layered compositing — background scene picker (loaded dynamically from Places tab in Sheets) + optional character cutout picker (loaded from characters with cutout_url) + live preview + caption. Both image URLs saved to Feeds tab.
- Messaging system: inbox, 1-on-1 threads, contacts, send/receive messages
- Character profile popups — full trading-card layout: large image at top, info + bio + actions below. Clickable from any feed or faction popup. Supports `profile_url` (direct URL) or `asset_slug` (local file) for the profile image.
- Faction popups — clicking a faction name opens a card with description, leader (clickable), optional banner image, and member list (if `members_public = yes`). All members are clickable.
- `[Name]` syntax in post body text — DM writes `[Mongrel]` in Sheets → renders as a clickable character link across all feeds
- Contact discovery (zero starting contacts, discover through feeds)
- Profile page with 4 aggregate scores + 6 base skills
- Class starting defaults (bank, followers, authority) applied at signup
- Reputation system — Reputation tab tracks player × faction standing (hostile/negative/neutral/positive/ally). Auto-initialized to neutral on signup.
- Asset system — organized under `assets/characters/{slug}/`, `assets/factions/{slug}/`, `assets/places/{slug}/`. Use `process-assets.js` drop folder workflow. Run `sync-assets.js` to verify.
  - Characters with assets: bloodhound, mongrel, dozer, aurora-edge, smiles (profile + cutout)
  - Places with assets: mongrels-towing-yard (background)
- **Mission system** — Full illusion-of-choice mission flow. DM writes missions in Sheets, players tap through questions in a full-screen overlay, outcome bucket auto-computed, DM reviews and resolves via admin portal. Three Sheets tabs: Missions, MissionQuestions, MissionSubmissions.
  - Mission cards in myHERO feed with 3 states: Available / Awaiting Resolution / Read Outcome
  - Full-screen question overlay: image swaps, flavor text (stays visible until next question renders), answer locking, auto-advance. Supports up to 5 questions.
  - Confirm screen before submit; outcome screen with narrative + stat change string after DM resolves
  - `option_weight` never sent to client — players cannot see how choices are weighted
- **Admin portal** — DM-only interface at `/admin.html`. Login-gated (ADMIN_PASSWORD env var). 11 sections:
  - **Dashboard** — overview stats (players, unread messages, pending missions, current cycle)
  - **NPC Inbox** — send messages as any NPC to any player; view full conversation history; opening a conversation marks those player messages as read automatically
  - **Post Composer** — write and publish feed posts with auto-filled timestamp + cycle_id; publish/unpublish toggle on existing posts; Posted By Type auto-fills (character/faction) when you pick a name
  - **Missions** — view all player submissions per mission; override outcome bucket; flip resolved = yes
  - **Cycle** — one-click cycle advancement (increments counter + writes timestamp to Sheets)
  - **Players** — editable stat table for all players (skills + aggregates)
  - **Reputation** — player × faction grid with dropdown per cell; auto-saves on change
  - **Characters** — roster + edit form; player characters auto-appear here on signup with green "PLAYER" badge and grouped separately from NPCs; toggle `profile_visible` to activate; "Sync Players" button retroactively creates Characters entries for any player who registered before that feature existed; each card shows `● profile` / `● cutout` indicators (green = set, gray = missing) so you can see at a glance which characters still need images
  - **Factions** — list + edit form; auto-creates reputation rows on new faction save; set banner_url
  - **Places** — Bliink background list; add/edit slug + label + background_url
  - **Assets** — read-only reference list of all images in the system (character profiles, cutouts, faction banners, place backgrounds) with asset name, URL, and one-click Copy URL buttons. Thumbnails intentionally removed — loading full-resolution assets as thumbnails was crashing the admin tab (2–3 MB images × 10+ = hundreds of MB decoded in memory). See IMAGE SIZE WARNING in the Asset System section above.
- **Admin portal Chrome crash fixes (2026-02-24):** Three separate crashes were tracked down and fixed. (1) Places roster cards: removed image thumbnails — same fix as Assets. (2) Characters section: `<img src="">` in the upload widget HTML was causing Chrome to fire a request to `admin.html` on every form render; fixed by removing the static `<img>` and only creating one via `document.createElement` when a file is actually selected. (3) Upload widget listener accumulation: `addEventListener('change')` and `addEventListener('click')` on form elements were holding closure references to detached DOM nodes across card clicks; fixed by switching to `fileInput.onchange` and `uploadBtn.onclick` so the listeners are owned by the element and released when the form is replaced. Rule going forward: never use `addEventListener` on elements inside dynamically-replaced form areas — use `.onevent` properties instead.
- Backend fully on Netlify Functions (auto-deploys with git push)
- Live at https://myherogame.netlify.app

**What's NOT built yet:**
1. **Feed content** — Only sample/test posts exist. DM needs to write real Streetview articles, Daily Dollar news, myHERO job listings, NPC Bliink posts, and The Times Today articles. (Use Post Composer in admin portal.)
2. **Real missions** — Sheets structure and UI are live, but only a sample mission exists. DM needs to write real missions with questions, images, and outcome narratives.
3. **Inventory/Notebook system** — Tab structure exists in Sheets but the terminal app shows "Coming Soon". Giving items/notes to players still requires manual Sheets editing.
4. **Mission stat-change auto-apply** — DM still reads the outcome_changes string and manually updates Players + Reputation tabs. Automation planned for a future phase.
5. **Password reset** — No admin UI yet. Manual Sheets edit required (Phase 3.13).
6. **In-portal image uploads** — Upload widget is built into admin forms but requires IMGBB_API_KEY env var (not set). Process-assets.js workflow still the primary way to add images (Phase 3.15).

See ROADMAP.md for full build plan.
