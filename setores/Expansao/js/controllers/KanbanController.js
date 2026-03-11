// KanbanCard, ExpansaoService, DashboardController → window globals

window.KanbanController = {
    renderKanban(obras) {
        try {
            const columns = ['backlog', 'planejamento', 'fase1', 'fase2', 'fase3', 'concluido'];

            columns.forEach(col => {
                const colContainer = document.querySelector(`#col-${col} .kanban-cards`);
                if (colContainer) colContainer.innerHTML = '';
                const countSpan = document.getElementById(`count-${col}`);
                if (countSpan) countSpan.innerText = '0';
            });

            obras.forEach(obra => {
                const colContainer = document.querySelector(`#col-${obra.status} .kanban-cards`);
                if (colContainer) {
                    const cardHtml = KanbanCard(obra);
                    colContainer.insertAdjacentHTML('beforeend', cardHtml);
                }
            });

            columns.forEach(col => {
                const colContainer = document.querySelector(`#col-${col} .kanban-cards`);
                if (colContainer) {
                    const countSpan = document.getElementById(`count-${col}`);
                    if (countSpan) countSpan.innerText = colContainer.children.length.toString();
                }
            });
        } catch (e) {
            console.error("Erro na renderização visual do Kanban.", e);
        }
    },

    filtrarKanban(obras, lojasIniciais) {
        try {
            const termoEl = document.getElementById('filtroKanbanBusca');
            const tagFiltroEl = document.getElementById('filtroKanbanTag');
            const regionalFiltroEl = document.getElementById('filtroKanbanRegional');
            if (!termoEl || !tagFiltroEl || !regionalFiltroEl) return;

            const termo = termoEl.value.toLowerCase().trim();
            const tagFiltro = tagFiltroEl.value;
            const regFiltro = regionalFiltroEl.value;

            let filtradas = obras.filter(o => {
                const tituloMatch = (o.titulo || '').toLowerCase().includes(termo);
                const lojaMatch = (o.loja || '').toLowerCase().includes(termo);
                const matchTag = tagFiltro ? o.tag === tagFiltro : true;

                let matchReg = true;
                if (regFiltro) {
                    const lojaInfo = lojasIniciais.find(l => l.nome === o.loja);
                    matchReg = lojaInfo ? lojaInfo.estado === regFiltro : false;
                }

                return (tituloMatch || lojaMatch) && matchTag && matchReg;
            });

            this.renderKanban(filtradas);
            return filtradas;
        } catch (e) {
            console.error("Erro ao Filtrar", e);
            return obras;
        }
    },

    popularSelectLojasExpansao(lojasIniciais) {
        const sel = document.getElementById('modalCardLoja');
        if (!sel) return;
        sel.innerHTML = '<option value="">(Selecione a Loja)</option>';

        const lojasOrdenadas = [...lojasIniciais].sort((a, b) => {
            if (a.estado !== b.estado) return a.estado.localeCompare(b.estado);
            return a.nome.localeCompare(b.nome);
        });

        let currentReg = '';
        lojasOrdenadas.forEach(l => {
            if (l.estado !== currentReg) {
                currentReg = l.estado;
                sel.innerHTML += `<option disabled style="background: var(--border); color: #fff; font-weight: bold;">--- REGIONAL ${currentReg} ---</option>`;
            }
            sel.innerHTML += `<option value="${l.nome}">${l.nome}</option>`;
        });
    },

    popularFiltroRegionaisExpansao(lojasIniciais) {
        const sel = document.getElementById('filtroKanbanRegional');
        if (!sel) return;

        const regionais = [...new Set(lojasIniciais.map(l => l.estado))].sort();

        sel.innerHTML = '<option value="">Todas as Regionais</option>';
        regionais.forEach(reg => {
            sel.innerHTML += `<option value="${reg}">${reg}</option>`;
        });
    },

    // Drag and Drop Logic
    allowDropExpansao(ev) {
        ev.preventDefault();
    },

    dragExpansao(ev) {
        ev.dataTransfer.setData("card_id", ev.target.dataset.id);
    },

    async dropExpansao(ev, obrasCache, currentUser, onUpdate) {
        ev.preventDefault();
        try {
            const dataId = ev.dataTransfer.getData("card_id");
            let targetCol = ev.target.closest('.kanban-col');
            if (!targetCol) return;

            let novaColId = targetCol.id.replace('col-', '');
            const cols = ['backlog', 'planejamento', 'fase1', 'fase2', 'fase3', 'concluido'];
            if (!cols.includes(novaColId)) return;

            const obraRef = obrasCache.find(o => o.id === dataId);
            if (obraRef && obraRef.status !== novaColId) {
                let msgTroca = `Moveu a obra do status '${obraRef.status}' para '${novaColId}'`;
                let coments = obraRef.comentarios || [];
                coments.push({ texto: msgTroca, autor: currentUser, dataHora: new Date().toLocaleString('pt-BR') });

                // Update UI optimistically
                obraRef.status = novaColId;
                obraRef.comentarios = coments;
                
                // Call app state update
                if (onUpdate) onUpdate();

                // Persist to DB
                await ExpansaoService.salvarObra({
                    status: novaColId,
                    comentarios: coments
                }, dataId);
            }
        } catch (e) {
            console.error("Erro no drag and drop", e);
        }
    }
};
