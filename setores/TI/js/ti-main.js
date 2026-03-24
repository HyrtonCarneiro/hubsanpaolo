// js/ti-main.js - TI
// Entry point for TI sector

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
        
        window.activeViewsConfig = ['analytics', 'lojas', 'projetos', 'atas', 'protocolos', 'links', 'inventario', 'mapa', 'tiaguinho', 'metapwr'];
        
        // Render Dynamic Sidebar
        if (window.renderDynamicSidebar) {
            window.renderDynamicSidebar('sidebar-container', {
                sectorTitle: 'TI',
                userName: currentUser,
                navItems: [
                    { id: 'analytics', label: 'Dashboard', icon: 'ph ph-chart-line-up', active: true },
                    { id: 'lojas', label: 'Lojas e Chamados', icon: 'ph ph-buildings' },
                    { id: 'projetos', label: 'Tarefas Equipe', icon: 'ph ph-kanban' },
                    { id: 'atas', label: 'Atas de Reunião', icon: 'ph ph-notebook' },
                    { id: 'protocolos', label: 'Protocolo de Chamados', icon: 'ph ph-ticket' },
                    { id: 'links', label: 'Links Úteis', icon: 'ph ph-link' },
                    { id: 'inventario', label: 'Inventário Tiaguinho', icon: 'ph ph-barcode', section: 'Explorar' },
                    { id: 'mapa', label: 'Mapa Marcas', icon: 'ph ph-map-trifold', section: 'Explorar' },
                    { id: 'tiaguinho', label: 'BI Tiaguinho', icon: 'ph ph-chart-pie-slice', section: 'Explorar' },
                    { id: 'metapwr', label: 'Meta PWR', icon: 'ph ph-target', section: 'Explorar' }
                ]
            });
        }
    }

    // Initialize Equipe Controller
    if (window.EquipeController) {
        window.EquipeController.init('ti_equipe');
    }

    // Initialize Links Listener
    if (typeof window.initLinksListeners === 'function') {
        window.initLinksListeners('TI');
    }

    // TI Specific Controller Inits
    if (window.initTiDashboard) window.initTiDashboard();
    if (window.initLojasChamados) window.initLojasChamados();
    if (window.initProjetosEquipe) window.initProjetosEquipe();
    if (window.initAtas) window.initAtas();
    if (window.initMapa) window.initMapa();
    if (window.initProtocolos) window.initProtocolos();

    window.switchView('analytics');
}

// Redirect view switching to CoreUI
window.switchView = function(viewId) {
    if (window.CoreUI && window.activeViewsConfig) {
        window.CoreUI.switchView(viewId, window.activeViewsConfig);
    }
};

window.logout = () => window.location.href = '../../index.html';

// Global trigger for TI Equipe Modal
window.abrirModalEquipe = function() {
    if (window.EquipeController) window.EquipeController.abrirModal();
};
window.fecharModalEquipe = function() {
    if (window.EquipeController) window.EquipeController.fecharModal();
};
