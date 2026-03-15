# myHERO — Google Sheets Schema

Full column definitions for all tabs. See also `docs/game-design.md` for game logic context.

---

## Tab: Players

Columns: `username`, `password_hash`, `hero_name`, `class`, `might`, `agility`, `charm`, `intuition`, `commerce`, `intelligence`, `followers`, `bank`, `positional_authority`, `clout`

---

## Tab: Characters

All characters (player + NPC).

Columns: `character_name`, `type` (player/npc), `username` (blank for NPCs), `class`, `bio`, `faction`, `faction_role`, `profile_visible`, `asset_slug`, `profile_url`, `cutout_url`

- `faction_role` — short description of the character's position within their faction (e.g. "Owner of Mongrel's Towing", "Private Eye")
- `asset_slug` — lowercase identifier used to locate local assets in `assets/characters/{slug}/`. Slug naming: lowercase, hyphens for spaces (e.g. `mongrels-towing`).
- `profile_url` — optional direct image URL (e.g. from imgbb). Takes priority over `asset_slug` path.
- `cutout_url` — optional direct image URL for the Bliink cutout. Takes priority over local file.
- `profile_visible` — `yes` to show character in-game, `no` to hide. DM activates after setting up bio/image.
- `type` and `username` are never sent to the player-facing API — players cannot tell which characters are real people vs. NPCs.

### Character auto-creation on registration

When a player registers, a Characters tab row is automatically created for their hero (`type: player`, `profile_visible: no`). The DM activates the character by flipping `profile_visible` to `yes` in the admin portal Characters section when ready. Until then, the character exists in Sheets but is invisible to all players.

---

## Tab: Factions

Columns: `faction_name`, `description`, `power_multiplier`, `leader`, `members_public` (yes/no — controls whether the member list is shown in the faction popup), `asset_slug` (lowercase slug for local banner image), `banner_url` (optional direct image URL for faction popup banner — takes priority over `asset_slug` path)

---

## Tab: Places

Bliink background scenes.

Columns: `slug` (lowercase, hyphens), `label` (display name shown in composer), `background_url` (direct image URL)

Loaded dynamically into the Bliink post composer. Falls back to hardcoded list if empty.

---

## Tab: Reputation

Columns: `hero_name`, `faction_name`, `reputation` (hostile/negative/neutral/positive/ally)

One row per player per faction. Will control visibility features in the future.

### Reputation maintenance routines

- **New player registers** → handled automatically by `handleRegister` in `api.js`. Neutral rows are added for all factions at signup. No manual action needed.
- **New faction added** → Use the Factions section in the admin portal. Reputation rows are created automatically for all existing players when the faction is saved. If adding directly to Sheets instead, run `node setup-reputation.js` afterward (additive only, never overwrites).
- **New character added** → no action needed. Reputation is player×faction only; NPC characters don't get reputation rows.

---

## Tab: Inventory

Per-player items. Managed via the admin portal Inventory section.

Columns: `username`, `item_name`, `quantity`, `category`

- `username` — must match exactly the player's username in the Players tab
- `quantity` — integer. Rows with `quantity <= 0` are soft-deleted and filtered out on read.
- `category` — one of: `money`, `vehicle`, `drug`, `drink`, `weapon`, `misc`. Controls the icon shown in the player dashboard.

Create this tab by running `node setup-inventory.js` (requires `credentials.json` in project root).

---

## Tab: Feeds

All feed posts — all feeds in one tab.

Columns: `feed`, `posted_by`, `posted_by_type` (character/faction/anonymous), `title`, `image_url`, `body`, `timestamp`, `visible` (yes/no), `cutout_url` (optional — character cutout layered over image_url in Bliink posts), `cycle_id`

- `timestamp` format: `YYYY-MM-DD HH:MM`
- `cycle_id` format: `1.00.00.0` — cycle number + days/hours/10-min-block since cycle start
- `cutout_url` — Bliink only; ignored by other feeds

| Feed | `feed` column value | Notes |
|------|---------------------|-------|
| myHERO | `myhero` | Hero jobs, missions, announcements |
| Bliink | `bliink` | Needs `image_url`. Optional `cutout_url`. |
| The Times Today | `todaystidbit` | City-wide updates |
| Daily Dollar | `dailydollar` | Financial/economic news |
| Streetview | `streetview` | Bloodhound's noir blog |

---

## Tab: Messages

All messages between characters.

Columns: `from_character`, `to_character`, `body`, `timestamp` (YYYY-MM-DD HH:MM), `read` (yes/no), `cycle_id`

---

## Tab: Settings

Game-wide configuration.

Columns: `key`, `value`

Current rows:
- `current_cycle` — integer, incremented when DM advances cycle
- `cycle_start` — ISO timestamp of when the current cycle started

Updated automatically when DM clicks "Advance Cycle" in the admin portal.

---

## Tab: Contacts

Player contact lists.

Columns: `hero_name`, `contact_name`

---

## Tab: Missions

Mission cards shown in the myHERO feed.

Columns: `mission_id`, `title`, `description`, `image_url`, `visible`, `cycle_id`, `outcome_a_label`, `outcome_a_narrative`, `outcome_a_image`, `outcome_a_changes`, `outcome_b_*`, `outcome_c_*`

- `outcome_a_changes` — plain text stat changes string (e.g. `bank:+500, reputation:mongrels-towing:positive`). Applied manually by DM after cycle resolution.
- `visible` — `yes` to publish, `no` for draft

---

## Tab: MissionQuestions

One row per answer option.

Columns: `mission_id`, `question_num`, `question_text`, `option_id`, `option_text`, `option_image`, `option_flavor`, `option_weight` (a/b/c — hidden from players)

- All options for the same question share the same `question_num`
- `option_id` — unique per option, e.g. `1a`, `1b`, `2a`, `2b`
- `option_flavor` — one-line text shown briefly after tapping (e.g. "You've got standards.")
- `option_weight` — determines outcome bucket. Never sent to client.

---

## Tab: MissionSubmissions

One row per player per mission.

Columns: `submission_id`, `username`, `hero_name`, `mission_id`, `q1_answer`–`q5_answer`, `outcome_bucket` (auto-computed), `dm_override`, `resolved` (yes/no), `cycle_id`, `timestamp`

- `outcome_bucket` — auto-computed from option_weight votes
- `dm_override` — DM can force a/b/c regardless of computed bucket
- `resolved` — flip to `yes` when DM is ready for player to see outcome
