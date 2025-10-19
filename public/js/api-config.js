
// API Configuration
(function() {
  'use strict';
  
  // Only declare if not already defined
  if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = window.location.origin;
  }

  // Export for use in other scripts
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE: window.API_BASE };
  }
})();
