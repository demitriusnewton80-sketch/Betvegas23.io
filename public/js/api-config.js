
// Cloud-based API Configuration
// Young Meeat LLC - FCC Entity: 20130314143016
(function() {
  const CloudConfig = {
    getAPIBase: function() {
      // Production cloud environment
      if (typeof window !== 'undefined' && window.location) {
        const host = window.location.host;
        const protocol = window.location.protocol;
        return `${protocol}//${host}`;
      }
      return 'http://0.0.0.0:5000';
    },

    getEnvironment: function() {
      if (typeof window !== 'undefined' && window.location) {
        return window.location.hostname.includes('replit') ? 'production' : 'development';
      }
      return 'development';
    },

    getConfig: function() {
      return {
        apiBase: this.getAPIBase(),
        environment: this.getEnvironment(),
        fccEntity: '20130314143016',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Expose globally - single declaration
  window.CloudConfig = CloudConfig;
  window.API_BASE = CloudConfig.getAPIBase();

  console.log('☁️ Cloud API Config loaded:', CloudConfig.getConfig());
})();
