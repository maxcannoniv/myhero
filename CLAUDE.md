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

- `index.html` — Landing page (in-universe "Emergency Alert" from the Mayor)
- `classes.html` — Class/archetype showcase ("Roles We Need Most")
- `login.html` — Login + signup with skill point allocation
- `dashboard.html` — Player terminal (phone-style app launcher with 9 apps)
- `css/style.css` — All styling (comic book theme, per-feed styles, messages, character popups)
- `js/auth.js` — Login, signup, password hashing, session management, class skill data
- `js/sheets.js` — API communication layer (calls Netlify Functions)
- `js/dashboard.js` — Terminal navigation, feed rendering (5 distinct styles), Bliink posting + compositing, messaging (inbox/threads/contacts), character + faction popups, clickable names, `[Name]` syntax
- `netlify/functions/api.js` — **The backend**. Handles all API actions: login, register, getHeroData, getFeed, createPost, getInbox, getThread, sendMessage, getContacts, addContact, getCharacter, getFaction
- `netlify.toml` — Netlify config (publish dir, functions dir, esbuild bundler)
- `google-apps-script-clean.js` — Legacy Apps Script code (no longer active, kept for reference)
- `setup-sheet.js` — Node script to set up Players tab
- `setup-new-tabs.js` — Creates Characters and Factions tabs with initial NPC/faction data
- `setup-feeds.js` — Creates Feeds tab with sample posts
- `setup-messages.js` — Creates Messages and Contacts tabs
- `setup-reputation.js` — Fills missing Reputation rows (player × faction = neutral). Safe to run after adding new factions — additive only, never overwrites custom values.
- `process-assets.js` — Drop folder processor. Move image files into `_drop/` subfolders, run this script, it slugifies, moves to `assets/`, updates Sheets, updates `dashboard.js` arrays.
- `sync-assets.js` — Read-only asset checker. Cross-references `assets/` folders vs. Sheets. Run to see what's missing or mismatched.
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
- Branching choose-your-own-adventure style (3 questions deep, 2-3 choices each, no going back)
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

**How it works:**
- Characters tab in Sheets has `asset_slug` column → frontend builds path `/assets/characters/{slug}/profile.png`
- Factions tab in Sheets has `asset_slug` column → frontend builds path `/assets/factions/{slug}/banner.png`
- Places are referenced directly by slug in the Bliink composer — no Sheets column needed
- If `asset_slug` is blank, popups fall back to a text initial placeholder

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
   - Adds cutouts to `BLIINK_CUTOUTS` and places to `BLIINK_BACKGROUNDS` in `dashboard.js`
   - Clears the `_drop/` folder
   - Prints a summary and warnings for any Sheets mismatches
4. Git push → Netlify auto-deploys
5. Optionally run `node sync-assets.js` to verify everything is wired up

**Characters with assets (profile + cutout):** bloodhound, mongrel, dozer, aurora-edge, smiles
**Places with assets:** mongrels-towing-yard

### Player Mystery
Players don't know which characters are NPCs and which are real players. All characters are presented the same way in feeds and messages.

## Google Sheets Structure

**Tab: Players** — Columns: username, password_hash, hero_name, class, might, agility, charm, intuition, commerce, intelligence, followers, bank, positional_authority, clout

**Tab: Characters** — All characters (player + NPC). Columns: character_name, type (player/npc), username (blank for NPCs), class, bio, faction, faction_role, profile_visible, asset_slug. NPCs start light (no stats), stats added later if needed. `faction_role` is a short description of the character's position within their faction (e.g. "Owner of Mongrel's Towing", "Private Eye"). `asset_slug` is a lowercase identifier (e.g. `bloodhound`) used to locate all assets for that character in `assets/characters/{slug}/`.
**Tab: Factions** — Columns: faction_name, description, power_multiplier, leader, members_public (yes/no — controls whether the member list is shown in the faction popup), asset_slug (lowercase slug for faction banner image, e.g. `mongrels-towing`)
**Tab: Reputation** — Columns: hero_name, faction_name, reputation (hostile/negative/neutral/positive/ally). One row per player per faction. Will control visibility features in the future.

