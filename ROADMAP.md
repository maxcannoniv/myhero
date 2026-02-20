# MyHERO — Development Roadmap

## Project Summary

A themed web dashboard for an asynchronous, DM-driven multiplayer RPG.
- **Players:** ~10 friends
- **DM:** You — you review actions, write content, update stats manually
- **Tech:** HTML/CSS/JS site hosted on Netlify, Google Sheets as the database
- **Backend:** Netlify Functions (serverless, auto-deploys with git push) + Service Account for Sheets access
- **Login:** Simple username/password (passwords hashed via SHA-256)
- **Visual Style:** Comic book — bold colors, Bangers font, panel borders, halftone effects

---

## Current Status

### Phase 1: Foundation — COMPLETE
- [x] **1.1 Project structure** — Folders, files, basic HTML/CSS/JS layout
- [x] **1.2 Google Sheets setup** — Players, Characters, Factions, Feeds, Messages, Contacts tabs
- [x] **1.3 Backend** — Netlify Functions (replaced Apps Script). Auto-deploys with git push.
- [x] **1.4 Login system** — Username/password with hashed passwords, login form
- [x] **1.5 Signup system** — Account creation with hero name, class selection, skill point allocation
- [x] **1.6 Dashboard shell** — Phone-style terminal with 9 app icons (3×3 grid), status bar, profile with aggregates + skills
- [x] **1.7 Landing page** — In-universe "Emergency Alert" from the Mayor
- [x] **1.8 Classes page** — 10 archetypes framed as "Roles We Need Most"
- [ ] **1.9 Test full flow end-to-end** — Landing → Classes → Signup → Dashboard → Logout → Login
- [x] **1.10 Deploy to Netlify** — Live at https://myherogame.netlify.app, auto-deploys from GitHub

---

## Build Order

### Phase 2: Game Data Foundation — MOSTLY COMPLETE
> Set up the data structures that everything else depends on.

