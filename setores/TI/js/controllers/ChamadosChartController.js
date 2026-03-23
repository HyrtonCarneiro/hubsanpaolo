/**
 * js/controllers/ChamadosChartController.js
 * Controlador para o gráfico de tendências de chamados (Abertos vs Resolvidos).
 */

let chamadosChartInst = null;

window.initChamadosChart = function() {
    const container = document.getElementById('chartChamadosContainer');
    if (!container) return;

    // Inicializar filtros com datas padrão (últimos 30 dias)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const elStart = document.getElementById('chartChamadosStart');
    const elEnd = document.getElementById('chartChamadosEnd');
    
    if (elStart) elStart.value = start.toISOString().split('T')[0];
    if (elEnd) elEnd.value = end.toISOString().split('T')[0];

    window.atualizarGraficoChamados();
};

window.atualizarGraficoChamados = function() {
    const ctx = document.getElementById('chartChamadosCanvas');
    if (!ctx) return;

    const period = document.getElementById('chartChamadosPeriod').value;
    const start = document.getElementById('chartChamadosStart').value;
    const end = document.getElementById('chartChamadosEnd').value;

    const events = ChamadosChartLogic.getEvents(window.sysLogs, window.tiDashboardFilters);
    const data = ChamadosChartLogic.groupEvents(events, period, start, end);

    if (chamadosChartInst) chamadosChartInst.destroy();

    const textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';

    chamadosChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Chamados Abertos',
                    data: data.abertos,
                    borderColor: '#ef4444', // Vermelho
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Chamados Resolvidos',
                    data: data.resolvidos,
                    borderColor: '#10b981', // Verde
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { weight: 'bold' } }
                },
                tooltip: {
                    padding: 12,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: textColor, stepSize: 1, precision: 0 }
                }
            }
        }
    });
};
