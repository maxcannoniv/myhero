// Setup script — creates Characters and Factions tabs in Google Sheets
// Run with: node setup-new-tabs.js
//
// This does NOT touch the Players tab. Safe to run anytime.

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Vuz-tDEt5pC2qsw40WDjt5tbvVBsNYaBjHSMp-F9NYc';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function main() {
  var auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  var sheets = google.sheets({ version: 'v4', auth });

  // --- Get existing tabs so we know what already exists ---
  var spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  var existingTabs = spreadsheet.data.sheets.map(function(s) {
    return s.properties.title;
  });

  // --- Create tabs that don't exist yet ---
  var tabsToCreate = ['Characters', 'Factions'];
  var requests = [];

  tabsToCreate.forEach(function(tabName) {
    if (existingTabs.indexOf(tabName) === -1) {
      requests.push({
        addSheet: { properties: { title: tabName } }
      });
      console.log('Creating tab: ' + tabName);
    } else {
      console.log('Tab already exists: ' + tabName);
    }
  });

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: requests }
    });
  }

  // --- Write Characters headers + initial NPCs ---
  var characterHeaders = [
    'character_name', 'type', 'username', 'class', 'bio', 'faction', 'profile_visible'
  ];

  var characters = [
    characterHeaders,
    [
      'Bloodhound',
      'npc',
      '',
      'Sleuth',
      'Leader of Streetview. A noir-inspired investigator with a super-smell ability. His face is never seen — shadows hint at hound-like features. Capable fighter, operates like a private eye. Lead writer of the Streetview blog.',
      'Streetview',
      'yes'
    ],
    [
      'Mongrel',
      'npc',
      '',
      'Mercenary',
      'Runs Mongrel\'s Towing — a towing company that doubles as low-level bounty hunting and repo work. Dog the Bounty Hunter inspired. Not afraid to get his hands dirty.',
      'Mongrel\'s Towing',
      'yes'
    ],
    [
      'Dozer',
      'npc',
      '',
      'Champion',
      'Mongrel\'s right-hand man. A brute-type big man bruiser. Does the heavy lifting — literally.',
      'Mongrel\'s Towing',
      'yes'
    ],
    [
      'Head Honcho',
      'npc',
      '',
      'Tycoon',
      'The power behind Cornerstone Holdings. Runs a web of businesses — construction, security, and a hidden stake in Mongrel\'s Towing. Everything is leverage.',
      'Cornerstone Holdings',
      'no'
    ]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Characters!A1',
    valueInputOption: 'RAW',
    requestBody: { values: characters }
  });
  console.log('Characters tab: headers + 3 NPCs written.');

  // --- Write Factions headers + initial factions ---
  var factionHeaders = [
    'faction_name', 'description', 'power_multiplier', 'leader'
  ];

  var factions = [
    factionHeaders,
    [
      'Streetview',
      'An off-the-books group of noir-inspired investigators. Not associated with myHERO. Operates in the shadows. Their public face is the Streetview blog.',
      1,
      'Bloodhound'
    ],
    [
      'Mongrel\'s Towing',
      'A towing company that doubles as low-level bounty hunters and repo men. Low-level villains.',
      1,
      'Mongrel'
    ],
    [
      'myHERO',
      'The officially sanctioned superhero organization. Details TBD.',
      1,
      ''
    ],
    [
      'Wednesday Wealth Investor\'s Club',
      'A low-level investors club that meets on Wednesdays. Most members are decent people, but a few are unscrupulous. Partly funded by Cornerstone Holdings, who uses the group to funnel money.',
      1,
      ''
    ],
    [
      'Cornerstone Holdings',
      'A powerful holding company operating behind the scenes. Invests in construction, a security company, and is a secret part-owner of Mongrel\'s Towing. Uses the Wednesday Wealth Investor\'s Club as a front for funding.',
      2,
      'Head Honcho'
    ]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Factions!A1',
    valueInputOption: 'RAW',
    requestBody: { values: factions }
  });
  console.log('Factions tab: headers + 3 factions written.');

  console.log('Done! Characters and Factions tabs are set up.');
}

main().catch(console.error);
