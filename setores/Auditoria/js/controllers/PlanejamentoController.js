// js/controllers/PlanejamentoController.js — Tabela de planejamento de auditorias
// Depends on: firebase-init.js, data.js, DashboardController.js (getLojaRegional), AuditoriaOnlineController.js (notasCache)

window.planejamentoCache = [];
let planejamentoAbertoId = null;
let planejamentoSortCol = 'proxima';
let planejamentoSortAsc = true;

window.initPlanejamentoListeners = function () {
    try {
        // Popular filtros imediatamente (Regional)
        window.popularFiltrosPlanejamento();

        onSnapshot(collection(db, "auditoria_planejamento"), function (snapshot) {
            window.planejamentoCache = [];
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                var lojaId = ( (window.lojasIniciais || lojasIniciais).find(l => l.nome === data.loja) || {}).id;
                window.planejamentoCache.push({ docId: docSnap.id, lojaId: lojaId, ...data });
            });
            
            // Re-popular filtros caso equipe tenha carregado
            window.popularFiltrosPlanejamento();
            
            window.renderizarTabelaPlanejamento();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            if (window.sidebarControleAberto) window.renderizarControleMensal();
        }, function (err) { console.error("Erro Planejamento:", err); });
    } catch (e) {
        console.error("Erro ao iniciar listener planejamento", e);
    }
}

window.popularFiltrosPlanejamento = function() {
    try {
        const lojas = window.lojasIniciais || lojasIniciais || [];
        
        // Regional
        const selReg = document.getElementById('planFilterRegional');
        if (selReg && lojas.length > 0) {
            const currentVal = selReg.value;
            selReg.innerHTML = '<option value="">Todas Regionais</option>';
            const estados = [...new Set(lojas.map(l => l.estado))].filter(e => e).sort();
            estados.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est;
                opt.textContent = est;
                selReg.appendChild(opt);
            });
            if (currentVal) selReg.value = currentVal;
        }

        // Auditor
        const selAud = document.getElementById('planFilterAuditor');
        if (selAud) {
            const currentVal = selAud.value;
            selAud.innerHTML = '<option value="">Todos Auditores</option>';
            const equipe = window.audiEquipe || [];
            if (equipe.length > 0) {
                equipe.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.nome;
                    opt.textContent = m.nome;
                    selAud.appendChild(opt);
                });
            }
            if (currentVal) selAud.value = currentVal;
        }
    } catch (e) {
        console.error("Erro ao popular filtros planejamento:", e);
    }
};

function getUltimaAuditoria(nomeLoja) {
    var notasCache = window.notasCache || [];
    var mapCache = window.historicoMapeamento || [];

    // Datas da Auditoria Online (notas)
    var historicoNotas = notasCache
        .filter(function (n) { return n.loja === nomeLoja; })
        .map(function(n) { return n.data; });

    // Datas de Tentativas Realizadas (SIM) no Mapeamento
    var historicoMap = mapCache
        .filter(function(m) { return m.nomeLoja === nomeLoja && m.realizada === 'SIM'; })
        .map(function(m) { return m.dataTentativa; });

    // Consolidar e ordenar
    var todasDatas = historicoNotas.concat(historicoMap);
    if (todasDatas.length === 0) return null;

    todasDatas.sort(function(a, b) { return b.localeCompare(a); }); // Decrescente (YYYY-MM-DD ou DD/MM/YYYY se for o caso, mas assumimos ISO)
    return todasDatas[0];
}

