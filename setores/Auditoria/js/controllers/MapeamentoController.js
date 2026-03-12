/**
 * MapeamentoController.js
 * Orquestração da aba Mapeamento.
 */

window.historicoMapeamento = [];
window.mapSortConfig = { field: 'createdAt', direction: 'desc' }; // Padrão: Mais recentes primeiro

window.initMapeamentoListeners = function() {
    window.MapeamentoService.initListeners((dados) => {
        window.historicoMapeamento = dados;
        window.renderizarMapeamento();
        if (typeof window.renderizarTabelaPlanejamento === 'function') {
            window.renderizarTabelaPlanejamento();
        }
    });
    
    // Popular selects
    window.popularSelectLojasMapeamento();
    if (window.audiEquipe && window.audiEquipe.length > 0) {
        window.popularSelectAuditoresMapeamento();
    }
    
    // Data de hoje default
    const inputData = document.getElementById('mapDataInput');
    if (inputData) inputData.valueAsDate = new Date();
};

window.popularSelectLojasMapeamento = function() {
    const select = document.getElementById('mapSelectLoja');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione a Loja...</option>';
    
    const porEstado = {};
    window.lojasIniciais.forEach(loja => {
        if (!porEstado[loja.estado]) porEstado[loja.estado] = [];
        porEstado[loja.estado].push(loja);
    });

    Object.keys(porEstado).sort().forEach(estado => {
        const group = document.createElement('optgroup');
        group.label = "Regional " + estado;
        porEstado[estado].sort((a,b) => a.nome.localeCompare(b.nome)).forEach(loja => {
            const opt = document.createElement('option');
            opt.value = loja.id;
            opt.dataset.nome = loja.nome;
            opt.dataset.estado = loja.estado;
            opt.textContent = loja.nome;
            group.appendChild(opt);
        });
        select.appendChild(group);
    });
};

window.popularSelectAuditoresMapeamento = function() {
    const select = document.getElementById('mapSelectAuditor');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione...</option>';
    window.audiEquipe.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.nome;
        opt.textContent = m.nome;
        select.appendChild(opt);
    });
};

window.toggleMapJustificativa = function() {
    const realizada = document.getElementById('mapRealizadaSelect').value;
    const container = document.getElementById('mapJustificativaContainer');
    if (realizada === 'NÃO') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
};

window.salvarTentativaMapeamento = async function() {
    const lojaId = document.getElementById('mapSelectLoja').value;
    const selectLoja = document.getElementById('mapSelectLoja');
    const nomeLoja = selectLoja.options[selectLoja.selectedIndex]?.dataset.nome;
    const estado = selectLoja.options[selectLoja.selectedIndex]?.dataset.estado;
    
    const dataTentativa = document.getElementById('mapDataInput').value;
    const realizada = document.getElementById('mapRealizadaSelect').value;
    const justificativa = document.getElementById('mapJustificativaSelect').value;
    const auditor = document.getElementById('mapSelectAuditor').value;
    const notas = document.getElementById('mapNotas').value;

    const nTentativa = window.MapeamentoLogic.circularTentativa(lojaId, dataTentativa, window.historicoMapeamento);
    const sla = window.MapeamentoLogic.estaNoPrazo(dataTentativa);
    
    // Captura o horário atual para registro
    const agora = new Date();
    const horarioRegistro = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const dados = {
        lojaId,
        nomeLoja,
        estado,
        dataTentativa,
        realizada,
        justificativa: realizada === 'NÃO' ? justificativa : null,
        auditor,
        notas,
        nTentativa,
        sla,
        horario: horarioRegistro
    };

    const validacao = window.MapeamentoLogic.validarRegistro(dados);
    if (!validacao.valid) return window.showToast(validacao.msg, 'error');

    try {
        await window.MapeamentoService.registrarTentativa(dados);
        window.showToast("Mapeamento registrado com sucesso!");
        
        // Reset form
        document.getElementById('mapRealizadaSelect').value = "SIM";
        document.getElementById('mapJustificativaSelect').value = "";
        document.getElementById('mapSelectAuditor').value = "";
        document.getElementById('mapNotas').value = "";
        window.toggleMapJustificativa();
    } catch (e) {
        console.error(e);
        window.showToast("Erro ao salvar no Firebase", "error");
    }
};

