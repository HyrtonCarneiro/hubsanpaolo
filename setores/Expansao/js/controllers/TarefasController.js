// TaskCard, ExpansaoService → window globals

window.TarefasController = {
    equipeExpCache: [],
    projetosExpCache: [],
    currentMemberExp: null,

    init(equipe, projetos) {
        this.equipeExpCache = equipe;
        this.projetosExpCache = projetos;
        this.renderizarFiltroEquipe();
        this.renderizarProjetos();
        this.renderListaMembrosModal();
    },

    updateEquipe(equipe) {
        this.equipeExpCache = equipe;
        this.renderizarFiltroEquipe();
        this.renderListaMembrosModal();
    },

    updateProjetos(projetos) {
        this.projetosExpCache = projetos;
        this.renderizarProjetos();
    },

    renderizarFiltroEquipe() {
        const cont = document.getElementById('membrosEquipeContainer');
        if (!cont) return;
        
        const activeClass = 'bg-brandOrange text-white border-brandOrange';
        const inactiveClass = 'bg-transparent text-mainText dark:text-white border-border dark:border-[#4a2815] hover:bg-black/5 dark:hover:bg-white/5';

        cont.innerHTML = `<button class="px-3 py-1.5 rounded-full font-medium text-sm transition-all border ${!this.currentMemberExp ? activeClass : inactiveClass}" onclick="window.tarefasCtrl.filtrarPorMembro(null)">Todos</button>`;

        this.equipeExpCache.forEach(m => {
            const isAct = this.currentMemberExp === m.nome;
            cont.innerHTML += `<button class="px-3 py-1.5 rounded-full font-medium text-sm transition-all border ${isAct ? activeClass : inactiveClass}" onclick="window.tarefasCtrl.filtrarPorMembro('${m.nome}')">${m.nome}</button>`;
        });
    },

    filtrarPorMembro(nome) {
        this.currentMemberExp = nome;
        this.renderizarFiltroEquipe();
        this.renderizarProjetos();
    },

    renderizarProjetos() {
        const cont = document.getElementById('projetos-list');
        if (!cont) return;

        let html = '';
        const cols = ['Pendente', 'Em Andamento', 'Concluído'];

        cols.forEach(col => {
            const projs = this.projetosExpCache.filter(p => p.status === col && (!this.currentMemberExp || p.demandante === this.currentMemberExp));

            let cardsHtml = projs.map(p => TaskCard(p)).join('');

            html += `
                <div class="flex-1 min-w-[300px] h-full flex flex-col bg-transparent">
                    <div class="flex justify-between items-center mb-4 px-1 sticky top-0 z-10 bg-background dark:bg-[#1a0f07] pb-2">
                        <h3 class="m-0 text-[1.05rem] font-bold text-mainText dark:text-white">${col}</h3>
                        <span class="bg-surface dark:bg-[#362011] text-mainText dark:text-white px-2.5 py-0.5 rounded-full text-[0.8rem] font-bold shadow-sm border border-border dark:border-[#4a2815]">${projs.length}</span>
                    </div>
                    <div class="flex-1 overflow-y-auto px-1">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        });
        cont.innerHTML = html;
    },

    async salvarProjeto() {
        const desc = document.getElementById('projDesc').value.trim();
        const demand = document.getElementById('projDemand').value.trim();
        const date = document.getElementById('projDate').value;
        const stat = document.getElementById('projStatus').value;
        const anexo = document.getElementById('projAnexo').value.trim();

        if (!desc || !demand) return window.showToast("Preencha descrição e demandante", "warning");

        try {
            await ExpansaoService.salvarProjeto({
                descricao: desc, demandante: demand, dataOriginal: date || new Date().toISOString(), status: stat, anexo: anexo, data: new Date().toISOString()
            });
            window.showToast("Tarefa registrada!", "success");
            document.getElementById('projDesc').value = '';
            document.getElementById('projAnexo').value = '';
        } catch (e) { console.error(e); window.showToast("Erro ao salvar", "error"); }
    },

    async atualizarStatusProj(id, novoStatus) {
        try {
            await ExpansaoService.atualizarStatusProjeto(id, novoStatus);
        } catch (e) { console.error(e); window.showToast("Erro atualizar", "error"); }
    },

    async deletarProjeto(id) {
        if (confirm("Excluir esta tarefa?")) {
            try { 
                await ExpansaoService.deletarProjeto(id); 
                window.showToast("Excluído", "success"); 
            } catch (e) { console.error(e); }
        }
    },

    // ==== Modal Equipe ====
    abrirModalEquipe() {
        const modal = document.getElementById('modalEquipeObj');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('show');
        this.renderListaMembrosModal();
        this.carregarUsuariosSistema();
    },

    async carregarUsuariosSistema() {
        const select = document.getElementById('novoMembroExpSelecionado');
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
    },

    fecharModalEquipe() {
        const modal = document.getElementById('modalEquipeObj');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => { if (!modal.classList.contains('show')) modal.classList.add('hidden'); }, 200);
        }
    },

    renderListaMembrosModal() {
        const list = document.getElementById('listaMembrosExp');
        if (!list) return;
        list.innerHTML = this.equipeExpCache.map(m => `
            <li class="flex justify-between items-center p-3 border-b border-border dark:border-[#4a2815] transition-colors hover:bg-black/5 dark:hover:bg-white/5 group">
                <span class="text-mainText dark:text-[#f5f0e6] font-medium text-[0.9rem]">${m.nome}</span>
                <button class="px-2.5 py-1.5 bg-[#fef2f2] text-brandRed dark:bg-brandRed/10 dark:text-[#f87171] border border-brandRed/20 hover:bg-brandRed hover:text-white dark:hover:bg-brandRed dark:hover:text-white rounded-md text-[0.8rem] transition-colors flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100" onclick="window.tarefasCtrl.removerMembro('${m.id}')"><i class="ph ph-trash text-lg"></i></button>
            </li>
        `).join('');
    },

    async addMembro() {
        const nome = document.getElementById('novoMembroExpSelecionado').value;
        if (!nome) return window.showToast("Selecione um usuário", "warning");
        try {
            await ExpansaoService.addMembroEquipe(nome);
            window.showToast("Membro adicionado", "success");
        } catch (e) { console.error(e); }
    },

    async removerMembro(id) {
        try {
            await ExpansaoService.removerMembroEquipe(id);
            window.showToast("Membro removido", "success");
        } catch (e) { console.error(e); }
    }
};