window.renderizarTabelaPlanejamento = function () {
    var tbody = document.getElementById('planejamentoTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var pesqEl = document.getElementById('planSearch');
    var filterRegional = document.getElementById('planFilterRegional')?.value;
    var filterAuditor = document.getElementById('planFilterAuditor')?.value;
    var filterStatus = document.getElementById('planFilterStatus')?.value;
    var filterData = document.getElementById('planFilterData')?.value;
    
    var searchTerms = (pesqEl ? pesqEl.value : '').toLowerCase().split(' ').filter(t => t);

    // Preparar array enriquecido
    var rows = lojasIniciais.map(function (lojaBase) {
        var cfg = (window.planejamentoCache || []).find(function (p) { return p.loja === lojaBase.nome; }) || {};
        var ultimaRaw = getUltimaAuditoria(lojaBase.nome);
        
        // Determinar status para filtro
        let status = "NAO_AGENDADA";
        if (cfg.dataProxima) {
            var mesProx = cfg.dataProxima.substring(0, 7);
            var realizadoNoMes = (window.historicoMapeamento || []).find(function(m) {
                return m.nomeLoja === lojaBase.nome && m.realizada === 'SIM' && (m.dataTentativa.startsWith(mesProx) || m.dataTentativa >= cfg.dataProxima);
            });
            if (realizadoNoMes) {
                status = "CONCLUIDA";
            } else {
                var hoje = new Date().toISOString().substring(0, 10);
                status = hoje > cfg.dataProxima ? "ATRASADA" : "AGENDADA";
            }
        }

        return {
            nome: lojaBase.nome,
            regional: window.getLojaRegional(lojaBase.nome),
            ultimaRaw: ultimaRaw || '',
            proximaRaw: cfg.dataProxima || '',
            auditor: cfg.auditor || '',
            docId: cfg.docId || null,
            lojaId: (window.lojasIniciais.find(l => l.nome === lojaBase.nome) || {}).id,
            status: status
        };
    });

    // Filtros
    rows = rows.filter(function (r) {
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
            (r.nome || "").toLowerCase().includes(term) || 
            (r.regional || "").toLowerCase().includes(term) ||
            (r.auditor || "").toLowerCase().includes(term)
        );
        const matchesRegional = !filterRegional || r.regional === filterRegional;
        const matchesAuditor = !filterAuditor || r.auditor === filterAuditor;
        const matchesStatus = !filterStatus || r.status === filterStatus || (filterStatus === 'AGENDADA_OU_ATRASADA' && (r.status === 'AGENDADA' || r.status === 'ATRASADA'));
        const matchesData = !filterData || r.proximaRaw === filterData;

        return matchesSearch && matchesRegional && matchesAuditor && matchesStatus && matchesData;
    });

    // Sorting
    rows.sort(function (a, b) {
        var va, vb;
        switch (planejamentoSortCol) {
            case 'loja': va = a.nome; vb = b.nome; break;
            case 'regional': va = a.regional; vb = b.regional; break;
            case 'ultima': va = a.ultimaRaw; vb = b.ultimaRaw; break;
            case 'proxima': va = a.proximaRaw; vb = b.proximaRaw; break;
            case 'auditor': va = a.auditor; vb = b.auditor; break;
            default: va = a.nome; vb = b.nome;
        }
        var isDateOrAuditorCol = ['proxima', 'ultima', 'auditor'].includes(planejamentoSortCol);
        if (isDateOrAuditorCol) {
            if (!va && !vb) return 0;
            if (!va) return 1;
            if (!vb) return -1;
        }
        if (va < vb) return planejamentoSortAsc ? -1 : 1;
        if (va > vb) return planejamentoSortAsc ? 1 : -1;
        return 0;
    });

    rows.forEach(function (r) {
        var ultimaStr = r.ultimaRaw ? r.ultimaRaw.split('-').reverse().join('/') : 'Nunca';
        var proxStr = r.proximaRaw ? r.proximaRaw.split('-').reverse().join('/') : '<span class="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest opacity-60">Não agendado</span>';
        var audStr = r.auditor || '<span class="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest text-center border border-[var(--border)] rounded-2xl px-2.5 py-1 shadow-sm bg-black/5 dark:bg-white/5 opacity-60">A Definir</span>';

        // Lógica de Status Baseado no Mapeamento
        var statusHtml = '';
        if (r.proximaRaw) {
            var mesProx = r.proximaRaw.substring(0, 7); // YYYY-MM
            var realizadoNoMes = (window.historicoMapeamento || []).find(function(m) {
                return m.nomeLoja === r.nome && m.realizada === 'SIM' && (m.dataTentativa.startsWith(mesProx) || m.dataTentativa >= r.proximaRaw);
            });

            if (realizadoNoMes) {
                var slaColor = realizadoNoMes.sla ? 'text-spPistache' : 'text-spLaranja';
                var slaTxt = realizadoNoMes.sla ? 'No Prazo' : 'Fora do Prazo';
                statusHtml = '<div class="mt-1 flex items-center gap-1.5"><span class="flex h-2 w-2 rounded-full bg-spPistache shadow-[0_0_8px_rgba(141,181,107,0.5)]"></span><span class="text-[10px] font-black uppercase tracking-wider ' + slaColor + '">Concluída (' + slaTxt + ')</span></div>';
            } else {
                var hoje = new Date().toISOString().substring(0, 10);
                var isAtrasado = hoje > r.proximaRaw;
                var dotColor = isAtrasado ? 'bg-spRed shadow-[0_0_8px_rgba(218,13,23,0.4)]' : 'bg-gray-400';
                var txtLabel = isAtrasado ? 'Atrasada' : 'Agendada';
                var txtColor = isAtrasado ? 'text-spRed' : 'text-[var(--text-muted)]';
                statusHtml = '<div class="mt-1 flex items-center gap-1.5"><span class="flex h-2 w-2 rounded-full ' + dotColor + '"></span><span class="text-[10px] font-black uppercase tracking-wider ' + txtColor + '">' + txtLabel + '</span></div>';
            }
        }

        // Calcular numero de ligacoes (tentativas) ja feitas para o mes agendado
        var ligacoesNoMes = 0;
        if (r.proximaRaw && window.MapeamentoLogic && window.MapeamentoLogic.circularTentativa) {
            ligacoesNoMes = window.MapeamentoLogic.circularTentativa(r.lojaId, r.proximaRaw, window.historicoMapeamento || []) - 1;
        }
        var ligacoesBadge = ligacoesNoMes > 0 
            ? '<span class="bg-[var(--primary)]/10 text-[var(--primary)] font-black text-[10px] px-2 py-0.5 rounded-full ml-2 shadow-sm whitespace-nowrap" title="' + ligacoesNoMes + ' tentativa(s) de ligação no mês">' + ligacoesNoMes + ' <i class="ph-fill ph-phone text-[10px]"></i></span>' 
            : '';

        var tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group';
        
        var actionButtons = `
            <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.navegarParaMapear('${r.lojaId}')" class="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" title="Mapear Visita">
                    <i class="ph ph-map-trifold text-lg"></i>
                </button>
                <button onclick="window.navegarParaLancarNota('${r.nome.replace(/'/g, "\\'")}')" class="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all active:scale-95" title="Lançar Nota">
                    <i class="ph ph-scroll text-lg"></i>
                </button>
                <button onclick="window.abrirModalEditPlanejamento('${r.nome.replace(/'/g, "\\'")}')" class="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl transition-all active:scale-95" title="Editar Agendamento">
                    <i class="ph ph-pencil-simple text-lg"></i>
                </button>
                <button onclick="window.excluirPlanejamento('${r.docId}')" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 ${r.docId ? '' : 'hidden'}" title="Excluir Planejamento">
                    <i class="ph ph-trash text-lg"></i>
                </button>
            </div>
        `;

        tr.innerHTML =
            '<td class="p-4 text-sm font-semibold text-[var(--text-main)] flex items-center h-full min-h-[53px]">' + r.nome + ligacoesBadge + '</td>' +
            '<td class="p-4 text-sm font-black text-brandBlue uppercase tracking-tighter"><span class="bg-brandBlue/10 dark:bg-brandBlue/20 px-3 py-1 rounded-2xl shadow-inner border border-brandBlue/20">' + r.regional + '</span></td>' +
            '<td class="p-4 text-sm font-medium text-[var(--text-main)]">' + ultimaStr + '</td>' +
            '<td class="p-4 text-sm">' +
                '<div class="font-bold text-[var(--primary)]">' + proxStr + '</div>' +
                statusHtml +
            '</td>' +
            '<td class="p-4 text-sm text-[var(--text-main)]"><div class="flex items-center gap-1.5"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)]"></i> ' + audStr + '</div></td>' +
            '<td class="p-4 text-center">' + actionButtons + '</td>';
        tbody.appendChild(tr);
    });
}