window.renderizarMapeamento = function() {
    const body = document.getElementById('mapHistoricoBody');
    if (!body) return;

    const searchTerm = document.getElementById('mapSearch').value.toLowerCase();
    
    let filtrados = window.historicoMapeamento.filter(h => {
        return h.nomeLoja.toLowerCase().includes(searchTerm) || 
               h.estado.toLowerCase().includes(searchTerm) ||
               (h.auditor && h.auditor.toLowerCase().includes(searchTerm));
    });

    // Aplicar Ordenação
    const { field, direction } = window.mapSortConfig;
    filtrados.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        // Caso especial para timestamps do Firebase (createdAt)
        if (field === 'createdAt') {
            valA = a.createdAt?.seconds || 0;
            valB = b.createdAt?.seconds || 0;
        }
        
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (filtrados.length === 0) {
        body.innerHTML = '<tr><td colspan="9" class="p-10 text-center text-[var(--text-muted)]">Nenhum registro encontrado.</td></tr>';
        return;
    }

    body.innerHTML = filtrados.map(h => {
        const slaLabel = h.sla ? 
            '<span class="text-[var(--success)] font-bold">No Prazo</span>' : 
            '<span class="text-[var(--sp-red)] font-bold">Atrasado</span>';
            
        const realizedBadge = h.realizada === 'SIM' ? 
            '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-[10px] font-bold">SIM</span>' : 
            '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-[10px] font-bold">NÃO</span>';

        // Verifica se já existe nota para esta loja/mês
        const dataMes = h.dataTentativa.substring(0, 7);
        const jaTemNota = (window.notasCache || []).find(n => n.loja === h.lojaId && n.data.startsWith(dataMes));

        const actionNota = h.realizada === 'SIM' ? 
            `<button onclick="window.navegarParaLancarNota('${h.lojaId}')" 
                class="p-1.5 ${jaTemNota ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-500'} rounded-lg transition-colors" 
                title="${jaTemNota ? 'Nota já lançada: ' + jaTemNota.nota : 'Lançar Nota'}">
                <i class="ph ${jaTemNota ? 'ph-check-circle' : 'ph-scroll'}"></i>
            </button>` : '';

        return `
            <tr class="hover:bg-black/5 transition-colors">
                <td class="p-4 text-sm whitespace-nowrap">
                    <div class="font-bold">${new Date(h.dataTentativa).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</div>
                    <div class="text-[10px] text-[var(--text-muted)]">${h.dataTentativa} ${h.horario || ''}</div>
                </td>
                <td class="p-4 text-center">
                    <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">${h.nTentativa}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-[var(--text-main)] text-sm">${h.estado}</div>
                </td>
                <td class="p-4">
                    <div class="font-bold text-[var(--text-main)]">${h.nomeLoja}</div>
                </td>
                <td class="p-4 text-center">${realizedBadge}</td>
                <td class="p-4 text-sm font-semibold text-[var(--text-main)]">${h.auditor || '-'}</td>
                <td class="p-4 text-sm max-w-[200px] truncate" title="${h.justificativa || ''} ${h.notas || ''}">
                    ${h.justificativa ? `<span class="italic text-[var(--sp-red)]">${h.justificativa}</span><br>` : ''}
                    <span class="text-[11px] text-[var(--text-muted)]">${h.notas || '-'}</span>
                </td>
                <td class="p-4 text-right text-xs">${slaLabel}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                        ${actionNota}
                        <button onclick="window.MapeamentoService.excluirRegistro('${h.id}')" class="p-1.5 text-red-400 hover:text-red-600 transition-colors" title="Excluir">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.sortMapeamento = function(field) {
    if (window.mapSortConfig.field === field) {
        window.mapSortConfig.direction = window.mapSortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        window.mapSortConfig.field = field;
        window.mapSortConfig.direction = 'asc';
    }
    window.renderizarMapeamento();
};

window.navegarParaLancarNota = function(lojaId) {
    // 1. Mudar para a aba de Auditoria Online
    window.switchView('online');
    
    // 2. Pré-selecionar a loja
    const select = document.getElementById('audiSelectLoja');
    if (select) {
        select.value = lojaId;
        // Scroll para o formulário
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pequeno destaque visual
        select.classList.add('ring-2', 'ring-[var(--primary)]');
        setTimeout(() => select.classList.remove('ring-2', 'ring-[var(--primary)]'), 2000);
    }
};