**Reputation maintenance routines:**
- **New player registers** → handled automatically by `handleRegister` in `api.js`. Neutral rows are added for all factions at signup. No manual action needed.
- **New faction added** (DM adds to Factions tab) → run `node setup-reputation.js` after adding. Script is additive — only fills missing rows, never overwrites custom values.
- **New character added** → no action needed. Reputation is player×faction only; NPC characters don't get reputation rows.
**Tab: Inventory** — Per-player items and notes. Columns: username, item_name, type (item/note), content_id (for notes), description
**Tab: NoteContent** — Secret content for notes. Columns: content_id, title, body_text, image_url. Only loaded when a player with the note clicks it.
**Tab: Feeds** — All feed posts (all feeds in one tab). Columns: feed, posted_by, posted_by_type (character/faction/anonymous), title, image_url, body, timestamp, visible (yes/no), cutout_url (optional — character cutout layered over image_url in Bliink posts), cycle_id (format: `1.00.00.0` — cycle number + days/hours/10-min-block since cycle start)
**Tab: Messages** — All messages. Columns: from_character, to_character, body, timestamp, read (yes/no), cycle_id
**Tab: Settings** — Game-wide configuration. Columns: key, value. Current rows: `current_cycle` (integer), `cycle_start` (ISO timestamp). DM edits these to advance the cycle.
**Tab: Contacts** — Player contact lists. Columns: hero_name, contact_name
**Tab: Missions** — Empty, for future use

## Game Manager Reference

Everything the GM needs to do to run the game. This list drives the admin portal build. Items marked **[AUTOMATABLE]** are good candidates for the admin dashboard. Items marked **[MANUAL]** will likely stay as direct Sheets edits for now.

---

### Cycle Management

**Advancing a Cycle** — do this when player actions have been reviewed and outcomes decided.
1. Open the `Settings` tab in Sheets
2. Increment `current_cycle` by 1 (e.g., 1 → 2)
3. Update `cycle_start` to the current ISO timestamp — open browser console and type `new Date().toISOString()`, paste the result into the cell
4. Write a Cycle Summary post (see Content Creation below)
> **[AUTOMATABLE]** — One button in the admin portal should do steps 1–3 automatically.

**Reviewing a Cycle** — before closing, review what happened:
- Read the Missions tab to see all player answers submitted since last cycle
- Check the Messages tab for any player-to-NPC conversations that need responses
- Check the Bliink feed for player posts
- Decide stat/reputation consequences and apply them (see Stat Management and Reputation Management)

---

### Content Creation

All feed posts are written directly into the `Feeds` tab in Sheets. Column order matters — always fill: `feed`, `posted_by`, `posted_by_type`, `title`, `image_url`, `body`, `timestamp`, `visible`, `cutout_url`, `cycle_id`.

- **`visible`** — set to `yes` to publish immediately, `no` to draft/hide
- **`timestamp`** — use format `YYYY-MM-DD HH:MM` (e.g. `2026-02-20 14:30`)
- **`cycle_id`** — use current cycle format, e.g. `1.00.00.0`. Posts created by players are stamped automatically; DM-written posts in Sheets need this filled in manually.
- **`[Name]` syntax** — write `[Mongrel]` anywhere in `body` and it renders as a clickable character link in all feeds

| Feed | Sheet `feed` value | Style | Notes |
|------|--------------------|-------|-------|
| myHERO | `myhero` | Job board card | Hero jobs, missions, announcements |
| Bliink | `bliink` | Instagram | Needs `image_url`. Optional `cutout_url` for character compositing. |
| The Times Today | `todaystidbit` | Broadsheet newspaper | City-wide updates. Use for Cycle Summaries. |
| Daily Dollar | `dailydollar` | WSJ newspaper | Financial/economic city news |
| Streetview | `streetview` | Noir blog | Bloodhound's anonymous investigator posts |

> **[AUTOMATABLE]** — A post composer form in the admin portal should write the row with correct column order, auto-fill timestamp and cycle_id, and handle the `[Name]` syntax without needing to remember columns.