window.navegarParaMapear = function(lojaId) {
    window.switchView('mapeamento');
    const select = document.getElementById('mapSelectLoja');
    if (select && lojaId) {
        select.value = lojaId;
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        select.classList.add('ring-2', 'ring-[var(--primary)]');
        setTimeout(() => select.classList.remove('ring-2', 'ring-[var(--primary)]'), 2000);
    }
};

window.sortPlanejamento = function (col) {
    if (planejamentoSortCol === col) {
        planejamentoSortAsc = !planejamentoSortAsc;
    } else {
        planejamentoSortCol = col;
        planejamentoSortAsc = true;
    }
    window.renderizarTabelaPlanejamento();
}

window.filtrarPlanejamento = function () {
    window.renderizarTabelaPlanejamento();
}

window.abrirModalEditPlanejamento = function (nomeLoja) {
    var cfg = (window.planejamentoCache || []).find(function (p) { return p.loja === nomeLoja; }) || {};

    planejamentoAbertoId = {
        nomeLoja: nomeLoja,
        docId: cfg.docId || null
    };

    document.getElementById('modalPlanLojaNome').innerText = nomeLoja;
    document.getElementById('modalPlanId').value = nomeLoja;
    document.getElementById('modalPlanDataProx').value = cfg.dataProxima || '';

    // Atualiza as opções do select com a equipe atual
    var audiEquipe = window.audiEquipe || [];
    var selectAuditor = document.getElementById('modalPlanAuditor');
    if (selectAuditor) {
        selectAuditor.innerHTML = '<option value="">A Definir</option>' +
            audiEquipe.map(function (mb) { return '<option value="' + mb.nome + '">' + mb.nome + '</option>'; }).join('');
    }
    document.getElementById('modalPlanAuditor').value = cfg.auditor || '';
    document.getElementById('modalPlanNotas').value = cfg.notasInternas || '';

    document.getElementById('modalPlanejamentoObj').classList.add('show');
}

