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
- `js/admin.js` — All admin logic: auth, 12 sections (Dashboard, NPC Inbox, Post Composer, Missions, Cycle, Players, Inventory, Reputation, Characters, Factions, Places, Assets)

**Backend:**
- `netlify/functions/api.js` — **The backend**. Handles all player + admin API routes. All admin routes verified by `verifyAdmin()`. See `docs/schema.md` for full action list.
- `netlify.toml` — Netlify config (publish dir, functions dir, esbuild bundler)

**Setup scripts:** see `docs/assets.md` for descriptions of all setup and asset scripts.

**Other:**
- `google-apps-script-clean.js` — Legacy Apps Script code (no longer active, kept for reference)
- `credentials.json` — Service account key (in .gitignore, never commit)

## Feeds Quick Reference

| Feed display name | Sheet `feed` value | Notes |
|-------------------|--------------------|-------|
| myHERO | `myhero` | Job board cards + missions |
| Bliink | `bliink` | Instagram-style. Needs `image_url`. Optional `cutout_url`. |
| The Times Today | `todaystidbit` | Broadsheet. Use for Cycle Summaries. |
| Daily Dollar | `dailydollar` | WSJ-style financial news |
| Streetview | `streetview` | Noir blog (Bloodhound's posts) |

`[Name]` syntax in post body (e.g. `[Mongrel]`) renders as a clickable character link in all feeds.

## Critical Rules

- **Images must be under 200 KB** before committing. Compress with squoosh.app: WebP format, ~80% quality. Cutouts: resize width to 650px first. See `docs/assets.md` for full steps.
- **Slug naming:** lowercase, hyphens only (e.g. `mongrels-towing`). Folder names must match exactly — no capitals or spaces.
- **`git push` → auto-deploys to Netlify.** No separate deploy step needed.
- **Never load image thumbnails in admin roster grids** — text-only cards only. Loading uncompressed images simultaneously crashes Chrome.
- **Never use `addEventListener` on dynamically-replaced form areas** — use `.onevent` properties (e.g. `fileInput.onchange`). Prevents listener accumulation and memory leaks.
- **Never use `<img src="">` in dynamically-rendered HTML** — only inject `<img>` via `document.createElement` when a real URL is available.

## Reference Docs

- `docs/schema.md` — Full Google Sheets tab/column definitions for all 13 tabs. Includes reputation maintenance routines, character auto-creation on registration, cycle_id format.
- `docs/game-design.md` — Game design narrative: 6 skills, 4 aggregate scores, in-universe framing, all factions + leaders, inventory/notes system, 10 classes, mission design, player mystery.
- `docs/game-manager.md` — GM how-to guide: cycle management, content creation, NPC messaging, character/faction/reputation/stat management, inventory, missions, player support, admin portal status table.
- `docs/assets.md` — Asset reference: folder structure, two image systems (local file vs. admin URL), compression steps, drop folder workflow, current asset inventory.
- `docs/status.md` — Current state snapshot: everything built and working, Chrome crash fixes and rules, what's not built yet.
- `ROADMAP.md` — Full phased build plan.
