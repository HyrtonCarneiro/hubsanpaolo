// js/app.js da Auditoria
// db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy, where -> from firebase-init.js
// lojasIniciais -> from data.js

let currentUser = sessionStorage.getItem('loggedUser') || null;
let scatterChartInst = null;

// Caches de Auditoria
let notasCache = [];
let planejamentoCache = [];
let planejamentoAbertoId = null;
let planejamentoSortCol = 'proxima';
let planejamentoSortAsc = true;
let chartMediaRegionalInst = null;
let chartRankingLojasInst = null;

// Caches de Tarefas/Equipe Auditoria
let audiProjetos = {};
let audiEquipe = [];
let audiCurrentMember = null;

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (scatterChartInst) renderizarGrafico(); // Atualiza cores
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
}

window.logout = function () {
    window.location.href = '../../index.html';
}

function showToast(msg, type = 'success') {
    try {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: msg, duration: 3000, gravity: "top", position: "right",
                style: { background: type === 'success' ? "var(--sp-pistache)" : (type === 'warning' ? "var(--sp-laranja)" : "var(--sp-red)"), borderRadius: "8px", fontFamily: "Inter" }
            }).showToast();
        } else { alert(msg); }
    } catch (e) { console.error(e); }
}
window.showToast = showToast;

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('loggedUserName').innerText = currentUser;

    // Popular Lojas no Select de Auditoria Online — Agrupado por Regional em ordem alfabética
    const selectLoja = document.getElementById('audiSelectLoja');
    if (selectLoja) {
        selectLoja.innerHTML = '<option value="">Selecione a Loja...</option>';
        // Agrupar por estado (regional)
        const porEstado = {};
        lojasIniciais.forEach(loja => {
            if (!porEstado[loja.estado]) porEstado[loja.estado] = [];
            porEstado[loja.estado].push(loja.nome);
        });
        // Ordenar as regionais e os nomes dentro de cada uma
        const estadosOrdenados = Object.keys(porEstado).sort();
        estadosOrdenados.forEach(estado => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Regional ${estado}`;
            porEstado[estado].sort().forEach(nome => {
                const opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                optgroup.appendChild(opt);
            });
            selectLoja.appendChild(optgroup);
        });
    }

    // Injetar botão do Hub dinamicamente
    document.querySelectorAll('.flex.items-center.gap-3').forEach(container => {
        if (!container.closest('.mb-8')) return; // Apenas no header
        if (container.querySelector('.btn-hub')) return;
        const btn = document.createElement('button');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors btn-hub shadow-sm';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four text-xl"></i>';
        btn.onclick = () => window.location.href = '../../index.html?hub=1';
        container.insertBefore(btn, container.querySelector('h1'));
    });

    // Iniciar Listeners do Firebase
    iniciarListenersAuditoria();

    // Iniciar com uma data preenchida hoje
    if (document.getElementById('audiDataInput')) {
        document.getElementById('audiDataInput').valueAsDate = new Date();
    }

    window.switchView('dashboard');
}

window.switchView = function (view) {
    const views = ['dashboard', 'auditoriaOnline', 'planejamento', 'tarefas', 'metapwr'];

    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        const nav = document.getElementById('nav-' + v);

        if (el) el.style.display = 'none';
        if (nav) nav.classList.remove('active-nav');
    });

    const currView = document.getElementById(`view-${view}`);
    const currNav = document.getElementById(`nav-${view}`);

    if (currView) currView.style.display = 'block';
    if (currNav) currNav.classList.add('active-nav');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }

    if (view === 'metapwr') {
        renderizarGrafico();
    }
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }
}

// Protótipo: Gráfico de Dispersão CMV
function renderizarGrafico() {
    const canvas = document.getElementById('cmvScatterChart');
    if (!canvas) return;

    // Tema claro vs escuro
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    if (scatterChartInst) scatterChartInst.destroy();

    // Dados Fictícios de Lojas para MVP
    // x = Faturamento (Receita), y = CMV (%)
    const lojasData = [
        { nome: 'Loja Beira Mar', x: 250000, y: 28 },
        { nome: 'Loja Iguatemi', x: 320000, y: 24 },
        { stroke: true, nome: 'Loja Centro', x: 180000, y: 35 }, // Acima da meta
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
                    const val = context.raw;
                    if (!val) return '#265D7C'; // Ao leite default
                    // Cores baseadas no percentual do CMV (Ideal abaixo de 30%)
                    if (val.y > 30) return '#DA0D17'; // Red Velvet 
                    if (val.y >= 26 && val.y <= 30) return '#DA5513'; // Laranja San Paolo
                    return '#4F7039'; // Pistache
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
                            const p = ctx.raw;
                            return `${p.nome} - Faturamento: R$${p.x.toLocaleString()} | CMV: ${p.y}%`;
                        }
                    }
                },
                legend: {
                    labels: { color: textColor }
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
                    ticks: { color: textColor, callback: (v) => 'R$' + v.toLocaleString() }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CMV de Mercadoria (%)',
                        color: textColor,
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, callback: (v) => v + '%' },
                    min: 15,
                    max: 40
                }
            }
        }
    });
}

// ============================================
// LÓGICA DE AUDITORIA (FIREBASE)
// ============================================

function iniciarListenersAuditoria() {
    try {
        // Listener de Notas Históricas
        const qNotas = query(collection(db, "auditoria_notas"), orderBy("data", "desc"));
        onSnapshot(qNotas, (snapshot) => {
            notasCache = [];
            snapshot.forEach((doc) => {
                notasCache.push({ id: doc.id, ...doc.data() });
            });
            renderizarHistoricoNotas();
            renderizarTabelaPlanejamento();
            renderDashboard(); // Atualizar Dashboard
        }, (err) => console.error("Erro Notas:", err));

        // Listener de Planejamento 
        onSnapshot(collection(db, "auditoria_planejamento"), (snapshot) => {
            planejamentoCache = [];
            snapshot.forEach((doc) => {
                // Guarda o ID autogerado da collection para podermos dar update depois
                planejamentoCache.push({ docId: doc.id, ...doc.data() });
            });
            renderizarTabelaPlanejamento();
        }, (err) => console.error("Erro Planejamento:", err));

        // Listener de Projetos/Tarefas de Auditoria
        const qAudiProj = query(collection(db, "auditoria_projetos"), orderBy("timestamp", "desc"));
        onSnapshot(qAudiProj, (snapshot) => {
            audiProjetos = {};
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                data.firebaseId = docSnap.id;
                if (!audiProjetos[data.membroResponsavel]) audiProjetos[data.membroResponsavel] = [];
                audiProjetos[data.membroResponsavel].push(data);
            });
            renderizarAudiProjetosList();
        }, (err) => console.error("Erro Projetos Audi:", err));

        // Listener de Equipe da Auditoria
        const qAudiEquipe = query(collection(db, "auditoria_equipe"), orderBy("nome"));
        onSnapshot(qAudiEquipe, (snapshot) => {
            audiEquipe = [];
            snapshot.forEach(docSnap => audiEquipe.push({ firebaseId: docSnap.id, ...docSnap.data() }));
            if (audiEquipe.length > 0 && (!audiCurrentMember || !audiEquipe.find(m => m.nome === audiCurrentMember))) {
                audiCurrentMember = audiEquipe[0].nome;
            }
            renderizarBotoesAudiEquipe();
            renderizarAudiProjetosList();
            renderizarListaAudiEquipeGerenciar();
        }, (err) => console.error("Erro Equipe Audi:", err));

    } catch (e) {
        console.error("Erro ao iniciar listeners auditoria", e);
    }
}

// 1. AUDITORIA ONLINE (LANÇAR NOTA)
window.salvarAuditoriaOnline = async function () {
    const loja = document.getElementById('audiSelectLoja').value;
    const data = document.getElementById('audiDataInput').value;
    const nota = parseFloat(document.getElementById('audiNotaInput').value);

    if (!loja || !data || isNaN(nota) || nota < 0 || nota > 10) {
        showToast("Preencha loja, data e uma nota válida (0 a 10).", "warning");
        return;
    }

    try {
        await addDoc(collection(db, "auditoria_notas"), {
            loja: loja,
            data: data,
            nota: nota,
            auditor: currentUser,
            timestamp: new Date().toISOString()
        });
        showToast("Auditoria registrada!", "success");
        document.getElementById('audiSelectLoja').value = "";
        document.getElementById('audiNotaInput').value = "";
    } catch (e) {
        console.error(e);
        showToast("Erro ao gravar nota.", "error");
    }
}

function renderizarHistoricoNotas() {
    const tbody = document.getElementById('audiHistoricoBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (notasCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-[var(--text-muted)]">Nenhuma avaliação registrada recente.</td></tr>';
        return;
    }

    // Exibir apenas as últimas 30 avaliações para não travar a tabela
    const relatorio = notasCache.slice(0, 30);

    relatorio.forEach(nota => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors';

        let colorClass = "text-spPistache";
        if (nota.nota < 7) colorClass = "text-spRed";
        else if (nota.nota < 8.5) colorClass = "text-spLaranja";

        // Data Formatter
        let displayData = nota.data;
        if (displayData) {
            const [y, m, d] = displayData.split('-');
            if (y && m && d) displayData = `${d}/${m}/${y}`;
        }

        tr.innerHTML = `
            <td class="p-4 text-sm text-[var(--text-main)]">${displayData}</td>
            <td class="p-4 text-sm font-semibold text-[var(--text-main)]">${nota.loja}</td>
            <td class="p-4 text-sm text-[var(--text-muted)]"><i class="ph ph-user"></i> ${nota.auditor}</td>
            <td class="p-4 text-lg font-bold text-right ${colorClass}">${nota.nota.toFixed(1)}</td>
        `;
        tbody.appendChild(tr);
    });
}


// 2. PLANEJAMENTO DE AUDITORIAS (TABELA COM SORT)
function getLojaRegional(nomeLoja) {
    const l = lojasIniciais.find(x => x.nome === nomeLoja);
    return l ? l.estado : 'N/A';
}

function getUltimaAuditoria(nomeLoja) {
    const historicoLoja = notasCache.filter(n => n.loja === nomeLoja);
    if (historicoLoja.length > 0) return historicoLoja[0].data; // Já vem em desc
    return null;
}

window.renderizarTabelaPlanejamento = function () {
    const tbody = document.getElementById('planejamentoTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtro = (document.getElementById('pesquisaPlanejamento')?.value || '').toLowerCase();

    // Preparar array enriquecido
    let rows = lojasIniciais.map(lojaBase => {
        const cfg = planejamentoCache.find(p => p.loja === lojaBase.nome) || {};
        const ultimaRaw = getUltimaAuditoria(lojaBase.nome);
        return {
            nome: lojaBase.nome,
            regional: getLojaRegional(lojaBase.nome),
            ultimaRaw: ultimaRaw || '',
            proximaRaw: cfg.dataProxima || '',
            auditor: cfg.auditor || '',
            docId: cfg.docId || null
        };
    });

    // Filtro de texto
    if (filtro) {
        rows = rows.filter(r => r.nome.toLowerCase().includes(filtro) || r.regional.toLowerCase().includes(filtro) || r.auditor.toLowerCase().includes(filtro));
    }

    // Sorting
    rows.sort((a, b) => {
        let va, vb;
        switch (planejamentoSortCol) {
            case 'loja': va = a.nome; vb = b.nome; break;
            case 'regional': va = a.regional; vb = b.regional; break;
            case 'ultima': va = a.ultimaRaw; vb = b.ultimaRaw; break;
            case 'proxima': va = a.proximaRaw; vb = b.proximaRaw; break;
            case 'auditor': va = a.auditor; vb = b.auditor; break;
            default: va = a.nome; vb = b.nome;
        }
        // Para colunas de data/auditor, valores vazios vão sempre para o final
        const isDateOrAuditorCol = ['proxima', 'ultima', 'auditor'].includes(planejamentoSortCol);
        if (isDateOrAuditorCol) {
            if (!va && !vb) return 0;
            if (!va) return 1;  // 'a' sem valor vai pro final
            if (!vb) return -1; // 'b' sem valor vai pro final
        }
        if (va < vb) return planejamentoSortAsc ? -1 : 1;
        if (va > vb) return planejamentoSortAsc ? 1 : -1;
        return 0;
    });

    rows.forEach(r => {
        const ultimaStr = r.ultimaRaw ? r.ultimaRaw.split('-').reverse().join('/') : 'Nunca';
        const proxStr = r.proximaRaw ? r.proximaRaw.split('-').reverse().join('/') : '<span class="text-[var(--text-muted)] font-normal text-xs">Não agendado</span>';
        const audStr = r.auditor || '<span class="text-[var(--text-muted)] font-normal text-xs text-center border border-[var(--border)] rounded-full px-2 py-0.5">A Definir</span>';

        const tr = document.createElement('tr');
        tr.className = 'border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group';
        tr.innerHTML = `
            <td class="p-4 text-sm font-semibold text-[var(--text-main)]">${r.nome}</td>
            <td class="p-4 text-sm font-medium text-brandBlue"><span class="bg-brandBlue/10 dark:bg-brandBlue/20 px-2 py-1 rounded-md">${r.regional}</span></td>
            <td class="p-4 text-sm font-medium text-[var(--text-main)]">${ultimaStr}</td>
            <td class="p-4 text-sm font-bold text-[var(--primary)]">${proxStr}</td>
            <td class="p-4 text-sm text-[var(--text-main)] flex items-center gap-1.5 h-full min-h-[53px]"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)]"></i> ${audStr}</td>
            <td class="p-4 text-center">
                <button class="flex mx-auto items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors text-xs font-semibold opacity-0 group-hover:opacity-100 focus:opacity-100" onclick="window.abrirModalEditPlanejamento('${r.nome}')">
                    <i class="ph ph-pencil-simple text-sm"></i> Editar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.sortPlanejamento = function (col) {
    if (planejamentoSortCol === col) {
        planejamentoSortAsc = !planejamentoSortAsc; // Toggle
    } else {
        planejamentoSortCol = col;
        planejamentoSortAsc = true;
    }
    renderizarTabelaPlanejamento();
}

