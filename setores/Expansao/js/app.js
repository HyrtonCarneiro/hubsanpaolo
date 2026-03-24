// setores/Expansao/js/app.js
// All dependencies are window globals loaded via <script> tags in index.html:
// lojasIniciais → data.js
// ExpansaoService → services/ExpansaoService.js
// DashboardController, KanbanController, ModalObraController, GanttController, TarefasController → controllers/
// KanbanCard, TaskCard → components/molecules/

let currentUser = localStorage.getItem('loggedUser') || null;
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
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userSectors');
    window.location.href = '../../index.html';
}

function initApp() {
    try {
        if (!currentUser) {
            window.location.href = '../../index.html';
            return;
        }

        // Render Dynamic Sidebar
        if (typeof window.renderDynamicSidebar === 'function') {
            window.renderDynamicSidebar('sidebar-container', {
                sectorTitle: 'Expansão',
                userName: currentUser,
                navItems: [
                    { id: 'dashboard', label: 'Dashboard', icon: 'ph-bold ph-chart-pie-slice' },
                    { id: 'obras', label: 'Kanban', icon: 'ph-bold ph-buildings' },
                    { id: 'gantt', label: 'Cronograma', icon: 'ph-bold ph-calendar' },
                    { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph-bold ph-kanban' },
                    { id: 'metapwr', label: 'Meta PWR', icon: 'ph-bold ph-target' },
                    { id: 'links', label: 'Links Úteis', icon: 'ph-bold ph-link' }
                ]
            });
        }

        window.switchView('dashboard');
        if (typeof window.initLinksListeners === 'function') window.initLinksListeners('Expansao');
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

window.switchView = function (view) {
    const views = ['dashboard', 'obras', 'tarefas', 'metapwr', 'gantt', 'links'];
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
