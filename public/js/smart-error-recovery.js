
// Smart Error Recovery System - Client Side
// Auto-fixes API connection issues and retries failed requests

class SmartErrorRecovery {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.backoffMultiplier = 1.5;
    this.eventSourceRetryDelay = 5000;
    this.activeEventSources = new Map();
    this.troubleshootingEnabled = true;
  }

  // Smart fetch with automatic retry and error recovery
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Try troubleshooting mode
        if (this.troubleshootingEnabled) {
          console.log(`⚠️ Expected JSON but got ${contentType}, attempting troubleshooting...`);
          return await this.troubleshootConnection(url, options, retryCount);
        }
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate JSON structure
      if (!this.validateJSON(data)) {
        console.warn('Invalid JSON structure, attempting recovery...');
        return await this.troubleshootConnection(url, options, retryCount);
      }

      return data;
    } catch (error) {
      console.error(`Fetch error (attempt ${retryCount + 1}/${this.maxRetries}):`, error);

      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(this.backoffMultiplier, retryCount);
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      // Max retries reached, return error object
      return {
        success: false,
        error: error.message,
        recovered: false
      };
    }
  }

  // Troubleshoot connection and fix JSON issues
  async troubleshootConnection(url, options = {}, retryCount = 0) {
    console.log('🔧 Starting smart troubleshooting...');
    
    try {
      // Step 1: Check if endpoint exists
      const healthCheck = await this.checkEndpointHealth(url);
      if (!healthCheck.healthy) {
        console.log('⚠️ Endpoint not healthy, attempting fix...');
        await this.fixEndpoint(url);
      }

      // Step 2: Try with different headers
      const fixedOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        }
      };

      const response = await fetch(url, fixedOptions);
      const text = await response.text();

      // Step 3: Try to parse JSON manually
      try {
        const data = JSON.parse(text);
        console.log('✅ Troubleshooting successful - JSON parsed');
        return data;
      } catch (parseError) {
        console.error('❌ Could not parse response as JSON:', text.substring(0, 100));
        
        // Step 4: Report to troubleshooting API
        await this.reportIssue(url, text);
        
        return {
          success: false,
          error: 'Invalid JSON response',
          recovered: false,
          rawResponse: text.substring(0, 200)
        };
      }
    } catch (error) {
      console.error('Troubleshooting failed:', error);
      return {
        success: false,
        error: error.message,
        recovered: false
      };
    }
  }

  // Check endpoint health
  async checkEndpointHealth(url) {
    try {
      const apiBase = window.CloudConfig ? window.CloudConfig.getAPIBase() : '';
      const checkUrl = `${apiBase}/api-troubleshooting/endpoints`;
      
      const response = await fetch(checkUrl);
      if (response.ok) {
        const data = await response.json();
        const endpoint = data.endpoints?.find(ep => url.includes(ep.endpoint));
        return {
          healthy: endpoint?.status === 'healthy',
          status: endpoint?.status || 'unknown'
        };
      }
    } catch (error) {
      console.warn('Health check failed:', error);
    }
    return { healthy: false, status: 'unknown' };
  }

  // Fix endpoint by triggering auto-fix
  async fixEndpoint(url) {
    try {
      const apiBase = window.CloudConfig ? window.CloudConfig.getAPIBase() : '';
      const fixUrl = `${apiBase}/api-troubleshooting/auto-fix`;
      
      await fetch(fixUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: url })
      });
      
      console.log('✅ Auto-fix triggered for endpoint');
      // Wait for fix to apply
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Auto-fix failed:', error);
    }
  }

  // Report issue to troubleshooting system
  async reportIssue(url, responseText) {
    try {
      const apiBase = window.CloudConfig ? window.CloudConfig.getAPIBase() : '';
      await fetch(`${apiBase}/smart-troubleshooting/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api',
          issue: 'Invalid JSON response',
          endpoint: url,
          response: responseText.substring(0, 500)
        })
      });
    } catch (error) {
      console.warn('Could not report issue:', error);
    }
  }

  // Validate JSON structure
  validateJSON(data) {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    // Check for common patterns
    if (data.success !== undefined || data.error !== undefined || Array.isArray(data)) {
      return true;
    }
    return true; // Allow other structures
  }

  // Smart EventSource with automatic reconnection
  createSmartEventSource(url, onMessage, onError) {
    const eventSourceId = url;
    
    // Close existing EventSource if any
    if (this.activeEventSources.has(eventSourceId)) {
      this.activeEventSources.get(eventSourceId).close();
    }

    const connectEventSource = () => {
      try {
        const eventSource = new EventSource(url);
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (this.validateJSON(data)) {
              if (onMessage) onMessage(data);
            } else {
              console.warn('Invalid event data structure');
            }
          } catch (error) {
            console.error('EventSource message parse error:', error);
            // Try troubleshooting
            if (this.troubleshootingEnabled) {
              this.reportIssue(url, event.data);
            }
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error, will reconnect...');
          if (onError) onError(error);
          
          eventSource.close();
          
          // Auto-reconnect after delay
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              console.log('Reconnecting EventSource...');
              connectEventSource();
            }
          }, this.eventSourceRetryDelay);
        };

        this.activeEventSources.set(eventSourceId, eventSource);
        return eventSource;
      } catch (error) {
        console.error('EventSource creation error:', error);
        
        // Retry connection
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            connectEventSource();
          }
        }, this.eventSourceRetryDelay);
      }
    };

    return connectEventSource();
  }

  // Close all EventSources
  closeAllEventSources() {
    this.activeEventSources.forEach(eventSource => {
      eventSource.close();
    });
    this.activeEventSources.clear();
  }

  // Handle visibility changes
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden, closing EventSources');
        this.closeAllEventSources();
      } else {
        console.log('Page visible, will reconnect EventSources on next call');
      }
    });
  }

  // Enable/disable troubleshooting
  setTroubleshooting(enabled) {
    this.troubleshootingEnabled = enabled;
    console.log(`Smart troubleshooting ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get communication stats
  getStats() {
    return {
      activeEventSources: this.activeEventSources.size,
      troubleshootingEnabled: this.troubleshootingEnabled,
      maxRetries: this.maxRetries
    };
  }
}

// Global instance
window.SmartErrorRecovery = new SmartErrorRecovery();
window.SmartErrorRecovery.setupVisibilityHandler();

// Helper function for HTML pages
window.smartFetch = async function(url, options) {
  return await window.SmartErrorRecovery.fetchWithRetry(url, options);
};

console.log('✅ Smart Error Recovery System loaded with troubleshooting');
