// js/controllers/AuditoriaOnlineController.js — Lançamento e histórico de notas
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

// Cache compartilhado
window.notasCache = [];

window.initAuditoriaOnlineListeners = function () {
    try {
        const qNotas = query(collection(db, "auditoria_notas"), orderBy("data", "desc"));
        onSnapshot(qNotas, function (snapshot) {
            window.notasCache = [];
            snapshot.forEach(function (docSnap) {
                window.notasCache.push({ id: docSnap.id, ...docSnap.data() });
            });
            renderizarHistoricoNotas();
            if (typeof window.renderizarTabelaPlanejamento === 'function') window.renderizarTabelaPlanejamento();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            if (window.sidebarControleAberto) window.renderizarControleMensal();
        }, function (err) { console.error("Erro Notas:", err); });
    } catch (e) {
        console.error("Erro ao iniciar listener de notas", e);
    }
}

window.salvarAuditoriaOnline = async function () {
    const loja = document.getElementById('audiSelectLoja').value;
    const data = document.getElementById('audiDataInput').value;
    const nota = parseFloat(document.getElementById('audiNotaInput').value);

    if (!loja || !data || isNaN(nota) || nota < 0 || nota > 10) {
        showToast("Preencha loja, data e uma nota válida (0 a 10).", "warning");
        return;
    }

    try {
        await addDoc(collection(db, "auditoria_notas"), {
            loja: loja,
            data: data,
            nota: nota,
            auditor: currentUser,
            timestamp: new Date().toISOString()
        });
        showToast("Auditoria registrada!", "success");

        // --- INTEGRAÇÃO 3-WAY: Criar sucesso automático no Mapeamento ---
        if (window.MapeamentoLogic && window.MapeamentoService) {
            const mapCache = window.historicoMapeamento || [];
            const mesAtualISO = data.substring(0, 7); // YYYY-MM
            
            const jaExisteSucesso = mapCache.find(m => 
                m.lojaId === loja && 
                m.realizada === 'SIM' && 
                m.dataTentativa.startsWith(mesAtualISO)
            );

            if (!jaExisteSucesso) {
                // Se não existe sucesso no mês, cria um automático
                const nTentativa = window.MapeamentoLogic.circularTentativa(loja, data, mapCache);
                const sla = window.MapeamentoLogic.estaNoPrazo(data);
                const dadosMapAuto = {
                    lojaId: loja,
                    nomeLoja: (window.lojasIniciais.find(l => l.id === loja) || {}).nome || loja,
                    estado: (window.lojasIniciais.find(l => l.id === loja) || {}).estado || '-',
                    dataTentativa: data,
                    realizada: 'SIM',
                    justificativa: null,
                    auditor: currentUser || 'Sistema',
                    notas: "Registrado automaticamente via Auditoria Online",
                    nTentativa: nTentativa,
                    sla: sla,
                    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                };
                await window.MapeamentoService.registrarTentativa(dadosMapAuto);
                showToast("Mapeamento atualizado automaticamente!", "info");
            }
        }
        // -------------------------------------------------------------

        document.getElementById('audiSelectLoja').value = "";
        document.getElementById('audiNotaInput').value = "";
    } catch (e) {
        console.error(e);
        showToast("Erro ao gravar nota.", "error");
    }
}