window.filtrarPlanejamento = function () {
    renderizarTabelaPlanejamento();
}

window.abrirModalEditPlanejamento = function (nomeLoja) {
    // Busca configuração pré-existente se houver para trazer também o docId
    const cfg = planejamentoCache.find(p => p.loja === nomeLoja) || {};

    // Guardamos um objeto para update
    planejamentoAbertoId = {
        nomeLoja: nomeLoja,
        docId: cfg.docId || null
    };

    document.getElementById('modalPlanLojaNome').innerText = nomeLoja;
    document.getElementById('modalPlanId').value = nomeLoja;

    document.getElementById('modalPlanDataProx').value = cfg.dataProxima || '';
    
    // Atualiza as opções do select com a equipe atual (audiEquipe)
    const selectAuditor = document.getElementById('modalPlanAuditor');
    if (selectAuditor) {
        selectAuditor.innerHTML = '<option value="">A Definir</option>' + 
            audiEquipe.map(mb => `<option value="${mb.nome}">${mb.nome}</option>`).join('');
    }
    document.getElementById('modalPlanAuditor').value = cfg.auditor || '';
    
    document.getElementById('modalPlanNotas').value = cfg.notasInternas || '';

    document.getElementById('modalPlanejamentoObj').classList.add('show');
}

window.fecharModalEditPlanejamento = function () {
    document.getElementById('modalPlanejamentoObj').classList.remove('show');
    planejamentoAbertoId = null;
}

