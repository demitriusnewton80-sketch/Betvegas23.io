
// Cloud-based API Configuration
// Young Meeat LLC - FCC Entity: 20130314143016
(function() {
  const CloudConfig = {
    getAPIBase: function() {
      // Production cloud environment
      if (window.location.hostname.includes('replit.dev') ||
          window.location.hostname.includes('replit.app')) {
        return window.location.origin;
      }

      // Custom domain support
      if (window.location.hostname !== 'localhost') {
        return window.location.origin;
      }

      // Development fallback
      return 'http://0.0.0.0:5000';
    },

    getEndpoint: function(path) {
      return this.getAPIBase() + path;
    },

    getConfig: function() {
      return {
        apiBase: this.getAPIBase(),
        environment: this.getEnvironment(),
        fccEntity: '20130314143016',
        timestamp: new Date().toISOString()
      };
    },

    getEnvironment: function() {
      if (window.location.hostname.includes('replit.dev')) return 'development';
      if (window.location.hostname.includes('replit.app')) return 'production';
      return 'local';
    }
  };

  // Expose globally - single declaration
  window.CloudConfig = CloudConfig;
  window.API_BASE = CloudConfig.getAPIBase();

  console.log('☁️ Cloud API Config loaded:', CloudConfig.getConfig());
})();
