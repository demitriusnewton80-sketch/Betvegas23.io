
// API Configuration for Young Meeat LLC
// FCC Entity: 20130314143016

(function() {
  'use strict';
  
  // Only declare if not already defined
  if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = window.location.origin;
  }

  // Global configuration object
  if (!window.CloudConfig) {
    window.CloudConfig = {
      apiBase: window.API_BASE,
      fccEntity: '20130314143016',
      fccRegistration: '0024454324',
      
      // Helper methods
      getAPIBase: function() {
        return this.apiBase;
      },
      
      buildEndpoint: function(path) {
        return `${this.apiBase}${path.startsWith('/') ? path : '/' + path}`;
      },
      
      // Visual theme configuration
      theme: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        gradients: {
          primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          blue: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          purple: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        },
        effects: {
          cardShadow: '0 10px 30px rgba(0,0,0,0.2)',
          cardShadowHover: '0 15px 40px rgba(0,0,0,0.3)',
          glow: '0 0 20px rgba(99, 102, 241, 0.5)',
          borderRadius: '16px'
        }
      }
    };
  }

  console.log('✅ CloudConfig initialized:', window.API_BASE);
})();