window.salvarPlanejamento = async function () {
    if (!planejamentoAbertoId) return;

    const dataProxima = document.getElementById('modalPlanDataProx').value;
    const auditor = document.getElementById('modalPlanAuditor').value.trim();
    const notasInternas = document.getElementById('modalPlanNotas').value.trim();

    const payload = {
        loja: planejamentoAbertoId.nomeLoja,
        dataProxima,
        auditor,
        notasInternas,
        regional: 'Nordeste',
        updatedAt: new Date().toISOString()
    };

    try {
        if (planejamentoAbertoId.docId) {
            // Se já existe no Firebase um doc para essa loja, faça Update
            await updateDoc(doc(db, "auditoria_planejamento", planejamentoAbertoId.docId), payload);
        } else {
            // Cria um novo doc
            await addDoc(collection(db, "auditoria_planejamento"), payload);
        }

        showToast("Agendamento de Auditoria salvo!", "success");
        window.fecharModalEditPlanejamento();
    } catch (e) {
        console.error(e);
        showToast("Erro ao salvar planejamento", "error");
    }
}

// ============================================
// 3. DASHBOARD DINÂMICO
// ============================================
function renderDashboard() {
    if (notasCache.length === 0) {
        if (document.getElementById('kpiTotalAuditorias')) document.getElementById('kpiTotalAuditorias').textContent = '0';
        if (document.getElementById('kpiMediaRede')) document.getElementById('kpiMediaRede').textContent = '-';
        if (document.getElementById('kpiMenorNota')) document.getElementById('kpiMenorNota').textContent = '-';
        if (document.getElementById('kpiMenorNotaLoja')) document.getElementById('kpiMenorNotaLoja').textContent = '';
        if (document.getElementById('kpiAuditoriaMes')) document.getElementById('kpiAuditoriaMes').textContent = '0';
        return;
    }

    // KPI: Total de Auditorias
    document.getElementById('kpiTotalAuditorias').textContent = notasCache.length;

    // KPI: Média da Rede
    const somaNotas = notasCache.reduce((acc, n) => acc + n.nota, 0);
    const media = somaNotas / notasCache.length;
    const elMedia = document.getElementById('kpiMediaRede');
    elMedia.textContent = media.toFixed(1);
    elMedia.className = media >= 8.5 ? 'text-3xl font-bold mt-1.5 text-spPistache' : (media >= 7 ? 'text-3xl font-bold mt-1.5 text-spLaranja' : 'text-3xl font-bold mt-1.5 text-spRed');

    // KPI: Menor Nota (da última auditoria de cada loja)
    // Pegar a nota mais recente de cada loja
    const ultimaPorLoja = {};
    notasCache.forEach(n => {
        if (!ultimaPorLoja[n.loja] || n.data > ultimaPorLoja[n.loja].data) {
            ultimaPorLoja[n.loja] = n;
        }
    });
    const todasUltimas = Object.values(ultimaPorLoja);
    const menor = todasUltimas.reduce((min, n) => n.nota < min.nota ? n : min, todasUltimas[0]);
    document.getElementById('kpiMenorNota').textContent = menor.nota.toFixed(1);
    document.getElementById('kpiMenorNotaLoja').textContent = menor.loja;

    // KPI: Auditorias neste mês
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const doMes = notasCache.filter(n => n.data && n.data.startsWith(mesAtual));
    document.getElementById('kpiAuditoriaMes').textContent = doMes.length;

    // ---- GRÁFICO 1: Média por Regional ----
    const mediaPorRegional = {};
    const countPorRegional = {};
    todasUltimas.forEach(n => {
        const reg = getLojaRegional(n.loja);
        if (!mediaPorRegional[reg]) { mediaPorRegional[reg] = 0; countPorRegional[reg] = 0; }
        mediaPorRegional[reg] += n.nota;
        countPorRegional[reg]++;
    });
    const regionais = Object.keys(mediaPorRegional).sort();
    const mediasRegionais = regionais.map(r => +(mediaPorRegional[r] / countPorRegional[r]).toFixed(1));
    const coresBarras = mediasRegionais.map(m => m >= 8.5 ? '#4F7039' : (m >= 7 ? '#DA5513' : '#DA0D17'));

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const canvasRegional = document.getElementById('chartMediaRegional');
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
                plugins: { legend: { display: false } },
                scales: {
                    x: { min: 0, max: 10, grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600' } } }
                }
            }
        });
    }

    // ---- GRÁFICO 2: Ranking das últimas notas por loja (horizontal bar, top 15) ----
    const ranking = [...todasUltimas].sort((a, b) => a.nota - b.nota).slice(0, 15);
    const labelsRanking = ranking.map(n => n.loja);
    const valoresRanking = ranking.map(n => n.nota);
    const coresRanking = valoresRanking.map(v => v >= 8.5 ? '#4F7039' : (v >= 7 ? '#DA5513' : '#DA0D17'));

    const canvasRanking = document.getElementById('chartRankingLojas');
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
                plugins: { legend: { display: false } },
                scales: {
                    x: { min: 0, max: 10, grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
                }
            }
        });
    }
}

