// Setup script — creates Feeds tab with sample posts
// Run with: node setup-feeds.js
//
// This does NOT touch Players, Characters, or Factions tabs.

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

  // --- Make sure the Feeds tab exists ---
  var spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  var existingTabs = spreadsheet.data.sheets.map(function(s) {
    return s.properties.title;
  });

  if (existingTabs.indexOf('Feeds') === -1) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Feeds' } } }]
      }
    });
    console.log('Created Feeds tab.');
  } else {
    // Clear existing data so we can rewrite cleanly
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Feeds!A:Z',
    });
    console.log('Cleared existing Feeds tab.');
  }

  // --- Write headers + sample posts ---
  var headers = [
    'feed', 'posted_by', 'posted_by_type', 'title', 'image_url', 'body', 'timestamp', 'visible'
  ];

  var posts = [
    headers,

    // --- STREETVIEW POSTS (Bloodhound's blog) ---
    [
      'streetview',
      'Bloodhound',
      'character',
      'Warehouse Fire on 5th — No Accident',
      '',
      'I could smell the accelerant from two blocks out. Kerosene. Cheap stuff — the kind you buy in bulk when you don\'t want a paper trail. The fire department is calling it electrical. They\'re wrong, or they\'re lying. Either way, somebody wanted that warehouse gone. The question is what was inside it. I\'m working on that.',
      '2026-02-15 09:00',
      'yes'
    ],
    [
      'streetview',
      'Bloodhound',
      'character',
      'New Faces in the Docks District',
      '',
      'Three new vehicles parked outside the old shipping office on Pier 9. Tinted windows. Out-of-state plates. Nobody moves into the docks quietly unless they have a reason to be quiet. I\'ve got eyes on it. If you see anything, you know how to reach me. Don\'t use your real name.',
      '2026-02-17 08:30',
      'yes'
    ],

    // --- DAILY DOLLAR POSTS ---
    [
      'dailydollar',
      'Daily Dollar',
      'faction',
      'City Council Approves Downtown Redevelopment Plan',
      '',
      'In a 7-2 vote, the city council greenlit a $4.2 billion redevelopment plan for the downtown corridor. The project, backed by an unnamed consortium of private investors, promises 12,000 new jobs and a complete overhaul of the waterfront district. Critics warn that longtime residents may be priced out. Construction is slated to begin in Q3.',
      '2026-02-16 06:00',
      'yes'
    ],
    [
      'dailydollar',
      'Daily Dollar',
      'faction',
      'Mongrel\'s Towing Wins City Impound Contract',
      '',
      'The city has awarded its municipal impound contract to Mongrel\'s Towing, a relatively unknown outfit that undercut three established competitors by nearly 40%. Sources inside City Hall say the bid was "unusually aggressive." Mongrel\'s Towing could not be reached for comment.',
      '2026-02-17 06:00',
      'yes'
    ],

    // --- MYHERO POSTS (job board style) ---
    [
      'myhero',
      'myHERO',
      'faction',
      'MISSION: Missing Shipment — Pier 9',
      '',
      'A shipment of medical supplies bound for the Eastside Clinic has gone missing somewhere between the port and its destination. The clinic is running low. We need someone to track it down. Discretion advised — this may not be a simple case of lost freight.',
      '2026-02-17 10:00',
      'yes'
    ],
    [
      'myhero',
      'myHERO',
      'faction',
      'MISSION: Security Detail — Wednesday Wealth Meeting',
      '',
      'The Wednesday Wealth Investor\'s Club has requested a hero presence at their next meeting following a series of threats from an unknown source. Low danger expected, but stay sharp. Good opportunity to make connections.',
      '2026-02-17 10:30',
      'yes'
    ],

    // --- BLIINK POSTS (social media) ---
    [
      'bliink',
      'Mongrel',
      'character',
      '',
      'https://placehold.co/600x600/1a1a2e/f5c518?text=MONGRELS+TOWING',
      'Another day, another repo. You don\'t pay, we tow. Simple as that. 💪🚛',
      '2026-02-16 14:00',
      'yes'
    ],
    [
      'bliink',
      'Dozer',
      'character',
      '',
      'https://placehold.co/600x600/1a1a2e/e94560?text=DOZER',
      'Leg day. Every day is leg day when you carry this much weight. 🏋️',
      '2026-02-17 11:00',
      'yes'
    ]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feeds!A1',
    valueInputOption: 'RAW',
    requestBody: { values: posts }
  });

  console.log('Feeds tab: headers + ' + (posts.length - 1) + ' sample posts written.');
  console.log('Done!');
}

main().catch(console.error);
