# myHERO — Current Status (as of 2026-03-15)

See ROADMAP.md for the full build plan and phased feature list.

---

## What's Built and Working

- Full login/signup flow with class selection and skill allocation
- Phone-style terminal dashboard with 9 apps in a 3×3 grid (row 1: myHERO, Bliink, The Times; row 2: Daily Dollar, Streetview, Messages; row 3: Profile, Inventory, Notebook)
- 5 live feeds with distinct visual styles: Streetview (noir), Daily Dollar (WSJ), myHERO (job board), Bliink (Instagram), The Times Today (broadsheet newspaper)
- Bliink posting with CSS-layered compositing — background scene picker (loaded dynamically from Places tab in Sheets) + optional character cutout picker (loaded from characters with `cutout_url`) + live preview + caption. Both image URLs saved to Feeds tab. Cutout is bottom-center (feet anchored to bottom, horizontally centered). Background zooms in slightly (`scale(1.05)`) to clip white edges from source images.
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
- **Mission system** — Full illusion-of-choice mission flow. DM writes missions in Sheets, players tap through questions in a full-screen overlay, outcome bucket auto-computed, DM reviews and resolves via admin portal.
  - Three Sheets tabs: Missions, MissionQuestions, MissionSubmissions
  - Mission cards in myHERO feed with 3 states: Available / Awaiting Resolution / Read Outcome. No thumbnail on cards — title + description only.
  - Full-screen question overlay: 3:2 image frame, image swaps per option, flavor text after each choice, answer locking, auto-advance. Supports up to 5 questions.
  - Skill-gated options: `option_skill_check` column (e.g. `agility:5`) locks an option if player skill is below the minimum.
  - Confirm screen before submit; outcome screen with narrative + NPC closing quote (comic speech bubble overlaid on the outcome frame) after DM resolves.
  - `option_weight` never sent to client — players cannot see how choices are weighted.
  - **1 mission per cycle** — backend enforces this; second submission attempt in the same cycle returns an error. Limit shown in the myHERO app HUD bar.
  - **Auto-apply on resolve** — when DM clicks Resolve in admin portal, the `outcome_*_changes` string is parsed and applied automatically. Supported: `bank`, `contacts:add`, `relation`, `inventory`, `reputation`, `message` (auto-DMs an NPC message to the player). Skill stats (might, agility, etc.) still require manual Players tab edits.
- **Admin portal** — DM-only interface at `/admin.html`. Login-gated (ADMIN_PASSWORD env var). 12 sections:
  - **Dashboard** — overview stats (players, unread messages, pending missions, current cycle)
  - **NPC Inbox** — send messages as any NPC to any player; view full conversation history; opening a conversation marks those player messages as read automatically
  - **Post Composer** — write and publish feed posts with auto-filled timestamp + cycle_id; publish/unpublish toggle on existing posts; Posted By Type auto-fills (character/faction) when you pick a name; Image URL dropdown has two groups (Place Backgrounds + Character Profiles), both sorted A–Z; Cutout URL dropdown lists characters with `cutout_url`; both dropdowns have "Other (paste URL)..." fallback
  - **Missions** — view all player submissions per mission; override outcome bucket; flip resolved = yes
  - **Cycle** — one-click cycle advancement (increments counter + writes timestamp to Sheets)
  - **Players** — editable stat table for all players (skills + aggregates)
  - **Inventory** — give, update, or remove items per player. Left panel: player list. Right panel: item table (name, qty, category) with inline editing + Remove button, plus Add Item form at the bottom. Quantity saves on blur; category saves on change. Items with quantity ≤ 0 are hidden.
  - **Reputation** — player × faction grid with dropdown per cell; auto-saves on change
  - **Characters** — roster + edit form; player characters auto-appear here on signup with green "PLAYER" badge and grouped separately from NPCs; toggle `profile_visible` to activate; "Sync Players" button retroactively creates Characters entries for any player who registered before that feature existed; each card shows `● profile` / `● cutout` indicators (green = set, gray = missing)
  - **Factions** — list + edit form; auto-creates reputation rows on new faction save; set banner_url
  - **Places** — Bliink background list; add/edit slug + label + background_url
  - **Assets** — read-only reference list of all images in the system with name, URL, and one-click Copy URL buttons. No thumbnails — loading full-resolution assets simultaneously was crashing the admin tab.
- **Inventory app (player dashboard)** — Inventory tab in the terminal now loads live data. Shows all items with category icons (💲🚗💊🥃🔪📦), item name, and quantity. Empty state message when no items. Lazy-loads on first open.
- Backend fully on Netlify Functions (auto-deploys with git push)
- Live at https://myherogame.netlify.app

---

## Admin Portal Chrome Crash Fixes (2026-02-24)

Three separate crashes were tracked down and fixed:

1. **Places roster cards** — removed image thumbnails (same fix as Assets section earlier)
2. **Characters section `<img src="">` bug** — static `<img src="" alt="">` in the upload widget HTML caused Chrome to fire a request to `admin.html` on every form render. Fixed by replacing with an empty `<div>` and only creating a real `<img>` via `document.createElement` when a file is actually selected.
3. **Upload widget listener accumulation** — `addEventListener('change')` and `addEventListener('click')` on form elements were holding closure references to detached DOM nodes across card clicks. Fixed by switching to `fileInput.onchange` and `uploadBtn.onclick` so the listeners are owned by the element and released when the form is replaced.

**Rules going forward (do not violate these):**
- Never load image thumbnails in admin roster grids — text-only cards only
- Never use `addEventListener` on elements inside dynamically-replaced form areas — use `.onevent` properties instead
- Never use `<img src="">` in dynamically-rendered HTML — only inject `<img>` elements via `document.createElement` when a real URL is available

---

## What's NOT Built Yet

1. **Feed content** — Only sample/test posts exist. DM needs to write real Streetview articles, Daily Dollar news, myHERO job listings, NPC Bliink posts, and The Times Today articles. (Use Post Composer in admin portal.)
2. **Real missions** — Sheets structure and UI are live. The Proposal (c1-the-proposal) is the first real mission. DM needs to write additional missions with questions, images, and outcome narratives.
3. **Notebook system** — Inventory items work. Notes/intel (secret content loaded from a NoteContent tab) are not built — the Notebook terminal app still shows "Coming Soon".
4. **Mission skill-stat auto-apply** — Most outcome effects auto-apply on resolve (`bank`, `inventory`, `reputation`, `contacts`, `relation`, `message`). Raw skill stat changes (might, agility, etc.) and aggregate scores (followers, positional_authority, clout) still require manual Players tab edits (Phase 3.7 remainder).
5. **Password reset** — No admin UI yet. Manual Sheets edit required (Phase 3.13).
6. **In-portal image uploads** — Upload widget is built into admin forms but requires `IMGBB_API_KEY` env var (not set). Process-assets.js workflow still the primary way to add images (Phase 3.15).
