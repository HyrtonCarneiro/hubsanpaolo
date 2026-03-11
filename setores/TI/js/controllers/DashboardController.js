// js/controllers/DashboardController.js — Gráficos do analytics
// Depends on: Chart.js CDN, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

let chartInstStatus = null;
let chartInstRegiao = null;
window.chartInstTarefaStatus = null;
window.chartInstTarefaEquipe = null;

window.atualizarGraficos = function () {
    var pendentes = 0;
    var regiaoCount = {};
    var lojaCallCount = {}; // Agrupamento por loja para o novo gráfico

    // Processar Chamados (Lojas)
    lojasIniciais.forEach(function (loja) {
        var lgs = window.sysLogs[loja.id] || [];
        lgs.forEach(function (l) {
            if (!l.resolvido) {
                pendentes++;
                // Contagem por estado
                if (loja.estado) {
                    regiaoCount[loja.estado] = (regiaoCount[loja.estado] || 0) + 1;
                }
                // Grupar por nome da loja (para o gráfico de pizza)
                if (loja.nome) {
                    lojaCallCount[loja.nome] = (lojaCallCount[loja.nome] || 0) + 1;
                }
            }
        });
    });

    // Calcular KPIs de Tarefas/Projetos (Excluir Concluídas)
    var tasksAndamento = 0;
    var tasksPendentes = 0;
    if (window.sysProjetos) {
        Object.values(window.sysProjetos).forEach(function(projetosDoMembro) {
            projetosDoMembro.forEach(function(p) {
                var st = p.status || 'Pendente';
                if (st === 'Em Andamento') tasksAndamento++;
                else if (st === 'Pendente') tasksPendentes++;
            });
        });
    }

    // Atualizar Contadores do Topo
    var elTotal = document.getElementById('statTotalLojas');
    var elPendentes = document.getElementById('statPendentes');
    if (elTotal) elTotal.innerText = lojasIniciais.length;
    if (elPendentes) elPendentes.innerText = pendentes;

    // Novos KPIs de Tarefas
    var elTasksAnd = document.getElementById('statTarefasPendentes'); 
    if (elTasksAnd) elTasksAnd.innerText = tasksAndamento;

    var elTasksPend = document.getElementById('statTarefasConcluidas');
    if (elTasksPend) elTasksPend.innerText = tasksPendentes;

    var textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
    var elChartStatus = document.getElementById('chartStatus');
    var elChartRegionais = document.getElementById('chartRegionais');
    var elChartTarefaStatus = document.getElementById('chartTarefaStatus');
    var elChartTarefaEquipe = document.getElementById('chartTarefaEquipe');

    if (elChartStatus) {
        if (chartInstStatus) chartInstStatus.destroy();
        var labelsLoja = Object.keys(lojaCallCount);
        var valuesLoja = labelsLoja.map(function(n) { return lojaCallCount[n]; });
        
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
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } } 
                } 
            }
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

    // Gráficos de Tarefas (Excluindo Concluídas)
    if (elChartTarefaStatus && window.sysProjetos) {
        if (window.chartInstTarefaStatus) window.chartInstTarefaStatus.destroy();
        window.chartInstTarefaStatus = new Chart(elChartTarefaStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Em Andamento'],
                datasets: [{ data: [tasksPendentes, tasksAndamento], backgroundColor: ['#ef4444', '#3b82f6'] }]
            },
            options: { plugins: { title: { display: true, text: 'Status das Tarefas Ativas', color: textColor }, legend: { labels: { color: textColor } } } }
        });
    }

    if (elChartTarefaEquipe && window.sysProjetos) {
        if (window.chartInstTarefaEquipe) window.chartInstTarefaEquipe.destroy();
        var labels = Object.keys(window.sysProjetos).sort();
        var dataValues = labels.map(function(l) { 
            return window.sysProjetos[l].filter(function(p) { return (p.status || 'Pendente') !== 'Concluído'; }).length; 
        });
        window.chartInstTarefaEquipe = new Chart(elChartTarefaEquipe, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Tarefas Ativas por Membro', data: dataValues, backgroundColor: '#8b5cf6' }]
            },
            options: {
                plugins: { title: { display: true, text: 'Distribuição de Tarefas Ativas', color: textColor }, legend: { display: false } },
                scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true } }
            }
        });
    }
}
