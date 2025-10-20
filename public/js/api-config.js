// API Configuration for all HTML pages
(function() {
  // Only declare if not already set
  if (typeof window.API_BASE === 'undefined') {
    // Use Replit's REPL_SLUG and REPL_OWNER for the domain
    const replSlug = window.REPL_SLUG || '35c0921b-9bf7-44a7-80bc-702201e66ac5-00-1uu6one07tj9j';
    const replOwner = window.REPL_OWNER || 'picard';

    // Construct the API base URL
    if (window.location.hostname.includes('replit.dev')) {
      window.API_BASE = window.location.origin;
    } else {
      window.API_BASE = `https://${replSlug}.${replOwner}.replit.dev:5000`;
    }

    console.log('✅ API_BASE configured:', window.API_BASE);
  }
})();


// WebSocket configuration
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_BASE = `${WS_PROTOCOL}//${window.location.host}/ws`;

// FCC Entity Information
const FCC_ENTITY = '20130314143016';
const FCC_REGISTRATION = '0024454324';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE, WS_BASE, FCC_ENTITY, FCC_REGISTRATION };
}