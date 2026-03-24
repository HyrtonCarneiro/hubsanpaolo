// js/app.js - Auditoria
// Entry point for Auditoria sector

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
        
        window.activeViewsConfig = ['dashboard', 'auditoriaOnline', 'planejamento', 'mapeamento', 'tarefas', 'protocolos', 'metapwr', 'links'];
        
        // Render Dynamic Sidebar
        if (window.renderDynamicSidebar) {
            window.renderDynamicSidebar('sidebar-container', {
                sectorTitle: 'Auditoria',
                userName: currentUser,
                navItems: [
                    { id: 'dashboard', label: 'Dashboard', icon: 'ph ph-chart-pie-slice', active: true },
                    { id: 'auditoriaOnline', label: 'Auditoria Online', icon: 'ph ph-clipboard-text' },
                    { id: 'planejamento', label: 'Planejamento', icon: 'ph ph-calendar-check' },
                    { id: 'mapeamento', label: 'Mapeamento (Novo)', icon: 'ph ph-map-trifold' },
                    { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph ph-kanban' },
                    { id: 'protocolos', label: 'Protocolo de Chamados', icon: 'ph ph-ticket' },
                    { id: 'metapwr', label: 'Meta PWR (MVP)', icon: 'ph ph-target' },
                    { id: 'links', label: 'Links Úteis', icon: 'ph ph-link' }
                ]
            });
        }
    }

    // Initialize Equipe Controller (Auditoria Specific naming preserved but used through standardized pattern if possible)
    if (window.AuditoriaEquipeController) {
        // Auditoria uses a custom modal name in some places, but we can standardize the trigger
    } else if (window.EquipeController) {
        window.EquipeController.init('auditoria_equipe');
    }

    // Initialize Links Listener
    if (typeof window.initLinksListeners === 'function') {
        window.initLinksListeners('Auditoria');
    }

    // Auditoria has many controllers to init
    if (window.initAuditoriaDashboard) window.initAuditoriaDashboard();
    if (window.initAuditoriaOnline) window.initAuditoriaOnline();
    if (window.initPlanejamento) window.initPlanejamento();
    if (window.initMapeamento) window.initMapeamento();
    if (window.initProtocolos) window.initProtocolos();

    window.switchView('dashboard');
}

// Redirect view switching to CoreUI
window.switchView = function(viewId) {
    if (window.CoreUI && window.activeViewsConfig) {
        window.CoreUI.switchView(viewId, window.activeViewsConfig);
    }
};

window.logout = () => window.location.href = '../../index.html';

// Global trigger for Auditoria Equipe Modal (preserving legacy naming compatibility)
window.abrirModalAudiEquipe = function() {
    if (window.EquipeController) window.EquipeController.abrirModal();
};
window.fecharModalEquipe = function() {
    if (window.EquipeController) window.EquipeController.fecharModal();
};
