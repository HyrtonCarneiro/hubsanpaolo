// js/app.js - Controladoria
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
            sectorTitle: 'Controladoria',
            userName: currentUser,
            navItems: [
                { id: 'dashboard', label: 'Dashboard', icon: 'ph-bold ph-chart-pie-slice' },
                { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph-bold ph-kanban' },
                { id: 'metapwr', label: 'Meta PWR', icon: 'ph-bold ph-target' },
                { id: 'links', label: 'Links Úteis', icon: 'ph-bold ph-link' }
            ]
        });
    }

    // Iniciar listener de equipe
    iniciarListenerEquipe();
    if (typeof window.initLinksListeners === 'function') window.initLinksListeners('Controladoria');

    window.switchView('dashboard');
}

window.switchView = function (view) {
    const views = ['dashboard', 'tarefas', 'metapwr', 'links'];
    window.CoreUI.switchView(view, views);
}

window.toggleSidebar = function () {
    window.CoreUI.toggleSidebar();
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
window.abrirModalEquipe = function() {
    document.getElementById('modalEquipe').classList.add('show');
    window.carregarUsuariosSistema();
}

window.fecharModalEquipe = function() {
    document.getElementById('modalEquipe').classList.remove('show');
}

window.carregarUsuariosSistema = async function() {
    const select = document.getElementById('novoMembroSelecionado');
    if (!select) return;
    select.innerHTML = '<option value="">Carregando...</option>';
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let users = [];
        querySnapshot.forEach(docSnap => users.push(docSnap.data().user));
        users.sort();
        select.innerHTML = '<option value="">Selecione um usuário...</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.innerText = u;
            select.appendChild(opt);
        });
    } catch(e) {
        console.error(e);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

window.adicionarMembro = async function() {
    const nome = document.getElementById('novoMembroSelecionado').value;
    if (!nome) return showToast("Selecione um usuário", "error");
    if (equipeCache.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "controladoria_equipe"), { nome });
        document.getElementById('novoMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch(e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function(idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
    try {
        await deleteDoc(doc(db, "controladoria_equipe", idMembro));
        showToast("Membro removido.");
    } catch(e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaEquipeGerenciar() {
    const container = document.getElementById('listaEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';
    if (equipeCache.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center">Nenhum membro.</p>';
        return;
    }
    equipeCache.forEach(m => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML = `
            <span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ${m.nome}</span>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onclick="window.removerMembro('${m.firebaseId}', '${m.nome}')"><i class="ph ph-trash"></i></button>
        `;
        container.appendChild(div);
    });
}

if (currentUser) initApp();
