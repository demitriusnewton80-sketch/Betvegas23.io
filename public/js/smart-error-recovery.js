
// Smart Error Recovery System - Client Side
// Auto-fixes API connection issues and retries failed requests

class SmartErrorRecovery {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.backoffMultiplier = 1.5;
    this.eventSourceRetryDelay = 5000;
    this.activeEventSources = new Map();
  }

  // Smart fetch with automatic retry and error recovery
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Fetch error (attempt ${retryCount + 1}/${this.maxRetries}):`, error);

      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(this.backoffMultiplier, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        
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
            if (onMessage) onMessage(data);
          } catch (error) {
            console.error('EventSource message parse error:', error);
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
}

// Global instance
window.SmartErrorRecovery = new SmartErrorRecovery();
window.SmartErrorRecovery.setupVisibilityHandler();
