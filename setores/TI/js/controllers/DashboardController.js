// js/controllers/DashboardController.js — Gráficos do analytics
// Depends on: Chart.js CDN, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

let chartInstStatus = null;
let chartInstRegiao = null;

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

    var textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
    var elChartStatus = document.getElementById('chartStatus');
    var elChartRegionais = document.getElementById('chartRegionais');

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
                plugins: {
                    title: { display: true, text: 'Volume de Chamados por Estado', color: textColor },
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    x: { ticks: { color: textColor } },
                    y: {
                        ticks: { color: textColor, stepSize: 1, precision: 0 },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