window.fecharModalEditPlanejamento = function () {
    document.getElementById('modalPlanejamentoObj').classList.remove('show');
    planejamentoAbertoId = null;
}

window.salvarPlanejamento = async function () {
    if (!planejamentoAbertoId) return;

    var dataProxima = document.getElementById('modalPlanDataProx').value;
    var auditor = document.getElementById('modalPlanAuditor').value.trim();
    var notasInternas = document.getElementById('modalPlanNotas').value.trim();

    var payload = {
        loja: planejamentoAbertoId.nomeLoja,
        dataProxima: dataProxima,
        auditor: auditor,
        notasInternas: notasInternas,
        regional: 'Nordeste',
        updatedAt: new Date().toISOString()
    };

    try {
        if (planejamentoAbertoId.docId) {
            await updateDoc(doc(db, "auditoria_planejamento", planejamentoAbertoId.docId), payload);
        } else {
            await addDoc(collection(db, "auditoria_planejamento"), payload);
        }
        showToast("Agendamento de Auditoria salvo!", "success");
        window.fecharModalEditPlanejamento();
    } catch (e) {
        console.error(e);
        showToast("Erro ao salvar planejamento", "error");
    }
}

window.excluirPlanejamento = async function (docId) {
    if (!docId || docId === 'null') return;
    if (!confirm("Deseja realmente remover este planejamento?")) return;
    try {
        await deleteDoc(doc(db, "auditoria_planejamento", docId));
        showToast("Planejamento removido.", "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir planejamento.", "error");
    }
}