// ============================================
// 4. TAREFAS/PROJETOS DA AUDITORIA (KANBAN)
// ============================================

window.switchAudiMember = function (name) {
    audiCurrentMember = name;
    renderizarBotoesAudiEquipe();
    renderizarAudiProjetosList();
}

function renderizarBotoesAudiEquipe() {
    const container = document.getElementById('audiMembrosEquipeContainer');
    if (!container) return;
    container.innerHTML = '';
    audiEquipe.forEach(m => {
        const btn = document.createElement('button');
        btn.className = m.nome === audiCurrentMember 
            ? 'px-4 py-2 rounded-full font-semibold transition-colors bg-[var(--primary)] text-white shadow-sm border border-[var(--primary)]' 
            : 'px-4 py-2 rounded-full font-semibold transition-colors bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm';
        btn.innerText = m.nome;
        btn.onclick = () => window.switchAudiMember(m.nome);
        container.appendChild(btn);
    });
}

window.salvarAudiProjeto = async function () {
    if (!audiCurrentMember) return showToast("Selecione ou crie um membro da equipe antes", "error");
    const desc = document.getElementById('audiProjDesc').value;
    const dem = document.getElementById('audiProjDemand').value;
    const dt = document.getElementById('audiProjDate').value;
    const status = document.getElementById('audiProjStatus').value;
    const fileInput = document.getElementById('audiProjAnexo');

    if (!desc || !dem || !dt) return showToast("Preencha os dados da tarefa", "error");
    const [y, m, d] = dt.split('-');
    let anexoUrl = fileInput ? fileInput.value.trim() : null;

    try {
        await addDoc(collection(db, "auditoria_projetos"), {
            membroResponsavel: audiCurrentMember,
            dataAtv: `${d}/${m}/${y}`,
            desc: desc,
            demandante: dem,
            status: status,
            anexoUrl: anexoUrl,
            autor: currentUser,
            timestamp: Date.now()
        });
        document.getElementById('audiProjDesc').value = '';
        document.getElementById('audiProjDemand').value = '';
        document.getElementById('audiProjStatus').value = 'Pendente';
        if (fileInput) fileInput.value = '';
        showToast("Tarefa registrada");
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar tarefa", "error");
    }
}

