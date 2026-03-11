// js/controllers/AppController.js — Core da aplicação TI (init, nav, sidebar, dark mode)
// Depends on: firebase-init.js (window globals), data.js (lojasIniciais, appConfig)

let currentUser = sessionStorage.getItem('loggedUser') || null;
window.currentUser = currentUser;
let currentMember = 'Hyrton';
window.currentMember = currentMember;

function showToast(msg, type = 'success') {
    Toastify({
        text: msg, duration: 3000, gravity: "bottom", position: "right",
        style: { background: type === 'success' ? "var(--success)" : "var(--danger)", borderRadius: "6px", fontFamily: "Inter" }
    }).showToast();
}
window.showToast = showToast;

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
}

window.logout = function () {
    sessionStorage.removeItem('loggedUser');
    sessionStorage.removeItem('userSectors');
    window.location.href = '../../index.html';
}

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    let sectors = [];
    try {
        sectors = JSON.parse(sessionStorage.getItem('userSectors')) || [];
    } catch (e) {
        sectors = [];
    }

    if (!sectors.includes("TI") && currentUser !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('loggedUserName').innerText = currentUser;

    // Injetar botão do Hub dinamicamente
    document.querySelectorAll('.flex.items-center.gap-3').forEach(function (container) {
        if (!container.closest('.mb-8')) return;
        if (container.querySelector('.btn-hub')) return;
        var btn = document.createElement('button');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors btn-hub';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four text-xl"></i>';
        btn.onclick = function () { window.location.href = '../../index.html?hub=1'; };
        container.insertBefore(btn, container.querySelector('h1'));
    });

    // Iniciar listeners do Firebase
    if (typeof window.initLojasChamadosListeners === 'function') window.initLojasChamadosListeners();
    if (typeof window.initProjetosEquipeListeners === 'function') window.initProjetosEquipeListeners();
    if (typeof window.initAtasListeners === 'function') window.initAtasListeners();

    window.switchView('analytics');
}
window.initApp = initApp;

window.switchView = function (view) {
    document.getElementById('view-analytics').style.display = 'none';
    document.getElementById('view-lojas').style.display = 'none';
    document.getElementById('view-projetos').style.display = 'none';
    var va = document.getElementById('view-atas'); if (va) va.style.display = 'none';
    var vb = document.getElementById('view-bi'); if (vb) vb.style.display = 'none';
    var vp = document.getElementById('view-metapwr'); if (vp) vp.style.display = 'none';

    document.getElementById('nav-analytics').classList.remove('active');
    document.getElementById('nav-lojas').classList.remove('active');
    document.getElementById('nav-projetos').classList.remove('active');
    var na = document.getElementById('nav-atas'); if (na) na.classList.remove('active');
    var nb = document.getElementById('nav-bi'); if (nb) nb.classList.remove('active');
    var np = document.getElementById('nav-metapwr'); if (np) np.classList.remove('active');

    document.getElementById('view-' + view).style.display = 'block';
    document.getElementById('nav-' + view).classList.add('active');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }

    if (view === 'analytics' && typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
    if (view === 'lojas') window.renderizarLojas();
    if (view === 'projetos') window.switchMember(window.currentMember || 'Hyrton');
    if (view === 'atas' && typeof window.renderizarAtas === 'function') window.renderizarAtas();
}

window.toggleSidebar = function () {
    var sidebar = document.getElementById('appSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var elDev = document.getElementById('devNameDisplay');
    var elVer = document.getElementById('appVersionDisplay');
    if (elDev) elDev.innerText = appConfig.desenvolvedor;
    if (elVer) elVer.innerText = appConfig.versao;
});