function renderizarHistoricoNotas() {
    const tbody = document.getElementById('audiHistoricoBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (window.notasCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-[var(--text-muted)]">Nenhuma avaliação registrada recente.</td></tr>';
        return;
    }

    var relatorio = window.notasCache.slice(0, 30);

    relatorio.forEach(function (nota) {
        var tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors';

        var colorClass = "text-spPistache";
        if (nota.nota < 7) colorClass = "text-spRed";
        else if (nota.nota < 8.5) colorClass = "text-spLaranja";

        var displayData = nota.data;
        if (displayData) {
            var parts = displayData.split('-');
            if (parts[0] && parts[1] && parts[2]) displayData = parts[2] + '/' + parts[1] + '/' + parts[0];
        }

        var actionButtons = `
            <div class="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.abrirModalEditarNota('${nota.id}')" class="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" title="Editar">
                    <i class="ph ph-pencil-simple text-lg"></i>
                </button>
                <button onclick="window.excluirNota('${nota.id}')" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95" title="Excluir">
                    <i class="ph ph-trash text-lg"></i>
                </button>
            </div>
        `;

        tr.innerHTML =
            '<td class="p-4 text-sm font-medium text-[var(--text-muted)]">' + displayData + '</td>' +
            '<td class="p-4 text-sm font-black text-[var(--text-main)] uppercase tracking-tight">' + nota.loja + '</td>' +
            '<td class="p-4 text-xs font-bold text-[var(--text-muted)] opacity-60 flex items-center gap-1.5 mt-1.5"><i class="ph-fill ph-user-circle text-lg"></i> ' + nota.auditor + '</td>' +
            '<td class="p-4 text-lg font-black text-right ' + colorClass + ' tracking-tighter">' + nota.nota.toFixed(1) + '</td>' +
            '<td class="p-4 text-center">' + actionButtons + '</td>';
        tbody.appendChild(tr);
    });
}

window.excluirNota = async function (id) {
    if (!confirm("Deseja realmente excluir esta avaliação?")) return;
    try {
        await deleteDoc(doc(db, "auditoria_notas", id));
        showToast("Avaliação excluída com sucesso!", "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir nota.", "error");
    }
}

window.abrirModalEditarNota = function (id) {
    const nota = window.notasCache.find(n => n.id === id);
    if (!nota) return;

    document.getElementById('editNotaId').value = id;
    
    // Popular select de lojas no modal
    const sel = document.getElementById('editNotaLoja');
    sel.innerHTML = window.lojasIniciais.sort((a,b) => a.nome.localeCompare(b.nome)).map(l => 
        `<option value="${l.nome}">${l.nome}</option>`
    ).join('');
    
    sel.value = nota.loja;
    document.getElementById('editNotaData').value = nota.data;
    document.getElementById('editNotaValor').value = nota.nota;

    document.getElementById('modalEditNota').classList.add('show');
}

window.fecharModalEditNota = function () {
    document.getElementById('modalEditNota').classList.remove('show');
}

window.salvarEdicaoNota = async function () {
    const id = document.getElementById('editNotaId').value;
    const loja = document.getElementById('editNotaLoja').value;
    const data = document.getElementById('editNotaData').value;
    const notaValor = parseFloat(document.getElementById('editNotaValor').value);

    if (!loja || !data || isNaN(notaValor) || notaValor < 0 || notaValor > 10) {
        showToast("Preencha todos os campos corretamente.", "warning");
        return;
    }

    try {
        await updateDoc(doc(db, "auditoria_notas", id), {
            loja: loja,
            data: data,
            nota: notaValor,
            updatedAt: new Date().toISOString()
        });
        showToast("Avaliação atualizada!", "success");
        window.fecharModalEditNota();
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar nota.", "error");
    }
}