window.deletarAudiProjeto = async function (firebaseId) {
    if (!confirm("Remover este registro?")) return;
    try {
        await deleteDoc(doc(db, "auditoria_projetos", firebaseId));
        showToast("Tarefa removida");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover tarefa", "error");
    }
}

function renderizarAudiProjetosList() {
    const container = document.getElementById('audi-projetos-list');
    if (!container) return;
    const projs = audiProjetos[audiCurrentMember] || [];
    container.innerHTML = '';

    if (projs.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 w-full bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed text-center">
                <i class="ph ph-kanban text-4xl text-[var(--primary)] mb-3 opacity-50"></i>
                <h2 class="text-lg font-bold text-[var(--text-main)] m-0">Nenhum registro para ${audiCurrentMember || 'esta equipe'}</h2>
                <p class="text-sm text-[var(--text-muted)] mt-1">Clique e registre uma nova demanda acima para começar a preencher o quadro.</p>
            </div>`;
        return;
    }

    const colunas = [
        { id: 'Pendente', titulo: 'Pendentes', badgeBg: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900', iconColor: 'text-red-500' },
        { id: 'Em Andamento', titulo: 'Em Andamento', badgeBg: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900', iconColor: 'text-yellow-500' },
        { id: 'Concluído', titulo: 'Concluídos', badgeBg: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900', iconColor: 'text-green-500' }
    ];

    colunas.forEach(col => {
        const projsNestaColuna = projs.filter(p => (p.status || 'Pendente') === col.id);
        const colDiv = document.createElement('div');
        colDiv.className = 'flex flex-col flex-1 min-w-[300px] bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border)] overflow-hidden';
        colDiv.innerHTML = `
            <div class="px-4 py-3 flex justify-between items-center border-b border-[var(--border)] bg-[var(--surface)]">
                <h3 class="m-0 font-bold text-[var(--text-main)] text-sm flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-current ${col.iconColor}"></div> ${col.titulo}</h3>
                <span class="bg-[var(--bg-color)] text-[var(--text-muted)] text-xs font-bold px-2.5 py-1 rounded-full border border-[var(--border)]">${projsNestaColuna.length}</span>
            </div>
            <div class="kanban-items p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3 min-h-[300px]"></div>
        `;
        const itemsContainer = colDiv.querySelector('.kanban-items');

        projsNestaColuna.forEach(p => {
            const div = document.createElement('div');
            div.className = 'bg-[var(--surface)] border-l-4 border-transparent hover:border-[var(--primary)] p-4 rounded-lg border border-[var(--border)] shadow-sm hover:shadow-md transition-all group flex flex-col gap-2 relative';

            let actionBtns = '';
            actionBtns += `<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Editar" onclick="window.abrirModalEditAudiProj('${p.firebaseId}')"><i class="ph ph-pencil-simple text-sm"></i></button>`;
            actionBtns += `<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Remover" onclick="window.deletarAudiProjeto('${p.firebaseId}')"><i class="ph ph-trash text-sm"></i></button>`;

            let urlBadge = '';
            if (p.anexoUrl) {
                const isImg = p.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
                if (isImg) {
                    urlBadge = `<a href="${p.anexoUrl}" target="_blank" class="block w-full mt-2 rounded-lg border border-[var(--border)] overflow-hidden hover:brightness-95 transition-all"><img src="${p.anexoUrl}" class="w-full h-24 object-cover" alt="Anexo"></a>`;
                } else {
                    urlBadge = `<a href="${p.anexoUrl}" target="_blank" class="inline-flex mt-2 items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-color)] text-[var(--text-main)] text-xs font-medium border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"><i class="ph ph-link"></i> Abrir Link Anexo</a>`;
                }
            }

            div.innerHTML = `
                <div class="flex justify-between items-start gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${col.badgeBg}"><i class="ph ph-calendar-blank"></i> ${p.dataAtv}</span>
                    <div class="flex items-center gap-1 bg-[var(--surface)] rounded-lg shadow-sm border border-[var(--border)] ml-auto absolute top-2 right-2 p-0.5 pointer-events-none group-hover:pointer-events-auto">${actionBtns}</div>
                </div>
                <h4 class="mt-2 mb-1 font-semibold text-sm text-[var(--text-main)] leading-relaxed break-words">${p.desc}</h4>
                ${urlBadge ? `<div>${urlBadge}</div>` : ''}
                <div class="mt-3 pt-3 border-t border-dashed border-[var(--border)] flex justify-between items-center text-xs text-[var(--text-muted)]">
                    <span class="flex items-center gap-1" title="Demandante"><i class="ph-fill ph-user-circle text-lg"></i> <span class="font-medium text-[var(--text-main)] truncate max-w-[120px]">${p.demandante}</span></span>
                </div>
            `;
            itemsContainer.appendChild(div);
        });
        container.appendChild(colDiv);
    });
}

