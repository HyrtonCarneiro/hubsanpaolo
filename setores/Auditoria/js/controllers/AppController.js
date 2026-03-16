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

// --- HELPERS DE NORMALIZAÇÃO E ROBUSTEZ ---

window.normalizeString = function(str) {
    if (!str) return "";
    return str.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toUpperCase()
        .trim();
};

window.properCase = function(str) {
    if (!str) return "";
    const s = str.toString().toLowerCase().trim();
    if (s.length === 0) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};

window.getLojaByFlexName = function(name) {
    if (!name) return null;
    const search = window.normalizeString(name);
    
    // Mapeamento de Sinônimos/Apelidos comuns
    const sinonimos = {
        "OUTLET FORTALEZA": "CAUCAIA/OUTLET",
        "CAUCAIA": "CAUCAIA/OUTLET",
        "OUTLET": "CAUCAIA/OUTLET",
        "ESTACAO CUIABA": "SHOPPING ESTAÇÃO CUIABA",
        "PANTANAL": "PANTANAL SHOPPING / CUIABA",
        "COHAMA": "SHOPPING DA ILHA", // No Hub Cohama é o Shopping da Ilha
        "IGUATEMI": "IGUATEMI FORTALEZA",
        "RIO POTY": "RIO POTY",
        "RIVERSIDE": "RIVERSIDE",
        "PATIO PAULISTA": "PATIO PAULISTA",
        "CIDADE SAO PAULO": "CIDADE SÃO PAULO",
        "AEROPORTO SALVADOR Q": "AEROPORTO QUIOSQUE SALVADOR",
        "AEROPORTO SALVADOR": "AEROPORTO LOJA SALVADOR",
        "BOULEVARD": "BOULEVARD",
        "PARNAMIRIM": "PARNAMIRIM",
        "PREA": "PREA"
    };

    // 1. Tentar por sinônimo exato (normalizado)
    if (sinonimos[search]) {
        const oficial = sinonimos[search];
        const loja = window.lojasIniciais.find(l => window.normalizeString(l.nome) === window.normalizeString(oficial));
        if (loja) return loja;
    }

    // 2. Tentar correspondência exata
    let found = window.lojasIniciais.find(l => window.normalizeString(l.nome) === search);
    if (found) return found;

    // 3. Tentar correspondência parcial (se o nome da planilha está contido no nome do sistema ou vice-versa)
    found = window.lojasIniciais.find(l => {
        const oficial = window.normalizeString(l.nome);
        return oficial.includes(search) || search.includes(oficial);
    });

    return found || null;
};

// --- CONTROLE DE MODAL DE IMPORTAÇÃO ---

window.showImportModal = function(total) {
    const modal = document.getElementById('modalImportProgresso');
    const log = document.getElementById('importLog');
    const bar = document.getElementById('importProgressBar');
    const percent = document.getElementById('importProgressPercent');
    const status = document.getElementById('importProgressStatus');
    const btnFechar = document.getElementById('btnFecharImport');
    const btnConcluir = document.getElementById('btnConcluirImport');

    if (modal) modal.classList.add('show');
    if (log) log.innerHTML = `<div class="text-blue-500 font-bold">Iniciando importação de ${total} registros...</div>`;
    if (bar) bar.style.width = '0%';
    if (percent) percent.innerText = '0%';
    if (status) status.innerText = 'Processando...';
    if (btnFechar) btnFechar.classList.add('hidden');
    if (btnConcluir) btnConcluir.classList.add('hidden');
};

window.updateImportProgress = function(current, total, message, type = 'info') {
    const log = document.getElementById('importLog');
    const bar = document.getElementById('importProgressBar');
    const percent = document.getElementById('importProgressPercent');
    const status = document.getElementById('importProgressStatus');

    const p = Math.round((current / total) * 100);
    if (bar) bar.style.width = p + '%';
    if (percent) percent.innerText = p + '%';
    if (status) status.innerText = `Processando ${current}/${total}...`;

    if (log) {
        const line = document.createElement('div');
        const colors = {
            'info': 'text-[var(--text-main)]',
            'success': 'text-green-500',
            'warning': 'text-orange-500',
            'error': 'text-red-500 font-bold'
        };
        line.className = colors[type] || colors.info;
        line.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
    }

    if (current === total) {
        if (status) status.innerText = 'Importação Concluída!';
        const btnFechar = document.getElementById('btnFecharImport');
        const btnConcluir = document.getElementById('btnConcluirImport');
        if (btnFechar) btnFechar.classList.remove('hidden');
        if (btnConcluir) btnConcluir.classList.remove('hidden');
    }
};

window.fecharModalImportProgresso = function() {
    const modal = document.getElementById('modalImportProgresso');
    if (modal) modal.classList.remove('show');
};

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
    if (typeof window.initMapeamentoListeners === 'function') window.initMapeamentoListeners();

    // Data padrão hoje
    if (document.getElementById('audiDataInput')) {
        document.getElementById('audiDataInput').valueAsDate = new Date();
    }

    window.switchView('dashboard');
}
window.initApp = initApp;

window.switchView = function (view) {
    const views = ['dashboard', 'auditoriaOnline', 'planejamento', 'mapeamento', 'tarefas', 'metapwr'];

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
