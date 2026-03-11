// js/controllers/AppController.js — Core da aplicação (init, nav, sidebar, dark mode)
// Depends on: firebase-init.js (window globals), data.js (lojasIniciais)

let currentUser = sessionStorage.getItem('loggedUser') || null;
window.currentUser = currentUser;

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
window.showToast = showToast;

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (typeof window.renderizarGrafico === 'function') window.renderizarGrafico();
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
}

window.logout = function () {
    window.location.href = '../../index.html';
}

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('loggedUserName').innerText = currentUser;

    // Popular Lojas no Select de Auditoria Online — Agrupado por Regional
    const selectLoja = document.getElementById('audiSelectLoja');
    if (selectLoja) {
        selectLoja.innerHTML = '<option value="">Selecione a Loja...</option>';
        const porEstado = {};
        lojasIniciais.forEach(loja => {
            if (!porEstado[loja.estado]) porEstado[loja.estado] = [];
            porEstado[loja.estado].push(loja.nome);
        });
        const estadosOrdenados = Object.keys(porEstado).sort();
        estadosOrdenados.forEach(estado => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Regional ' + estado;
            porEstado[estado].sort().forEach(nome => {
                const opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                optgroup.appendChild(opt);
            });
            selectLoja.appendChild(optgroup);
        });
    }

    // Injetar botão do Hub dinamicamente
    document.querySelectorAll('.flex.items-center.gap-3').forEach(container => {
        if (!container.closest('.mb-8') && !container.closest('.mb-6')) return;
        if (container.querySelector('.btn-hub')) return;
        const btn = document.createElement('button');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors btn-hub shadow-sm';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four text-xl"></i>';
        btn.onclick = () => window.location.href = '../../index.html?hub=1';
        container.insertBefore(btn, container.querySelector('h1'));
    });

    // Iniciar Listeners do Firebase (cada controller exporta sua função de init)
    if (typeof window.initAuditoriaOnlineListeners === 'function') window.initAuditoriaOnlineListeners();
    if (typeof window.initPlanejamentoListeners === 'function') window.initPlanejamentoListeners();
    if (typeof window.initTarefasListeners === 'function') window.initTarefasListeners();

    // Data padrão hoje
    if (document.getElementById('audiDataInput')) {
        document.getElementById('audiDataInput').valueAsDate = new Date();
    }

    window.switchView('dashboard');
}
window.initApp = initApp;

window.switchView = function (view) {
    const views = ['dashboard', 'auditoriaOnline', 'planejamento', 'tarefas', 'metapwr'];

    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        const nav = document.getElementById('nav-' + v);
        if (el) el.style.display = 'none';
        if (nav) nav.classList.remove('active-nav');
    });

    const currView = document.getElementById('view-' + view);
    const currNav = document.getElementById('nav-' + view);
    if (currView) currView.style.display = 'block';
    if (currNav) currNav.classList.add('active-nav');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }

    if (view === 'metapwr' && typeof window.renderizarGrafico === 'function') {
        window.renderizarGrafico();
    }
}

window.toggleSidebar = function () {
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
}
