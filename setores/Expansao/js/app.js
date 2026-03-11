// setores/Expansao/js/app.js
// All dependencies are window globals loaded via <script> tags in index.html:
// lojasIniciais → data.js
// ExpansaoService → services/ExpansaoService.js
// DashboardController, KanbanController, ModalObraController, GanttController, TarefasController → controllers/
// KanbanCard, TaskCard → components/molecules/

let currentUser = sessionStorage.getItem('loggedUser') || null;
let obrasCache = [];

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

// Attach globals for HTML handlers
window.showToast = showToast;
window.expansaoModal = ModalObraController;
window.tarefasCtrl = TarefasController;

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
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
    try {
        if (!currentUser) {
            window.location.href = '../../index.html';
            return;
        }

        const loggedUserNameEl = document.getElementById('loggedUserName');
        if (loggedUserNameEl) loggedUserNameEl.innerText = currentUser;

        document.querySelectorAll('.header-actions > div:first-child').forEach(container => {
            if (container.querySelector('.btn-hub')) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline btn-hub';
            btn.style.padding = '6px 10px';
            btn.title = 'Escolha de Setores';
            btn.innerHTML = '<i class="ph ph-squares-four" style="font-size: 1.2rem;"></i>';
            btn.onclick = () => window.location.href = '../../index.html?hub=1';
            container.insertBefore(btn, container.querySelector('.page-title'));
        });

        window.switchView('dashboard');
        carregarDadosBase();
        
        ExpansaoService.listenEquipe((equipe) => TarefasController.updateEquipe(equipe));
        ExpansaoService.listenProjetos((projetos) => TarefasController.updateProjetos(projetos));

        KanbanController.popularFiltroRegionaisExpansao(lojasIniciais);
        KanbanController.popularSelectLojasExpansao(lojasIniciais);

    } catch (e) {
        console.error("ERRO CRÍTICO NO INITAPP:", e);
        showToast("Erro ao iniciar a tela. " + e.message, "error");
    }
}

async function carregarDadosBase() {
    try {
        obrasCache = await ExpansaoService.getObras();
        KanbanController.filtrarKanban(obrasCache, lojasIniciais);
        GanttController.renderGantt(obrasCache);
        DashboardController.atualizarDashboard(obrasCache);
    } catch (error) {
        console.error("Erro ao carregar Obras: ", error);
        showToast("Erro ao carregar obras da base.", "error");
    }
}

// Global View Switcher
window.switchView = function (view) {
    try {
        const views = ['dashboard', 'obras', 'tarefas', 'metapwr', 'gantt'];
        views.forEach(v => {
            const el = document.getElementById(`view-\${v}`);
            if (el) el.style.display = 'none';
            const nav = document.getElementById(`nav-\${v}`);
            if (nav) nav.classList.remove('active');
        });

        const currView = document.getElementById(`view-\${view}`);
        const currNav = document.getElementById(`nav-\${view}`);

        if (currView) currView.style.display = (view === 'obras' || view === 'tarefas' || view === 'gantt') ? 'flex' : 'block';
        if (view === 'tarefas') currView.style.flexDirection = 'column';
        if (currNav) currNav.classList.add('active');

        if (view === 'gantt') GanttController.renderGantt(obrasCache);

        if (window.innerWidth <= 768) window.toggleSidebar();
    } catch (e) {
        console.error("ERRO NO SWITCHVIEW:", e);
        showToast("Erro ao mudar de aba", "error");
    }
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// Global Wrappers for HTML Event Listeners
window.filtrarKanban = () => KanbanController.filtrarKanban(obrasCache, lojasIniciais);
window.abrirModalCardExpansao = (id) => ModalObraController.abrirModal(id, obrasCache, currentUser);
window.fecharModalCardExpansao = () => ModalObraController.fecharModal();
window.salvarCardExpansao = () => ModalObraController.salvarCard(currentUser, () => carregarDadosBase());
window.excluirObra = () => ModalObraController.excluirObra(() => carregarDadosBase());

window.allowDropExpansao = KanbanController.allowDropExpansao;
window.dragExpansao = KanbanController.dragExpansao;
window.dropExpansao = (ev) => KanbanController.dropExpansao(ev, obrasCache, currentUser, () => {
    KanbanController.filtrarKanban(obrasCache, lojasIniciais);
    DashboardController.atualizarDashboard(obrasCache);
});

// Expose directly to window via objects for specific scopes, but some direct globals for modal items
window.addChecklistItemCard = () => ModalObraController.addChecklist();
window.addComentarioCardExpansao = () => ModalObraController.addComentario(currentUser);
window.addAnexoCard = () => ModalObraController.addAnexo();
window.addFornecedorCard = () => ModalObraController.addFornecedor();

// --- Tarefas globals
window.salvarProjeto = () => TarefasController.salvarProjeto();
window.deletarProjetoExp = (id) => TarefasController.deletarProjeto(id);
window.atualizarStatusProjExp = (id, s) => TarefasController.atualizarStatusProj(id, s);
window.abrirModalEquipeExp = () => TarefasController.abrirModalEquipe();
window.fecharModalEquipeExp = () => TarefasController.fecharModalEquipe();
window.addMembroEquipeExp = () => TarefasController.addMembro();
window.removerMembroExp = (id) => TarefasController.removerMembro(id);

if (currentUser) {
    initApp();
}
