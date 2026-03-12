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

        tr.innerHTML =
            '<td class="p-4 text-sm text-[var(--text-main)]">' + displayData + '</td>' +
            '<td class="p-4 text-sm font-semibold text-[var(--text-main)]">' + nota.loja + '</td>' +
            '<td class="p-4 text-sm text-[var(--text-muted)]"><i class="ph ph-user"></i> ' + nota.auditor + '</td>' +
            '<td class="p-4 text-lg font-bold text-right ' + colorClass + '">' + nota.nota.toFixed(1) + '</td>';
        tbody.appendChild(tr);
    });
}