// ====== EDIÇÃO DE TAREFAS AUDITORIA ======
window.abrirModalEditAudiProj = function (firebaseId) {
    // Busca em todos os membros
    let p = null;
    Object.values(audiProjetos).forEach(arr => {
        const found = arr.find(x => x.firebaseId === firebaseId);
        if (found) p = found;
    });
    if (!p) return;

    document.getElementById('editAudiProjId').value = p.firebaseId;
    document.getElementById('editAudiProjDesc').value = p.desc;
    document.getElementById('editAudiProjDemand').value = p.demandante;
    const [d, m, y] = p.dataAtv.split('/');
    document.getElementById('editAudiProjDate').value = `${y}-${m}-${d}`;
    document.getElementById('editAudiProjStatus').value = p.status;

    const mbSelect = document.getElementById('editAudiProjMember');
    mbSelect.innerHTML = audiEquipe.map(mb => `<option value="${mb.nome}">${mb.nome}</option>`).join('');
    mbSelect.value = p.membroResponsavel;

    document.getElementById('modalEditAudiProj').classList.add('show');
}

window.fecharModalEditAudiProj = function () {
    document.getElementById('modalEditAudiProj').classList.remove('show');
}

window.confirmarEdicaoAudiProj = async function () {
    const id = document.getElementById('editAudiProjId').value;
    const desc = document.getElementById('editAudiProjDesc').value;
    const dem = document.getElementById('editAudiProjDemand').value;
    const dt = document.getElementById('editAudiProjDate').value;
    const status = document.getElementById('editAudiProjStatus').value;
    const newMember = document.getElementById('editAudiProjMember').value;

    if (!desc || !dem || !dt || !newMember) return showToast("Preencha todos os campos da tarefa", "error");
    const [y, m, d] = dt.split('-');

    try {
        await updateDoc(doc(db, "auditoria_projetos", id), {
            desc, demandante: dem, dataAtv: `${d}/${m}/${y}`, status, membroResponsavel: newMember
        });
        window.fecharModalEditAudiProj();
        showToast("Tarefa atualizada com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar tarefa", "error");
    }
}

