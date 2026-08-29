// js/services/CoreUI.js
// Global Utility Service for San Paolo Hub UI behaviors

// Global Configuration (Auditoria Exclusivo)
window.appConfig = {
    sectors: [
        { id: "Auditoria", title: "Auditoria", icon: "ph-fill ph-magnifying-glass", color: false, equipeCol: "auditoria_equipe" }
    ]
};

// Global Toast Utility
window.showToast = function (msg, type = 'success') {
    if (typeof Toastify === 'undefined') {
        console.log("Toast:", msg);
        return;
    }
    Toastify({
        text: msg, duration: 3000, gravity: "bottom", position: "right",
        style: { background: type === 'success' ? "var(--success)" : (type === 'warning' ? "#f59e0b" : "var(--danger)"), borderRadius: "6px", fontFamily: "Inter" }
    }).showToast();
}

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
    },

    linkify: function (text) {
        if (!text) return '';
        // Impede de quebrar links já existentes e ignora pontuação no final
        var urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
        return text.replace(urlRegex, function(url) {
            // Se a string testada já fizer parte de um HTML com href, não aplicamos
            if (url.indexOf('href=') !== -1) return url;
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline break-all" onclick="event.stopPropagation()">' + url + '</a>';
        });
    }
};

// Auto-init dark mode on load
window.CoreUI.initDarkMode();
