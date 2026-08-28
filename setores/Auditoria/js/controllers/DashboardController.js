let chartMediaRegionalInst = null;
let chartRankingLojasInst = null;
let chartStatusPlanejamentoInst = null;
let chartTarefaStatusInst = null;
let chartTarefaEquipeInst = null;

function getLojaRegional(nomeLoja) {
    const lojas = window.lojasIniciais || lojasIniciais || [];
    const l = lojas.find(function (x) { return x.nome === nomeLoja; });
    return l ? l.estado : 'N/A';
}
window.getLojaRegional = getLojaRegional;

// Registrar plugin de labels globalmente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.popularFiltrosDashboard = function () {
    try {
        const select = document.getElementById('dashFilterRegional');
        if (!select) return;

        const lojas = window.lojasIniciais || lojasIniciais || [];
        const currentVal = select.value;

        // Manter a opção padrão
        select.innerHTML = '<option value="">Todas as Regionais (Rede)</option>';

        const estados = [...new Set(lojas.map(l => l.estado).filter(Boolean))].sort();
        estados.forEach(est => {
            const countLojas = lojas.filter(l => l.estado === est).length;
            const opt = document.createElement('option');
            opt.value = est;
            opt.textContent = `Regional ${est} (${countLojas} lojas)`;
            select.appendChild(opt);
        });

        if (currentVal && estados.includes(currentVal)) {
            select.value = currentVal;
        }
    } catch (e) {
        console.error("Erro ao popular filtros do dashboard:", e);
    }
};

