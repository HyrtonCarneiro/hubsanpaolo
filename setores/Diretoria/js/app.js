// js/app.js - Diretoria
// Entry point for Diretoria sector

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
        
        window.activeViewsConfig = ['visao', 'ranking', 'atos', 'cofre', 'inovacao', 'links'];
        
        // Render Dynamic Sidebar
        if (window.renderDynamicSidebar) {
            window.renderDynamicSidebar('sidebar-container', {
                sectorTitle: 'Diretoria',
                userName: currentUser,
                navItems: [
                    { id: 'visao', label: 'Visão Executiva', icon: 'ph ph-chart-polar', active: true },
                    { id: 'ranking', label: 'Ranking de Lojas', icon: 'ph ph-medal' },
                    { id: 'atos', label: 'Sala de Atos', icon: 'ph ph-megaphone' },
                    { id: 'cofre', label: 'Cofre de Arquivos', icon: 'ph ph-vault' },
                    { id: 'inovacao', label: 'Radar de Inovação', icon: 'ph ph-lightbulb' },
                    { id: 'links', label: 'Links Úteis', icon: 'ph ph-link' }
                ]
            });
        }
    }

    // Initialize Equipe Controller (Shared)
    if (window.EquipeController) {
        window.EquipeController.init('diretoria_equipe');
    }

    // Initialize Links Listener
    if (typeof window.initLinksListeners === 'function') {
        window.initLinksListeners('Diretoria');
    }

    window.switchView('visao');
}

// Redirect view switching to CoreUI
window.switchView = function(viewId) {
    if (window.CoreUI && window.activeViewsConfig) {
        window.CoreUI.switchView(viewId, window.activeViewsConfig);
    }
};

window.logout = () => window.location.href = '../../index.html';