window.processarImportacaoPlanejamento = async function (dados) {
    let sucessos = 0;
    let erros = 0;
    let ignorados = 0;
    const total = dados.length - 1;

    window.showImportModal(total);

    const logErroGlobal = (msg) => {
        const log = document.getElementById('importLog');
        if (log) log.innerHTML += `<div class="text-red-500 font-bold mt-2">ERRO CRÍTICO: ${msg}</div>`;
    };

    const salvarLinha = async (lojaValida, rawDataRaw, auditorFinal, row) => {
        let dataPrevista = "";
        try {
            if (rawDataRaw) {
                if (typeof rawDataRaw === 'number') {
                    const dateObj = new Date(Math.round((rawDataRaw - 25569) * 86400 * 1000));
                    dataPrevista = dateObj.toISOString().split('T')[0];
                } else {
                    const strDate = rawDataRaw.toString().trim();
                    if (strDate.includes('/')) {
                        dataPrevista = strDate.split('/').reverse().join('-');
                    } else if (strDate.includes('-')) {
                        const parts = strDate.split(' ')[0].split('-');
                        dataPrevista = parts[0].length === 4 ? parts.join('-') : parts.reverse().join('-');
                    } else {
                        dataPrevista = strDate;
                    }
                }
            }
        } catch (e) {
            console.error("Erro data:", e);
        }

        const payload = {
            loja: lojaValida.nome,
            dataProxima: dataPrevista,
            auditor: auditorFinal,
            notasInternas: (row[5] || '').toString(), 
            regional: row[1] || (window.lojasIniciais.find(l => l.nome === lojaValida.nome) || {}).estado || 'N/A', 
            updatedAt: new Date().toISOString()
        };

        const existByLoja = (window.planejamentoCache || []).find(p => p.loja === lojaValida.nome);
        if (existByLoja) {
            await updateDoc(doc(db, "auditoria_planejamento", existByLoja.docId), payload);
        } else {
            await addDoc(collection(db, "auditoria_planejamento"), payload);
        }
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

            const rawLoja = (row[0] || '').toString().trim();
            const rawDataRaw = row[3];
            const rawAuditor = (row[4] || '').toString().trim();
            
            if (!rawLoja) {
                window.updateImportProgress(index, total, `Linha ${i}: Nome da loja ausente.`, 'warning');
                continue;
            }

            const lojaValida = window.getLojaByFlexName(rawLoja);
            const auditorFinal = window.getAuditorByFlexName(rawAuditor);

            if (!lojaValida || !auditorFinal) {
                const motivo = !lojaValida ? 'Loja não encontrada' : 'Auditor não encontrado';
                window.updateImportProgress(index, total, `Linha ${i}: ${motivo} (${!lojaValida ? rawLoja : rawAuditor}).`, 'warning');
                window.adicionarPendente(
                    !lojaValida ? 'loja' : 'auditor', 
                    !lojaValida ? rawLoja : rawAuditor, 
                    row, 
                    { rawDataRaw, auditorParcial: auditorFinal, lojaOriginal: lojaValida, unknownAuditorName: !auditorFinal ? rawAuditor : null }
                );
                ignorados++;
                continue;
            }

            try {
                await salvarLinha(lojaValida, rawDataRaw, auditorFinal, row);
                window.updateImportProgress(index, total, `${lojaValida.nome}: Processado com sucesso.`, 'success');
                sucessos++;
            } catch (err) {
                console.error("Erro import:", err);
                window.updateImportProgress(index, total, `${lojaValida.nome}: Erro ao salvar (${err.message}).`, 'error');
                erros++;
            }
            
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 50));
        }

        if (window.importPendentes.rows.length > 0 && !window.importCancelled) {
            window.updateImportProgress(total, total, `Importação parcial: ${window.importPendentes.rows.length} itens aguardando remapeamento.`, 'warning');
            
            window.abrirModalRemapear(async (resolvidos) => {
                let remSucessos = 0;
                let remErros = 0;
                for (const r of resolvidos) {
                    try {
                        const l = r.lojaMapeada || r.lojaOriginal;
                        const a = r.auditorMapeado || r.auditorParcial || window.currentUser || 'Sistema';
                        await salvarLinha(l, r.rawDataRaw, a, r.row);
                        remSucessos++;
                    } catch (e) { 
                        console.error("Erro remapeamento:", e); 
                        remErros++;
                    }
                }
                showToast(`${remSucessos} registros adicionais salvos pós-remapeamento.`, remErros > 0 ? "warning" : "success");
            }, 'planejamento');
        } else {
            let msg = `Importação concluída: ${sucessos} salvos.`;
            if (erros > 0) msg += ` ${erros} erros.`;
            showToast(msg, erros > 0 ? "warning" : "success");
        }
    } catch (criticalErr) {
        console.error("Erro crítico no planejamento:", criticalErr);
        logErroGlobal(criticalErr.message);
        showToast("Erro crítico no processamento. Verifique o log.", "error");
    }
}

