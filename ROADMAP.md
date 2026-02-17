# MyHERO — Development Roadmap

## Project Summary

A themed web dashboard for an asynchronous, DM-driven multiplayer RPG.
- **Players:** ~10 friends
- **DM:** You — you review actions, write content, update stats manually
- **Tech:** HTML/CSS/JS site hosted on Netlify, Google Sheets as the database
- **Connections:** Apps Script (player-facing API) + Service Account (admin/dev tool)
- **Login:** Simple username/password (passwords hashed via SHA-256)
- **Visual Style:** Comic book — bold colors, Bangers font, panel borders, halftone effects

---

## Current Status

### Phase 1: Foundation — IN PROGRESS
- [x] **1.1 Project structure** — Folders, files, basic HTML/CSS/JS layout
- [x] **1.2 Google Sheets setup** — Players tab with headers, Feeds/Missions/Messages tabs created
- [x] **1.3 Google connections** — Apps Script deployed (player API) + Service Account (admin writes)
- [x] **1.4 Login system** — Username/password with hashed passwords, login form
- [x] **1.5 Signup system** — Account creation with hero name, class selection, skill point allocation
- [x] **1.6 Dashboard shell** — Phone-style terminal with app icon grid, status bar, profile with aggregates + skills
- [x] **1.7 Landing page** — In-universe "city broadcast" intro page
- [x] **1.8 Classes page** — 10 archetypes with flavor text and skill tags
- [ ] **1.9 Test full flow end-to-end** — Landing → Classes → Signup → Dashboard → Logout → Login
- [x] **1.10 Deploy to Netlify** — Live at https://myherogame.netlify.app, auto-deploys from GitHub

---

## Build Order

### Phase 2: Game Data Foundation
> Set up the data structures that everything else depends on.

- [x] **2.1 Class starting defaults** — Bank: $3k base + $1k/commerce over 3. Followers: class-based (100-1000). Authority: letter tier per class.
- [x] **2.2 Authority scale** — F (nobody) → E (low recognition) → D (minor position) → C (notable) → B (powerful) → A (elite) → S (CEO/gov) → SS (president)
- [ ] **2.3 Factions tab in Sheets** — Create Factions tab with columns: faction_name, description, power_multiplier, etc.
- [ ] **2.4 Characters tab in Sheets** — Create Characters tab for ALL characters (player + NPC). Columns: character_name, type (player/npc), class, skills, aggregates, faction, bio, etc.
- [ ] **2.5 Clout calculation** — Define formula: faction standing × faction power multiplier, summed across factions
- [ ] **2.6 Update signup flow** — New accounts get starting bank/followers/authority based on class defaults
- [x] **2.7 Rename net_worth → bank** — Update Sheets column, Apps Script, and all JS references
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

### Phase 3.5: Migrate Backend to Netlify Functions
> Eliminate manual Apps Script redeployment. Code auto-deploys with git push.

- [ ] **3.5.1 Set up Netlify Functions** — Create serverless functions that replace Apps Script endpoints
- [ ] **3.5.2 Migrate login/signup/getHeroData** — Move player auth to Netlify Functions using service account
- [ ] **3.5.3 Migrate getFeed** — Move feed fetching to Netlify Functions
- [ ] **3.5.4 Update sheets.js** — Point frontend at new Netlify Function URLs instead of Apps Script
- [ ] **3.5.5 Test and retire Apps Script** — Verify everything works, stop using Apps Script deployment

### Phase 4: myHERO Feed & Mission Thumbnails
> The core feed where players see available missions and hero activity.

- [ ] **4.1 myHERO feed layout** — Scrollable feed with post/mission cards
- [ ] **4.2 Mission thumbnails** — Visual cards for each of the 3 initial missions (title, description, difficulty, rewards)
- [ ] **4.3 Mission selection** — Players pick 1 of 3 missions (locked after choosing)
- [ ] **4.4 Feed posts** — Players and DM can post to the myHERO feed, saved to Sheets

### Phase 5: Mission Flow
> The choose-your-own-adventure question system.

