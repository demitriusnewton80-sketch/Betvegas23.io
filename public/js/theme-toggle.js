
// Dark Mode Toggle System
// Young Meaat LLC - FCC Entity: 20130314143016

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);
        
        // Create toggle button if it doesn't exist
        if (!document.querySelector('.theme-toggle')) {
            this.createToggleButton();
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.innerHTML = `<span class="theme-icon">${this.currentTheme === 'dark' ? '🌙' : '☀️'}</span>`;
        
        button.addEventListener('click', () => this.toggleTheme());
        
        document.body.appendChild(button);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button icon
        const toggleButton = document.querySelector('.theme-toggle .theme-icon');
        if (toggleButton) {
            toggleButton.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        
        console.log(`Theme switched to: ${theme}`);
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ThemeManager = themeManager;
}
