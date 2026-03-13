/**
 * DashboardController
 * Handles analytics and charts for the Expansao Dashboard.
 */

let chartObrasStatusInst = null;
let chartObrasTagsInst = null;

// Registrar plugin de labels globalmente com segurança
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.DashboardController = {
    atualizarDashboard(obras) {
        try {
            const totalEl = document.getElementById('statTotalObras');
            const atrasadasEl = document.getElementById('statObrasAtrasadas');

            let atrasadasCount = 0;
            let hoje = new Date();

            let statusCounts = {
                'backlog': 0, 'planejamento': 0, 'fase1': 0, 'fase2': 0, 'fase3': 0, 'concluido': 0
            };
            let tagCounts = {
                'Urgente': 0, 'Nova Loja': 0, 'Obras': 0, 'Manutenção': 0, 'Retrofit': 0 // Adjusted tags to match kanban
            };

            obras.forEach(o => {
                if (o.status && statusCounts[o.status] !== undefined) statusCounts[o.status]++;
                if (o.tag && tagCounts[o.tag] !== undefined) tagCounts[o.tag]++;

                if (o.dataFim && o.status !== 'concluido') {
                    if (new Date(o.dataFim) < hoje) atrasadasCount++;
                }
            });

            if (totalEl) totalEl.innerText = obras.length;
            if (atrasadasEl) atrasadasEl.innerText = atrasadasCount;

            const ctxStatus = document.getElementById('chartObrasStatus');
            if (ctxStatus && typeof Chart !== 'undefined') {
                if (chartObrasStatusInst) chartObrasStatusInst.destroy();
                chartObrasStatusInst = new Chart(ctxStatus, {
                    type: 'doughnut',
                    data: {
                        labels: ['Backlog', 'Pré-Obra', 'Fase 1', 'Fase 2', 'Fase 3', 'Concluído'],
                        datasets: [{
                            data: Object.values(statusCounts),
                            backgroundColor: ['#64748b', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981']
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { position: 'right' },
                            datalabels: {
                                color: '#ffffff',
                                font: { weight: 'bold' },
                                formatter: function(value) { return value > 0 ? value : ''; }
                            }
                        } 
                    }
                });
            }

            const ctxTags = document.getElementById('chartObrasTags');
            if (ctxTags && typeof Chart !== 'undefined') {
                if (chartObrasTagsInst) chartObrasTagsInst.destroy();
                
                // Remove keys slightly to match what we actually use
                const tagLabels = Object.keys(tagCounts);
                
                chartObrasTagsInst = new Chart(ctxTags, {
                    type: 'bar',
                    data: {
                        labels: tagLabels,
                        datasets: [{
                            label: 'Obras por Tag',
                            data: Object.values(tagCounts),
                            backgroundColor: ['#ef4444', '#0ea5e9', '#84cc16', '#f97316', '#a855f7']
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: {
                            datalabels: {
                                color: '#ffffff',
                                anchor: 'end',
                                align: 'top',
                                font: { weight: 'bold' },
                                formatter: function(value) { return value > 0 ? value : ''; }
                            }
                        },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } 
                    }
                });
            }
        } catch (e) {
            console.error("Erro no Dashboard:", e);
        }
    }
};
