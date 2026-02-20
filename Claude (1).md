# MyHERO Game - Complete Development Specification

> **LEGACY DOCUMENT — DO NOT USE AS REFERENCE**
> This was the original pre-build design spec. It contains wrong skill names (12 skills vs the actual 6), wrong class names ("Bruiser" vs "Mercenary"), wrong data structures, and outdated tech assumptions. The actual implementation is documented in `CLAUDE.md` and `ROADMAP.md`. This file is kept only as a historical artifact of the early design phase.

---

## Project Overview

MyHERO is an **asynchronous multiplayer social-strategy RPG** where players create low-level superhero characters to take on jobs, build influence, and interact with a dynamic city ecosystem. Players do not need to be online simultaneously; the game progresses via actions, posts, and updates in a dashboard-style interface.

**Target Platform**: Netlify (static hosting)  
**Backend**: Google Sheets API  
**Auth**: Simple username/password (casual security)  
**Game Master**: Single admin user with special controls

---

## Core Game Concepts

### Vision
- **Asynchronous gameplay**: No simultaneous login required
- **Multiple paths to influence**: Combat, social, financial, investigative
- **Dynamic city ecosystem**: Factions, NPCs, jobs, and social media
- **Small meaningful choices**: Actions have layered consequences
- **Dashboard interface**: Multiple apps/feeds for different game aspects

### Key Metrics
Every hero has four influence vectors:
1. **Followers** – Social media influence (driven by Charisma, Performance, Bliink actions)
2. **Net Worth** – Financial power (driven by Finance skill, jobs, investments)
3. **Positional Authority** – Faction rank, leadership roles, city office
4. **Faction Influence** – Combined standing within factions

---

## Hero Classes (10)

Each class has **48 skill points** distributed across **12 skills** (scale 1–10).  
**Baseline**: 3 = average human. No starting skill exceeds 6–7.

| Class          | Description                          |
|----------------|--------------------------------------|
| Superhero      | Combat-focused hero, paladin type    |
| Celebrity      | Fame-driven social star              |
| Politician     | Power broker & diplomat              |
| Sleuth         | City investigator                    |
| Tycoon         | Wealthy strategic player             |
| Visionary      | Innovator & trendsetter              |
| Mogul          | Financial & media powerhouse         |
| Bruiser        | Raw street fighter, brawler          |
| Champion       | Elite fighter & showman              |
| Philanthropist | Generous city influencer             |

---

## Skills (12)