// --- CONTROLE MENSAL (Sidebar) ---
window.sidebarControleAberto = false;
window.ctrlTabAtual = 'auditor';

window.abrirControleMensal = function () {
    document.getElementById('sidebarControleMensal').classList.remove('translate-x-full');
    document.getElementById('overlayControleMensal').classList.remove('hidden');
    // Força reflow
    void document.getElementById('overlayControleMensal').offsetWidth;
    document.getElementById('overlayControleMensal').classList.remove('opacity-0');
    window.sidebarControleAberto = true;

    // Inicializa o input com o mês atual caso esteja vazio
    const inputMes = document.getElementById('ctrlMesInput');
    if (inputMes && !inputMes.value) {
        inputMes.value = new Date().toISOString().substring(0, 7);
    }

    window.renderizarControleMensal();
};

window.fecharControleMensal = function () {
    document.getElementById('sidebarControleMensal').classList.add('translate-x-full');
    const overlay = document.getElementById('overlayControleMensal');
    overlay.classList.add('opacity-0');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
    window.sidebarControleAberto = false;
};

window.switchTabControle = function (tab) {
    window.ctrlTabAtual = tab;
    document.getElementById('tabCtrlAuditor').classList.replace(
        tab === 'auditor' ? 'border-transparent' : 'border-[var(--primary)]',
        tab === 'auditor' ? 'border-[var(--primary)]' : 'border-transparent'
    );
    document.getElementById('tabCtrlAuditor').classList.replace(
        tab === 'auditor' ? 'text-[var(--text-muted)]' : 'text-[var(--primary)]',
        tab === 'auditor' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
    );

    document.getElementById('tabCtrlLoja').classList.replace(
        tab === 'loja' ? 'border-transparent' : 'border-[var(--primary)]',
        tab === 'loja' ? 'border-[var(--primary)]' : 'border-transparent'
    );
    document.getElementById('tabCtrlLoja').classList.replace(
        tab === 'loja' ? 'text-[var(--text-muted)]' : 'text-[var(--primary)]',
        tab === 'loja' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
    );

    if (tab === 'auditor') {
        document.getElementById('viewCtrlAuditor').classList.remove('hidden');
        document.getElementById('viewCtrlLoja').classList.add('hidden');
    } else {
        document.getElementById('viewCtrlAuditor').classList.add('hidden');
        document.getElementById('viewCtrlLoja').classList.remove('hidden');
    }
};