window.renderDashboard = function () {
    // Garantir que os filtros do select estejam populados
    if (typeof window.popularFiltrosDashboard === 'function') {
        const select = document.getElementById('dashFilterRegional');
        if (select && select.options.length <= 1) {
            window.popularFiltrosDashboard();
        }
    }

    const selectRegional = document.getElementById('dashFilterRegional');
    const filterRegional = selectRegional ? selectRegional.value : "";

    // Atualizar badge informativa de filtro
    const infoSpan = document.getElementById('dashFiltroInfo');
    if (infoSpan) {
        if (filterRegional) {
            infoSpan.innerHTML = `<span class="bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><i class="ph-fill ph-funnel"></i> Regional ${filterRegional} selecionada</span>`;
        } else {
            infoSpan.innerHTML = `<i class="ph ph-info text-base text-[var(--primary)]"></i><span>Exibindo visão consolidada da rede</span>`;
        }
    }

    let notasCache = window.notasCache || [];
    let planeCache = window.planejamentoCache || [];
    let mapCache = window.historicoMapeamento || [];

    // --- FILTRAGEM POR REGIONAL ---
    if (filterRegional) {
        notasCache = notasCache.filter(n => getLojaRegional(n.loja) === filterRegional);
        planeCache = planeCache.filter(p => getLojaRegional(p.loja) === filterRegional || p.regional === filterRegional);
        mapCache = mapCache.filter(m => m.estado === filterRegional || getLojaRegional(m.nomeLoja) === filterRegional);
    }

    var hoje = new Date();
    var mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    var hojeISO = hoje.toISOString().split('T')[0];

    // --- KPI: Auditoria Online (Media e Notas) ---
    var elMediaRedeTitle = document.querySelector('#kpiMediaRede + p');
    if (elMediaRedeTitle) {
        elMediaRedeTitle.textContent = filterRegional ? `Média Regional (${filterRegional})` : 'Média da Rede';
    }

    var todasUltimas = [];

    if (notasCache.length === 0) {
        document.getElementById('kpiTotalAuditorias').textContent = '0';
        document.getElementById('kpiMediaRede').textContent = '-';
        document.getElementById('kpiMenorNota').textContent = '-';
        document.getElementById('kpiMenorNotaLoja').textContent = '';
        document.getElementById('kpiAuditoriaMes').textContent = '0';
    } else {
        document.getElementById('kpiTotalAuditorias').textContent = notasCache.length;
        var somaNotas = notasCache.reduce(function (acc, n) { return acc + (parseFloat(n.nota) || 0); }, 0);
        var media = somaNotas / notasCache.length;
        var elMedia = document.getElementById('kpiMediaRede');
        if (elMedia) {
            elMedia.textContent = media.toFixed(1);
            elMedia.className = media >= 8.5 ? 'text-3xl font-black m-0 leading-none text-spPistache' : (media >= 7 ? 'text-3xl font-black m-0 leading-none text-spLaranja' : 'text-3xl font-black m-0 leading-none text-spRed');
        }
        var ultimaPorLoja = {};
        notasCache.forEach(function (n) { if (!ultimaPorLoja[n.loja] || n.data > ultimaPorLoja[n.loja].data) ultimaPorLoja[n.loja] = n; });
        todasUltimas = Object.values(ultimaPorLoja);
        
        if (todasUltimas.length > 0) {
            var menor = todasUltimas.reduce(function (min, n) { return n.nota < min.nota ? n : min; }, todasUltimas[0]);
            if (document.getElementById('kpiMenorNota')) document.getElementById('kpiMenorNota').textContent = menor.nota.toFixed(1);
            if (document.getElementById('kpiMenorNotaLoja')) document.getElementById('kpiMenorNotaLoja').textContent = menor.loja;
        } else {
            if (document.getElementById('kpiMenorNota')) document.getElementById('kpiMenorNota').textContent = '-';
            if (document.getElementById('kpiMenorNotaLoja')) document.getElementById('kpiMenorNotaLoja').textContent = '';
        }

        var doMesNotas = notasCache.filter(function (n) { return n.data && n.data.startsWith(mesAtual); });
        if (document.getElementById('kpiAuditoriaMes')) document.getElementById('kpiAuditoriaMes').textContent = doMesNotas.length;
    }

    // --- INTEGRACAO 3-WAY: KPIs Dinamicos ---
    
    // 1. Cobertura do Mês
    var planeMes = planeCache.filter(p => (p.dataProxima || '').startsWith(mesAtual));
    var visitasSucessoMes = mapCache.filter(m => m.realizada === 'SIM' && m.dataTentativa.startsWith(mesAtual));
    
    var cobertura = 0;
    if (planeMes.length > 0) {
        var concluidas = planeMes.filter(p => visitasSucessoMes.some(m => m.nomeLoja === p.loja)).length;
        cobertura = (concluidas / planeMes.length) * 100;
    }
    document.getElementById('kpiCoberturaMes').textContent = Math.round(cobertura) + '%';

    // 2. Índice de SLA
    var slaGlobal = 0;
    if (visitasSucessoMes.length > 0) {
        var noPrazo = visitasSucessoMes.filter(m => m.sla).length;
        slaGlobal = (noPrazo / visitasSucessoMes.length) * 100;
    }
    document.getElementById('kpiSlaGlobal').textContent = Math.round(slaGlobal) + '%';

    // 3. Eficiência de Visita
    var totalTentativas = visitasSucessoMes.reduce((acc, m) => acc + (m.nTentativa || 1), 0);
    var mediaTentativas = visitasSucessoMes.length > 0 ? (totalTentativas / visitasSucessoMes.length).toFixed(1) : '0.0';
    document.getElementById('kpiMediaTentativas').textContent = mediaTentativas;

    // 4. Lojas Atrasadas e Status Chart
    var statusCounts = { concluida: 0, atrasada: 0, pendente: 0 };
    planeMes.forEach(p => {
        var temSucesso = visitasSucessoMes.some(m => m.nomeLoja === p.loja);
        if (temSucesso) {
            statusCounts.concluida++;
        } else {
            if (hojeISO > p.dataProxima) statusCounts.atrasada++;
            else statusCounts.pendente++;
        }
    });
    document.getElementById('kpiLojasAtrasadas').textContent = statusCounts.atrasada;

    // --- LOGICA DE LOJAS CRÍTICAS (Dashboard) ---
    const mapCacheMes = mapCache.filter(m => m.dataTentativa.startsWith(mesAtual));
    const lojasCriticasMap = {};
    
    mapCacheMes.forEach(m => {
        if (!lojasCriticasMap[m.nomeLoja]) {
            lojasCriticasMap[m.nomeLoja] = { maxTentativa: 0, teveSucesso: false };
        }
        if (m.realizada === 'SIM') lojasCriticasMap[m.nomeLoja].teveSucesso = true;
        if (m.nTentativa > lojasCriticasMap[m.nomeLoja].maxTentativa) {
            lojasCriticasMap[m.nomeLoja].maxTentativa = m.nTentativa;
        }
    });

    const bodyCriticas = document.getElementById('dashboardLojasCriticas');
    if (bodyCriticas) {
        const criticas = Object.entries(lojasCriticasMap)
            .filter(([nome, dados]) => !dados.teveSucesso && dados.maxTentativa >= 2)
            .sort((a, b) => b[1].maxTentativa - a[1].maxTentativa);

        if (criticas.length === 0) {
            bodyCriticas.innerHTML = `<div class="col-span-full py-10 text-center text-[var(--text-muted)]">Nenhuma loja crítica identificada${filterRegional ? ' na Regional ' + filterRegional : ''}.</div>`;
        } else {
            bodyCriticas.innerHTML = criticas.map(([nome, dados]) => `
                <div class="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-7xl text-red-500 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500">
                        <i class="ph-fill ph-warning-octagon"></i>
                    </div>
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-red-500/10 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                        ${dados.maxTentativa}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-black text-[var(--text-main)] text-sm truncate mb-1">${nome}</h4>
                        <p class="text-[0.6rem] font-black uppercase tracking-widest text-red-500 opacity-70">Tentativas sem sucesso</p>
                    </div>
                    <i class="ph ph-caret-right text-red-300 group-hover:text-red-500 transition-colors"></i>
                </div>
            `).join('');
        }
    }

    // --- GRAFICOS ---
    var isDark = document.body.classList.contains('dark-mode');
    var textColor = isDark ? '#f8fafc' : '#0f172a';
    var gridColor = isDark ? '#334155' : '#e2e8f0';

    // Gráfico 1: Média Regional
    var canvasRegional = document.getElementById('chartMediaRegional');
    if (canvasRegional) {
        var mediaPorRegional = {};
        var countPorRegional = {};

        // Se filtro ativo, calcula médias de lojas daquela regional ou de todas com destaque
        const notasParaGrafico = filterRegional 
            ? (window.notasCache || []).filter(n => getLojaRegional(n.loja) === filterRegional)
            : (window.notasCache || []);

        var ultimasGrafico = {};
        notasParaGrafico.forEach(function (n) { 
            if (!ultimasGrafico[n.loja] || n.data > ultimasGrafico[n.loja].data) ultimasGrafico[n.loja] = n; 
        });

        Object.values(ultimasGrafico).forEach(n => {
            var reg = getLojaRegional(n.loja);
            if (!mediaPorRegional[reg]) { mediaPorRegional[reg] = 0; countPorRegional[reg] = 0; }
            mediaPorRegional[reg] += parseFloat(n.nota) || 0; 
            countPorRegional[reg]++;
        });

        var regionais = Object.keys(mediaPorRegional).sort();
        var mediasRegionais = regionais.map(r => +(mediaPorRegional[r] / countPorRegional[r]).toFixed(1));
        var coresBarras = mediasRegionais.map(m => m >= 8.5 ? '#4F7039' : (m >= 7 ? '#DA5513' : '#DA0D17'));
        
        if (chartMediaRegionalInst) chartMediaRegionalInst.destroy();
        chartMediaRegionalInst = new Chart(canvasRegional, {
            type: 'bar',
            data: { labels: regionais.length > 0 ? regionais : ['Sem dados'], datasets: [{ label: 'Média', data: mediasRegionais.length > 0 ? mediasRegionais : [0], backgroundColor: coresBarras.length > 0 ? coresBarras : ['#94a3b8'], borderRadius: 8, barThickness: 25 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, datalabels: { color: textColor, font: { weight: 'bold' }, anchor: 'end', align: 'end' }}, scales: { x: { min: 0, max: 10, ticks: { color: textColor } }, y: { ticks: { color: textColor } } } }
        });
    }

    // Gráfico 2: Status do Planejamento
    var canvasStatus = document.getElementById('chartStatusPlanejamento');
    if (canvasStatus) {
        if (chartStatusPlanejamentoInst) chartStatusPlanejamentoInst.destroy();
        chartStatusPlanejamentoInst = new Chart(canvasStatus, {
            type: 'doughnut',
            data: {
                labels: ['Concluída', 'Atrasada', 'Pendente'],
                datasets: [{
                    data: [statusCounts.concluida, statusCounts.atrasada, statusCounts.pendente],
                    backgroundColor: ['#4F7039', '#DA0D17', '#94a3b8'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 20, font: { size: 12 } } },
                    datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (v) => v > 0 ? v : '' }
                }
            }
        });
    }

    // Gráfico 3: Ranking Notas (Top 15 Lojas)
    var canvasRanking = document.getElementById('chartRankingLojas');
    if (canvasRanking) {
        var ranking = (todasUltimas.length > 0 ? todasUltimas : notasCache.slice())
            .sort((a,b) => a.nota - b.nota)
            .slice(0, 15);

        if (chartRankingLojasInst) chartRankingLojasInst.destroy();
        chartRankingLojasInst = new Chart(canvasRanking, {
            type: 'bar',
            data: {
                labels: ranking.length > 0 ? ranking.map(n => n.loja) : ['Sem dados'],
                datasets: [{ 
                    data: ranking.length > 0 ? ranking.map(n => n.nota) : [0], 
                    backgroundColor: ranking.map(n => n.nota >= 8.5 ? '#4F7039' : (n.nota >= 7 ? '#DA5513' : '#DA0D17')), 
                    borderRadius: 8, 
                    barThickness: 15 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                indexAxis: 'y', 
                plugins: { legend: { display: false }, datalabels: { display: false } }, 
                scales: { 
                    x: { min: 0, max: 10, ticks: { display: false }, grid: { display: false } }, 
                    y: { ticks: { color: textColor, font: { size: 10 } } } 
                } 
            }
        });
    }

    // --- INDICADORES DE TAREFAS ---
    var tasks = window.audiProjetos || {};
    var taskStatusCounts = { 'Pendente': 0, 'Em Andamento': 0, 'Concluído': 0 };
    var taskDistrib = {};

    Object.keys(tasks).forEach(membro => {
        taskDistrib[membro] = 0;
        tasks[membro].forEach(p => {
            if (p.status === 'Concluído') {
                taskStatusCounts['Concluído']++;
            } else if (p.status === 'Em Andamento') {
                taskStatusCounts['Em Andamento']++;
                taskDistrib[membro]++;
            } else {
                taskStatusCounts['Pendente']++;
                taskDistrib[membro]++;
            }
        });
    });

    // Gráfico 4: Status das Tarefas Ativas
    var canvasTaskStatus = document.getElementById('chartTarefaStatus');
    if (canvasTaskStatus) {
        if (chartTarefaStatusInst) chartTarefaStatusInst.destroy();
        chartTarefaStatusInst = new Chart(canvasTaskStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Em Andamento'],
                datasets: [{
                    data: [taskStatusCounts['Pendente'], taskStatusCounts['Em Andamento']],
                    backgroundColor: ['#DA0D17', '#3b82f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } },
                    datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (v) => v > 0 ? v : '' }
                }
            }
        });
    }

    // Gráfico 5: Distribuição por Membro
    var canvasTaskEquipe = document.getElementById('chartTarefaEquipe');
    if (canvasTaskEquipe) {
        var membros = Object.keys(taskDistrib).sort();
        var qtds = membros.map(m => taskDistrib[m]);
        if (chartTarefaEquipeInst) chartTarefaEquipeInst.destroy();
        chartTarefaEquipeInst = new Chart(canvasTaskEquipe, {
            type: 'bar',
            data: {
                labels: membros,
                datasets: [{ label: 'Tarefas Ativas', data: qtds, backgroundColor: '#8b5cf6', borderRadius: 8, barThickness: 25 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { anchor: 'end', align: 'top', color: textColor, font: { weight: 'bold' } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        });
    }
};
