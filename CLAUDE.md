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
- `dashboard.html` — Player terminal (phone-style app launcher with 8 apps)
- `css/style.css` — All styling (comic book theme, per-feed styles, messages, character popups)
- `js/auth.js` — Login, signup, password hashing, session management, class skill data
- `js/sheets.js` — API communication layer (calls Netlify Functions)
- `js/dashboard.js` — Terminal navigation, feed rendering (4 distinct styles), Bliink posting, messaging (inbox/threads/contacts), character profile popups, clickable names
- `netlify/functions/api.js` — **The backend**. Handles all API actions: login, register, getHeroData, getFeed, createPost, getInbox, getThread, sendMessage, getContacts, addContact, getCharacter
- `netlify.toml` — Netlify config (publish dir, functions dir, esbuild bundler)
- `google-apps-script-clean.js` — Legacy Apps Script code (no longer active, kept for reference)
- `setup-sheet.js` — Node script to set up Players tab
- `setup-new-tabs.js` — Creates Characters and Factions tabs with initial NPC/faction data
- `setup-feeds.js` — Creates Feeds tab with sample posts
- `setup-messages.js` — Creates Messages and Contacts tabs
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
- All feeds (myHERO, Bliink, Streetview, Daily Dollar, Messages, Profile) are presented as individual apps on the terminal home screen

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

**Workflow for new assets:**
1. Drop the file directly into the right subfolder with the correct filename
2. Set `asset_slug` in the relevant Sheets tab
3. Git push → Netlify auto-deploys
4. Run `node sync-assets.js` to verify everything is wired up

**Do NOT use the drop folders** (`Profile Pics/`, `Faction Pics/`, `Place Pics/`). Go directly to the right `assets/` subfolder.

**Characters with assets:** bloodhound, mongrel, dozer, aurora-edge, smiles

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
**Tab: Feeds** — All feed posts (all feeds in one tab). Columns: feed, posted_by, posted_by_type (character/faction/anonymous), title, image_url, body, timestamp, visible (yes/no), cutout_url (optional — character cutout layered over image_url in Bliink posts)
**Tab: Messages** — All messages. Columns: from_character, to_character, body, timestamp, read (yes/no)
**Tab: Contacts** — Player contact lists. Columns: hero_name, contact_name
**Tab: Missions** — Empty, for future use

## Current State (as of 2026-02-17)

**What's built and working:**
- Full login/signup flow with class selection and skill allocation
- Phone-style terminal dashboard with 8 app icons
- 4 live feeds with distinct visual styles: Streetview (noir), Daily Dollar (WSJ), myHERO (job board), Bliink (Instagram)
- Bliink posting with preset image picker + captions
- Messaging system: inbox, 1-on-1 threads, contacts, send/receive messages
- Character profile popups from clickable names in feeds
- Contact discovery (zero starting contacts, discover through feeds)
- Profile page with 4 aggregate scores + 6 base skills
- Class starting defaults (bank, followers, authority) applied at signup
- Factions and NPC characters created in Sheets
- Character profile photos — asset system with `assets/characters/{slug}/profile.png`, shown in popup; falls back to first initial. Bloodhound, Mongrel, Dozer have photos.
- The Times Today feed — local newspaper style (broadsheet). Feed key: `todaystidbit`
- Faction popups — clicking a faction name in a character popup opens a faction card (name, description, leader, member list if members_public=yes). Leader and members are clickable.
- [Name] syntax in post body text — DM writes [Mongrel] in Sheets → renders as clickable character link across all feeds
- Aurora Edge (asset_slug: aurora-edge) and Smiles (asset_slug: smiles) added to character assets
- Backend fully on Netlify Functions (auto-deploys with git push)
- Live at https://myherogame.netlify.app

**What's NOT built yet (next steps toward MVP):**
1. **Feed content** — Only sample/test posts exist. DM needs to write real Streetview articles, Daily Dollar news, myHERO job listings, and NPC Bliink posts
2. **Missions** — The choose-your-own-adventure branching system (core gameplay). Data structure, UI, branching logic, answer recording
3. **Admin dashboard** — DM tools to manage content, review posts, update stats, run the game without editing Sheets directly

See ROADMAP.md for full build plan.
