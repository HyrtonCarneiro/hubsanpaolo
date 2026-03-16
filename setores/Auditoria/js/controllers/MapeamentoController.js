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
        if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
        }
    });
    
    // Popular selects
    window.popularSelectLojasMapeamento();
    if (window.audiEquipe && window.audiEquipe.length > 0) {
        window.popularSelectAuditoresMapeamento();
    }
    
    // Popular filtros novos
    window.popularFiltrosMapeamento();
    
    // Data de hoje default
    const inputData = document.getElementById('mapDataInput');
    if (inputData) inputData.valueAsDate = new Date();
};

window.popularFiltrosMapeamento = function() {
    // Regional
    const selReg = document.getElementById('mapFilterRegional');
    if (selReg) {
        selReg.innerHTML = '<option value="">Todas Regionais</option>';
        const estados = [...new Set(window.lojasIniciais.map(l => l.estado))].sort();
        estados.forEach(est => {
            const opt = document.createElement('option');
            opt.value = est;
            opt.textContent = est;
            selReg.appendChild(opt);
        });
    }

    // Auditor
    const selAud = document.getElementById('mapFilterAuditor');
    if (selAud) {
        selAud.innerHTML = '<option value="">Todos Auditores</option>';
        if (window.audiEquipe) {
            window.audiEquipe.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.nome;
                opt.textContent = m.nome;
                selAud.appendChild(opt);
            });
        }
    }
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
    const filterRegional = document.getElementById('mapFilterRegional')?.value;
    const filterAuditor = document.getElementById('mapFilterAuditor')?.value;
    const filterRealizada = document.getElementById('mapFilterRealizada')?.value;
    const filterCritico = document.getElementById('mapFilterCritico')?.checked;
    
    let filtrados = window.historicoMapeamento.filter(h => {
        const matchesSearch = h.nomeLoja.toLowerCase().includes(searchTerm) || 
                             (h.notas && h.notas.toLowerCase().includes(searchTerm)) ||
                             (h.justificativa && h.justificativa.toLowerCase().includes(searchTerm));
        
        const matchesRegional = !filterRegional || h.estado === filterRegional;
        const matchesAuditor = !filterAuditor || h.auditor === filterAuditor;
        const matchesRealizada = !filterRealizada || h.realizada === filterRealizada;
        
        // Lógica de crítico: 2+ tentativas e sem sucesso (realizada === 'NÃO')
        // Nota: para o filtro, mostramos apenas os registros que são 'NÃO' e nTentativa >= 2
        const isCritico = h.realizada === 'NÃO' && (h.nTentativa >= 2);
        const matchesCritico = !filterCritico || isCritico;

        return matchesSearch && matchesRegional && matchesAuditor && matchesRealizada && matchesCritico;
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
        const jaTemNota = (window.notasCache || []).find(n => n.loja === h.nomeLoja && n.data.startsWith(dataMes));

        const isCritico = h.realizada === 'NÃO' && (h.nTentativa >= 2);
        
        const actionNota = h.realizada === 'SIM' ? 
            `<button onclick="window.navegarParaLancarNota('${h.nomeLoja}')" 
                class="p-1.5 ${jaTemNota ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-500'} rounded-lg transition-colors" 
                title="${jaTemNota ? 'Nota já lançada: ' + jaTemNota.nota : 'Lançar Nota'}">
                <i class="ph ${jaTemNota ? 'ph-check-circle' : 'ph-scroll'}"></i>
            </button>` : '';

        const rowClass = isCritico ? 'bg-red-50/50 hover:bg-red-100/50' : 'hover:bg-black/5';
        const criticoIcon = isCritico ? '<i class="ph-fill ph-warning-octagon text-red-500 mr-1" title="Loja Crítica (2+ tentativas sem sucesso)"></i>' : '';

        return `
            <tr class="${rowClass} transition-colors border-l-4 ${isCritico ? 'border-red-500' : 'border-transparent'}">
                <td class="p-4 text-sm whitespace-nowrap">
                    <div class="font-bold">${new Date(h.dataTentativa).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</div>
                    <div class="text-[10px] text-[var(--text-muted)]">${h.dataTentativa} ${h.horario || ''}</div>
                </td>
                <td class="p-4 text-center">
                    <div class="w-8 h-8 rounded-full ${isCritico ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-100'} flex items-center justify-center font-bold border">${h.nTentativa}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-[var(--text-main)] text-sm">${h.estado}</div>
                </td>
                <td class="p-4">
                    <div class="flex items-center font-bold text-[var(--text-main)]">
                        ${criticoIcon}
                        ${h.nomeLoja}
                    </div>
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

window.navegarParaLancarNota = function(lojaIdentificador) {
    // 1. Mudar para a aba de Auditoria Online
    window.switchView('auditoriaOnline');
    
    // 2. Pré-selecionar a loja (tenta por nome primeiro, que é o padrão do select)
    const select = document.getElementById('audiSelectLoja');
    if (select) {
        select.value = lojaIdentificador;
        // Scroll para o formulário
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pequeno destaque visual
        select.classList.add('ring-2', 'ring-[var(--primary)]');
        setTimeout(() => select.classList.remove('ring-2', 'ring-[var(--primary)]'), 2000);
    }
};

window.processarImportacaoMapeamento = async function (dados) {
    let sucessos = 0;
    let erros = 0;

    for (let i = 1; i < dados.length; i++) {
        const row = dados[i];
        if (!row || row.length < 3) continue;

        // Mapeamento Posicional (Ordem padrão de exportação do Hub):
        // 0:DATA_TENTATIVA, 1:HORARIO, 2:LOJA, 3:REGIONAL, 4:REALIZADA, 5:MOTIVO, 6:AUDITOR, 7:N_TENTATIVA, 8:ESTA_NO_PRAZO, 9:NOTAS
        const rawLoja = (row[2] || '').toString().trim();
        const data = (row[0] || '').toString().trim();
        if (!rawLoja || !data) continue;

        const lojaValida = window.getLojaByFlexName(rawLoja);
        if (!lojaValida) continue;

        const dadosMap = {
            lojaId: lojaValida.id.toString(),
            nomeLoja: lojaValida.nome,
            estado: lojaValida.estado,
            dataTentativa: data,
            realizada: row[4] || 'SIM',
            justificativa: row[5] || null,
            auditor: window.properCase(row[6] || window.currentUser || 'Sistema'),
            notas: row[9] || '',
            nTentativa: parseInt(row[7]) || 1,
            sla: row[8] === 'SIM',
            horario: row[1] || '08:00'
        };

        try {
            await window.MapeamentoService.registrarTentativa(dadosMap);
            sucessos++;
        } catch (err) {
            console.error(err);
            erros++;
        }
    }
    showToast(`Mapeamento: ${sucessos} importados, ${erros} erros.`, erros > 0 ? "warning" : "success");
}
