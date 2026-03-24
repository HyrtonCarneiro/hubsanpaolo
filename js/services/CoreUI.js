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
        if (sidebar && overlay) {
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }
        document.body.classList.toggle('sidebar-collapsed');
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

    injectHubButton: function (parentElementQuery) {
        // Future-proof injector that looks for the main header flex container
        const headerContainer = document.querySelector(parentElementQuery) || document.querySelector('.mb-8 .flex.items-center');
        if (!headerContainer || headerContainer.querySelector('.btn-hub')) return;
        
        const btn = document.createElement('button');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors btn-hub';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four text-xl"></i>';
        btn.onclick = () => window.location.href = '../../index.html?hub=1';
        
        // Insert before the first h1
        const h1 = headerContainer.querySelector('h1');
        if (h1) {
            headerContainer.insertBefore(btn, h1);
            // Ensure gap is present
            headerContainer.classList.add('gap-3');
        } else {
            headerContainer.prepend(btn);
        }
    }
};

// Auto-init dark mode on load
window.CoreUI.initDarkMode();
