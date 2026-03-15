# myHERO — Game Manager Reference

Everything the GM needs to do to run the game. Items marked **[DONE]** are handled by the admin portal at `/admin.html`. Items marked **[MANUAL]** still require direct Sheets editing. Items marked **[PARTIALLY DONE]** are in the portal but have gaps.

---

## Cycle Management

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

## Content Creation

Feed posts can be created in two ways:

**Preferred: Admin portal Post Composer** (`/admin.html` → Post Composer)
- Select feed, posted_by character, title, body
- **Image URL** — dropdown with two groups: **Place Backgrounds** (from Places tab, sorted A–Z) and **Character Profiles** (characters with `profile_url` set, sorted A–Z). Select "Other (paste URL)..." to type a custom URL.
- **Cutout URL** — dropdown populated from characters with `cutout_url` set, sorted A–Z. Select "Other (paste URL)..." to type a custom URL. Bliink only — ignored by other feeds.
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

## NPC Messaging

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

## Character Management

**When a player registers**, a Characters row is automatically created for them (`type: player`, `profile_visible: no`). You'll see their hero name appear in the Characters section of the admin portal, labeled as `player` type. Fill in their bio, faction, and image when ready, then flip `profile_visible` to `yes` to make them visible in-world.

**Preferred: Admin portal Characters section** (`/admin.html` → Characters)
- Player characters appear automatically after signup — labeled with a green "PLAYER" badge, green left border, their @username, and grouped separately from NPCs at the top of the roster
- Click any character card to open its edit form (name, class, bio, faction, faction_role, profile_visible, profile_url, cutout_url)
- Click "Add New Character" to create an NPC manually
- Toggle `profile_visible` to reveal or hide a character from players
- Paste a direct image URL into `profile_url` or `cutout_url` to set images without local file management
- **Sync Players button** — if players registered before the auto-create feature was added, click "Sync Players → Characters" to retroactively create their Characters tab entries
- Each character card shows `● profile` / `● cutout` status indicators (green = set, gray = missing) — quick visual scan to see who still needs images added

**Add local image assets for a character:**
1. Drop the profile headshot into `_drop/characters/` and the transparent cutout into `_drop/cutouts/` — name each file after the character exactly as they appear in Sheets (e.g. `Big Buster.png`)
2. Run `node process-assets.js` — read the output carefully for name-mismatch warnings
3. Compress the output files at squoosh.app (under 200 KB — PNG is fine if already small, no need to force WebP)
4. `git push` — files must be deployed before URLs will work
5. Go to admin portal → Characters → open each character → paste `profile_url` and `cutout_url`:
   - `https://myherogame.netlify.app/assets/characters/{slug}/profile.png`
   - `https://myherogame.netlify.app/assets/characters/{slug}/cutout.png`
   - This is required for the Post Composer image dropdowns to show the character

> **[DONE]** — Character editor is in the admin portal.

---

## Faction Management

**Preferred: Admin portal Factions section** (`/admin.html` → Factions)
- Click any faction card to open its edit form (name, description, power_multiplier, leader, members_public, banner_url)
- Click "Add New Faction" to create one — reputation rows for all existing players are created automatically
- Paste a direct image URL into `banner_url` to show a banner in the faction popup

**Manual fallback: Sheets**
- Open `Factions` tab → add/edit row
- **After adding a new faction via Sheets:** run `node setup-reputation.js` to create neutral reputation rows for all existing players (skip this and existing players have no row for that faction)

> **[DONE]** — Faction editor is in the admin portal.

---

## Reputation Management

Reputation is stored in the `Reputation` tab. One row per player per faction. Values: `hostile`, `negative`, `neutral`, `positive`, `ally`.

**Preferred: Admin portal Reputation section** (`/admin.html` → Reputation)
- Player × faction grid with a dropdown per cell
- Change any standing — auto-saves on change

**Manual fallback: Sheets**
- Open `Reputation` tab → find the row (hero_name + faction_name) → change the `reputation` value

Do this after cycle resolution when player actions have earned or lost favor.

> **[DONE]** — Reputation editor is in the admin portal.

---

## Stat Management

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

## Inventory Management

**Preferred: Admin portal Inventory section** (`/admin.html` → Inventory)
1. Click a player from the left panel — their current inventory loads on the right
2. **Add an item** — fill in Name, Category (dropdown), and Qty at the bottom of the panel → click **+ Add**
3. **Update quantity** — edit the Qty field and click away (saves on blur)
4. **Change category** — use the Category dropdown (saves immediately on change)
5. **Remove an item** — click **Remove** — sets quantity to 0, item disappears from the list and from the player's dashboard

Categories: `money` 💲 · `vehicle` 🚗 · `drug` 💊 · `drink` 🥃 · `weapon` 🔪 · `misc` 📦

**Manual fallback: Sheets**
- Open `Inventory` tab → add or edit rows directly: `username`, `item_name`, `quantity`, `category`
- Rows with `quantity = 0` are treated as deleted and won't appear for the player

> **[DONE]** — Inventory management is in the admin portal.

---

## Asset Management

**Adding new images (characters, factions, places):**
1. Name the file naturally (spaces and caps are fine): e.g. `Head Honcho.png`
2. Drop into the correct `_drop/` subfolder:
   - `_drop/characters/` → character profile headshots
   - `_drop/cutouts/` → transparent PNGs for Bliink compositing
   - `_drop/factions/` → faction banner images
   - `_drop/places/` → background scenes for Bliink composer
3. Run `node process-assets.js` — slugifies, moves to `assets/`, updates Sheets
4. **Compress the output files** — see `docs/assets.md` for compression steps
5. Run `git push` to deploy
6. Optionally run `node sync-assets.js` to verify

> **[MANUAL for now]** — Asset processing requires local terminal access and a git push. Low priority to automate.

---

## Mission Management

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
- Update `Players` tab (bank, followers, skills, etc.) and `Reputation` tab as needed

> **[PARTIALLY DONE]** — Missions reviewer is in the admin portal. Stat-change auto-apply is not yet built (Phase 3.7 in ROADMAP.md).

---

## Player Support

**Reset a player's password** — not yet in admin portal:
1. Generate a SHA-256 hash of the new password (use a browser-based tool or the signup page's hashing logic)
2. Open the `Players` tab → find the player row → update `password_hash`

> **[MANUAL]** — Simple but infrequent. Admin portal will handle this in a future phase (Phase 3.13 in ROADMAP.md).

---

## Admin Portal Status

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
| **Inventory (item giver)** | ✓ Done | Inventory |
| **Notebook/note giver** | Not built | Phase 3.12 |
| **Mission stat-change auto-apply** | Not built | Phase 3.7 |
| **Password reset** | Not built | Phase 3.13 |
| **In-portal image uploads (imgbb)** | Not built | Phase 3.15 |
