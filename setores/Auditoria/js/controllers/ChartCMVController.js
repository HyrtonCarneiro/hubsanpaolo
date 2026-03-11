// js/controllers/ChartCMVController.js — Gráfico de dispersão CMV (Meta PWR)
// Depends on: Chart.js CDN

let scatterChartInst = null;

// Registrar plugin de labels globalmente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.renderizarGrafico = function () {
    var canvas = document.getElementById('cmvScatterChart');
    if (!canvas) return;

    var isDark = document.body.classList.contains('dark-mode');
    var textColor = isDark ? '#f8fafc' : '#0f172a';
    var gridColor = isDark ? '#334155' : '#e2e8f0';

    if (scatterChartInst) scatterChartInst.destroy();

    // Dados Fictícios de Lojas para MVP
    var lojasData = [
        { nome: 'Loja Beira Mar', x: 250000, y: 28 },
        { nome: 'Loja Iguatemi', x: 320000, y: 24 },
        { nome: 'Loja Centro', x: 180000, y: 35 },
        { nome: 'Loja Sul', x: 210000, y: 31 },
        { nome: 'Loja Aeroporto', x: 450000, y: 22 },
        { nome: 'Loja Praia', x: 300000, y: 26 },
        { nome: 'Loja Norte', x: 150000, y: 32 },
        { nome: 'Loja RioMar', x: 380000, y: 23 },
        { nome: 'Loja Meireles', x: 280000, y: 29 },
        { nome: 'Loja Aldeota', x: 290000, y: 25 }
    ];

    scatterChartInst = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Lojas San Paolo',
                data: lojasData,
                backgroundColor: function (context) {
                    var val = context.raw;
                    if (!val) return '#265D7C';
                    if (val.y > 30) return '#DA0D17';
                    if (val.y >= 26 && val.y <= 30) return '#DA5513';
                    return '#4F7039';
                },
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            var p = ctx.raw;
                            return p.nome + ' - Faturamento: R$' + p.x.toLocaleString() + ' | CMV: ' + p.y + '%';
                        }
                    }
                },
                legend: {
                    labels: { color: textColor }
                },
                datalabels: {
                    color: textColor,
                    align: 'top',
                    anchor: 'end',
                    offset: 4,
                    font: { size: 10, weight: 'bold' },
                    formatter: function(value) { return value.nome; }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Faturamento Bruto (R$)',
                        color: textColor,
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, callback: function (v) { return 'R$' + v.toLocaleString(); } }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CMV de Mercadoria (%)',
                        color: textColor,
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, callback: function (v) { return v + '%'; } },
                    min: 15,
                    max: 40
                }
            }
        }
    });
}