| # | Skill          | Description                                                    |
|---|----------------|----------------------------------------------------------------|
| 1 | Finance        | Financial decision-making, investment strategy, market savvy (doesn't directly equal wealth, but helps grow it) |
| 2 | Martial        | Combat, intimidation, physical feats                           |
| 3 | Charisma       | Persuasion, charm, social influence                            |
| 4 | Investigation  | Uncovering clues, analyzing intel                              |
| 5 | Stealth        | Sneaking, evasion, covert actions                              |
| 6 | Negotiation    | Brokering deals, diplomacy, managing conflicts                 |
| 7 | Performance    | Stunts, viral acts, public spectacles                          |
| 8 | Intuition      | Reading people, predicting behavior, spotting hidden dangers   |
| 9 | Networking     | Alliances, contacts, influence growth                          |
| 10| Endurance      | Stamina, survival, resilience                                  |
| 11| Cyber          | Hacking, networks, computer systems, digital manipulation      |
| 12| Agility        | Speed, reflexes, acrobatics, mobility                          |

---

## Class Skill Assignments

**Total points per class: 48**

| Class          | Fin | Mar | Cha | Inv | Stl | Neg | Perf | Int | Net | End | Cyber | Agi | Total |
|----------------|-----|-----|-----|-----|-----|-----|------|-----|-----|-----|-------|-----|-------|
| Superhero      | 3   | 6   | 4   | 3   | 3   | 5   | 3    | 3   | 2   | 5   | 2     | 3   | 42    |
| Celebrity      | 3   | 2   | 6   | 3   | 3   | 3   | 6    | 3   | 5   | 3   | 2     | 3   | 42    |
| Politician     | 4   | 2   | 5   | 4   | 2   | 6   | 3    | 4   | 6   | 2   | 2     | 2   | 42    |
| Sleuth         | 3   | 3   | 3   | 6   | 4   | 3   | 2    | 5   | 3   | 3   | 4     | 3   | 42    |
| Tycoon         | 6   | 2   | 4   | 3   | 2   | 4   | 2    | 3   | 5   | 2   | 5     | 2   | 40    |
| Visionary      | 4   | 2   | 4   | 4   | 2   | 3   | 3    | 5   | 4   | 2   | 6     | 3   | 42    |
| Mogul          | 6   | 2   | 5   | 3   | 2   | 4   | 3    | 3   | 5   | 2   | 4     | 2   | 41    |
| Bruiser        | 2   | 6   | 3   | 2   | 4   | 2   | 2    | 3   | 2   | 5   | 2     | 5   | 38    |
| Champion       | 3   | 6   | 4   | 3   | 3   | 3   | 5    | 3   | 3   | 4   | 2     | 5   | 44    |
| Philanthropist | 4   | 2   | 5   | 3   | 2   | 4   | 3    | 3   | 4   | 2   | 2     | 2   | 36    |

**Note**: Some classes need point adjustments to reach exactly 48. Adjust minor skills (+1 or +2) to balance.

---

## Dashboard Apps/Feeds

The game interface is a **dashboard with multiple app icons**. Players start with only **myHERO** unlocked. The GM will release other apps when ready for players to use them.

### 1. myHERO (Always Unlocked)
**Purpose**: Core job board where heroes take on missions

**Features**:
- View available jobs (posted by citizens, factions, NPCs)
- Job details show:
  - Description
  - Difficulty (Easy, Medium, Hard, Extreme)
  - Required/recommended skills
  - Rewards (money, followers, authority, faction rep)
  - Risk level (chance of failure/consequences)
- Accept/decline jobs
- View job history and outcomes
- Track active jobs

**Player Actions**:
- Browse jobs
- Accept job (assign hero)
- View job outcome after GM resolution
- Gain rewards or suffer consequences

---

### 2. Bliink (GM-Released)
**Purpose**: Social media feed (Instagram/TikTok/YouTube hybrid)

**Features**:
- Feed of posts from heroes, villains, NPCs, public figures
- Like, comment, share mechanics
- Post types:
  - Status updates
  - Stunt videos
  - Hero selfies
  - Challenge posts
  - Viral trends
- Follower counts visible on profiles
- Trending posts section

**Player Actions**:
- Create posts (text, "image", video concepts)
- Like/comment on other posts
- Perform stunts for content
- Gain/lose followers based on activity
- Influence public opinion

**Release**: GM will unlock this app for all players when ready

---

### 3. Streetview (GM-Released)
**Purpose**: Investigative blog by NPC "Bloodhound"

**Features**:
- Blog-style posts about city crime, corruption, events
- Intel on:
  - Faction activities
  - Villain movements
  - Hidden opportunities
  - City scandals
- Tips and clues for investigative heroes
- Comment section for hero reactions

**Player Actions**:
- Read posts for intel
- Uncover hidden jobs
- Share posts to Bliink
- Investigate leads (if Investigation skill high enough)

**Release**: GM will unlock this app for all players when ready

---

### 4. Daily Dollar (GM-Released)
**Purpose**: Financial news and market tracker

**Features**:
- Market trends (stocks, crypto, real estate in city)
- Faction resource reports
- Job economy updates (which jobs pay well)
- Investment opportunities
- Economic forecasts

**Player Actions**:
- Read financial intel
- Make investments (Finance skill checks)
- Hack financial systems (Cyber skill checks)
- Leverage info for profit
- Track net worth growth

**Release**: GM will unlock this app for all players when ready

---

## Factions

Factions are city power groups with varying goals. Heroes can join, ally with, oppose, or ignore them.

### Faction Relationship Scale
- **Hostile** (-2): Active enemies
- **Negative** (-1): Distrusted, opposed
- **Neutral** (0): No relationship
- **Positive** (+1): Friendly, cooperative
- **Ally** (+2): Close partnership

### Faction Benefits
- **Jobs**: Faction-specific missions with better rewards for members
- **Positional Authority**: Ranks within faction hierarchy
- **Resources**: Access to faction assets (safe houses, equipment, info)
- **Protection**: Backup in conflicts with rival factions

### Pre-Made Faction Examples
(GM will create specific factions for the city)

Example structure:
- **Name**: The Iron Syndicate
- **Type**: Corporate/Financial
- **Goals**: Control city economy
- **Relationships**: (with other factions)
- **Power Level**: 1–10 scale
- **Members**: List of hero and NPC members
- **Positions Available**: Leader, Lieutenant, Enforcer, Specialist, Member

---

## Jobs System

Jobs are the primary gameplay mechanic. They drive skill growth, resource gain, and story progression.

### Job Structure
```
Job ID: [unique number]
Title: [Short catchy name]
Posted By: [Citizen name / Faction / NPC]
Description: [What needs to be done]
Difficulty: [Easy/Medium/Hard/Extreme]
Primary Skill: [Most relevant skill]
Secondary Skills: [Supporting skills]
Reward - Money: $[amount]
Reward - Followers: [number]
Reward - Authority: [faction/position boost]
Reward - Faction Rep: [faction relationship change]
Risk: [Consequences of failure]
Status: [Open/Assigned/Completed/Failed]
Assigned To: [Hero name or empty]
```

### Job Difficulty Guide
- **Easy**: Appropriate for heroes with 3–4 in relevant skill
- **Medium**: Requires 5–6 in relevant skill
- **Hard**: Requires 6–7+ or multiple skills
- **Extreme**: Requires 8+ or team coordination (future feature)

### Job Resolution (GM Process)
1. Hero accepts job
2. GM reviews hero's relevant skills
3. GM determines outcome based on:
   - Skill levels vs. difficulty
   - Narrative choices by player (if any)
   - Random factor (optional dice roll)
4. GM updates:
   - Hero skills (growth on success, possible on failure)
   - Hero resources (money, followers, authority)
   - Faction relationships
   - Story consequences (new jobs, events, NPC reactions)

### Sample Jobs

**Easy Job**:
```
Title: Lost Cat Rescue
Posted By: Citizen - Mrs. Chen
Description: Find my cat Whiskers who escaped near the docks
Difficulty: Easy
Primary Skill: Investigation (3+)
Reward - Money: $500
Reward - Followers: +10
Risk: Minor embarrassment if you fail
```

**Medium Job**:
```
Title: Corporate Espionage Prevention
Posted By: Faction - TechCorp
Description: Investigate suspected data breach in our servers
Difficulty: Medium
Primary Skill: Cyber (5+)
Secondary Skills: Investigation, Stealth
Reward - Money: $5,000
Reward - Faction Rep: TechCorp +1
Reward - Authority: TechCorp Specialist position offered
Risk: Hackers may target you if discovered
```

**Hard Job**:
```
Title: Supervillain Showdown
Posted By: City Hall
Description: Stop Dr. Chaos from robbing the Central Bank
Difficulty: Hard
Primary Skill: Martial (6+)
Secondary Skills: Agility, Intuition, Stealth
Reward - Money: $15,000
Reward - Followers: +200
Reward - Authority: City Hero Commendation
Risk: Injury, public failure, villain vendetta
```

---

## Influence Calculation

**Total Influence** is derived from four components:

```
Total Influence = (Followers × 0.01) + (Net Worth × 0.00001) + (Positional Authority × 10) + Faction Influence
```

### Component Breakdown

**1. Followers** (Social Influence)
- Starting: 100 baseline for all classes
- Gained via:
  - Bliink posts (especially viral ones)
  - Job successes (public jobs give more)
  - Performance skill use
  - Charisma-based actions
- Lost via:
  - Public failures
  - Scandals
  - Inactivity on Bliink

**2. Net Worth** (Financial Influence)
- Starting: $3,000 baseline; some classes get bonuses ($10k max for Tycoon/Mogul, $8k for Philanthropist, $5k for Politician/Visionary)
- Finance skill affects how well financial decisions play out, not direct wealth
- Gained via:
  - Job rewards
  - Investments (Finance skill helps success rate)
  - Cyber exploits
  - Faction resources
- Lost via:
  - Expenses
  - Failed investments
  - Fines/penalties

**3. Positional Authority** (Structural Power)
- Starting: 0 (no position)
- Scale: 0–10
  - 0 = No position
  - 1–2 = Faction Member
  - 3–4 = Faction Specialist/Enforcer
  - 5–6 = Faction Lieutenant
  - 7–8 = Faction Leader
  - 9–10 = City-level position (Mayor, Chief, etc.)
- Gained via:
  - Faction promotions
  - Election/appointment
  - Hostile takeovers
- Lost via:
  - Demotion
  - Faction leaving
  - Vote of no confidence

**4. Faction Influence** (Collective Power)
- Sum of all faction relationship values × faction power level
- Example: Hero is Ally (+2) with Iron Syndicate (Power 8) = +16 influence
- Multiple faction relationships stack

---

## Skill Growth System

Skills start based on class but can grow through gameplay.

### Growth Triggers
1. **Job Success**: Primary skill +1, secondary skills +0.5 (accumulates)
2. **Job Failure**: Sometimes still gain +0.5 in primary skill (learning from mistakes)
3. **Training**: Spend money/time to train (GM event)
4. **Faction Perks**: Some factions offer skill training
5. **Special Events**: City events, NPC mentorship, etc.

### Growth Caps
- Maximum skill: 10
- Growth slows at higher levels:
  - 1–5: Normal growth
  - 6–8: Requires 2× the triggers
  - 9–10: Requires 3× the triggers (elite mastery)

### Fractional Points
Skills can have .5 values internally (tracked in sheets). Display rounds down for players.

---

## Hero Profile Structure

Each hero has the following data:

```
Hero ID: [unique]
Username: [player login]
Hero Name: [in-game name]
Class: [one of 10]
Profile Picture: [URL or description]
Tagline: [short hero motto/catchphrase]

SKILLS (12):
- Finance: X
- Martial: X
- Charisma: X
- Investigation: X
- Stealth: X
- Negotiation: X
- Performance: X
- Intuition: X
- Networking: X
- Endurance: X
- Cyber: X
- Agility: X

METRICS:
- Followers: X
- Net Worth: $X
- Positional Authority: X (position name)
- Total Influence: X (calculated)

FACTION RELATIONSHIPS:
- Faction Name: [Hostile/Negative/Neutral/Positive/Ally]
- (repeat for each faction)

CURRENT FACTION: [name or "Independent"]
FACTION RANK: [position name or "N/A"]

JOBS COMPLETED: X
JOBS FAILED: X
ACTIVE JOBS: [list]

UNLOCKED APPS:
- myHERO (always)
- Bliink (yes/no)
- Streetview (yes/no)
- Daily Dollar (yes/no)

INVENTORY: [future feature - equipment, items]
```

---

## Data Structure (Google Sheets)

### Sheet 1: Characters
| Column | Data |
|--------|------|
| A: HeroID | Unique identifier |
| B: Username | Login username |
| C: Password | Hashed or plain (casual security) |
| D: HeroName | Display name |
| E: Class | Class name |
| F: ProfilePicURL | Image link or description |
| G: Tagline | Hero motto |
| H–S: Skills | Finance, Martial, Charisma, Investigation, Stealth, Negotiation, Performance, Intuition, Networking, Endurance, Cyber, Agility |
| T: Followers | Count |
| U: NetWorth | Dollar amount |
| V: PositionalAuthority | Numeric value |
| W: PositionName | Text description |
| X: CurrentFaction | Faction name or "Independent" |
| Y: FactionRank | Rank name |
| Z: JobsCompleted | Count |
| AA: JobsFailed | Count |
| AB: UnlockedApps | Comma-separated list |
| AC: TotalInfluence | Calculated value |

---

### Sheet 2: Factions
| Column | Data |
|--------|------|
| A: FactionID | Unique identifier |
| B: FactionName | Display name |
| C: Type | Corporate/Criminal/Civic/Vigilante/etc. |
| D: Goals | Short description |
| E: PowerLevel | 1–10 scale |
| F: LeaderName | Hero or NPC |
| G: MemberCount | Number of members |
| H: Resources | Wealth/equipment/influence level |

---

### Sheet 3: FactionRelationships
| Column | Data |
|--------|------|
| A: HeroID | Reference to character |
| B: FactionID | Reference to faction |
| C: RelationshipValue | -2 to +2 (Hostile to Ally) |
| D: RelationshipName | Text: Hostile/Negative/Neutral/Positive/Ally |

---

### Sheet 4: Jobs
| Column | Data |
|--------|------|
| A: JobID | Unique identifier |
| B: Title | Short name |
| C: PostedBy | Name of poster (Citizen/Faction/NPC) |
| D: Description | Full text |
| E: Difficulty | Easy/Medium/Hard/Extreme |
| F: PrimarySkill | Skill name |
| G: SecondarySkills | Comma-separated |
| H: RewardMoney | Dollar amount |
| I: RewardFollowers | Number |
| J: RewardAuthority | Positional authority change |
| K: RewardFactionRep | Faction + relationship change |
| L: Risk | Consequence text |
| M: Status | Open/Assigned/Completed/Failed |
| N: AssignedTo | HeroID or empty |
| O: DatePosted | Timestamp |
| P: DateCompleted | Timestamp or empty |

---

### Sheet 5: BliinkPosts
| Column | Data |
|--------|------|
| A: PostID | Unique identifier |
| B: AuthorName | Hero/NPC name |
| C: AuthorType | Hero/Villain/NPC/Civilian |
| D: PostType | Status/Stunt/Photo/Video/Challenge |
| E: Content | Text of post |
| F: ImageURL | Link or description |
| G: Likes | Count |
| H: Comments | Count (links to Comments sheet) |
| I: Shares | Count |
| J: Timestamp | When posted |
| K: IsTrending | Yes/No |

---

### Sheet 6: BliinkComments
| Column | Data |
|--------|------|
| A: CommentID | Unique identifier |
| B: PostID | Reference to post |
| C: AuthorName | Who commented |
| D: Content | Comment text |
| E: Timestamp | When posted |

---

### Sheet 7: StreetviewPosts
| Column | Data |
|--------|------|
| A: PostID | Unique identifier |
| B: Title | Blog post headline |
| C: Content | Full article text |
| D: Tags | Crime/Corruption/Intel/etc. |
| E: RelatedFactions | Comma-separated |
| F: RelatedJobs | JobIDs that this unlocks/relates to |
| G: Timestamp | When posted |

---

### Sheet 8: DailyDollarPosts
| Column | Data |
|--------|------|
| A: PostID | Unique identifier |
| B: Title | News headline |
| C: Content | Article text |
| D: MarketData | Stock/crypto/real estate info |
| E: FactionEconomics | Which factions affected |
| F: InvestmentOpportunities | Available actions |
| G: Timestamp | When posted |

---

### Sheet 9: Positions
| Column | Data |
|--------|------|
| A: PositionID | Unique identifier |
| B: PositionName | Display name |
| C: FactionID | Which faction (or "City" for government) |
| D: AuthorityValue | Numeric value (1–10) |
| E: Requirements | Skills/influence needed |
| F: CurrentHolder | HeroID or empty |
| G: Perks | Benefits of position |

---

### Sheet 10: GameState
| Column | Data |
|--------|------|
| A: VariableName | Setting name |
| B: Value | Current value |

Example variables:
- CityName
- CurrentDate (in-game time)
- TotalHeroes
- TotalJobs
- MajorEvents (upcoming/current)

---

## Player Actions & Interactions

### Core Player Actions
1. **Register Hero**: Choose class, name, tagline, starting skills are auto-assigned
2. **View Available Jobs**: Browse myHERO job board
3. **Accept Job**: Assign hero to a job (only 1 active job at a time to start)
4. **View Profile**: See own stats, skills, metrics
5. **View Other Profiles**: See other heroes' public info
6. **Post to Bliink**: Create social media content (once unlocked)
7. **React to Bliink**: Like, comment, share posts
8. **Read Feeds**: View Streetview and Daily Dollar content
9. **Message Heroes**: Send direct messages (simple inbox system)
10. **Check Faction Status**: View faction relationships and positions

### GM Actions (Admin Controls)
1. **Create Jobs**: Post new jobs to myHERO
2. **Resolve Jobs**: Determine outcomes, update hero stats
3. **Post as NPCs**: Create Bliink posts, Streetview articles, Daily Dollar news
4. **Manage Factions**: Create, modify, dissolve factions
5. **Award/Penalize**: Manually adjust hero stats for events
6. **Create Events**: Spawn city-wide events that affect all heroes
7. **Promote/Demote**: Change hero positions and authority
8. **Moderate**: Edit/delete inappropriate content

---

## User Interface Design

### Login Screen
```
[MyHERO Logo]

Existing Hero:
Username: [______]
Password: [______]
[Login Button]

New Hero:
[Register New Hero Button]
```

### Registration Screen
```
Create Your Hero

Username: [______] (for login)
Password: [______]
Confirm Password: [______]

Hero Name: [______] (in-game display name)
Tagline: [______] (your motto/catchphrase)

Choose Your Class:
[Superhero] [Celebrity] [Politician] [Sleuth] [Tycoon]
[Visionary] [Mogul] [Bruiser] [Champion] [Philanthropist]

(Selecting a class shows its skill distribution)

Profile Picture: [Upload or choose from presets]

[Create Hero Button]
```

### Main Dashboard
```
[Header: Hero Name | Total Influence: XXX | Followers: XXX | Net Worth: $XXX]

[App Icons in Grid]
┌─────────┬─────────┬─────────┬─────────┐
│ myHERO  │ Bliink  │Streetview│Daily $  │
│ [icon]  │ [icon]  │ [icon]  │ [icon]  │
│ ACTIVE  │🔒LOCKED │🔒LOCKED │🔒LOCKED │
│         │(GM will │(GM will │(GM will │
│         │ unlock) │ unlock) │ unlock) │
└─────────┴─────────┴─────────┴─────────┘

[Recent Activity Feed]
- You completed "Lost Cat Rescue" (+$500, +10 followers)
- New job posted: "Corporate Espionage Prevention"
- (More apps coming soon - GM will announce)

[Active Job Status]
Current Job: "Patrol Downtown"
Status: In Progress
Awaiting GM Resolution

[Quick Stats Panel]
Skills: [link to full profile]
Faction: Independent
Position: None
Jobs Completed: 5
Jobs Failed: 1
```

### myHERO Job Board Screen
```
myHERO - Available Jobs

[Filter: All | Easy | Medium | Hard | Extreme]
[Filter: All Skills | Finance | Martial | etc.]

────────────────────────────────────────
Job: Lost Cat Rescue
Posted by: Citizen - Mrs. Chen
Difficulty: ⭐ Easy
Primary Skill: Investigation (3+)

Reward: $500 | +10 Followers

[View Details] [Accept Job]
────────────────────────────────────────
Job: Corporate Espionage Prevention
Posted by: TechCorp Faction
Difficulty: ⭐⭐ Medium
Primary Skill: Cyber (5+)
Secondary: Investigation, Stealth

Reward: $5,000 | TechCorp +1 Rep | Specialist Position

[View Details] [Accept Job]
────────────────────────────────────────
(more jobs...)

[Your Active Job]
Current: "Patrol Downtown" - Awaiting Resolution
```

### Bliink Feed Screen
```
Bliink

[Create Post Button]

────────────────────────────────────────
@SuperNova • 2h ago • 🔥 Trending
Just stopped a robbery at 5th Street! #HeroLife
[Photo: Action shot]
❤️ 245 Likes | 💬 18 Comments | 🔁 32 Shares

[Like] [Comment] [Share]
────────────────────────────────────────
@Bloodhound • 5h ago
New evidence suggests the Iron Syndicate is planning something big. Stay vigilant, heroes. #StreetviewIntel

❤️ 89 Likes | 💬 12 Comments | 🔁 15 Shares

[Like] [Comment] [Share]
────────────────────────────────────────
@MayorJones • 1d ago
Thank you to all heroes keeping our city safe! Applications open for City Hero Commendation Awards.

❤️ 156 Likes | 💬 24 Comments | 🔁 8 Shares

[Like] [Comment] [Share]
────────────────────────────────────────
```

### Hero Profile Screen
```
[Profile Picture]

Hero Name: SuperNova
Class: Champion
Tagline: "Shine bright, fight right!"

Total Influence: 245
Followers: 1,240
Net Worth: $12,500
Position: Independent | No faction position

────────────────────────────────────────
Skills (Primary: 6-7 | Secondary: 3-5 | Minor: 2-3)
────────────────────────────────────────
Finance:        ███░░░░░░░ 3
Martial:        ██████░░░░ 6  ⭐ Primary
Charisma:       ████░░░░░░ 4
Investigation:  ███░░░░░░░ 3
Stealth:        ███░░░░░░░ 3
Negotiation:    ███░░░░░░░ 3
Performance:    █████░░░░░ 5  ⭐ Primary
Intuition:      ███░░░░░░░ 3
Networking:     ███░░░░░░░ 3
Endurance:      ████░░░░░░ 4
Cyber:          ██░░░░░░░░ 2
Agility:        █████░░░░░ 5  ⭐ Primary

────────────────────────────────────────
Record
────────────────────────────────────────
Jobs Completed: 12
Jobs Failed: 2
Success Rate: 85.7%

────────────────────────────────────────
Faction Relationships
────────────────────────────────────────
Iron Syndicate: ⚔️ Hostile
TechCorp: 🤝 Positive
City Hall: 😐 Neutral

[View Bliink Posts] [Send Message]
```

---

## Technical Implementation Guide

### Tech Stack
- **Frontend**: HTML, CSS, JavaScript (vanilla or React)
- **Hosting**: Netlify (static site)
- **Backend**: Google Sheets API (read/write)
- **Auth**: Simple localStorage or basic JWT

### Google Sheets API Setup

1. **Create Google Cloud Project**
   - Go to Google Cloud Console
   - Create new project "MyHERO Game"
   - Enable Google Sheets API

2. **Create API Credentials**
   - Create API Key (for read operations)
   - Create OAuth 2.0 Client ID (for write operations)
   - Add authorized JavaScript origins (your Netlify URL)

3. **Sheet Setup**
   - Create Google Sheet with 10 tabs (as outlined in Data Structure)
   - Share sheet with "Anyone with link can view"
   - Note the Sheet ID from URL

4. **JavaScript Integration**
   ```javascript
   // Initialize Sheets API
   const SHEET_ID = 'your-sheet-id-here';
   const API_KEY = 'your-api-key-here';
   
   // Read data
   function getSheetData(sheetName, range) {
     const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
     return fetch(url).then(res => res.json());
   }
   
   // Write data (requires OAuth)
   function updateSheetData(sheetName, range, values) {
     // Use OAuth token for authenticated writes
   }
   ```

### Authentication System

**Simple Option** (for casual game):
```javascript
// Store in localStorage
function login(username, password) {
  // Check against Characters sheet
  // If match, store heroID in localStorage
  localStorage.setItem('currentHero', heroID);
}

function isLoggedIn() {
  return localStorage.getItem('currentHero') !== null;
}

function logout() {
  localStorage.removeItem('currentHero');
}
```

**Security Notes**:
- Passwords can be plain text in sheet (casual game, no sensitive data)
- For slightly better security, hash passwords with simple algorithm
- Add salt if multiple players have same password
- Consider rate limiting login attempts
- GM should have separate admin password

### File Structure
```
myhero-game/
├── index.html (login/registration)
├── dashboard.html (main interface)
├── css/
│   ├── main.css
│   ├── dashboard.css
│   └── components.css
├── js/
│   ├── auth.js (login/registration)
│   ├── sheets-api.js (Google Sheets integration)
│   ├── dashboard.js (main UI logic)
│   ├── myhero-app.js (job board logic)
│   ├── bliink-app.js (social feed logic)
│   ├── streetview-app.js (blog logic)
│   ├── dailydollar-app.js (financial feed logic)
│   ├── profile.js (hero profile display)
│   └── utils.js (helper functions)
├── images/
│   ├── app-icons/
│   ├── profile-pics/
│   └── class-icons/
└── netlify.toml (deployment config)
```

### Key Functions to Implement

**1. Hero Registration**
```javascript
async function registerHero(username, password, heroName, className, tagline, profilePic) {
  // Get class skill template
  // Create new row in Characters sheet
  // Initialize all metrics to starting values
  // Return success/heroID
}
```

**2. Load Hero Data**
```javascript
async function loadHeroData(heroID) {
  // Fetch hero row from Characters sheet
  // Fetch faction relationships
  // Fetch active jobs
  // Calculate total influence
  // Return hero object
}
```

**3. Load Jobs**
```javascript
async function loadAvailableJobs() {
  // Fetch all jobs with Status = "Open"
  // Filter out jobs already assigned to current hero
  // Sort by difficulty or date
  // Return job array
}
```

**4. Accept Job**
```javascript
async function acceptJob(heroID, jobID) {
  // Check hero doesn't have active job
  // Update job Status to "Assigned"
  // Update job AssignedTo to heroID
  // Notify GM
}
```

**5. Create Bliink Post**
```javascript
async function createBliinkPost(heroID, postType, content, imageURL) {
  // Create new row in BliinkPosts sheet
  // Initialize likes/comments/shares to 0
  // Set timestamp
  // Return postID
}
```

**6. Calculate Influence**
```javascript
function calculateInfluence(hero) {
  const followerInfluence = hero.followers * 0.01;
  const wealthInfluence = hero.netWorth * 0.00001;
  const authorityInfluence = hero.positionalAuthority * 10;
  const factionInfluence = hero.factionRelationships.reduce((sum, rel) => {
    return sum + (rel.value * rel.faction.powerLevel);
  }, 0);
  
  return followerInfluence + wealthInfluence + authorityInfluence + factionInfluence;
}
```

**7. GM Resolve Job**
```javascript
async function resolveJob(jobID, outcome, skillGrowth, rewards) {
  // Update job Status to "Completed" or "Failed"
  // Update hero skills based on skillGrowth object
  // Update hero metrics (money, followers, authority)
  // Update faction relationships if applicable
  // Create notification for player
}
```

### GM Admin Panel

Create special admin page (password protected):

```
GM Dashboard

[Create Job] [Post Bliink] [Post Streetview] [Post Daily Dollar]

────────────────────────────────────────
Pending Job Resolutions
────────────────────────────────────────
Hero: SuperNova
Job: "Patrol Downtown"
Assigned: 2h ago

Hero Skills:
- Martial: 6
- Agility: 5
- Intuition: 3

[Resolve as Success] [Resolve as Failure] [Partial Success]

(Success opens form for rewards and skill growth)
────────────────────────────────────────
Active Heroes: 5
Total Jobs Posted: 23
Completed: 18
Failed: 3
In Progress: 2

[View All Heroes] [View All Factions] [Create Event]
```

---

## Gameplay Flow Examples

### Example 1: New Player Journey

1. **Registration**
   - Player creates account: username "player1", password "hero123"
   - Chooses Champion class, hero name "SuperNova"
   - Tagline: "Shine bright, fight right!"
   - Starting stats assigned automatically

2. **First Login**
   - Sees dashboard with only myHERO app unlocked
   - Views 3 available easy jobs
   - Accepts "Lost Cat Rescue" (Investigation job)

3. **Job Resolution**
   - GM sees job assigned to SuperNova
   - GM resolves: Success! (SuperNova has Investigation 3, job needs 3+)
   - SuperNova gains:
     - +$500 net worth
     - +10 followers
     - +0.5 Investigation skill
   - Player sees notification of success

4. **Progression**
   - After several days of play, GM unlocks Bliink for everyone
   - SuperNova posts: "Just saved Mrs. Chen's cat! #HeroLife"
   - Post gets 15 likes, +15 followers
   - Now has 115 followers total

5. **Faction Interest**
   - GM creates job from City Hall faction
   - SuperNova completes it successfully
   - City Hall relationship goes from Neutral to Positive
   - City Hall offers SuperNova a position: "City Patrol Officer" (Authority +2)

### Example 2: Social Player Strategy

1. **Celebrity Class Player "StarPower"**
   - Focuses on Charisma (6), Performance (6), Networking (5)
   - Completes easy Performance jobs to gain followers
   - Waits for GM to unlock Bliink

2. **Bliink Dominance** (once GM releases it)
   - Posts 3 times per day (stunts, selfies, challenges)
   - Gains followers rapidly (+50 per viral post)
   - Reaches 1,000 followers (900 gained from posting)

3. **Influence Strategy**
   - High followers = high social influence
   - Uses Networking to connect with faction leaders
   - Offered position in Celebrity faction "The Spotlights"
   - Accepts, gains Authority +3

4. **Endgame**
   - StarPower has:
     - 5,000 followers
     - $10,000 net worth (from sponsorship jobs)
     - Authority 5 (Lieutenant in The Spotlights)
     - Total Influence: 250+

### Example 3: GM Creating Dynamic Event

1. **Event: "Bank Heist by Dr. Chaos"**
   - GM posts Streetview article: "Breaking: Dr. Chaos threatens Central Bank"
   - GM creates Hard job on myHERO: "Stop Dr. Chaos"
   - Requires Martial 6+ or Stealth 7+

2. **Multiple Heroes Respond**
   - SuperNova (Martial 6) accepts job
   - Another hero "ShadowFox" (Stealth 7) also wants to take it
   - GM allows team-up (special rules)

3. **Resolution**
   - GM determines: Combined effort succeeds
   - Both heroes gain:
     - +$15,000 split ($7,500 each)
     - +200 followers each
     - +1 Martial or Stealth
     - City Hero Commendation (Authority +2)
   - Dr. Chaos becomes "Hostile" to both heroes
   - GM creates follow-up: Dr. Chaos posts threat on Bliink

4. **Consequences**
   - Dr. Chaos (NPC villain) posts: "You haven't seen the last of me, @SuperNova and @ShadowFox!"
   - Other villains take notice
   - New jobs appear from villains targeting these heroes
   - City Hall offers them positions

---

## Future Features (Phase 2+)

### Team-Ups
- Heroes can form teams for difficult jobs
- Combine skills and split rewards
- Team chat/coordination

### Equipment System
- Heroes can buy/earn equipment
- Equipment provides skill bonuses
- Inventory management

### PvP Challenges
- Heroes can challenge each other
- Skill contests (Martial vs Martial, etc.)
- Betting system with followers/money

### Territory Control
- City divided into districts
- Factions compete for territory
- Heroes contribute to faction territory expansion

### Events Calendar
- Scheduled city events (elections, tournaments, festivals)
- Limited-time jobs with special rewards
- Seasonal content

### Advanced Cyber Warfare
- Heroes with high Cyber can hack other heroes' social media
- Spread misinformation for faction warfare
- Counter-hacking mechanics

### Real-Time Notifications
- Push notifications for job results
- Alerts when mentioned in Bliink
- Faction announcements

### Mobile App
- Native iOS/Android app
- Push notifications
- Streamlined interface

---

## GM Best Practices

### Job Creation Tips
1. **Vary difficulty**: Mix easy, medium, hard jobs
2. **Tie to skills**: Make sure jobs use all 12 skills sometimes
3. **Create story arcs**: Chain jobs into ongoing narratives
4. **React to player actions**: Create jobs based on what heroes do
5. **Reward creativity**: Give bonuses for interesting roleplay choices

### Balancing Rewards
- **Easy jobs**: $500–$2,000, 10–50 followers
- **Medium jobs**: $3,000–$8,000, 50–150 followers
- **Hard jobs**: $10,000–$20,000, 150–300 followers
- **Extreme jobs**: $25,000+, 300+ followers, special rewards

### Faction Management
1. **Create diverse factions**: Different goals and styles
2. **Encourage rivalry**: Some factions should oppose each other
3. **Reward loyalty**: Give perks to faction members
4. **Allow betrayal**: Heroes can switch factions (with consequences)
5. **NPC faction members**: Create interesting NPCs in each faction

### Keeping It Fun
1. **Celebrate successes**: Make job completions feel rewarding
2. **Make failures interesting**: Failed jobs lead to new opportunities
3. **Encourage interaction**: Prompt heroes to comment on each other's posts
4. **Create drama**: Villains, scandals, rivalries, romances
5. **Stay responsive**: Resolve jobs within 24 hours when possible

---

## Technical Considerations

### Performance
- Cache hero data in localStorage to reduce API calls
- Only fetch new data when needed (jobs, posts, etc.)
- Use pagination for long feeds (20 posts at a time)

### Data Integrity
- Validate all inputs client-side and server-side
- Prevent duplicate job assignments
- Check skill requirements before allowing job acceptance
- Sanitize user content (especially Bliink posts)

### Scalability
- Google Sheets works fine for 10–50 players
- For 100+ players, consider migrating to Firebase or Airtable
- Implement search functionality once job/post count is high

### Error Handling
- Graceful failures when Sheets API is down
- Clear error messages for players
- Retry logic for failed API calls
- GM notifications for system errors

---

## Launch Checklist

### Pre-Launch
- [ ] Set up Google Cloud Project and Sheets API
- [ ] Create master Google Sheet with all 10 tabs
- [ ] Populate starting factions (3–5)
- [ ] Create 10–15 starter jobs (mix of difficulties)
- [ ] Write 3–5 Streetview posts for context
- [ ] Test registration and login flow
- [ ] Test job acceptance and resolution
- [ ] Create GM admin panel
- [ ] Write player onboarding guide

### Launch Day
- [ ] Deploy to Netlify
- [ ] Share link with players
- [ ] Post welcome message as Bloodhound
- [ ] Monitor for bugs/issues
- [ ] Be available for player questions
- [ ] Resolve first batch of jobs quickly to build momentum

### Week 1
- [ ] Post new jobs daily
- [ ] Create Bliink posts as NPCs to seed content (before player release)
- [ ] Unlock Bliink when players have gotten comfortable with jobs
- [ ] Unlock Streetview when you're ready to add investigation layer
- [ ] Start faction recruitment
- [ ] Create first city event
- [ ] Gather player feedback
- [ ] Fix any reported bugs

---

## Player Onboarding Guide

When players first join, show them:

```
Welcome to MyHERO!

You're a low-level superhero in a dynamic city full of opportunities and dangers.

Getting Started:
1. Complete jobs on myHERO to earn money and followers
2. Grow your skills through successful (and failed!) jobs
3. More apps will be unlocked by the GM as the game progresses (Bliink, Streetview, Daily Dollar)
4. Join a faction or stay independent
5. Build influence through combat, social media, finances, or investigation

Your Goal:
Become the most influential hero in the city! Influence comes from:
- Followers (social power)
- Net Worth (financial power)
- Positional Authority (structural power)
- Faction Relationships (collective power)

Tips:
- Don't take jobs way above your skill level (you'll likely fail)
- Stay active - the GM is watching and will create content based on what you do
- Factions will be available soon - they provide protection, resources, and positions
- Be patient - new features and apps will roll out as everyone gets comfortable

Have fun and be creative!
- The Game Master
```

---

## Conclusion

MyHERO is designed to be a **lightweight, asynchronous, social-strategy RPG** that blends superhero action with social media influence and faction politics. 

Key design principles:
- **Asynchronous play**: No need for real-time coordination
- **Multiple paths**: Combat, social, financial, investigative builds all viable
- **Layered choices**: Small actions have rippling consequences
- **Social integration**: Bliink makes the city feel alive
- **GM-driven narrative**: Game Master creates dynamic, reactive content

The Google Sheets backend keeps it simple to launch and maintain, while the dashboard UI makes it accessible and engaging for players.

Good luck with your launch! 🦸‍♂️

---

## Quick Reference

### Starting Values by Class

| Class | Followers | Net Worth | Authority |
|-------|-----------|-----------|-----------|
| Superhero | 100 | $3,000 | 0 |
| Celebrity | 100 | $3,000 | 0 |
| Politician | 100 | $5,000 | 1 |
| Sleuth | 100 | $3,000 | 0 |
| Tycoon | 100 | $10,000 | 0 |
| Visionary | 100 | $5,000 | 0 |
| Mogul | 100 | $10,000 | 0 |
| Bruiser | 100 | $3,000 | 0 |
| Champion | 100 | $3,000 | 0 |
| Philanthropist | 100 | $8,000 | 1 |

### Skill Check Difficulty Guide

| Difficulty | Required Skill | Success Rate at Skill Level |
|------------|----------------|----------------------------|
| Easy | 3+ | 90% at 3, 100% at 4+ |
| Medium | 5+ | 60% at 5, 90% at 6+ |
| Hard | 7+ | 50% at 7, 80% at 8+ |
| Extreme | 9+ | 40% at 9, 70% at 10 |

### App Release Status

| App | Release Control |
|-----|------------------|
| myHERO | Always unlocked from start |
| Bliink | GM will release when players are ready |
| Streetview | GM will release when players are ready |
| Daily Dollar | GM will release when players are ready |