// ====== EQUIPE AUDITORIA ======
window.abrirModalAudiEquipe = function () {
    document.getElementById('modalAudiEquipe').classList.add('show');
}

window.fecharModalAudiEquipe = function () {
    document.getElementById('modalAudiEquipe').classList.remove('show');
}

window.adicionarAudiMembro = async function () {
    const nome = document.getElementById('novoAudiMembroNome').value.trim();
    if (!nome) return showToast("Digite um nome", "error");
    if (audiEquipe.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "auditoria_equipe"), { nome });
        document.getElementById('novoAudiMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerAudiMembro = async function (idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
    try {
        await deleteDoc(doc(db, "auditoria_equipe", idMembro));
        if (audiCurrentMember === nomeMembro) audiCurrentMember = null;
        showToast("Membro removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaAudiEquipeGerenciar() {
    const container = document.getElementById('listaAudiEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';
    
    if (audiEquipe.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center py-4">Nenhum membro.</p>';
        return;
    }

    audiEquipe.forEach(m => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML = `
            <span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ${m.nome}</span>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100" onclick="window.removerAudiMembro('${m.firebaseId}', '${m.nome}')">
                <i class="ph ph-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function escapeCSV(text) {
    if (!text) return '';
    const str = String(text);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

window.exportarAudiProjetosCSV = function () {
    let csvContent = "\uFEFFResponsavel,Data_Atividade,Status,Descricao,Demandante,Registrado_Por\n";
    Object.keys(audiProjetos).forEach(membro => {
        const projetos = audiProjetos[membro] || [];
        projetos.forEach(p => {
            const row = [
                membro, p.dataAtv, p.status || 'Pendente',
                p.desc || "", p.demandante || "", p.autor || ""
            ].map(escapeCSV).join(",");
            csvContent += row + "\n";
        });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_auditoria_tarefas_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de tarefas iniciado");
}

if (currentUser) initApp();
