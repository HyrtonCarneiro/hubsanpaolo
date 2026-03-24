// js/services/CoreUI.js
// Global Utility Service for San Paolo Hub UI behaviors

window.CoreUI = {
    toggleDarkMode: function () {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    },

    initDarkMode: function () {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode', 'dark');
        } else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode', 'dark');
            localStorage.setItem('darkMode', 'true');
        }
    },

    toggleSidebar: function () {
        const sidebar = document.getElementById('appSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const body = document.body;
        
        if (window.innerWidth <= 768) {
            // Mobile: slide in/out as overlay
            if (sidebar && overlay) {
                if (sidebar.classList.contains('-translate-x-full')) {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                } else {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                }
            }
        } else {
            // Desktop: toggle width/margin
            body.classList.toggle('sidebar-collapsed');
        }
    },

    switchView: function (targetViewId, allViewIds) {
        // Hides all views and shows the target
        allViewIds.forEach(viewId => {
            const el = document.getElementById('view-' + viewId);
            if (el) el.style.display = 'none';
            const nav = document.getElementById('nav-' + viewId);
            if (nav) nav.classList.remove('active-nav');
        });

        const targetEl = document.getElementById('view-' + targetViewId);
        if (targetEl) targetEl.style.display = 'block';
        
        const targetNav = document.getElementById('nav-' + targetViewId);
        if (targetNav) targetNav.classList.add('active-nav');

        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }
    },

    goToHub: function () {
        window.location.href = '../../index.html?hub=1';
    }
};

// Auto-init dark mode on load
window.CoreUI.initDarkMode();
