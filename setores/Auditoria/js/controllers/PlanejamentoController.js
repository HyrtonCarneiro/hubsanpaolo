// js/controllers/PlanejamentoController.js — Tabela de planejamento de auditorias
// Depends on: firebase-init.js, data.js, DashboardController.js (getLojaRegional), AuditoriaOnlineController.js (notasCache)

window.planejamentoCache = [];
let planejamentoAbertoId = null;
let planejamentoSortCol = 'proxima';
let planejamentoSortAsc = true;

window.initPlanejamentoListeners = function () {
    try {
        onSnapshot(collection(db, "auditoria_planejamento"), function (snapshot) {
            window.planejamentoCache = [];
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                // Tenta achar o ID da loja pelo nome para facilitar navegação
                var lojaId = (window.lojasIniciais.find(l => l.nome === data.loja) || {}).id;
                window.planejamentoCache.push({ docId: docSnap.id, lojaId: lojaId, ...data });
            });
            window.renderizarTabelaPlanejamento();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }, function (err) { console.error("Erro Planejamento:", err); });
    } catch (e) {
        console.error("Erro ao iniciar listener planejamento", e);
    }
}

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

    var pesqEl = document.getElementById('pesquisaPlanejamento');
    var filtro = (pesqEl ? pesqEl.value : '').toLowerCase();

    // Preparar array enriquecido
    var rows = lojasIniciais.map(function (lojaBase) {
        var cfg = (window.planejamentoCache || []).find(function (p) { return p.loja === lojaBase.nome; }) || {};
        var ultimaRaw = getUltimaAuditoria(lojaBase.nome);
        return {
            nome: lojaBase.nome,
            regional: window.getLojaRegional(lojaBase.nome),
            ultimaRaw: ultimaRaw || '',
            proximaRaw: cfg.dataProxima || '',
            auditor: cfg.auditor || '',
            docId: cfg.docId || null,
            lojaId: (window.lojasIniciais.find(l => l.nome === lojaBase.nome) || {}).id
        };
    });

    // Filtro de texto
    if (filtro) {
        rows = rows.filter(function (r) {
            return r.nome.toLowerCase().includes(filtro) || r.regional.toLowerCase().includes(filtro) || r.auditor.toLowerCase().includes(filtro);
        });
    }

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
        var proxStr = r.proximaRaw ? r.proximaRaw.split('-').reverse().join('/') : '<span class="text-[var(--text-muted)] font-normal text-xs">Não agendado</span>';
        var audStr = r.auditor || '<span class="text-[var(--text-muted)] font-normal text-xs text-center border border-[var(--border)] rounded-full px-2 py-0.5">A Definir</span>';

        // Lógica de Status Baseado no Mapeamento
        var statusHtml = '';
        if (r.proximaRaw) {
            var mesProx = r.proximaRaw.substring(0, 7); // YYYY-MM
            var realizadoNoMes = (window.historicoMapeamento || []).find(function(m) {
                return m.nomeLoja === r.nome && m.realizada === 'SIM' && m.dataTentativa.startsWith(mesProx);
            });

            if (realizadoNoMes) {
                var slaColor = realizadoNoMes.sla ? 'text-green-600' : 'text-orange-500';
                var slaTxt = realizadoNoMes.sla ? 'No Prazo' : 'Fora do Prazo';
                statusHtml = '<div class="mt-1 flex items-center gap-1.5"><span class="flex h-2 w-2 rounded-full bg-green-500"></span><span class="text-[10px] font-bold uppercase ' + slaColor + '">Concluída (' + slaTxt + ')</span></div>';
            } else {
                var hoje = new Date().toISOString().substring(0, 10);
                var isAtrasado = hoje > r.proximaRaw;
                var dotColor = isAtrasado ? 'bg-red-500' : 'bg-gray-400';
                var txtLabel = isAtrasado ? 'Atrasada' : 'Agendada';
                var txtColor = isAtrasado ? 'text-red-500' : 'text-[var(--text-muted)]';
                statusHtml = '<div class="mt-1 flex items-center gap-1.5"><span class="flex h-2 w-2 rounded-full ' + dotColor + '"></span><span class="text-[10px] font-bold uppercase ' + txtColor + '">' + txtLabel + '</span></div>';
            }
        }

        var tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group';
        
        var actionButtons = `
            <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.navegarParaMapear('${r.lojaId}')" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Mapear Visita">
                    <i class="ph ph-map-trifold text-lg"></i>
                </button>
                <button onclick="window.navegarParaLancarNota('${r.nome.replace(/'/g, "\\'")}')" class="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Lançar Nota">
                    <i class="ph ph-scroll text-lg"></i>
                </button>
                <button onclick="window.abrirModalEditPlanejamento('${r.nome.replace(/'/g, "\\'")}')" class="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg transition-colors" title="Editar Agendamento">
                    <i class="ph ph-pencil-simple text-lg"></i>
                </button>
            </div>
        `;

        tr.innerHTML =
            '<td class="p-4 text-sm font-semibold text-[var(--text-main)]">' + r.nome + '</td>' +
            '<td class="p-4 text-sm font-medium text-brandBlue"><span class="bg-brandBlue/10 dark:bg-brandBlue/20 px-2 py-1 rounded-md">' + r.regional + '</span></td>' +
            '<td class="p-4 text-sm font-medium text-[var(--text-main)]">' + ultimaStr + '</td>' +
            '<td class="p-4 text-sm">' +
                '<div class="font-bold text-[var(--primary)]">' + proxStr + '</div>' +
                statusHtml +
            '</td>' +
            '<td class="p-4 text-sm text-[var(--text-main)] flex items-center gap-1.5 h-full min-h-[53px]"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)]"></i> ' + audStr + '</td>' +
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