---

### NPC Messaging

To send a message as an NPC to a player:
1. Open the `Messages` tab in Sheets
2. Add a new row: `from_character` = NPC name, `to_character` = player's hero_name, `body` = message text, `timestamp` = `YYYY-MM-DD HH:MM`, `read` = `no`, `cycle_id` = current cycle_id
3. The player will see this in their Messages inbox with an unread badge

> **[AUTOMATABLE]** — Highest-priority admin feature. Writing rows by hand is error-prone and the column order is fragile.

---

### Character Management

**Add a new NPC:**
1. Open the `Characters` tab in Sheets
2. Add a row: `character_name`, `type` = `npc`, `username` = blank, `class`, `bio`, `faction`, `faction_role` (short description, e.g. "Private Eye"), `profile_visible` = `yes` or `no`, `asset_slug` = blank until assets are added

**Edit an NPC:**
- Edit bio, faction_role, or other fields directly in the Characters tab
- Change `profile_visible` from `no` to `yes` to reveal a hidden NPC to players

**Add assets for a character:**
1. Drop the image into `_drop/characters/` (profile headshot) or `_drop/cutouts/` (transparent PNG)
2. Run `node process-assets.js`
3. Run `git push` to deploy

> **[AUTOMATABLE]** — NPC creation and editing via a form. Asset upload via drag-and-drop (harder, lower priority).

---

### Faction Management

**Add a new faction:**
1. Open the `Factions` tab in Sheets
2. Add a row: `faction_name`, `description`, `power_multiplier` (number — affects Clout calculations), `leader` (character name), `members_public` = `yes` or `no`, `asset_slug` = blank until banner added
3. **Immediately after:** run `node setup-reputation.js` — this creates neutral reputation rows for every existing player against the new faction. If you skip this, existing players will have no reputation row for that faction.

**Edit a faction:**
- Edit any field directly in the Factions tab
- Changing `members_public` to `yes` will make the member list visible in the faction popup

> **[AUTOMATABLE]** — Faction form + auto-run reputation fill on creation.

---

### Reputation Management

Reputation is stored in the `Reputation` tab. One row per player per faction. Values: `hostile`, `negative`, `neutral`, `positive`, `ally`.

**Adjust a player's standing with a faction:**
1. Open the `Reputation` tab
2. Find the row where `hero_name` = player and `faction_name` = faction
3. Change the `reputation` value

Do this after cycle resolution when player actions have earned or lost favor.

> **[AUTOMATABLE]** — A simple grid or dropdown editor in the admin portal would be much easier than scrolling a Sheets tab.

---

### Stat Management

Player stats live in the `Players` tab. Update these after cycle resolution.

**Skills** (edit directly in Players tab — columns `might`, `agility`, `charm`, `intuition`, `commerce`, `intelligence`):
- Scale: 1–10. 3 = average person. 20 starting points.

**Aggregate scores** (edit directly in Players tab):
- `followers` — number (e.g. 500)
- `bank` — number in dollars (e.g. 4500)
- `positional_authority` — letter tier: F, E, D, C, B, A, S, SS
- `clout` — derived from reputation × faction power multiplier. Currently manual. Formula TBD.

> **[AUTOMATABLE]** — A stat editor per player would prevent accidental column mismatches and make cycle resolution faster.

---

### Inventory Management

*(UI not yet built, but Sheets structure exists)*

**Give a player an item:**
1. Open the `Inventory` tab
2. Add a row: `username` = player username, `item_name` = name, `type` = `item`, `content_id` = blank, `description` = short description

**Give a player a note (secret content):**
1. First create the note content: open `NoteContent` tab → add row with `content_id` (unique, hard-to-guess string — e.g. `sv-clue-001`), `title`, `body_text`, `image_url` (optional)
2. Then add to Inventory tab: `username`, `item_name`, `type` = `note`, `content_id` = the ID you just created, `description`

> **[AUTOMATABLE]** — Note creation is especially error-prone (two tabs, linked by ID). Admin portal should handle both steps together.

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

