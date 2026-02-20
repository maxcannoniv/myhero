/* ============================================
   sheets.js — Google Sheets API Connection
   ============================================
   This file handles all communication between
   the website and Google Sheets via Apps Script.
   ============================================ */

// -----------------------------------------------
// API URL — Netlify Function (auto-deploys with git push)
// Falls back to Apps Script if needed.
// -----------------------------------------------
const API_URL = '/.netlify/functions/api';

/**
 * Send a request to the Google Apps Script web app.
 *
 * How it works:
 * - We send a POST request to the Apps Script URL
 * - The request includes an "action" (what we want to do)
 *   and "data" (any info the action needs)
 * - Apps Script processes it and returns a JSON response
 *
 * @param {string} action - The action to perform (e.g., 'login', 'getHeroData')
 * @param {object} data - The data to send with the request
 * @returns {object} - The response from Google Sheets
 */
async function callAppsScript(action, data) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, data: data })
    });

    // Parse the JSON response from Apps Script
    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error calling Apps Script:', error);
    return { success: false, error: 'Could not connect to the server. Try again.' };
  }
}

/**
 * Log in a player by checking their credentials against Google Sheets.
 *
 * @param {string} username - The player's username
 * @param {string} passwordHash - The SHA-256 hash of the player's password
 * @returns {object} - { success: true, hero: {...} } or { success: false, error: '...' }
 */
async function sheetsLogin(username, passwordHash) {
  return await callAppsScript('login', {
    username: username,
    passwordHash: passwordHash
  });
}

/**
 * Get a hero's full data (stats, class, followers, etc.)
 *
 * @param {string} username - The player's username
 * @returns {object} - { success: true, hero: {...} } or { success: false, error: '...' }
 */
async function sheetsGetHeroData(username) {
  return await callAppsScript('getHeroData', {
    username: username
  });
}

/**
 * Register a new hero account.
 *
 * @param {object} data - { username, passwordHash, heroName, heroClass, skills }
 * @returns {object} - { success: true, hero: {...} } or { success: false, error: '...' }
 */
async function sheetsRegister(data) {
  return await callAppsScript('register', data);
}

/**
 * Get all visible posts for a specific feed.
 *
 * @param {string} feedName - The feed to fetch ('streetview', 'dailydollar', 'myhero', 'bliink')
 * @returns {object} - { success: true, posts: [...] } or { success: false, error: '...' }
 */
async function sheetsGetFeed(feedName) {
  return await callAppsScript('getFeed', { feed: feedName });
}

/**
 * Create a new post on a feed.
 *
 * @param {object} postData - { feed, posted_by, posted_by_type, title, image_url, body }
 * @returns {object} - { success: true } or { success: false, error: '...' }
 */
async function sheetsCreatePost(postData) {
  return await callAppsScript('createPost', postData);
}

// --- Messaging ---

async function sheetsGetInbox(heroName) {
  return await callAppsScript('getInbox', { heroName: heroName });
}

async function sheetsGetThread(heroName, contactName) {
  return await callAppsScript('getThread', { heroName: heroName, contactName: contactName });
}

async function sheetsSendMessage(from, to, body) {
  return await callAppsScript('sendMessage', { from: from, to: to, body: body });
}

async function sheetsGetContacts(heroName) {
  return await callAppsScript('getContacts', { heroName: heroName });
}

async function sheetsAddContact(heroName, contactName) {
  return await callAppsScript('addContact', { heroName: heroName, contactName: contactName });
}

async function sheetsGetCharacter(characterName) {
  return await callAppsScript('getCharacter', { characterName: characterName });
}

async function sheetsGetFaction(factionName) {
  return await callAppsScript('getFaction', { factionName: factionName });
}

// --- Missions ---

async function sheetsGetMissions(username) {
  return await callAppsScript('getMissions', { username: username });
}

async function sheetsGetMissionQuestions(missionId) {
  return await callAppsScript('getMissionQuestions', { missionId: missionId });
}

async function sheetsSubmitMission(data) {
  return await callAppsScript('submitMission', data);
}
