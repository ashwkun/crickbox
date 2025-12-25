/**
 * Wisden Client IDs Configuration
 * ================================
 * 
 * These client IDs are required to access Wisden APIs.
 * They are publicly embedded in Wisden's website JavaScript.
 * 
 * HOW TO GET NEW CLIENT IDs IF API STOPS WORKING:
 * ------------------------------------------------
 * 1. Open https://www.wisden.com/live-cricket-scores in Chrome
 * 2. Open DevTools (F12) → Network tab
 * 3. Filter by "Fetch/XHR" or search for "client"
 * 4. Find requests to:
 *    - default.aspx → look for "client=" parameter
 *    - scorecard → look for "client_id=" parameter
 *    - wallstream → look for "client_id=" parameter
 * 5. Update the values below with the new IDs
 * 
 * ALTERNATIVE METHOD:
 * 1. View page source of https://www.wisden.com/live-cricket-scores
 * 2. Search for "client_id" or "client=" in the HTML/JS
 * 3. The IDs are usually in embedded script tags
 * 
 * Last verified: December 2025
 */

// Client ID for Matches List API (default.aspx)
// Used for fetching live, upcoming, and completed matches
export const CLIENT_MATCHES = 'e656463796';

// Client ID for Scorecard API
// Used for detailed match scorecards
export const CLIENT_SCORECARD = '430fdd0d';

// Client ID for Wallstream API (ball-by-ball commentary)
// Note: This is base64 encoded and needs URL encoding when used
export const CLIENT_WALLSTREAM = 'lx/QMpdauKZQKYaddAs76w==';

// Sport ID (1 = Cricket)
export const SPORT_ID = '1';

// Default timezone offset
export const TIMEZONE = '0530';

// Default language
export const LANGUAGE = 'en';
