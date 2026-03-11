// ExpansaoService → window global

window.ModalObraController = {
    cardAbertoId: null,
    checklistsCache: [],
    comentariosCache: [],
    anexosCache: [],
    fornecedoresCache: [],

    abrirModal(id = null, obrasCache, currentUser) {
        try {
            this.cardAbertoId = id;
            const modal = document.getElementById('modalCardExpansaoObj');
            if (!modal) return;

            // Limpar tudo
            document.getElementById('modalCardId').value = '';
            if (document.getElementById('modalCardTituloInput')) document.getElementById('modalCardTituloInput').value = '';
            document.getElementById('modalCardLoja').value = '';
            document.getElementById('modalCardStatus').value = 'backlog';

            if (document.querySelector('input[name="modalTagExp"][value="Retrofit"]')) {
                document.querySelector('input[name="modalTagExp"][value="Retrofit"]').checked = true;
            }
            document.getElementById('modalDataInicio').value = '';
            document.getElementById('modalDataFim').value = '';
            document.getElementById('modalCustoPrev').value = '';
            document.getElementById('modalCustoReal').value = '';
            if (document.getElementById('modalNovoAnexoURL')) document.getElementById('modalNovoAnexoURL').value = '';
            if (document.getElementById('novoChecklistItemInput')) document.getElementById('novoChecklistItemInput').value = '';
            if (document.getElementById('novoComentarioCard')) document.getElementById('novoComentarioCard').value = '';

            // Limpar Stakeholders
            if (document.getElementById('modalCardEngenheiro')) document.getElementById('modalCardEngenheiro').value = '';
            if (document.getElementById('modalCardMestre')) document.getElementById('modalCardMestre').value = '';
            if (document.getElementById('novoFornNomeInput')) document.getElementById('novoFornNomeInput').value = '';
            if (document.getElementById('novoFornContatoInput')) document.getElementById('novoFornContatoInput').value = '';

            document.getElementById('displayCardId').textContent = 'Novo Workflow';
            document.getElementById('displayCardCriador').textContent = currentUser || 'Sistema';
            if (document.getElementById('modalChecklistPercent')) document.getElementById('modalChecklistPercent').textContent = '0%';
            if (document.getElementById('modalChecklistProgress')) document.getElementById('modalChecklistProgress').style.width = '0%';

            this.checklistsCache = [];
            this.comentariosCache = [];
            this.anexosCache = [];
            this.fornecedoresCache = [];

            this.renderChecklists();
            this.renderComentarios();
            this.renderAnexos();
            this.renderFornecedores();

            document.getElementById('btnExcluirCardExpansao').style.display = 'none';

            if (id) {
                const obra = obrasCache.find(o => o.id === id);
                if (obra) {
                    document.getElementById('modalCardId').value = obra.id;
                    document.getElementById('displayCardId').textContent = obra.id.substring(0, 8).toUpperCase();
                    document.getElementById('displayCardCriador').textContent = obra.autor || 'Sistema';

                    if (document.getElementById('modalCardTituloInput')) document.getElementById('modalCardTituloInput').value = obra.titulo;
                    document.getElementById('modalCardLoja').value = obra.loja;

                    document.getElementById('modalCardStatus').value = obra.status;

                    const radioTag = document.querySelector(`input[name="modalTagExp"][value="${obra.tag || 'Retrofit'}"]`);
                    if (radioTag) radioTag.checked = true;

                    document.getElementById('modalDataInicio').value = obra.dataInicio || '';
                    document.getElementById('modalDataFim').value = obra.dataFim || '';
                    document.getElementById('modalCustoPrev').value = obra.custoPrev || '';
                    document.getElementById('modalCustoReal').value = obra.custoReal || '';

                    // Carregar Stakeholders
                    if (document.getElementById('modalCardEngenheiro')) document.getElementById('modalCardEngenheiro').value = obra.engenheiro || '';
                    if (document.getElementById('modalCardMestre')) document.getElementById('modalCardMestre').value = obra.mestreObras || '';

                    this.checklistsCache = obra.checklists || [];
                    this.comentariosCache = obra.comentarios || [];
                    this.anexosCache = obra.anexos || [];
                    this.fornecedoresCache = obra.fornecedores || [];

                    this.renderChecklists();
                    this.renderComentarios();
                    this.renderAnexos();
                    this.renderFornecedores();

                    document.getElementById('btnExcluirCardExpansao').style.display = 'inline-block';
                }
            }

            modal.classList.add('show');
        } catch (e) {
            console.error("Erro abrir modal: ", e);
        }
    },

    fecharModal() {
        const modal = document.getElementById('modalCardExpansaoObj');
        if (modal) modal.classList.remove('show');
        this.cardAbertoId = null;
    },

    async salvarCard(currentUser, onUpdateSuccess) {
        try {
            const id = document.getElementById('modalCardId').value;
            const tituloEl = document.getElementById('modalCardTituloInput');
            const lojaEl = document.getElementById('modalCardLoja');
            const statusEl = document.getElementById('modalCardStatus');
            const radioSelected = document.querySelector('input[name="modalTagExp"]:checked');

            if (!tituloEl || !lojaEl || !statusEl) {
                throw new Error("Elementos básicos do modal não encontrados (HTML corrompido)");
            }

            const titulo = tituloEl.value.trim();
            const loja = lojaEl.value;
            const status = statusEl.value;
            const tag = radioSelected ? radioSelected.value : 'Retrofit';

            const dataInicio = document.getElementById('modalDataInicio')?.value || '';
            const dataFim = document.getElementById('modalDataFim')?.value || '';
            const custoPrev = document.getElementById('modalCustoPrev')?.value || '';
            const custoReal = document.getElementById('modalCustoReal')?.value || '';

            const engenheiro = document.getElementById('modalCardEngenheiro')?.value.trim() || '';
            const mestreObras = document.getElementById('modalCardMestre')?.value.trim() || '';

            if (!titulo) return window.showToast("O título da obra é obrigatório", "warning");
            if (!loja) return window.showToast("Selecione uma loja para esta obra", "warning");

            const payload = {
                titulo, loja, status, tag, dataInicio, dataFim, custoPrev, custoReal,
                engenheiro, mestreObras,
                checklists: this.checklistsCache,
                comentarios: this.comentariosCache,
                anexos: this.anexosCache,
                fornecedores: this.fornecedoresCache
            };

            if (id) {
                await ExpansaoService.salvarObra(payload, id);
                window.showToast("Obra atualizada", "success");
            } else {
                payload.comentarios = [{
                    texto: "Obra criada no sistema.", dataHora: new Date().toLocaleString('pt-BR'), autor: currentUser
                }];
                // Assume that whoever is logged in is the author if new
                payload.autor = currentUser;
                await ExpansaoService.salvarObra(payload);
                window.showToast("Obra criada", "success");
            }
            this.fecharModal();
            if (onUpdateSuccess) onUpdateSuccess();
        } catch (e) {
            console.error(e);
            window.showToast("Erro ao salvar card", "error");
        }
    },

    async excluirObra(onUpdateSuccess) {
        if (!this.cardAbertoId) return;
        if (confirm("Tem certeza que deseja excluir esta obra permanentemente?")) {
            try {
                await ExpansaoService.excluirObra(this.cardAbertoId);
                window.showToast("Obra excluída", "success");
                this.fecharModal();
                if (onUpdateSuccess) onUpdateSuccess();
            } catch (e) {
                console.error(e);
                window.showToast("Erro ao excluir obra", "error");
            }
        }
    },

    // --- CHECKLISTS ---
    renderChecklists() {
        const cont = document.getElementById('modalChecklistItensContainer');
        if (!cont) return;
        cont.innerHTML = '';

        let concluidos = 0;
        this.checklistsCache.forEach((item, index) => {
            if (item.checked) concluidos++;
            cont.insertAdjacentHTML('beforeend', `
                <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${item.checked ? 'text-brandGreen dark:text-[#a7f3d0] line-through opacity-70' : 'text-mainText dark:text-white'}">
                    <input type="checkbox" class="w-4 h-4 rounded text-brandGreen focus:ring-brandGreen bg-surface dark:bg-[#362011] border-border dark:border-[#4a2815] transition-all cursor-pointer accent-brandGreen" ${item.checked ? 'checked' : ''} onchange="window.expansaoModal.toggleChecklist(${index})">
                    <span class="flex-1 text-[0.85rem] font-medium leading-tight">${item.texto}</span>
                    <button class="p-1.5 rounded-md text-mutedText dark:text-[#d4bda8] opacity-0 group-hover:opacity-100 hover:text-brandRed hover:bg-brandRed/10 transition-all cursor-pointer flex items-center justify-center shrink-0 border-none bg-transparent" onclick="window.expansaoModal.removerChecklist(${index})"><i class="ph-bold ph-x text-sm"></i></button>
                </div>
            `);
        });

        const perc = this.checklistsCache.length > 0 ? Math.round((concluidos / this.checklistsCache.length) * 100) : 0;
        const progBar = document.getElementById('modalChecklistProgress');
        if (progBar) progBar.style.width = `${perc}%`;
        const percText = document.getElementById('modalChecklistPercent');
        if (percText) percText.textContent = `${perc}%`;
    },

    addChecklist() {
        const ipt = document.getElementById('novoChecklistItemInput');
        if (!ipt) return;
        const txt = ipt.value.trim();
        if (txt) {
            this.checklistsCache.push({ texto: txt, checked: false });
            ipt.value = '';
            this.renderChecklists();
        }
    },

    toggleChecklist(idx) {
        if (this.checklistsCache[idx]) {
            this.checklistsCache[idx].checked = !this.checklistsCache[idx].checked;
            this.renderChecklists();
        }
    },

    removerChecklist(idx) {
        if (this.checklistsCache[idx]) {
            this.checklistsCache.splice(idx, 1);
            this.renderChecklists();
        }
    },

    // --- COMENTÁRIOS ---
    renderComentarios() {
        const cont = document.getElementById('modalComentariosContainer');
        if (!cont) return;
        cont.innerHTML = '';
        const reversed = [...this.comentariosCache].reverse();
        reversed.forEach(c => {
            cont.insertAdjacentHTML('beforeend', `
                <div class="bg-surface dark:bg-[#362011] p-3 rounded-lg border-l-[3px] border-l-brandOrange text-[0.85rem] shadow-sm border border-border dark:border-[#4a2815]">
                    <div class="font-bold text-brandOrange dark:text-[#f97316] flex justify-between items-center mb-1">
                        ${c.autor || 'Usuário'} <span class="text-[0.7rem] text-mutedText dark:text-[#d4bda8] font-normal">${c.dataHora}</span>
                    </div>
                    <div class="text-mainText dark:text-white mt-1 leading-snug break-words">${c.texto}</div>
                </div>
            `);
        });
    },

    addComentario(currentUser) {
        const ipt = document.getElementById('novoComentarioCard');
        if (!ipt) return;
        const txt = ipt.value.trim();
        if (txt) {
            this.comentariosCache.push({
                texto: txt,
                autor: currentUser || 'Usuário',
                dataHora: new Date().toLocaleString('pt-BR')
            });
            ipt.value = '';
            this.renderComentarios();
        }
    },

    // --- ANEXOS ---
    renderAnexos() {
        const cont = document.getElementById('modalAnexosContainer');
        if (!cont) return;
        cont.innerHTML = '';
        this.anexosCache.forEach((url, i) => {
            cont.insertAdjacentHTML('beforeend', `
                <li class="mb-2 flex justify-between items-center group">
                    <a href="${url}" target="_blank" class="text-brandBlue dark:text-[#60a5fa] hover:text-[#1e4a63] dark:hover:text-[#93c5fd] font-medium no-underline hover:underline break-words max-w-[90%] text-[0.85rem] transition-colors"><i class="ph ph-link align-middle mr-1"></i> Anexo ${i + 1} - Acessar Link</a>
                    <button class="p-1 rounded-md text-brandRed opacity-50 hover:opacity-100 hover:bg-brandRed/10 transition-all cursor-pointer flex items-center justify-center shrink-0 border-none bg-transparent" onclick="window.expansaoModal.removerAnexo(${i})">
                        <i class="ph ph-trash text-base"></i>
                    </button>
                </li>
            `);
        });
    },

    addAnexo() {
        const ipt = document.getElementById('modalNovoAnexoURL');
        if (!ipt) return;
        if (ipt.value.trim()) {
            this.anexosCache.push(ipt.value.trim());
            ipt.value = '';
            this.renderAnexos();
        }
    },

    removerAnexo(i) {
        if (this.anexosCache[i] !== undefined) {
            this.anexosCache.splice(i, 1);
            this.renderAnexos();
        }
    },

    // --- FORNECEDORES ---
    renderFornecedores() {
        const list = document.getElementById('modalFornecedoresContainer');
        if (!list) return;
        list.innerHTML = "";

        if (this.fornecedoresCache.length === 0) {
            list.innerHTML = `<span class="block text-[0.8rem] text-mutedText dark:text-[#d4bda8] text-center italic py-2.5">Nenhum fornecedor cadastrado</span>`;
            return;
        }

        this.fornecedoresCache.forEach((f, index) => {
            list.insertAdjacentHTML('beforeend', `
                <div class="flex justify-between items-center bg-surface dark:bg-[#362011] px-3 py-2 border border-border dark:border-[#4a2815] rounded-md shadow-sm group">
                    <div class="flex flex-col flex-1 overflow-hidden pr-2">
                        <span class="font-semibold text-[0.85rem] text-mainText dark:text-white truncate">${f.nome}</span>
                        <span class="text-[0.75rem] text-mutedText dark:text-[#d4bda8] truncate">${f.contato}</span>
                    </div>
                    <button class="p-1.5 rounded-md text-brandRed opacity-50 group-hover:opacity-100 hover:bg-brandRed/10 transition-all cursor-pointer flex items-center justify-center shrink-0 border-none bg-transparent" onclick="window.expansaoModal.removerFornecedor(${index})">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
            `);
        });
    },

    addFornecedor() {
        const inputNome = document.getElementById('novoFornNomeInput');
        const inputContato = document.getElementById('novoFornContatoInput');
        if (!inputNome || !inputContato) return;

        const nome = inputNome.value.trim();
        const contato = inputContato.value.trim();

        if (!nome) return window.showToast("Insira o nome do fornecedor/empresa", "warning");

        this.fornecedoresCache.push({ nome, contato });
        inputNome.value = '';
        inputContato.value = '';
        this.renderFornecedores();
    },

    removerFornecedor(index) {
        if (confirm("Remover este fornecedor?")) {
            this.fornecedoresCache.splice(index, 1);
            this.renderFornecedores();
        }
    }
};
