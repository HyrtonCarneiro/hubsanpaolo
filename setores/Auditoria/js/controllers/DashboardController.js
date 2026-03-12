let chartMediaRegionalInst = null;
let chartRankingLojasInst = null;
let chartStatusPlanejamentoInst = null;
let chartTarefaStatusInst = null;
let chartTarefaEquipeInst = null;

function getLojaRegional(nomeLoja) {
    const l = lojasIniciais.find(function (x) { return x.nome === nomeLoja; });
    return l ? l.estado : 'N/A';
}
window.getLojaRegional = getLojaRegional;

// Registrar plugin de labels globalmente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.renderDashboard = function () {
    var notasCache = window.notasCache || [];
    var planeCache = window.planejamentoCache || [];
    var mapCache = window.historicoMapeamento || [];

    var hoje = new Date();
    var mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    var hojeISO = hoje.toISOString().split('T')[0];

    // --- KPI: Auditoria Online (Media e Notas) ---
    if (notasCache.length === 0) {
        document.getElementById('kpiTotalAuditorias').textContent = '0';
        document.getElementById('kpiMediaRede').textContent = '-';
        document.getElementById('kpiMenorNota').textContent = '-';
        document.getElementById('kpiMenorNotaLoja').textContent = '';
        document.getElementById('kpiAuditoriaMes').textContent = '0';
    } else {
        document.getElementById('kpiTotalAuditorias').textContent = notasCache.length;
        var somaNotas = notasCache.reduce(function (acc, n) { return acc + n.nota; }, 0);
        var media = somaNotas / notasCache.length;
        var elMedia = document.getElementById('kpiMediaRede');
        if (elMedia) {
            elMedia.textContent = media.toFixed(1);
            elMedia.className = media >= 8.5 ? 'text-3xl font-bold mt-1.5 text-spPistache' : (media >= 7 ? 'text-3xl font-bold mt-1.5 text-spLaranja' : 'text-3xl font-bold mt-1.5 text-spRed');
        }
        var ultimaPorLoja = {};
        notasCache.forEach(function (n) { if (!ultimaPorLoja[n.loja] || n.data > ultimaPorLoja[n.loja].data) ultimaPorLoja[n.loja] = n; });
        var todasUltimas = Object.values(ultimaPorLoja);
        var menor = todasUltimas.reduce(function (min, n) { return n.nota < min.nota ? n : min; }, todasUltimas[0]);
        if (document.getElementById('kpiMenorNota')) document.getElementById('kpiMenorNota').textContent = menor.nota.toFixed(1);
        if (document.getElementById('kpiMenorNotaLoja')) document.getElementById('kpiMenorNotaLoja').textContent = menor.loja;
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

    // --- GRAFICOS ---
    var isDark = document.body.classList.contains('dark-mode');
    var textColor = isDark ? '#f8fafc' : '#0f172a';
    var gridColor = isDark ? '#334155' : '#e2e8f0';

    // Gráfico 1: Média Regional (Existente)
    var canvasRegional = document.getElementById('chartMediaRegional');
    if (canvasRegional && todasUltimas) {
        var mediaPorRegional = {};
        var countPorRegional = {};
        todasUltimas.forEach(n => {
            var reg = getLojaRegional(n.loja);
            if (!mediaPorRegional[reg]) { mediaPorRegional[reg] = 0; countPorRegional[reg] = 0; }
            mediaPorRegional[reg] += n.nota; countPorRegional[reg]++;
        });
        var regionais = Object.keys(mediaPorRegional).sort();
        var mediasRegionais = regionais.map(r => +(mediaPorRegional[r] / countPorRegional[r]).toFixed(1));
        var coresBarras = mediasRegionais.map(m => m >= 8.5 ? '#4F7039' : (m >= 7 ? '#DA5513' : '#DA0D17'));
        if (chartMediaRegionalInst) chartMediaRegionalInst.destroy();
        chartMediaRegionalInst = new Chart(canvasRegional, {
            type: 'bar',
            data: { labels: regionais, datasets: [{ label: 'Média', data: mediasRegionais, backgroundColor: coresBarras, borderRadius: 6, barThickness: 25 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, datalabels: { color: textColor, font: { weight: 'bold' }, anchor: 'end', align: 'end' }}, scales: { x: { min: 0, max: 10, ticks: { color: textColor } }, y: { ticks: { color: textColor } } } }
        });
    }

    // Gráfico 2: Status do Planejamento (Novo)
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

    // Gráfico 3: Ranking (Refinado top 15)
    var canvasRanking = document.getElementById('chartRankingLojas');
    if (canvasRanking && todasUltimas) {
        var ranking = notasCache.slice().sort((a,b) => a.nota - b.nota).slice(0, 15);
        if (chartRankingLojasInst) chartRankingLojasInst.destroy();
        chartRankingLojasInst = new Chart(canvasRanking, {
            type: 'bar',
            data: {
                labels: ranking.map(n => n.loja),
                datasets: [{ data: ranking.map(n => n.nota), backgroundColor: ranking.map(n => n.nota >= 8.5 ? '#4F7039' : (n.nota >= 7 ? '#DA5513' : '#DA0D17')), borderRadius: 4, barThickness: 15 }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { x: { min: 0, max: 10, ticks: { display: false }, grid: { display: false } }, y: { ticks: { color: textColor, font: { size: 10 } } } } }
        });
    }

    // --- INDICADORES DE TAREFAS (Igual ao TI) ---
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
                datasets: [{ label: 'Tarefas Ativas', data: qtds, backgroundColor: '#8b5cf6', borderRadius: 6, barThickness: 25 }]
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
}
