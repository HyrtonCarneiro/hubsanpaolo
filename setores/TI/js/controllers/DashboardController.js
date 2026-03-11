// js/controllers/DashboardController.js — Gráficos do analytics
// Depends on: Chart.js CDN, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

let chartInstStatus = null;
let chartInstRegiao = null;
window.chartInstTarefaStatus = null;
window.chartInstTarefaEquipe = null;

window.atualizarGraficos = function () {
    var pendentes = 0;
    var resolvidos = 0;
    var lojasPendentes = 0;
    var lojasResolvidas = 0;
    var regiaoCount = {};

    lojasIniciais.forEach(function (loja) {
        if (!regiaoCount[loja.estado]) regiaoCount[loja.estado] = 0;
        var lgs = window.sysLogs[loja.id] || [];

        var temPendenteNaLoja = false;
        if (lgs.length > 0) {
            regiaoCount[loja.estado] += lgs.length;
            lgs.forEach(function (l) {
                if (!l.resolvido) {
                    pendentes++;
                    temPendenteNaLoja = true;
                } else {
                    resolvidos++;
                }
            });

            if (temPendenteNaLoja) lojasPendentes++;
            else lojasResolvidas++;
        }
    });

    var elTotal = document.getElementById('statTotalLojas');
    var elPendentes = document.getElementById('statPendentes');
    if (elTotal) elTotal.innerText = lojasIniciais.length;
    if (elPendentes) elPendentes.innerText = pendentes;
    
    // Calcular KPIs de Tarefas/Projetos
    var tarefasPendentesAndamento = 0;
    var tarefasConcluidas = 0;
    if (window.sysProjetos) {
        Object.values(window.sysProjetos).forEach(function(projetosDoMembro) {
            projetosDoMembro.forEach(function(p) {
                var st = p.status || 'Pendente';
                if (st === 'Concluído') tarefasConcluidas++;
                else tarefasPendentesAndamento++; // Considera Em Andamento e Pendente
            });
        });
    }

    var elTarefasPendentes = document.getElementById('statTarefasPendentes');
    var elTarefasConcluidas = document.getElementById('statTarefasConcluidas');
    if (elTarefasPendentes) elTarefasPendentes.innerText = tarefasPendentesAndamento;
    if (elTarefasConcluidas) elTarefasConcluidas.innerText = tarefasConcluidas;

    var textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
    var elChartStatus = document.getElementById('chartStatus');
    var elChartRegionais = document.getElementById('chartRegionais');
    var elChartTarefaStatus = document.getElementById('chartTarefaStatus');
    var elChartTarefaEquipe = document.getElementById('chartTarefaEquipe');

    if (elChartStatus) {
        if (chartInstStatus) chartInstStatus.destroy();
        chartInstStatus = new Chart(elChartStatus, {
            type: 'doughnut',
            data: {
                labels: ['Lojas com Pendências', 'Lojas 100% Resolvidas'],
                datasets: [{ data: [lojasPendentes, lojasResolvidas], backgroundColor: ['#ef4444', '#10b981'] }]
            },
            options: { plugins: { title: { display: true, text: 'Status Atual das Lojas', color: textColor }, legend: { labels: { color: textColor } } } }
        });
    }

    if (elChartRegionais) {
        if (chartInstRegiao) chartInstRegiao.destroy();
        var orderedStates = Object.keys(regiaoCount).sort(function (a, b) { return a.localeCompare(b); });
        var orderedValues = orderedStates.map(function (k) { return regiaoCount[k]; });
        chartInstRegiao = new Chart(elChartRegionais, {
            type: 'bar',
            data: {
                labels: orderedStates,
                datasets: [{ label: 'Total de Ocorrências', data: orderedValues, backgroundColor: '#3b82f6' }]
            },
            options: {
                plugins: { title: { display: true, text: 'Volume de Chamados por Estado', color: textColor }, legend: { labels: { color: textColor } } },
                scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true } }
            }
        });
    }

    // Novos Gráficos de Tarefas
    if (elChartTarefaStatus && window.sysProjetos) {
        if (window.chartInstTarefaStatus) window.chartInstTarefaStatus.destroy();
        var stCount = { 'Pendente': 0, 'Em Andamento': 0, 'Concluído': 0 };
        Object.values(window.sysProjetos).forEach(function(list) {
            list.forEach(function(p) { if(stCount[p.status] !== undefined) stCount[p.status]++; else stCount['Pendente']++; });
        });
        window.chartInstTarefaStatus = new Chart(elChartTarefaStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Em Andamento', 'Concluído'],
                datasets: [{ data: [stCount['Pendente'], stCount['Em Andamento'], stCount['Concluído']], backgroundColor: ['#ef4444', '#3b82f6', '#10b981'] }]
            },
            options: { plugins: { title: { display: true, text: 'Status Geral das Tarefas', color: textColor }, legend: { labels: { color: textColor } } } }
        });
    }

    if (elChartTarefaEquipe && window.sysProjetos) {
        if (window.chartInstTarefaEquipe) window.chartInstTarefaEquipe.destroy();
        var labels = Object.keys(window.sysProjetos).sort();
        var dataValues = labels.map(function(l) { return window.sysProjetos[l].length; });
        window.chartInstTarefaEquipe = new Chart(elChartTarefaEquipe, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Tarefas por Membro', data: dataValues, backgroundColor: '#8b5cf6' }]
            },
            options: {
                plugins: { title: { display: true, text: 'Distribuição por Membro da Equipe', color: textColor }, legend: { display: false } },
                scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true } }
            }
        });
    }
}
