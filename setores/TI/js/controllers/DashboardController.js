// js/controllers/DashboardController.js — Gráficos do analytics
// Depends on: Chart.js CDN, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

let chartInstStatus = null;
let chartInstRegiao = null;
window.chartInstTarefaStatus = null;
window.chartInstTarefaEquipe = null;

// Novo Estado Global de Filtros (Estilo PowerBI)
window.tiDashboardFilters = {
    unidade: null,
    regiao: null,
    tarefaStatus: null,
    membro: null,
    dataChamado: null
};

// Registrar plugin de labels globalmente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.setTiDashboardFilter = function(key, value) {
    if (window.tiDashboardFilters[key] === value) {
        window.tiDashboardFilters[key] = null;
    } else {
        window.tiDashboardFilters[key] = value;
    }
    window.atualizarGraficos();
    if (typeof window.atualizarGraficoChamados === 'function') window.atualizarGraficoChamados();
    window.renderizarFiltrosAtivos();
};

window.resetTiDashboardFilters = function() {
    window.tiDashboardFilters = { unidade: null, regiao: null, tarefaStatus: null, membro: null, dataChamado: null };
    window.atualizarGraficos();
    if (typeof window.atualizarGraficoChamados === 'function') window.atualizarGraficoChamados();
    window.renderizarFiltrosAtivos();
};

window.renderizarFiltrosAtivos = function() {
    const container = document.getElementById('dashboardActiveFilters');
    if (!container) return;

    const activeKeys = Object.keys(window.tiDashboardFilters).filter(k => window.tiDashboardFilters[k]);
    
    if (activeKeys.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    let html = `<div class="flex flex-wrap gap-2 items-center mb-4 animate-fadeIn">
        <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mr-2">Filtros Ativos:</span>`;
    
    activeKeys.forEach(k => {
        html += `
            <div class="flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full border border-[var(--primary)]/20 text-xs font-bold">
                <span class="opacity-60 uppercase text-[9px]">${k}:</span> ${window.tiDashboardFilters[k]}
                <button onclick="window.setTiDashboardFilter('${k}', '${window.tiDashboardFilters[k]}')" class="hover:text-red-500 transition-colors">
                    <i class="ph ph-x-circle"></i>
                </button>
            </div>`;
    });

    html += `<button onclick="window.resetTiDashboardFilters()" class="text-xs font-bold text-red-500 hover:underline ml-2">Limpar Tudo</button></div>`;
    container.innerHTML = html;
};

window.atualizarGraficos = function () {
    const l_metrics = DashboardLogic.processarMetricasLojas(window.lojasIniciais, window.sysLogs, window.tiDashboardFilters);
    const t_metrics = DashboardLogic.processarMetricasTarefasAtivas(window.sysProjetos, window.tiDashboardFilters);

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

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, elements, chart) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = chart.data.labels[index];
                
                // Determinar qual filtro aplicar baseado no ID do canvas
                const id = chart.canvas.id;
                if (id === 'chartStatus') window.setTiDashboardFilter('unidade', label);
                if (id === 'chartRegionais') window.setTiDashboardFilter('regiao', label);
                if (id === 'chartTarefaStatus') window.setTiDashboardFilter('tarefaStatus', label);
                if (id === 'chartTarefaEquipe') window.setTiDashboardFilter('membro', label);
            }
        }
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
                ...commonOptions,
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
                ...commonOptions,
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
                ...commonOptions,
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
                ...commonOptions,
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