window.processarImportacaoPlanejamento = async function (dados) {
    let sucessos = 0;
    let erros = 0;
    let ignorados = 0;

    for (const row of dados) {
        const nomeLoja = (row.LOJA || '').toString().trim().toUpperCase();
        const dataPrevista = (row.DATA_PREVISTA || '').toString().trim();
        const auditor = (row.AUDITOR_RESPONSAVEL || '').toString().trim();
        const idRegistro = row.ID_REGISTRO;

        // Validar se a loja existe no sistema
        const lojaValida = window.lojasIniciais.find(l => l.nome.toUpperCase() === nomeLoja);
        if (!lojaValida) {
            console.warn("Loja ignorada (não encontrada):", nomeLoja);
            ignorados++;
            continue;
        }

        const payload = {
            loja: lojaValida.nome, // Usa o nome oficial
            dataProxima: dataPrevista,
            auditor: auditor,
            notasInternas: row.NOTAS_ADICIONAIS || '',
            regional: 'Nordeste', // Default do sistema atual
            updatedAt: new Date().toISOString()
        };

        try {
            // Se tiver ID_REGISTRO, tentamos atualizar
            let docRef = null;
            if (idRegistro) {
                // Tenta achar pelo docId no cache primeiro
                const noCache = (window.planejamentoCache || []).find(p => p.docId === idRegistro || p.id === idRegistro);
                if (noCache) {
                    docRef = doc(db, "auditoria_planejamento", noCache.docId);
                    await updateDoc(docRef, payload);
                    sucessos++;
                    continue;
                }
            }

            // Se não achou pelo ID ou não tem ID, busca por nome de loja
            const existByLoja = (window.planejamentoCache || []).find(p => p.loja === lojaValida.nome);
            if (existByLoja) {
                docRef = doc(db, "auditoria_planejamento", existByLoja.docId);
                await updateDoc(docRef, payload);
            } else {
                await addDoc(collection(db, "auditoria_planejamento"), payload);
            }
            sucessos++;
        } catch (err) {
            console.error("Erro ao importar linha:", row, err);
            erros++;
        }
    }

    let msg = `Importação concluída: ${sucessos} salvos.`;
    if (ignorados > 0) msg += ` ${ignorados} lojas não encontradas.`;
    if (erros > 0) msg += ` ${erros} erros.`;
    
    showToast(msg, erros > 0 ? "warning" : "success");
}
