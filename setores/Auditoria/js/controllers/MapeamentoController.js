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
    
    const filterInicio = document.getElementById('mapFilterInicio')?.value;
    const filterFim = document.getElementById('mapFilterFim')?.value;
    
    let filtrados = window.historicoMapeamento.filter(h => {
        const matchesSearch = h.nomeLoja.toLowerCase().includes(searchTerm) || 
                             (h.notas && h.notas.toLowerCase().includes(searchTerm)) ||
                             (h.justificativa && h.justificativa.toLowerCase().includes(searchTerm));
        
        const matchesRegional = !filterRegional || h.estado === filterRegional;
        const matchesAuditor = !filterAuditor || h.auditor === filterAuditor;
        const matchesRealizada = !filterRealizada || h.realizada === filterRealizada;
        
        // Filtro de Data
        let matchesData = true;
        if (filterInicio) matchesData = matchesData && (h.dataTentativa >= filterInicio);
        if (filterFim) matchesData = matchesData && (h.dataTentativa <= filterFim);

        const isCritico = h.realizada === 'NÃO' && (h.nTentativa >= 2);
        const matchesCritico = !filterCritico || isCritico;

        return matchesSearch && matchesRegional && matchesAuditor && matchesRealizada && matchesCritico && matchesData;
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

    const allChecked = filtrados.length > 0 && filtrados.every(h => h.selected);
    const selectAllCheck = document.getElementById('selectAllMapeamento');
    if (selectAllCheck) selectAllCheck.checked = allChecked;

    body.innerHTML = filtrados.map(h => {
        const slaLabel = h.sla ? 
            '<span class="text-[var(--success)] font-bold">No Prazo</span>' : 
            '<span class="text-[var(--sp-red)] font-bold">Atrasado</span>';
            
        const realizedBadge = h.realizada === 'SIM' ? 
            '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-[10px] font-bold">SIM</span>' : 
            '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-[10px] font-bold">NÃO</span>';

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

        let dataObj = new Date(h.dataTentativa);
        
        // Se a data resultar em um ano absurdo (ex: 46045) ou for inválida, mas for um número
        const year = dataObj.getFullYear();
        if ((isNaN(dataObj.getTime()) || year > 3000) && !isNaN(h.dataTentativa)) {
            const serial = parseFloat(h.dataTentativa);
            if (serial > 40000) { // Seriais do Excel atuais estão na casa de 45000+
                dataObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
            }
        }

        return `
            <tr class="${rowClass} transition-colors border-l-4 ${isCritico ? 'border-red-500' : 'border-transparent'}">
                <td class="p-4">
                    <input type="checkbox" ${h.selected ? 'checked' : ''} onchange="window.toggleRowMapeamento('${h.id}', this.checked)" class="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer">
                </td>
                <td class="p-4 text-sm whitespace-nowrap">
                    <div class="font-bold">${isNaN(dataObj.getTime()) ? 'Data Inválida' : dataObj.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</div>
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
    window.updateBulkButtonVisibility();
};

window.toggleRowMapeamento = function(id, checked) {
    const item = window.historicoMapeamento.find(h => h.id === id);
    if (item) item.selected = checked;
    window.updateBulkButtonVisibility();
    
    // Sync Select All checkbox
    const filtrados = window.historicoMapeamentoFiltradoCache || []; 
    // Nota: precisei cachear ou refiltrar para checar o toggle
    // Mas para simplificar, o renderizar cuida disso na próxima chamada
};

window.toggleSelectAllMapeamento = function(checked) {
    // Aplicar apenas aos registros que estão VISÍVEIS (filtrados)
    const searchTerm = document.getElementById('mapSearch').value.toLowerCase();
    const filterRegional = document.getElementById('mapFilterRegional')?.value;
    const filterAuditor = document.getElementById('mapFilterAuditor')?.value;
    const filterRealizada = document.getElementById('mapFilterRealizada')?.value;
    const filterCritico = document.getElementById('mapFilterCritico')?.checked;
    const filterInicio = document.getElementById('mapFilterInicio')?.value;
    const filterFim = document.getElementById('mapFilterFim')?.value;

    window.historicoMapeamento.forEach(h => {
        const matchesSearch = h.nomeLoja.toLowerCase().includes(searchTerm) || 
                             (h.notas && h.notas.toLowerCase().includes(searchTerm)) ||
                             (h.justificativa && h.justificativa.toLowerCase().includes(searchTerm));
        const matchesRegional = !filterRegional || h.estado === filterRegional;
        const matchesAuditor = !filterAuditor || h.auditor === filterAuditor;
        const matchesRealizada = !filterRealizada || h.realizada === filterRealizada;
        let matchesData = true;
        if (filterInicio) matchesData = matchesData && (h.dataTentativa >= filterInicio);
        if (filterFim) matchesData = matchesData && (h.dataTentativa <= filterFim);
        const matchesCritico = !filterCritico || (h.realizada === 'NÃO' && h.nTentativa >= 2);

        if (matchesSearch && matchesRegional && matchesAuditor && matchesRealizada && matchesData && matchesCritico) {
            h.selected = checked;
        }
    });

    window.renderizarMapeamento();
};

window.updateBulkButtonVisibility = function() {
    const selectedCount = window.historicoMapeamento.filter(h => h.selected).length;
    const btn = document.getElementById('btnBulkDeleteMapeamento');
    const countSpan = document.getElementById('countSelectedMapeamento');
    
    if (btn && countSpan) {
        if (selectedCount > 0) {
            btn.classList.remove('hidden');
            btn.classList.add('flex');
            countSpan.innerText = selectedCount;
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('flex');
        }
    }
};

window.excluirMapeamentoEmMassa = async function() {
    const selecionados = window.historicoMapeamento.filter(h => h.selected);
    const total = selecionados.length;
    if (total === 0) return;

    if (!confirm(`⚠️ ATENÇÃO: Você está prestes a excluir ${total} registros permanentemente.\n\nEsta ação NÃO pode ser desfeita. Deseja continuar?`)) return;

    // Usar o modal de progresso para dar feedback visual
    window.showImportModal(total);
    const log = document.getElementById('importLog');
    if (log) log.innerHTML = `<div class="text-red-500 font-bold">Iniciando exclusão em massa de ${total} registros...</div>`;
    
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < selecionados.length; i++) {
        if (window.importCancelled) {
            window.updateImportProgress(i, total, "Exclusão interrompida pelo usuário.", "warning");
            break;
        }

        const h = selecionados[i];
        try {
            await window.MapeamentoService.excluirRegistro(h.id, true); // true = skipConfirm
            sucessos++;
            if (i % 10 === 0 || i === total - 1) {
                window.updateImportProgress(i + 1, total, `Excluído: ${h.nomeLoja} (${h.dataTentativa})`, 'success');
            }
        } catch (e) {
            console.error(e);
            erros++;
            window.updateImportProgress(i + 1, total, `Erro ao excluir ${h.nomeLoja}: ${e.message}`, 'error');
        }
        
        // Pequena pausa para não travar a UI em listas gigantes
        if (i % 50 === 0) await new Promise(r => setTimeout(r, 10));
    }

    showToast(`${sucessos} registros excluídos com sucesso.`, erros > 0 ? "warning" : "success");
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
    let ignorados = 0;
    const total = dados.length - 1;

    window.showImportModal(total);

    const logErroGlobal = (msg) => {
        const log = document.getElementById('importLog');
        if (log) log.innerHTML += `<div class="text-red-500 font-bold mt-2">ERRO CRÍTICO: ${msg}</div>`;
    };

    // Função auxiliar para salvar um único registro (reutilizada no remapeamento)
    const salvarLinhaMapeamento = async (lojaValida, nTentativaFinal, dataFormatada, rawRealizada, rawMotivo, auditorFinal, rawNoPrazo) => {
        const dadosMap = {
            lojaId: lojaValida.id.toString(),
            nomeLoja: lojaValida.nome,
            estado: lojaValida.estado,
            dataTentativa: dataFormatada,
            realizada: rawRealizada === 'NÃO' ? 'NÃO' : 'SIM',
            justificativa: rawRealizada === 'NÃO' ? (rawMotivo || 'NÃO ESPECIFICADO') : null,
            auditor: auditorFinal,
            notas: rawRealizada === 'NÃO' ? rawMotivo : '',
            nTentativa: nTentativaFinal,
            sla: rawNoPrazo === 'SIM',
            horario: '08:00',
            createdAt: new Date()
        };
        await window.MapeamentoService.registrarTentativa(dadosMap);
    };

    try {
        for (let i = 1; i < dados.length; i++) {
            const row = dados[i];
            const index = i;
            
            if (window.importCancelled) {
                window.updateImportProgress(index, total, "Importação interrompida pelo usuário.", "warning");
                break;
            }
            if (!row || !Array.isArray(row)) {
                window.updateImportProgress(index, total, `Linha ${i}: Formato inválido.`, 'warning');
                continue;
            }

            // Layout da Planilha: 0:DATA, 1:TENTATIVA, 2:UF, 3:LOJA, 4:REALIZADA, 5:POR QUE, 6:RESPONSÁVEL, 7:SLA
            const rawData = row[0];
            const rawTentativa = row[1];
            const rawLoja = (row[3] || '').toString().trim();
            const rawRealizada = (row[4] || 'SIM').toString().trim().toUpperCase();
            const rawMotivo = (row[5] || '').toString().trim();
            const rawAuditor = (row[6] || '').toString().trim();
            const rawNoPrazo = (row[7] || '').toString().trim().toUpperCase();

            if (!rawLoja || !rawData) {
                window.updateImportProgress(index, total, `Linha ${i}: Loja ou Data ausente (${rawLoja || 'N/A'}).`, 'warning');
                continue;
            }

            // Parse Tentativa e Data ANTES de checar loja/auditor para ter os dados prontos
            let nTentativaFinal = 1;
            if (rawTentativa !== undefined && rawTentativa !== null && rawTentativa !== "") {
                const parsed = parseInt(rawTentativa.toString().replace(/[^0-9]/g, ''));
                if (!isNaN(parsed)) nTentativaFinal = parsed;
            }

            let dataFormatada = "";
            try {
                if (rawData) {
                    if (typeof rawData === 'number' || (!isNaN(rawData) && !rawData.toString().includes('-') && !rawData.toString().includes('/'))) {
                        const serial = parseFloat(rawData);
                        const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
                        dataFormatada = dateObj.toISOString().split('T')[0];
                    } else {
                        const strDate = rawData.toString().trim();
                        if (strDate.includes('/')) {
                            const parts = strDate.split('/');
                            if (parts.length === 3) {
                                dataFormatada = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        } else if (strDate.includes('-')) {
                            const parts = strDate.split(' ')[0].split('-');
                            if (parts.length === 3) {
                                // Garantir YYYY-MM-DD
                                dataFormatada = parts[0].length === 4 ? parts.join('-') : parts.reverse().join('-');
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Erro data:", e);
            }

            if (!dataFormatada) {
                window.updateImportProgress(index, total, `Linha ${i}: Data inválida (${rawData}).`, 'warning');
                continue;
            }

            const lojaValida = window.getLojaByFlexName(rawLoja);
            const auditorFinal = window.getAuditorByFlexName(rawAuditor);

            if (!lojaValida || !auditorFinal) {
                const motivoPendente = !lojaValida ? 'Loja não encontrada' : 'Auditor não encontrado';
                window.updateImportProgress(index, total, `Linha ${i}: ${motivoPendente} (${!lojaValida ? rawLoja : rawAuditor}).`, 'warning');
                
                window.adicionarPendente(
                    !lojaValida ? 'loja' : 'auditor', 
                    !lojaValida ? rawLoja : rawAuditor, 
                    row, 
                    { nTentativaFinal, dataFormatada, rawRealizada, rawMotivo, rawNoPrazo, auditorParcial: auditorFinal, lojaOriginal: lojaValida, unknownAuditorName: !auditorFinal ? rawAuditor : null }
                );
                ignorados++;
                continue;
            }

            try {
                await salvarLinhaMapeamento(lojaValida, nTentativaFinal, dataFormatada, rawRealizada, rawMotivo, auditorFinal, rawNoPrazo);
                window.updateImportProgress(index, total, `${lojaValida.nome}: Salvo (Tentativa ${nTentativaFinal}).`, 'success');
                sucessos++;
            } catch (err) {
                console.error(err);
                window.updateImportProgress(index, total, `${lojaValida.nome || rawLoja}: Erro de rede ou Firebase (${err.message}).`, 'error');
                erros++;
            }

            if (i % 5 === 0) await new Promise(r => setTimeout(r, 50));
        }

        if (window.importPendentes.rows.length > 0 && !window.importCancelled) {
            window.updateImportProgress(total, total, `Importação parcial: ${window.importPendentes.rows.length} itens aguardando remapeamento.`, 'warning');
            
            window.abrirModalRemapear(async (resolvidos, mapLojas, mapAuditores) => {
                let remSucessos = 0;
                let remErros = 0;
                for (const r of resolvidos) {
                    try {
                        const l = r.lojaMapeada || r.lojaOriginal;
                        const a = r.auditorMapeado || r.auditorParcial || window.currentUser || 'Sistema';
                        await salvarLinhaMapeamento(l, r.nTentativaFinal, r.dataFormatada, r.rawRealizada, r.rawMotivo, a, r.rawNoPrazo);
                        remSucessos++;
                    } catch (e) { 
                        console.error("Erro remapeamento:", e); 
                        remErros++;
                    }
                }
                showToast(`${remSucessos} registros adicionais salvos pós-remapeamento.`, remErros > 0 ? "warning" : "success");
            }, 'mapeamento');
        } else {
            showToast(`Mapeamento concluído: ${sucessos} sucessos.`, erros > 0 ? "warning" : "success");
        }
    } catch (criticalErr) {
        console.error("Erro crítico na importação:", criticalErr);
        logErroGlobal(criticalErr.message);
        showToast("Ocorreu um erro crítico durante o processamento. Verifique o log.", "error");
    }
}