- [x] **2.1 Class starting defaults** — Bank: $3k base + $1k/commerce over 3. Followers: class-based (100-1000). Authority: letter tier per class.
- [x] **2.2 Authority scale** — F (nobody) → E (low recognition) → D (minor position) → C (notable) → B (powerful) → A (elite) → S (CEO/gov) → SS (president)
- [x] **2.3 Factions tab in Sheets** — 5 factions created (Streetview, Mongrel's Towing, myHERO, Wednesday Wealth, Cornerstone Holdings)
- [x] **2.4 Characters tab in Sheets** — NPCs created (Bloodhound, Mongrel, Dozer, Head Honcho). Players added at signup.
- [ ] **2.5 Clout calculation** — Define formula: faction standing × faction power multiplier, summed across factions
- [x] **2.6 Update signup flow** — New accounts get starting bank/followers/authority based on class defaults
- [x] **2.7 Rename net_worth → bank** — Updated across all files
- [ ] **2.8 Inventory system** — Inventory tab in Sheets, items + notes, display in Inventory app on terminal
- [ ] **2.9 Notebook system** — NoteContent tab in Sheets, secret content loaded by content_id, popup overlay display
- [ ] **2.10 Save-as-note from messages** — Players can save NPC messages as notes to their notebook

### Phase 3: Admin Dashboard
> DM tools to manage the game world behind the scenes.

- [ ] **3.1 Admin login** — Separate admin login (or admin flag on account) to access DM tools
- [ ] **3.2 Admin dashboard shell** — Admin-only page with tools for managing the game
- [ ] **3.3 NPC management** — Create, edit, and delete NPC characters from the admin dashboard
- [ ] **3.4 Faction management** — Create and edit factions, set power multipliers
- [ ] **3.5 Character roster view** — See all characters (player + NPC) in one place, edit stats
- [ ] **3.6 Feed content posting** — Write Streetview and Daily Dollar posts from admin dashboard (instead of editing Sheets directly)
- [ ] **3.7 Mission management** — Create and edit missions from admin dashboard
- [ ] **3.8 Stat updates** — Manually adjust any player's skills, bank, followers, authority from admin

### Phase 3.5: Migrate Backend to Netlify Functions — COMPLETE
> Eliminate manual Apps Script redeployment. Code auto-deploys with git push.

- [x] **3.5.1 Set up Netlify Functions** — Single function at `netlify/functions/api.js`
- [x] **3.5.2 Migrate all endpoints** — login, register, getHeroData, getFeed, createPost, messaging, contacts, characters
- [x] **3.5.3 Update sheets.js** — Frontend calls `/.netlify/functions/api` instead of Apps Script
- [x] **3.5.4 Retire Apps Script** — Apps Script restricted. All traffic goes through Netlify Functions.

### Phase 4: Feeds — COMPLETE
> All 5 feeds are live with distinct visual styles.

- [x] **4.1 Unified Feeds tab** — Single Sheets tab with `feed` column for filtering
- [x] **4.2 Streetview feed** — Noir/dark brown style. Posts are anonymous (Bloodhound must be discovered).
- [x] **4.3 Daily Dollar feed** — WSJ/newspaper cream style
- [x] **4.4 myHERO feed** — Job board card style
- [x] **4.5 Bliink feed** — Instagram dark style with image posts
- [x] **4.6 Bliink posting** — CSS-layered compositing: background scene picker + optional character cutout picker + live preview + caption. Both `image_url` (background) and `cutout_url` (cutout) saved to Feeds tab.
- [x] **4.7 The Times Today feed** — Local broadsheet newspaper style (newsprint palette, Georgia serif). Feed key: `todaystidbit`. Tagline: "same time, different day".
- [x] **4.8 `[Name]` clickable syntax** — DM writes `[Mongrel]` in any post body → renders as a clickable character link in all feeds
- [ ] **4.9 Bliink moderation queue** — New posts go to `visible: no`, DM reviews. Styled as "Bliink Quality Control" in-universe
- [ ] **4.10 Custom image uploads** — Players submit own images (behind moderation wall)
- [ ] **4.11 Interactions** — Likes, comments (simple versions)
- [ ] **4.12 Tagging** — Tag other characters in posts

### Phase 4.5: World Systems — COMPLETE
> Factions, reputation, character popups, and asset management.

- [x] **4.5.1 Character profile popups** — Full trading-card layout: large image flush at top, name/faction_role/faction/bio/actions below. Accessible by clicking any character name in any feed.
- [x] **4.5.2 Faction popups** — Clicking a faction name opens a faction card: name, description, leader (clickable), member list (if `members_public = yes`). All members are clickable.
- [x] **4.5.3 Faction role column** — Characters tab has `faction_role` (e.g. "Private Eye", "Owner of Mongrel's Towing"). Shown in popup instead of class/archetype.
- [x] **4.5.4 Reputation system** — Reputation tab: `hero_name`, `faction_name`, `reputation` (hostile/negative/neutral/positive/ally). Auto-initialized to neutral on signup. Run `setup-reputation.js` after adding new factions.
- [x] **4.5.5 Asset system** — All visual assets under `assets/characters/{slug}/`, `assets/factions/{slug}/`, `assets/places/{slug}/`. Served directly by Netlify — no external image hosting needed.
- [x] **4.5.6 Drop folder automation** — `process-assets.js` reads `_drop/{characters,cutouts,factions,places}/`, slugifies filenames, moves files to `assets/`, updates Sheets `asset_slug`, updates `BLIINK_CUTOUTS`/`BLIINK_BACKGROUNDS` in `dashboard.js`.
- [x] **4.5.7 Asset verification** — `sync-assets.js` cross-references `assets/` folders vs. Sheets. Read-only checker, safe to run anytime.
- [ ] **4.5.8 Reputation affects visibility** — Higher reputation unlocks more info about a faction or its members (future mechanic)
- [ ] **4.5.9 Faction banners in popup** — Show faction banner image at top of faction card (assets exist for some factions)

### Phase 5: Messaging — COMPLETE
> 1-on-1 messaging with contact discovery.

- [x] **5.1 Messages & Contacts tabs** — Sheets structure for messages and contact lists
- [x] **5.2 Inbox view** — Conversations sorted by most recent, unread counts
- [x] **5.3 Thread view** — Full conversation with reply bar, auto-marks as read
- [x] **5.4 Contacts** — Zero starting contacts, discovered through feeds
- [x] **5.5 Character profile popups** — Clickable names in feeds open profile with "Add to Contacts" / "Send Message"
- [x] **5.6 Auto-add contacts** — Sending a message auto-adds the recipient to contacts

### Phase 6: Missions — NOT STARTED
> The choose-your-own-adventure branching system (core gameplay).

- [ ] **6.1 Mission data structure** — Define how branching questions are stored in Sheets
- [ ] **6.2 Mission thumbnails on myHERO feed** — Visual cards for available missions
- [ ] **6.3 Mission selection** — Players pick 1 of 3 initial missions (locked after choosing)
- [ ] **6.4 Mission player UI** — Sequential question screens, no going back
- [ ] **6.5 Branching logic** — Player's answer determines next question (3 questions deep, 2-3 choices each)
- [ ] **6.6 Answer recording** — All answers saved to Sheets for DM review
- [ ] **6.7 Mission completion** — Player sees a summary; DM reviews and updates stats manually

### Phase 7: DM Content — NOT STARTED
> DM needs to populate the world with actual content.

- [ ] **7.1 Write Streetview articles** — Bloodhound's anonymous investigator blog posts
- [ ] **7.2 Write Daily Dollar articles** — News/finance stories about the city
- [ ] **7.3 Write myHERO job listings** — Hero jobs, missions, activity posts
- [ ] **7.4 Write NPC Bliink posts** — Use compositing system: pick a background + character cutout, add caption
- [ ] **7.5 Write The Times Today articles** — City-wide updates all players should see
- [ ] **7.6 DM posting from admin dashboard** — Post content without editing Sheets directly (requires Phase 3)

### Phase 8: Influence & Mechanics
> The systems that make the game feel alive.

- [ ] **9.1 Aggregate score formulas** — Finalize how followers, bank, authority, and clout are calculated and updated
- [ ] **9.2 Clout system** — Faction standing × faction power multiplier, summed across factions
- [ ] **9.3 Influence affects feeds** — Aggregate scores determine how much weight posts/actions carry
- [ ] **9.4 Automated stat updates** — Mission outcomes auto-calculate skill/stat changes
- [ ] **9.5 NPC interactions** — Automated NPC posts and responses
- [ ] **9.6 Advanced missions** — Longer missions, more branching, skill checks
- [ ] **9.7 Player-to-player dynamics** — Tagging, influence on each other's standing

---

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Database | Google Sheets | Simple, free, you already know it, easy for DM to review/edit |
| Hosting | Netlify | Free, HTTPS included, easy deploys |
| Login | Username/password (SHA-256 hashed) | Simple enough for friends, secure enough for a game |
| Game logic | DM-driven (manual for now) | Keeps it flexible, automation added later |
| Feeds | All public | Everyone sees everything — simplifies permissions |
| Missions | Branching, 3 questions deep, 2-3 choices each | Enough depth to feel meaningful, manageable content load |
| Skills | 6 skills (Might, Agility, Charm, Intuition, Commerce, Intelligence) | Clean, distinct, easy to remember. Scale 1-10, 3 = average, 20 starting points |
| Classes | 10 archetypes with recommended skill defaults | Players can redistribute points before locking in |
| Aggregates | 4 derived scores (not skills) | Followers, Bank, Authority, Clout — displayed prominently on profile |
| Clout | Weighted faction influence | Faction standing × faction power multiplier, summed across factions |
| Dashboard | Phone-style terminal | App icon grid, status bar, each feed is an "app" — myHERO is an in-world app like Upwork |
| Characters | Players + NPCs in one table | All characters look identical in feeds/messages; players can't tell who's real |
| Admin | DM dashboard | Separate admin interface for managing NPCs, factions, content, stats |
| Player mystery | Players don't know who is NPC vs. real player | All characters presented the same way in feeds and messages |
| "Marketing" | In-universe landing page + class showcase | Players get immersed before creating an account |

---

## Classes (10 Archetypes)

| Class | Might | Agility | Charm | Intuition | Commerce | Intelligence |
|-------|-------|---------|-------|-----------|----------|-------------|
| Hero | 6 | 4 | 3 | 3 | 1 | 3 |
| Celebrity | 1 | 3 | 6 | 2 | 2 | 6 |
| Politician | 1 | 1 | 6 | 4 | 3 | 5 |
| Sleuth | 2 | 3 | 2 | 6 | 1 | 6 |
| Tycoon | 1 | 1 | 3 | 3 | 7 | 5 |
| Visionary | 1 | 2 | 4 | 5 | 2 | 6 |
| Mogul | 1 | 1 | 4 | 3 | 6 | 5 |
| Mercenary | 5 | 5 | 1 | 3 | 4 | 2 |
| Champion | 5 | 4 | 4 | 2 | 1 | 4 |
| Philanthropist | 1 | 1 | 6 | 4 | 4 | 4 |

All rows total 20. Players can redistribute before locking in.

---

## Content You'll Need to Prepare

Before the game is ready for players:

- [ ] **3 initial missions** — each with branching questions (up to 7 questions per mission if 2 choices, more if 3)
- [ ] **Streetview posts** — real articles for Bloodhound's anonymous blog (replace sample content in Sheets)
- [ ] **Daily Dollar posts** — real news/finance articles (replace sample content in Sheets)
- [ ] **myHERO job listings** — hero jobs and activity posts (replace sample content)
- [ ] **The Times Today articles** — city-wide updates all players should see
- [ ] **NPC Bliink posts** — social media posts from NPCs (use compositing system: background + cutout)
- [x] ~~**NPC characters**~~ — Bloodhound, Mongrel, Dozer, Head Honcho, Aurora Edge, Smiles created
- [x] ~~**Faction list**~~ — 5 factions created in Sheets
- [x] ~~**Class starting defaults**~~ — Done, applied at signup
- [x] ~~**Authority scale definition**~~ — F through SS defined
- [x] ~~**Character profile photos**~~ — bloodhound, mongrel, dozer, aurora-edge, smiles
- [x] ~~**Character cutouts**~~ — bloodhound, mongrel, dozer, aurora-edge, smiles (for Bliink compositing)

---

## Discussed But Not Yet Built

These came up in conversation and should be addressed in future sessions:

- **Cycle system** — Three-layer time structure: Real Time (timestamped actions, logs only) → Cycles (DM-controlled resolution windows, labeled C-001, C-002, etc.) → Arcs (narrative containers, multiple cycles). Engineering scope: Settings tab in Sheets with `current_cycle` value; `cycle_id` column on Feeds (and later Missions); backend stamps current cycle on every post. DM manually increments cycle in Sheets. *Arcs are a narrative planning tool — not engineered yet.*
- **Cycle Summary post** — After each Cycle closes, DM publishes a summary to The Times Today. A dedicated admin feed and/or personal player summaries are future ideas (too much DM work for now).
- **Arc system** — Narrative containers spanning multiple Cycles (central threat, escalation path, planned beats, end condition). Arcs escalate from Street → City → Global scale. Not urgent to engineer — DM planning tool first.
- **Stock market** — Future system, likely tied to Commerce skill and Daily Dollar feed. No design yet.
- **Thread system** — Narrative sub-structure within Arcs. Design TBD.
- **Clout formula** — Faction standing × faction power multiplier, details TBD. Reputation tab exists but clout calculation is not wired up yet.
- **Admin dashboard** — DM tools for managing NPCs, factions, content, stats, missions. Top priority after Missions.
- **Bliink moderation** — New posts go to `visible: no`, DM reviews. "Bliink Quality Control" in-universe.
- **Custom image uploads for Bliink** — Behind moderation wall
- **Tagging other characters** — In posts and messages, works for both player and NPC characters
- **Feed influence mechanics** — Higher aggregate scores = more impact on the game world through posts
- **Mission content math** — 3 questions × 2 choices = 7 questions per mission; 3 questions × 3 choices = 13 per mission
- **Inventory system** — Inventory tab in Sheets exists (schema defined), but Inventory app on terminal shows "Coming Soon"
- **Notebook system** — NoteContent tab schema defined, but not built. Secret content loaded by content_id, popup overlay display.
- **Save-as-note from messages** — Players save NPC messages as notes to notebook
- **Reputation visibility gating** — Using reputation level to control what info players can see about factions/characters
- **Faction banners in faction popup** — Asset structure supports it (`assets/factions/{slug}/banner.png`), not yet wired into the faction popup UI

---

## Notes

- Each phase should be **playable/testable on its own** before moving to the next
- Phases 1-4 give players a working game with missions
- Phases 5-7 add the social/content layer
- Phase 8 is ongoing — mechanics added as the game evolves
- **Start small, add complexity only when it's needed**
- Backend auto-deploys with git push (Netlify Functions)
