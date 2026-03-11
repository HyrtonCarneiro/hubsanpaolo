// js/controllers/DashboardController.js — KPIs e gráficos do dashboard
// Depends on: firebase-init.js, data.js, AuditoriaOnlineController.js (notasCache)

let chartMediaRegionalInst = null;
let chartRankingLojasInst = null;

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

    if (notasCache.length === 0) {
        var el;
        el = document.getElementById('kpiTotalAuditorias'); if (el) el.textContent = '0';
        el = document.getElementById('kpiMediaRede'); if (el) el.textContent = '-';
        el = document.getElementById('kpiMenorNota'); if (el) el.textContent = '-';
        el = document.getElementById('kpiMenorNotaLoja'); if (el) el.textContent = '';
        el = document.getElementById('kpiAuditoriaMes'); if (el) el.textContent = '0';
        return;
    }

    // KPI: Total de Auditorias
    document.getElementById('kpiTotalAuditorias').textContent = notasCache.length;

    // KPI: Média da Rede
    var somaNotas = notasCache.reduce(function (acc, n) { return acc + n.nota; }, 0);
    var media = somaNotas / notasCache.length;
    var elMedia = document.getElementById('kpiMediaRede');
    if (elMedia) {
        elMedia.textContent = media.toFixed(1);
        elMedia.className = media >= 8.5 ? 'text-3xl font-bold mt-1.5 text-spPistache' : (media >= 7 ? 'text-3xl font-bold mt-1.5 text-spLaranja' : 'text-3xl font-bold mt-1.5 text-spRed');
    }

    // KPI: Menor Nota (da última auditoria de cada loja)
    var ultimaPorLoja = {};
    notasCache.forEach(function (n) {
        if (!ultimaPorLoja[n.loja] || n.data > ultimaPorLoja[n.loja].data) {
            ultimaPorLoja[n.loja] = n;
        }
    });
    var todasUltimas = Object.values(ultimaPorLoja);
    var menor = todasUltimas.reduce(function (min, n) { return n.nota < min.nota ? n : min; }, todasUltimas[0]);
    var elMenorNota = document.getElementById('kpiMenorNota');
    if (elMenorNota) elMenorNota.textContent = menor.nota.toFixed(1);
    var elMenorNotaLoja = document.getElementById('kpiMenorNotaLoja');
    if (elMenorNotaLoja) elMenorNotaLoja.textContent = menor.loja;

    // KPI: Auditorias neste mês
    var hoje = new Date();
    var mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    var doMes = notasCache.filter(function (n) { return n.data && n.data.startsWith(mesAtual); });
    var elMes = document.getElementById('kpiAuditoriaMes');
    if (elMes) elMes.textContent = doMes.length;

    // Tema
    var isDark = document.body.classList.contains('dark-mode');
    var textColor = isDark ? '#f8fafc' : '#0f172a';
    var gridColor = isDark ? '#334155' : '#e2e8f0';

    // ---- GRÁFICO 1: Média por Regional ----
    var mediaPorRegional = {};
    var countPorRegional = {};
    todasUltimas.forEach(function (n) {
        var reg = getLojaRegional(n.loja);
        if (!mediaPorRegional[reg]) { mediaPorRegional[reg] = 0; countPorRegional[reg] = 0; }
        mediaPorRegional[reg] += n.nota;
        countPorRegional[reg]++;
    });
    var regionais = Object.keys(mediaPorRegional).sort();
    var mediasRegionais = regionais.map(function (r) { return +(mediaPorRegional[r] / countPorRegional[r]).toFixed(1); });
    var coresBarras = mediasRegionais.map(function (m) { return m >= 8.5 ? '#4F7039' : (m >= 7 ? '#DA5513' : '#DA0D17'); });

    var canvasRegional = document.getElementById('chartMediaRegional');
    if (canvasRegional) {
        if (chartMediaRegionalInst) chartMediaRegionalInst.destroy();
        chartMediaRegionalInst = new Chart(canvasRegional, {
            type: 'bar',
            data: {
                labels: regionais,
                datasets: [{ label: 'Média', data: mediasRegionais, backgroundColor: coresBarras, borderRadius: 6, barThickness: 30 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { 
                    legend: { display: false },
                    datalabels: {
                        color: textColor,
                        font: { weight: 'bold' },
                        anchor: 'end',
                        align: 'end',
                        formatter: function(value) { return value.toFixed(1); }
                    }
                },
                scales: {
                    x: { min: 0, max: 10, grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600' } } }
                }
            }
        });
    }

    // ---- GRÁFICO 2: Ranking das últimas notas por loja (top 15) ----
    var ranking = todasUltimas.slice().sort(function (a, b) { return a.nota - b.nota; }).slice(0, 15);
    var labelsRanking = ranking.map(function (n) { return n.loja; });
    var valoresRanking = ranking.map(function (n) { return n.nota; });
    var coresRanking = valoresRanking.map(function (v) { return v >= 8.5 ? '#4F7039' : (v >= 7 ? '#DA5513' : '#DA0D17'); });

    var canvasRanking = document.getElementById('chartRankingLojas');
    if (canvasRanking) {
        if (chartRankingLojasInst) chartRankingLojasInst.destroy();
        chartRankingLojasInst = new Chart(canvasRanking, {
            type: 'bar',
            data: {
                labels: labelsRanking,
                datasets: [{ label: 'Nota', data: valoresRanking, backgroundColor: coresRanking, borderRadius: 6, barThickness: 18 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { 
                    legend: { display: false },
                    datalabels: {
                        color: textColor,
                        font: { weight: 'bold', size: 10 },
                        anchor: 'end',
                        align: 'end',
                        formatter: function(value) { return value.toFixed(1); }
                    }
                },
                scales: {
                    x: { min: 0, max: 10, grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
                }
            }
        });
    }
}