window.renderizarControleMensal = function () {
    if (!window.sidebarControleAberto) return;

    const inputMes = document.getElementById('ctrlMesInput');
    let mesAtualIso;
    if (inputMes && inputMes.value) {
        mesAtualIso = inputMes.value;
    } else {
        const dataAtual = new Date();
        mesAtualIso = dataAtual.toISOString().substring(0, 7); // YYYY-MM
    }

    // 1. Por Auditor
    const auditoresMap = {};
    (window.audiEquipe || []).forEach(m => {
        auditoresMap[m.nome] = { concluidas: 0, total: 0 };
    });

    window.lojasIniciais.forEach(lojaBase => {
        const cfg = (window.planejamentoCache || []).find(p => p.loja === lojaBase.nome) || {};
        
        const realizadoMapeamento = (window.historicoMapeamento || []).find(m => 
            m.nomeLoja === lojaBase.nome && m.realizada === 'SIM' && m.dataTentativa.startsWith(mesAtualIso)
        );
        const notaDoMes = (window.notasCache || []).find(n => 
            n.loja === lojaBase.nome && n.data && n.data.startsWith(mesAtualIso)
        );
        
        const isConcluida = !!realizadoMapeamento || !!notaDoMes;
        
        let auditor = cfg.auditor || 'Sistema';
        if (notaDoMes && notaDoMes.auditor) auditor = notaDoMes.auditor;

        let contabiliza = false;
        if (isConcluida) {
            contabiliza = true;
        } else if (cfg.dataProxima && cfg.dataProxima.startsWith(mesAtualIso)) {
            contabiliza = true;
        } else {
            const hojeMes = new Date().toISOString().substring(0, 7);
            if (mesAtualIso < hojeMes) {
                // Em meses passados, se não foi concluída, contabiliza como pendente para o auditor atual
                contabiliza = true; 
            }
        }

        if (contabiliza) {
            if (!auditoresMap[auditor]) auditoresMap[auditor] = { concluidas: 0, total: 0 };
            auditoresMap[auditor].total++;
            if (isConcluida) {
                auditoresMap[auditor].concluidas++;
            }
        }
    });

    const listaAuditores = Object.keys(auditoresMap).map(nome => ({
        nome: nome,
        concluidas: auditoresMap[nome].concluidas,
        total: auditoresMap[nome].total
    })).sort((a, b) => b.total - a.total);

    document.getElementById('ctrlTotalAuditores').innerText = listaAuditores.length;

    const containerAuditor = document.getElementById('listaCtrlAuditor');
    containerAuditor.innerHTML = '';
    
    if (listaAuditores.length === 0) {
        containerAuditor.innerHTML = '<div class="text-sm text-[var(--text-muted)]">Nenhum auditor encontrado.</div>';
    } else {
        listaAuditores.forEach(aud => {
            const hasAgendamentos = aud.total > 0;
            const isCompleted = hasAgendamentos && aud.concluidas === aud.total;
            const bgCor = isCompleted ? 'bg-spPistache/10 text-spPistache' : (hasAgendamentos ? 'bg-spLaranja/10 text-spLaranja' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]');
            const iconCor = isCompleted ? 'text-spPistache' : (hasAgendamentos ? 'text-spLaranja' : 'text-[var(--text-muted)]');
            const statusTexto = hasAgendamentos ? `${aud.concluidas} de ${aud.total} concluídas` : 'Sem agendamentos (0)';

            containerAuditor.innerHTML += `
                <div class="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${bgCor} flex items-center justify-center">
                            <i class="ph-fill ph-user ${iconCor} text-lg"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-[var(--text-main)]">${aud.nome}</div>
                            <div class="text-xs font-semibold ${isCompleted ? 'text-spPistache' : (hasAgendamentos ? 'text-spLaranja' : 'text-[var(--text-muted)]')}">${statusTexto}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // 2. Por Loja (render inicial)
    window.renderizarControleLoja();
};

window.renderizarControleLoja = function() {
    const search = (document.getElementById('ctrlSearchLoja').value || '').toUpperCase();
    
    const inputMes = document.getElementById('ctrlMesInput');
    let mesAtualIso;
    if (inputMes && inputMes.value) {
        mesAtualIso = inputMes.value;
    } else {
        const dataAtual = new Date();
        mesAtualIso = dataAtual.toISOString().substring(0, 7);
    }

    const lojasStatus = [];
    window.lojasIniciais.forEach(lojaBase => {
        const cfg = (window.planejamentoCache || []).find(p => p.loja === lojaBase.nome) || {};
        
        const realizadoMapeamento = (window.historicoMapeamento || []).find(m => 
            m.nomeLoja === lojaBase.nome && m.realizada === 'SIM' && m.dataTentativa.startsWith(mesAtualIso)
        );
        const notaDoMes = (window.notasCache || []).find(n => 
            n.loja === lojaBase.nome && n.data && n.data.startsWith(mesAtualIso)
        );
        
        const isConcluida = !!realizadoMapeamento || !!notaDoMes;

        let status = "NAO_AGENDADA";
        let notaStr = "";
        let auditor = cfg.auditor || "A Definir";
        let dataAgendada = cfg.dataProxima || "";

        if (isConcluida) {
            status = "CONCLUIDA";
            if (notaDoMes) {
                auditor = notaDoMes.auditor || auditor;
                notaStr = parseFloat(notaDoMes.nota).toFixed(1);
                dataAgendada = notaDoMes.data;
            } else if (realizadoMapeamento) {
                dataAgendada = realizadoMapeamento.dataTentativa;
            }
        } else {
            if (cfg.dataProxima && cfg.dataProxima.startsWith(mesAtualIso)) {
                const hoje = new Date().toISOString().substring(0, 10);
                status = hoje > cfg.dataProxima ? "ATRASADA" : "AGENDADA";
            } else {
                const hojeMes = new Date().toISOString().substring(0, 7);
                if (mesAtualIso < hojeMes) {
                    status = "PENDENTE"; // Passou e não foi feita
                } else {
                    status = "NAO_AGENDADA"; // Mês atual ou futuro e sem agendamento
                }
            }
        }

        lojasStatus.push({
            loja: lojaBase.nome,
            estado: lojaBase.estado,
            status: status,
            auditor: auditor,
            dataAgendada: dataAgendada,
            notaStr: notaStr
        });
    });

    const listaLojas = lojasStatus.filter(l => l.loja.includes(search) || l.estado.includes(search));
    
    // Agrupar por Regional
    const porRegional = {};
    listaLojas.forEach(l => {
        if (!porRegional[l.estado]) porRegional[l.estado] = [];
        porRegional[l.estado].push(l);
    });

    const containerLoja = document.getElementById('listaCtrlLoja');
    containerLoja.innerHTML = '';

    if (Object.keys(porRegional).length === 0) {
        containerLoja.innerHTML = '<div class="text-sm text-[var(--text-muted)] text-center py-4">Nenhuma loja encontrada.</div>';
        return;
    }

    Object.keys(porRegional).sort().forEach(estado => {
        const lojas = porRegional[estado].sort((a,b) => a.loja.localeCompare(b.loja));
        let html = `
            <div class="mb-4">
                <div class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <i class="ph-fill ph-map-pin"></i> Regional ${estado}
                </div>
                <div class="space-y-2">
        `;

        lojas.forEach(l => {
            if (l.status === "CONCLUIDA") {
                html += `
                    <div class="flex flex-col p-2.5 rounded-lg border border-spPistache/30 bg-spPistache/5 text-sm shadow-sm gap-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-[var(--text-main)] truncate max-w-[200px]">${l.loja}</span>
                            ${l.notaStr ? '<span class="text-xs font-black text-white bg-spPistache px-2 py-0.5 rounded-md">' + l.notaStr + '</span>' : '<span class="text-[10px] font-bold text-spPistache uppercase">Concluída</span>'}
                        </div>
                        <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span class="flex items-center gap-1"><i class="ph-fill ph-user-circle"></i> ${l.auditor}</span>
                            <span>${l.dataAgendada ? l.dataAgendada.split('-').reverse().join('/') : '-'}</span>
                        </div>
                    </div>
                `;
            } else if (l.status === "AGENDADA" || l.status === "ATRASADA" || l.status === "PENDENTE") {
                const isAtrasadaOrPendente = l.status === "ATRASADA" || l.status === "PENDENTE";
                const corStatus = isAtrasadaOrPendente ? "text-spRed" : "text-spLaranja";
                const textoStatus = l.status === "PENDENTE" ? "Pendente" : (l.status === "ATRASADA" ? "Atrasada" : "Agendada");
                html += `
                    <div class="flex flex-col p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm shadow-sm gap-1">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold text-[var(--text-main)] truncate max-w-[200px]">${l.loja}</span>
                            <span class="text-[10px] font-bold ${corStatus} uppercase">${textoStatus}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-[var(--text-muted)] opacity-80">
                            <span class="flex items-center gap-1"><i class="ph-fill ph-user-circle"></i> ${l.auditor}</span>
                            <span>${l.dataAgendada ? 'Prev: ' + l.dataAgendada.split('-').reverse().join('/') : '-'}</span>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-black/5 dark:bg-white/5 text-sm shadow-sm opacity-60">
                        <span class="font-semibold text-[var(--text-muted)] truncate max-w-[200px]">${l.loja}</span>
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase">Não Agendada</span>
                    </div>
                `;
            }
        });

        html += `</div></div>`;
        containerLoja.innerHTML += html;
    });
};