window.processarImportacaoNotas = async function (dados) {
    let sucessos = 0;
    let erros = 0;

    for (const row of dados) {
        const nomeLoja = (row.LOJA || '').toString().trim().toUpperCase();
        const data = (row.DATA_AUDITORIA || '').toString().trim();
        const nota = parseFloat(row.NOTA);
        const auditor = (row.AUDITOR || '').toString().trim();

        if (!nomeLoja || !data || isNaN(nota)) continue;

        const lojaValida = window.lojasIniciais.find(l => l.nome.toUpperCase() === nomeLoja);
        if (!lojaValida) continue;

        const payload = {
            loja: lojaValida.nome,
            data: data,
            nota: nota,
            auditor: auditor || currentUser || 'Sistema',
            timestamp: new Date().toISOString()
        };

        try {
            // Tenta atualizar se já existe nota para aquela loja e data
            const exist = window.notasCache.find(n => n.loja === lojaValida.nome && n.data === data);
            if (exist) {
                await updateDoc(doc(db, "auditoria_notas", exist.id), payload);
            } else {
                await addDoc(collection(db, "auditoria_notas"), payload);
            }
            sucessos++;
        } catch (err) {
            console.error(err);
            erros++;
        }
    }

    showToast(`Importação de Notas: ${sucessos} processadas, ${erros} erros.`, erros > 0 ? "warning" : "success");
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

    const notasDoMes = window.notasCache.filter(n => n.data && n.data.startsWith(mesAtualIso));

    // 1. Por Auditor
    const auditoresMap = {};
    (window.audiEquipe || []).forEach(m => {
        auditoresMap[m.nome] = 0;
    });

    notasDoMes.forEach(nota => {
        const auditor = nota.auditor || 'Sistema';
        if (auditoresMap[auditor] !== undefined) {
            auditoresMap[auditor]++;
        } else {
            auditoresMap[auditor] = 1;
        }
    });

    const listaAuditores = Object.keys(auditoresMap).map(nome => ({
        nome: nome,
        count: auditoresMap[nome]
    })).sort((a, b) => b.count - a.count); // Maior número primeiro

    document.getElementById('ctrlTotalAuditores').innerText = listaAuditores.length;

    const containerAuditor = document.getElementById('listaCtrlAuditor');
    containerAuditor.innerHTML = '';
    
    if (listaAuditores.length === 0) {
        containerAuditor.innerHTML = '<div class="text-sm text-[var(--text-muted)]">Nenhum auditor cadastrado ou encontrado.</div>';
    } else {
        listaAuditores.forEach(aud => {
            const hasLançamentos = aud.count > 0;
            const bgCor = hasLançamentos ? 'bg-spPistache/10 text-spPistache' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]';
            const iconCor = hasLançamentos ? 'text-spPistache' : 'text-[var(--text-muted)]';
            const statusTexto = hasLançamentos ? `${aud.count} lançamento(s)` : 'Pendente (0)';

            containerAuditor.innerHTML += `
                <div class="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${bgCor} flex items-center justify-center">
                            <i class="ph-fill ph-user ${iconCor} text-lg"></i>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-[var(--text-main)]">${aud.nome}</div>
                            <div class="text-xs font-semibold ${hasLançamentos ? 'text-spPistache' : 'text-spRed'}">${statusTexto}</div>
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

    const notasDoMes = window.notasCache.filter(n => n.data && n.data.startsWith(mesAtualIso));

    const lojasStatus = {};
    window.lojasIniciais.forEach(loja => {
        lojasStatus[loja.nome] = { 
            loja: loja.nome, 
            estado: loja.estado,
            auditada: false, 
            auditor: null, 
            data: null,
            notaFinal: null
        };
    });

    notasDoMes.forEach(nota => {
        if (lojasStatus[nota.loja]) {
            lojasStatus[nota.loja].auditada = true;
            lojasStatus[nota.loja].auditor = nota.auditor;
            lojasStatus[nota.loja].data = nota.data;
            lojasStatus[nota.loja].notaFinal = nota.nota;
        }
    });

    const listaLojas = Object.values(lojasStatus).filter(l => l.loja.includes(search) || l.estado.includes(search));
    
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
            if (l.auditada) {
                html += `
                    <div class="flex flex-col p-2.5 rounded-lg border border-spPistache/30 bg-spPistache/5 text-sm shadow-sm gap-1">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-[var(--text-main)] truncate max-w-[200px]">${l.loja}</span>
                            <span class="text-xs font-black text-white bg-spPistache px-2 py-0.5 rounded-md">${parseFloat(l.notaFinal).toFixed(1)}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span class="flex items-center gap-1"><i class="ph-fill ph-user-circle"></i> ${l.auditor || 'Sistema'}</span>
                            <span>${l.data.split('-').reverse().join('/')}</span>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-black/5 dark:bg-white/5 text-sm shadow-sm opacity-60">
                        <span class="font-semibold text-[var(--text-muted)] truncate max-w-[200px]">${l.loja}</span>
                        <span class="text-[10px] font-bold text-spRed uppercase">Pendente</span>
                    </div>
                `;
            }
        });

        html += `</div></div>`;
        containerLoja.innerHTML += html;
    });
};
