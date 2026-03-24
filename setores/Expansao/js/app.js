// js/app.js - Expansão
// Entry point for Expansão sector

let currentUser = localStorage.getItem('loggedUser') || null;

function showToast(msg, type = 'success') {
    try {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: msg, duration: 3000, gravity: "top", position: "right",
                style: { background: type === 'success' ? "var(--sp-pistache)" : (type === 'warning' ? "var(--sp-laranja)" : "var(--sp-red)"), borderRadius: "8px", fontFamily: "Inter" }
            }).showToast();
        } else { alert(msg); }
    } catch (e) { console.error(e); }
}

if (currentUser) {
    initApp();
} else {
    window.location.href = '../../index.html';
}

function initApp() {
    // Replaced explicit DOM updates with CoreUI
    if (window.CoreUI) {
        window.CoreUI.initDarkMode();
        
        window.activeViewsConfig = ['dashboard', 'tarefas', 'metapwr', 'links'];
        
        // Render Dynamic Sidebar
        if (window.renderDynamicSidebar) {
            window.renderDynamicSidebar('sidebar-container', {
                sectorTitle: 'Expansão',
                userName: currentUser,
                navItems: [
                    { id: 'dashboard', label: 'Dashboard', icon: 'ph ph-chart-pie-slice', active: true },
                    { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph ph-kanban' },
                    { id: 'metapwr', label: 'Meta PWR', icon: 'ph ph-target' },
                    { id: 'links', label: 'Links Úteis', icon: 'ph ph-link' }
                ]
            });
        }
    }

    // Initialize Equipe Controller (Shared)
    if (window.EquipeController) {
        window.EquipeController.init('expansao_equipe');
    }

    // Initialize Links Listener
    if (typeof window.initLinksListeners === 'function') {
        window.initLinksListeners('Expansão');
    }

    window.switchView('dashboard');
}

// Redirect view switching to CoreUI
window.switchView = function(viewId) {
    if (window.CoreUI && window.activeViewsConfig) {
        window.CoreUI.switchView(viewId, window.activeViewsConfig);
    }
};

window.logout = () => window.location.href = '../../index.html';
