// js/app.js - Marketing
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy -> from firebase-init.js (window globals)

let currentUser = localStorage.getItem('loggedUser') || null;
let equipeCache = [];

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

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode', 'dark');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode', 'dark');
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

    // Render Dynamic Sidebar
    if (typeof window.renderDynamicSidebar === 'function') {
        window.renderDynamicSidebar('sidebar-container', {
            sectorTitle: 'Marketing',
            userName: currentUser,
            navItems: [
                { id: 'dashboard', label: 'Dashboard', icon: 'ph-bold ph-chart-pie-slice' },
                { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph-bold ph-kanban' },
                { id: 'metapwr', label: 'Meta PWR', icon: 'ph-bold ph-target' },
                { id: 'ianzinho', label: 'BI Ianzinho', icon: 'ph-bold ph-chart-pie-slice' },
                { id: 'links', label: 'Links Úteis', icon: 'ph-bold ph-link' }
            ]
        });
    }

    // Iniciar listeners
    if (typeof window.initMarketingTarefasListeners === 'function') window.initMarketingTarefasListeners();
    if (typeof window.initLinksListeners === 'function') window.initLinksListeners('Marketing');

    window.switchView('dashboard');
}

window.switchView = function (view) {
    const views = ['dashboard', 'tarefas', 'metapwr', 'ianzinho', 'links'];
    window.CoreUI.switchView(view, views);
    
    // Refresh board if switching to tarefas
    if (view === 'tarefas' && typeof window.renderizarMarketingProjetosList === 'function') {
        window.renderizarMarketingProjetosList();
    }
}

window.toggleSidebar = function () {
    window.CoreUI.toggleSidebar();
}

window.toggleFullscreenBI = function() {
    const container = document.getElementById('ianzinhoContainer');
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

window.toggleDarkMode = function () {
    window.CoreUI.toggleDarkMode();
}

window.logout = function () {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userSectors');
    window.location.href = '../../index.html';
}

// ====== EQUIPE ======
// Redirecionando para o TarefasController que agora gerencia isso de forma centralizada
window.abrirModalEquipe = function() {
    document.getElementById('modalEquipe').classList.add('show');
    if (typeof window.carregarUsuariosSistemaMarketing === 'function') {
        window.carregarUsuariosSistemaMarketing();
    }
}

window.fecharModalEquipe = function() {
    document.getElementById('modalEquipe').classList.remove('show');
}

window.adicionarMembro = async function() {
    const select = document.getElementById('novoMembroSelecionado');
    const nome = select ? select.value : '';
    if (!nome) return showToast("Selecione um usuário", "error");
    
    if (window.marketingEquipe && window.marketingEquipe.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "marketing_equipe"), { nome });
        showToast("Membro adicionado!");
    } catch(e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function(idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
    try {
        await deleteDoc(doc(db, "marketing_equipe", idMembro));
        showToast("Membro removido.");
    } catch(e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

if (currentUser) initApp();

