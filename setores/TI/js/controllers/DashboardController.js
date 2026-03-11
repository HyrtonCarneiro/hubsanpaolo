// js/controllers/DashboardController.js — Gráficos do analytics
// Depends on: Chart.js CDN, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

let chartInstStatus = null;
let chartInstRegiao = null;
window.chartInstTarefaStatus = null;
window.chartInstTarefaEquipe = null;

// Registrar plugin de labels globalmente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.atualizarGraficos = function () {
    const l_metrics = DashboardLogic.processarMetricasLojas(window.lojasIniciais, window.sysLogs);
    const t_metrics = DashboardLogic.processarMetricasTarefasAtivas(window.sysProjetos);

    // Atualizar Contadores do Topo
    var elTotal = document.getElementById('statTotalLojas');
    var elPendentes = document.getElementById('statPendentes');
    if (elTotal) elTotal.innerText = window.lojasIniciais ? window.lojasIniciais.length : 0;
    if (elPendentes) elPendentes.innerText = l_metrics.totalPendentes;

    // Novos KPIs de Tarefas
    var elTasksAnd = document.getElementById('statTarefasPendentes'); 
    if (elTasksAnd) elTasksAnd.innerText = t_metrics.andamento;

    var elTasksPend = document.getElementById('statTarefasConcluidas');
    if (elTasksPend) elTasksPend.innerText = t_metrics.pendentes;

    var textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
    var elChartStatus = document.getElementById('chartStatus');
    var elChartRegionais = document.getElementById('chartRegionais');
    var elChartTarefaStatus = document.getElementById('chartTarefaStatus');
    var elChartTarefaEquipe = document.getElementById('chartTarefaEquipe');

    // Configuração padrão de labels
    const baseLabels = {
        color: textColor,
        font: { weight: 'bold', size: 11 },
        formatter: function(value) { return value > 0 ? value : ''; }
    };

    if (elChartStatus) {
        if (chartInstStatus) chartInstStatus.destroy();
        var labelsLoja = Object.keys(l_metrics.lojaCallCount);
        var valuesLoja = labelsLoja.map(function(n) { return l_metrics.lojaCallCount[n]; });
        
        chartInstStatus = new Chart(elChartStatus, {
            type: 'doughnut',
            data: {
                labels: labelsLoja,
                datasets: [{ 
                    data: valuesLoja, 
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'] 
                }]
            },
            options: { 
                plugins: { 
                    title: { display: true, text: 'Pendências por Unidade', color: textColor }, 
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } },
                    datalabels: baseLabels
                } 
            }
        });
    }

    if (elChartRegionais) {
        if (chartInstRegiao) chartInstRegiao.destroy();
        var orderedStates = Object.keys(l_metrics.regiaoCount).sort(function (a, b) { return a.localeCompare(b); });
        var orderedValues = orderedStates.map(function (k) { return l_metrics.regiaoCount[k]; });
        chartInstRegiao = new Chart(elChartRegionais, {
            type: 'bar',
            data: {
                labels: orderedStates,
                datasets: [{ label: 'Total de Ocorrências (Incl. Resolvidos)', data: orderedValues, backgroundColor: '#3b82f6' }]
            },
            options: {
                plugins: { 
                    title: { display: true, text: 'Volume de Chamados por Estado', color: textColor }, 
                    legend: { labels: { color: textColor } },
                    datalabels: { ...baseLabels, anchor: 'end', align: 'top' }
                },
                scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true } }
            }
        });
    }

    // Gráficos de Tarefas (Excluindo Concluídas)
    if (elChartTarefaStatus && window.sysProjetos) {
        if (window.chartInstTarefaStatus) window.chartInstTarefaStatus.destroy();
        window.chartInstTarefaStatus = new Chart(elChartTarefaStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Em Andamento'],
                datasets: [{ data: [t_metrics.pendentes, t_metrics.andamento], backgroundColor: ['#ef4444', '#3b82f6'] }]
            },
            options: { 
                plugins: { 
                    title: { display: true, text: 'Status das Tarefas Ativas', color: textColor }, 
                    legend: { labels: { color: textColor } },
                    datalabels: baseLabels
                } 
            }
        });
    }

    if (elChartTarefaEquipe && window.sysProjetos) {
        if (window.chartInstTarefaEquipe) window.chartInstTarefaEquipe.destroy();
        var labels = Object.keys(t_metrics.porMembro).sort();
        var dataValues = labels.map(function(l) { return t_metrics.porMembro[l]; });
        window.chartInstTarefaEquipe = new Chart(elChartTarefaEquipe, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Tarefas Ativas por Membro', data: dataValues, backgroundColor: '#8b5cf6' }]
            },
            options: {
                plugins: { 
                    title: { display: true, text: 'Distribuição de Tarefas Ativas', color: textColor }, 
                    legend: { display: false },
                    datalabels: { ...baseLabels, anchor: 'end', align: 'top' }
                },
                scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true } }
            }
        });
    }
}