- [ ] **5.1 Mission data structure** — Define how branching questions are stored in Sheets
- [ ] **5.2 Mission player UI** — Sequential question screens, no going back
- [ ] **5.3 Branching logic** — Player's answer determines next question (3 questions deep, 2-3 choices each)
- [ ] **5.4 Answer recording** — All answers saved to Sheets for DM review
- [ ] **5.5 Mission completion** — Player sees a summary; DM reviews and updates stats manually

### Phase 6: Bliink Feed
> Social media feed — players post, tag characters, build followers.

- [ ] **6.1 Bliink feed layout** — Social media style feed (think Instagram)
- [ ] **6.2 Post creation with presets** — Players pick from preset images + write caption
- [ ] **6.3 Moderation queue** — New posts go to `visible: no`, DM reviews in admin dashboard. Styled as "Bliink Quality Control" in-universe
- [ ] **6.4 Custom image uploads** — Players can submit their own images (behind moderation wall)
- [ ] **6.5 Interactions** — Likes, comments (simple versions)
- [ ] **6.6 Save to Sheets** — All posts and interactions recorded
- [ ] **6.7 Tagging** — Tag other characters in posts

### Phase 7: Messaging
> Private messages between players (and eventually NPCs).

- [ ] **7.1 Message UI** — Simple chat-style interface
- [ ] **7.2 Send/receive messages** — Between heroes (and NPCs)
- [ ] **7.3 Save to Sheets** — All messages recorded for DM visibility

### Phase 8: DM Content Feeds
> Streetview and Daily Dollar — DM-written content displayed to players.

- [ ] **8.1 Streetview feed** — Blog-style layout, pulls posts from Sheets (Bloodhound's intel blog)
- [ ] **8.2 Daily Dollar feed** — News/financial style layout, pulls from Sheets
- [ ] **8.3 DM posting workflow** — Post from admin dashboard, content appears in player feeds

### Phase 9: Influence & Mechanics
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

Before we can fully test the game, you'll need:

- [ ] **3 initial missions** — each with branching questions (up to 7 questions per mission if 2 choices, more if 3)
- [ ] **Streetview posts** — a few initial blog posts from "Bloodhound"
- [ ] **Daily Dollar posts** — a few initial news/finance articles
- [ ] **NPC characters** — heroes/villains/public figures for feeds and messages (players won't know they're NPCs)
- [ ] **Faction list** — names, descriptions, power multipliers (needed for Phase 2)
- [ ] **Class starting defaults** — bank, followers, and authority values for each of the 10 classes
- [ ] **Authority scale definition** — what each level of authority means in the game world

---

## Discussed But Not Yet Built

These came up in conversation and should be addressed in future sessions:

- **Class starting defaults** — Each class should start with different bank/followers/authority values (e.g., Tycoon starts rich, Celebrity starts famous)
- **Authority scale** — Need to define what values mean (0-10? 0-100?) and what each level represents
- **Clout formula** — Faction standing × faction power multiplier, details TBD
- **Bank system** — Renamed from "net worth". Per-hero currency, visible on profile
- **Factions** — Need a list of factions with names, descriptions, power multipliers
- **Characters table** — Unified table for player characters + NPCs, so feeds/messages treat them identically
- **Admin dashboard** — DM tools for managing NPCs, factions, content, stats, missions
- **Player posts on feeds** — Ability to post on Bliink and myHERO, with aggregate scores affecting impact
- **Tagging other characters** — In posts and messages, works for both player and NPC characters
- **Feed influence mechanics** — Higher aggregate scores = more impact on the game world through posts
- **Mission content math** — 3 questions × 2 choices = 7 questions per mission; 3 questions × 3 choices = 13 per mission

---

## Notes

- Each phase should be **playable/testable on its own** before moving to the next
- Phases 1-4 give players a working game with missions
- Phases 5-7 add the social/content layer
- Phase 8 is ongoing — mechanics added as the game evolves
- **Start small, add complexity only when it's needed**
- Apps Script must be redeployed (new version) every time the code changes