### Mission Management *(not yet built)*

Once missions are built, the GM will need to:
- **Create missions** — write branching questions and answer choices
- **Review answers** — read player submissions from the Missions tab
- **Resolve outcomes** — decide stat/reputation consequences and apply them manually

> **[AUTOMATABLE]** — Mission creator and answer reviewer are high-priority admin portal features once missions are built.

---

### Player Support

**Reset a player's password** — no automated flow exists yet:
1. Generate a SHA-256 hash of the new password (use a browser-based tool or the signup page's hashing logic)
2. Open the `Players` tab → find the player row → update `password_hash`

> **[AUTOMATABLE]** — Simple admin action.

---

### Summary: Admin Portal Priority Order

Based on frequency of use and error risk:

| Priority | Task | Why |
|----------|------|-----|
| 1 | **NPC messaging** | Done every cycle, column order error-prone |
| 2 | **Feed post composer** | Done every cycle, tedious in Sheets |
| 3 | **Cycle advancement** | Requires computing ISO timestamp manually |
| 4 | **Stat editor** | Done every cycle, risk of column mistakes |
| 5 | **Reputation editor** | Done every cycle, slow to find rows in Sheets |
| 6 | **Character creator/editor** | Less frequent but fiddly |
| 7 | **Inventory/note giver** | Two-tab operation, easy to get wrong |
| 8 | **Mission reviewer** | Not built yet |
| 9 | **Faction creator/editor** | Infrequent |
| 10 | **Password reset** | Rare |

---

## Current State (as of 2026-02-19)

**What's built and working:**
- Full login/signup flow with class selection and skill allocation
- Phone-style terminal dashboard with 9 apps in a 3×3 grid (row 1: myHERO, Bliink, The Times; row 2: Daily Dollar, Streetview, Messages; row 3: Profile, Inventory, Notebook)
- 5 live feeds with distinct visual styles: Streetview (noir), Daily Dollar (WSJ), myHERO (job board), Bliink (Instagram), The Times Today (broadsheet newspaper)
- Bliink posting with CSS-layered compositing — background scene picker + optional character cutout picker + live preview + caption. Both image URLs saved to Feeds tab (`image_url` + `cutout_url`).
- Messaging system: inbox, 1-on-1 threads, contacts, send/receive messages
- Character profile popups — full trading-card layout: large image at top, info + bio + actions below. Clickable from any feed or faction popup.
- Faction popups — clicking a faction name opens a card with description, leader (clickable), and member list (if `members_public = yes`). All members are clickable.
- `[Name]` syntax in post body text — DM writes `[Mongrel]` in Sheets → renders as a clickable character link across all feeds
- Contact discovery (zero starting contacts, discover through feeds)
- Profile page with 4 aggregate scores + 6 base skills
- Class starting defaults (bank, followers, authority) applied at signup
- Reputation system — Reputation tab tracks player × faction standing (hostile/negative/neutral/positive/ally). Auto-initialized to neutral on signup. Run `node setup-reputation.js` after adding new factions.
- Asset system — organized under `assets/characters/{slug}/`, `assets/factions/{slug}/`, `assets/places/{slug}/`. Use `process-assets.js` drop folder workflow to add new images. Run `sync-assets.js` to verify.
  - Characters with assets: bloodhound, mongrel, dozer, aurora-edge, smiles (profile + cutout)
  - Places with assets: mongrels-towing-yard (background)
- Backend fully on Netlify Functions (auto-deploys with git push)
- Live at https://myherogame.netlify.app

**What's NOT built yet (next steps toward MVP):**
1. **Feed content** — Only sample/test posts exist. DM needs to write real Streetview articles, Daily Dollar news, myHERO job listings, NPC Bliink posts, and The Times Today articles
2. **Missions** — The choose-your-own-adventure branching system (core gameplay). Data structure, UI, branching logic, answer recording
3. **Admin dashboard** — DM tools to manage content, review posts, update stats, run the game without editing Sheets directly

See ROADMAP.md for full build plan.
