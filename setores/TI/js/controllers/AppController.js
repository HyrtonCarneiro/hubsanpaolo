// js/controllers/AppController.js — Core da aplicação TI (init, nav, sidebar, dark mode)
// Depends on: firebase-init.js (window globals), data.js (lojasIniciais, appConfig)

let currentUser = localStorage.getItem('loggedUser') || null;
window.currentUser = currentUser;
let currentMember = 'Hyrton';
window.currentMember = currentMember;

function showToast(msg, type = 'success') {
    Toastify({
        text: msg, duration: 4000, gravity: "bottom", position: "right",
        style: { 
            background: type === 'success' ? "var(--success)" : "var(--danger)", 
            borderRadius: "12px", 
            fontFamily: "Inter",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        }
    }).showToast();
}
window.showToast = showToast;

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode', 'dark');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode', 'dark');
    localStorage.setItem('darkMode', 'true');
}

window.logout = function () {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userSectors');
    window.location.href = '../../index.html';
}

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    let sectors = [];
    try {
        sectors = JSON.parse(localStorage.getItem('userSectors')) || [];
    } catch (e) {
        sectors = [];
    }

    if (!sectors.includes("TI") && currentUser !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }

    // Render Dynamic Sidebar
    if (typeof window.renderDynamicSidebar === 'function') {
        window.renderDynamicSidebar('sidebar-container', {
            sectorTitle: 'Tecnologia (TI)',
            userName: currentUser,
            navItems: [
                { id: 'analytics', label: 'Dashboard', icon: 'ph-bold ph-chart-pie-slice' },
                { id: 'lojas', label: 'Lojas e Chamados', icon: 'ph-bold ph-buildings' },
                { id: 'projetos', label: 'Tarefas da Equipe', icon: 'ph-bold ph-kanban' },
                { id: 'atas', label: 'Atas de Reunião', icon: 'ph-bold ph-notebook' },
                { id: 'protocolos', label: 'Protocolo de Chamados', icon: 'ph-bold ph-ticket' },
                { id: 'links', label: 'Links Úteis', icon: 'ph-bold ph-link' },
                { id: 'inventario', label: 'Inventário Tiaguinho', icon: 'ph-bold ph-barcode' },
                { id: 'mapa', label: 'Mapa de Lojas', icon: 'ph-bold ph-map-trifold' },
                { id: 'tiaguinho', label: 'BI do Lulu', icon: 'ph-bold ph-chart-pie-slice' },
                { id: 'conhecimento', label: 'Base de Conhecimento', icon: 'ph-bold ph-books' },
                { id: 'metapwr', label: 'Meta PWR', icon: 'ph-bold ph-target' }
            ]
        });
    }

    // Iniciar listeners do Firebase
    if (typeof window.initLojasChamadosListeners === 'function') window.initLojasChamadosListeners();
    if (typeof window.initProjetosEquipeListeners === 'function') window.initProjetosEquipeListeners();
    if (typeof window.initAtasListeners === 'function') window.initAtasListeners();
    if (typeof window.initProtocolosListeners === 'function') window.initProtocolosListeners();
    if (typeof window.initAtividadesListener === 'function') window.initAtividadesListener();
    if (typeof window.initLinksListeners === 'function') window.initLinksListeners('TI');
    if (typeof window.initConhecimentoListeners === 'function') window.initConhecimentoListeners();
    if (typeof window.initChamadosChart === 'function') window.initChamadosChart();

    const urlParams = new URLSearchParams(window.location.search);
    const viewToOpen = urlParams.get('view') || 'analytics';
    window.switchView(viewToOpen);
}
window.initApp = initApp;

window.switchView = function (view) {
    const views = ['analytics', 'lojas', 'projetos', 'atas', 'protocolos', 'metapwr', 'tiaguinho', 'inventario', 'mapa', 'links', 'conhecimento'];
    
    // Use CoreUI switchView
    window.CoreUI.switchView(view, views);

    if (view === 'analytics') {
        if (typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
        if (typeof window.atualizarGraficoChamados === 'function') window.atualizarGraficoChamados();
    }
    if (view === 'lojas') {
        window.renderizarLojas();
    }
    if (view === 'projetos') window.switchMember(window.currentMember || 'Hyrton');
    if (view === 'atas' && typeof window.renderizarAtas === 'function') window.renderizarAtas();
    if (view === 'protocolos' && typeof window.renderizarProtocolos === 'function') window.renderizarProtocolos();
    if (view === 'mapa' && typeof window.initMapa === 'function') window.initMapa();
    if (view === 'conhecimento' && typeof window.renderizarConhecimento === 'function') window.renderizarConhecimento();
}

window.toggleFullscreenBI = function() {
    const container = document.getElementById('tiaguinhoContainer');
    if (!container) return;

    if (container.classList.contains('bi-expanded')) {
        container.classList.remove('bi-expanded');
        const exitBtn = container.querySelector('.exit-bi-btn');
        if (exitBtn) exitBtn.classList.add('hidden');
    } else {
        container.classList.add('bi-expanded');
        const exitBtn = container.querySelector('.exit-bi-btn');
        if (exitBtn) exitBtn.classList.remove('hidden');
    }
}

window.toggleSidebar = function () {
    window.CoreUI.toggleSidebar();
}

document.addEventListener("DOMContentLoaded", function () {
    var elDev = document.getElementById('devNameDisplay');
    var elVer = document.getElementById('appVersionDisplay');
    if (elDev) elDev.innerText = appConfig.desenvolvedor;
    if (elVer) elVer.innerText = appConfig.versao;
});

