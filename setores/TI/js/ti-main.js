// js/ti-main.js
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, query, where, orderBy → from firebase-init.js
// lojasIniciais, appConfig → from data.js

let currentUser = sessionStorage.getItem('loggedUser') || null;
let authMode = 'login';
let lojaAtualId = null;
let currentMember = 'Hyrton';
let chartInstSetor = null;
let chartInstStatus = null;
let chartInstRegiao = null;

let sysLogs = {};
let sysProjetos = {};
let sysAtas = [];
let membrosEquipe = [];

function showToast(msg, type = 'success') {
    Toastify({
        text: msg, duration: 3000, gravity: "bottom", position: "right",
        style: { background: type === 'success' ? "var(--success)" : "var(--danger)", borderRadius: "6px", fontFamily: "Inter" }
    }).showToast();
}

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (chartInstStatus) atualizarGraficos();
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
}

window.logout = function () {
    sessionStorage.removeItem('loggedUser');
    sessionStorage.removeItem('userSectors');
    window.location.href = '../../index.html';
}

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    let sectors = [];
    try {
        sectors = JSON.parse(sessionStorage.getItem('userSectors')) || [];
    } catch (e) {
        sectors = [];
    }

    if (!sectors.includes("TI") && currentUser !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('loggedUserName').innerText = currentUser;

    // Injetar botão do Hub dinamicamente nos header-actions
    document.querySelectorAll('.header-actions > div:first-child').forEach(container => {
        if (container.querySelector('.btn-hub')) return;
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-hub';
        btn.style.padding = '6px 10px';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four" style="font-size: 1.2rem;"></i>';
        btn.onclick = () => window.location.href = '../../index.html?hub=1';
        container.insertBefore(btn, container.querySelector('.page-title'));
    });

    iniciarOuvintesFirestore();
    window.switchView('analytics');
}

function iniciarOuvintesFirestore() {
    const qLogs = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    onSnapshot(qLogs, (snapshot) => {
        sysLogs = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            data.firebaseId = doc.id;
            if (!sysLogs[data.lojaId]) sysLogs[data.lojaId] = [];
            sysLogs[data.lojaId].push(data);
        });
        window.renderizarLojas();
        atualizarGraficos();
        if (lojaAtualId !== null) renderizarComentarios(sysLogs[lojaAtualId] || []);
    });

    const qProjetos = query(collection(db, "projetos"), orderBy("timestamp", "desc"));
    onSnapshot(qProjetos, (snapshot) => {
        sysProjetos = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            data.firebaseId = doc.id;
            if (!sysProjetos[data.membroResponsavel]) {
                sysProjetos[data.membroResponsavel] = [];
            }
            sysProjetos[data.membroResponsavel].push(data);
        });
        renderizarProjetosList();
    });

    const qEquipe = query(collection(db, "equipe"), orderBy("nome"));
    onSnapshot(qEquipe, (snapshot) => {
        membrosEquipe = [];
        snapshot.forEach(doc => membrosEquipe.push({ firebaseId: doc.id, ...doc.data() }));
        if (membrosEquipe.length > 0 && (!currentMember || !membrosEquipe.find(m => m.nome === currentMember))) {
            currentMember = membrosEquipe[0].nome;
        }
        renderizarBotoesEquipe();
        renderizarProjetosList();
        renderizarListaEquipeGerenciar();
    });

    const qAtas = query(collection(db, "atas"), orderBy("timestamp", "desc"));
    onSnapshot(qAtas, (snapshot) => {
        sysAtas = [];
        snapshot.forEach(doc => sysAtas.push({ firebaseId: doc.id, ...doc.data() }));
        renderizarAtas();
    });
}

window.switchView = function (view) {
    document.getElementById('view-analytics').style.display = 'none';
    document.getElementById('view-lojas').style.display = 'none';
    document.getElementById('view-projetos').style.display = 'none';
    const va = document.getElementById('view-atas'); if (va) va.style.display = 'none';
    const vb = document.getElementById('view-bi'); if (vb) vb.style.display = 'none';
    const vp = document.getElementById('view-metapwr'); if (vp) vp.style.display = 'none';

    document.getElementById('nav-analytics').classList.remove('active');
    document.getElementById('nav-lojas').classList.remove('active');
    document.getElementById('nav-projetos').classList.remove('active');
    const na = document.getElementById('nav-atas'); if (na) na.classList.remove('active');
    const nb = document.getElementById('nav-bi'); if (nb) nb.classList.remove('active');
    const np = document.getElementById('nav-metapwr'); if (np) np.classList.remove('active');

    document.getElementById(`view-${view}`).style.display = 'block';
    document.getElementById(`nav-${view}`).classList.add('active');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }

    if (view === 'analytics') atualizarGraficos();
    if (view === 'lojas') window.renderizarLojas();
    if (view === 'projetos') window.switchMember('Hyrton');
    if (view === 'atas') renderizarAtas();
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

function criarCardLojaHTML(loja, logs) {
    const pendentes = logs.filter(l => !l.resolvido);
    const temPendente = pendentes.length > 0;
    const statusColor = logs.length > 0 ? (temPendente ? 'var(--sp-red)' : 'var(--success)') : 'var(--border)';
    const statusBg = logs.length > 0 ? (temPendente ? 'rgba(218,13,23,0.1)' : 'rgba(16,185,129,0.1)') : 'var(--bg-color)';
    const darkStatusBg = logs.length > 0 ? (temPendente ? 'rgba(218,13,23,0.2)' : 'rgba(16,185,129,0.2)') : 'transparent';
    
    const card = document.createElement('div');
    card.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer relative overflow-hidden group';
    // Style left border color dynamically
    card.style.borderLeftColor = statusColor;
    card.style.borderLeftWidth = '4px';
    card.onclick = () => abrirModal(loja.id, loja.nome, loja.estado);

    let preview = `<div class="mt-4"><div class="flex flex-col items-center justify-center p-4 text-center text-[var(--text-muted)] bg-[var(--bg-color)] rounded-lg border border-dashed border-[var(--border)]"><i class="ph ph-check-circle text-2xl mb-2"></i><p class="m-0 text-sm font-medium">Sistema operando normalmente</p></div></div>`;

    if (logs.length > 0) {
        let logsExibidos = temPendente ? pendentes : [logs[0]];
        let logsHtml = '';

        logsExibidos.forEach((logItem, index) => {
            const iconStatus = logItem.resolvido ? '<i class="ph-fill ph-check-circle text-[var(--success)]"></i>' : '<i class="ph-fill ph-warning-circle text-[var(--danger)]"></i>';
            const marginStyle = index < logsExibidos.length - 1 ? 'mb-3 pb-3 border-b border-[var(--border)]' : '';
            logsHtml += `
                <div class="${marginStyle}">
                    <div class="flex justify-between items-center text-xs text-[var(--text-muted)] mb-2 font-semibold">
                        <span class="flex items-center gap-1.5">${iconStatus} ${logItem.dataStr}</span>
                        <span class="flex items-center gap-1"><i class="ph ph-user"></i> ${logItem.autor}</span>
                    </div>
                    <div class="text-sm text-[var(--text-main)] leading-relaxed line-clamp-2">${logItem.texto}</div>
                    <span class="inline-block px-2 py-0.5 mt-2 rounded-md text-xs font-bold bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] dark:bg-[rgba(var(--primary-rgb),0.2)] dark:text-blue-400 border border-[var(--primary)]/20">${logItem.tag || 'Geral'}</span>
                </div>`;
        });

        preview = `
            <div class="mt-4 bg-[var(--bg-color)] rounded-lg p-3 border border-[var(--border)] max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div class="text-[0.75rem] text-[var(--text-muted)] mb-2 font-bold pb-1 border-b border-[var(--border)]">
                    ${temPendente ? (pendentes.length + ' ocorrência(s) pendente(s)') : 'Última ocorrência:'}
                </div>
                ${logsHtml}
            </div>`;
    }

    card.innerHTML = `
        <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[${statusBg}] dark:from-[${darkStatusBg}] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div class="flex justify-between items-start mb-1 relative z-10">
            <h3 class="text-lg font-bold text-[var(--text-main)] m-0 group-hover:text-[var(--primary)] transition-colors">${loja.nome}</h3>
            <span class="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border)] shadow-sm">${loja.estado}</span>
        </div>
        ${preview}
    `;
    return card;
}

window.renderizarLojas = function () {
    const container = document.getElementById('lojas-container');
    if (!container) return;

    const filterStatus = document.getElementById('statusFilter').value;
    const filterTag = document.getElementById('tagFilter') ? document.getElementById('tagFilter').value : 'todas';
    const filterSetor = document.getElementById('setorFilter') ? document.getElementById('setorFilter').value : 'todos';
    const sortOrder = document.getElementById('sortOrder').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    container.innerHTML = '';

    let lojasProcessadas = [];
    lojasIniciais.forEach(loja => {
        if (!loja.nome.toLowerCase().includes(search) && !loja.estado.toLowerCase().includes(search)) return;

        let logs = sysLogs[loja.id] || [];

        if (filterTag !== 'todas') logs = logs.filter(l => (l.tag || 'Geral') === filterTag || (filterTag === 'Geral' && !l.tag));
        if (filterSetor !== 'todos') logs = logs.filter(l => (l.setor || '') === filterSetor);

        if ((filterTag !== 'todas' || filterSetor !== 'todos') && logs.length === 0) return;

        const pendentes = logs.filter(l => !l.resolvido);
        if (filterStatus === 'pendente' && pendentes.length === 0) return;
        if (filterStatus === 'resolvido' && (logs.length === 0 || pendentes.length > 0)) return;

        lojasProcessadas.push({ loja, logs });
    });

    if (lojasProcessadas.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]"><i class="ph ph-magnifying-glass text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum resultado encontrado</h2></div>`;
        return;
    }

    if (sortOrder === 'estado-az') {
        const estadosUnicos = [...new Set(lojasProcessadas.map(lp => lp.loja.estado))].sort();
        estadosUnicos.forEach(est => {
            const section = document.createElement('div');
            section.className = 'mb-8';
            section.innerHTML = `<h2 class="text-xl font-bold text-[var(--primary)] mb-4 border-b border-[var(--border)] pb-2">Regional ${est}</h2>`;
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

            lojasProcessadas.filter(lp => lp.loja.estado === est)
                .sort((a, b) => a.loja.nome.localeCompare(b.loja.nome))
                .forEach(lp => grid.appendChild(criarCardLojaHTML(lp.loja, lp.logs)));

            section.appendChild(grid);
            container.appendChild(section);
        });
    } else {
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

        if (sortOrder === 'recentes') {
            lojasProcessadas.sort((a, b) => {
                const timeA = a.logs.length > 0 ? a.logs[0].timestamp : 0;
                const timeB = b.logs.length > 0 ? b.logs[0].timestamp : 0;
                return timeB - timeA;
            });
        } else if (sortOrder === 'pendentes-topo') {
            lojasProcessadas.sort((a, b) => {
                const pendentesA = a.logs.filter(l => !l.resolvido).length > 0 ? 1 : 0;
                const pendentesB = b.logs.filter(l => !l.resolvido).length > 0 ? 1 : 0;
                if (pendentesA !== pendentesB) return pendentesB - pendentesA;
                return a.loja.nome.localeCompare(b.loja.nome);
            });
        } else {
            lojasProcessadas.sort((a, b) => a.loja.nome.localeCompare(b.loja.nome));
        }

        lojasProcessadas.forEach(lp => grid.appendChild(criarCardLojaHTML(lp.loja, lp.logs)));
        container.appendChild(grid);
    }
}

function abrirModal(id, nome, estado) {
    lojaAtualId = id;
    document.getElementById('modalTitle').innerText = nome;
    document.getElementById('modalEstado').innerText = estado;
    document.getElementById('modalLoja').classList.add('show');
    renderizarComentarios(sysLogs[lojaAtualId] || []);
}

window.fecharModal = function () {
    document.getElementById('modalLoja').classList.remove('show');
    lojaAtualId = null;
}

window.salvarComentario = async function () {
    const texto = document.getElementById('novoComentario').value;
    const tag = document.getElementById('tagComentario').value;
    const setor = document.getElementById('setorComentario').value;
    const inputAnexo = document.getElementById('anexoComentario');
    const anexoUrl = inputAnexo ? inputAnexo.value.trim() : null;
    if (!texto.trim()) return showToast("A descrição é obrigatória", "error");

    const dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await addDoc(collection(db, "logs"), {
            lojaId: lojaAtualId,
            dataStr: dStr,
            texto: texto,
            tag: tag,
            setor: setor,
            anexoUrl: anexoUrl || null,
            resolvido: false,
            autor: currentUser,
            timestamp: Date.now()
        });
        document.getElementById('novoComentario').value = '';
        document.getElementById('setorComentario').value = '';
        if (inputAnexo) inputAnexo.value = '';
        showToast("Ocorrência registrada");
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar no servidor", "error");
    }
}

window.resolverComentario = async function (firebaseId) {
    try {
        const dataResolucao = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        await updateDoc(doc(db, "logs", firebaseId), {
            resolvido: true,
            autorResolucao: currentUser,
            dataResolucao: dataResolucao
        });
        showToast("Ocorrência marcada como resolvida");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar registro", "error");
    }
}

window.deletarComentario = async function (firebaseId) {
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    try {
        await deleteDoc(doc(db, "logs", firebaseId));
        showToast("Registro removido");
    } catch (e) {
        console.error(e);
        showToast("Erro ao apagar registro", "error");
    }
}

function renderizarComentarios(hist) {
    const container = document.getElementById('listaComentarios');
    if (!container) return;

    container.innerHTML = '';

    if (hist.length === 0) {
        container.innerHTML = '<p class="text-center text-[var(--text-muted)] p-5">Nenhum histórico.</p>';
        return;
    }

    hist.forEach(c => {
        const div = document.createElement('div');
        const resolveColor = c.resolvido ? 'var(--success)' : 'var(--sp-red)';
        const resolveBg = c.resolvido ? 'rgba(16,185,129,0.05)' : 'rgba(218,13,23,0.05)';
        
        div.className = `p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-color)] shadow-sm relative overflow-hidden`;
        div.style.borderLeftColor = resolveColor;
        div.style.borderLeftWidth = '4px';

        let htmlButtons = '';
        htmlButtons += `<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-transparent border border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors mr-2" onclick="window.abrirModalEditLog('${c.firebaseId}')"><i class="ph ph-pencil"></i> Editar</button>`;
        htmlButtons += `<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-[rgba(218,13,23,0.1)] text-red-600 dark:text-red-400 border border-transparent hover:border-red-600/30 transition-colors" onclick="window.deletarComentario('${c.firebaseId}')"><i class="ph ph-trash"></i> Apagar</button>`;

        let resolveSection = '';
        if (!c.resolvido) {
            resolveSection = `<button class="inline-flex items-center justify-center gap-1.5 px-4 py-2 mt-2 sm:mt-0 font-semibold rounded-lg bg-[var(--success)] text-white shadow hover:brightness-110 transition-all sm:w-auto w-full" onclick="window.resolverComentario('${c.firebaseId}')"><i class="ph ph-check font-bold"></i> Resolver</button>`;
        } else {
            resolveSection = `<span class="text-[var(--success)] font-bold text-sm flex items-center gap-1"><i class="ph-fill ph-check-circle text-lg"></i> Resolvido por ${c.autorResolucao} em ${c.dataResolucao}</span>`;
        }

        const setorBadge = c.setor ? `<span class="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] ml-1">📍 ${c.setor}</span>` : '';

        let anexoHtml = '';
        if (c.anexoUrl) {
            const isImg = c.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
            if (isImg) {
                anexoHtml = `<div class="mt-3"><a href="${c.anexoUrl}" target="_blank"><img src="${c.anexoUrl}" class="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-cover shadow-sm"></a></div>`;
            } else {
                anexoHtml = `<div class="mt-3"><a href="${c.anexoUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text-main)] text-sm font-bold border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline"><i class="ph ph-link"></i> Ver Link/Anexo</a></div>`;
            }
        }

        div.innerHTML = `
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[${resolveBg}] to-transparent pointer-events-none"></div>
            <div class="flex justify-between items-start mb-3 relative z-10 flex-wrap gap-2">
                <div class="flex flex-col">
                    <span class="font-bold text-[var(--text-main)] flex items-center gap-1.5"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)]"></i> ${c.autor}</span>
                    <span class="text-xs text-[var(--text-muted)] mt-0.5">${c.dataStr}</span>
                </div>
                <div class="flex flex-wrap gap-1 items-center">
                    <span class="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] dark:bg-[rgba(var(--primary-rgb),0.2)] dark:text-blue-400 border border-[var(--primary)]/20">${c.tag || 'Geral'}</span>
                    ${setorBadge}
                </div>
            </div>
            <div class="text-[var(--text-main)] text-sm leading-relaxed whitespace-pre-line mb-4 relative z-10">${c.texto}${anexoHtml}</div>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-[var(--border)] gap-3 relative z-10">
                ${resolveSection}
                <div class="flex items-center w-full sm:w-auto mt-2 sm:mt-0 justify-end">${htmlButtons}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function escapeCSV(text) {
    if (text == null) return "N/A";
    const str = String(text);
    if (str.search(/("|,|\n)/g) >= 0) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

window.exportarCSV = function () {
    let csvContent = "\uFEFFID_Loja,Nome_Loja,Estado,Data_Criacao,Autor,Tag,Setor,Status,Autor_Resolucao,Data_Resolucao,Descricao\n";
    lojasIniciais.forEach(loja => {
        const hist = sysLogs[loja.id] || [];
        hist.forEach(l => {
            const status = l.resolvido ? "Resolvido" : "Pendente";
            const row = [
                loja.id, loja.nome, loja.estado, l.dataStr, l.autor,
                l.tag || 'Geral', l.setor || 'N/A', status,
                l.autorResolucao || "N/A", l.dataResolucao || "N/A",
                l.texto || ""
            ].map(escapeCSV).join(",");
            csvContent += row + "\n";
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_ti_chamados_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de chamados iniciado");
}

window.exportarProjetosCSV = function () {
    let csvContent = "\uFEFFResponsavel,Data_Atividade,Status,Descricao,Demandante,Registrado_Por\n";

    Object.keys(sysProjetos).forEach(membro => {
        const projetos = sysProjetos[membro] || [];
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
    link.setAttribute("download", `relatorio_ti_projetos_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de tarefas iniciado");
}

function atualizarGraficos() {
    let pendentes = 0; let resolvidos = 0;
    let lojasPendentes = 0; let lojasResolvidas = 0;
    let regiaoCount = {};

    lojasIniciais.forEach(loja => {
        if (!regiaoCount[loja.estado]) regiaoCount[loja.estado] = 0;
        const lgs = sysLogs[loja.id] || [];

        let temPendenteNaLoja = false;
        if (lgs.length > 0) {
            regiaoCount[loja.estado] += lgs.length;
            lgs.forEach(l => {
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

    const elTotal = document.getElementById('statTotalLojas');
    const elPendentes = document.getElementById('statPendentes');
    if (elTotal) elTotal.innerText = lojasIniciais.length;
    if (elPendentes) elPendentes.innerText = pendentes;

    const textColor = document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
    const elChartStatus = document.getElementById('chartStatus');
    const elChartRegionais = document.getElementById('chartRegionais');

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

        // Extrai as chaves (Estados) e as valores, garantindo ordem alfabética
        const orderedStates = Object.keys(regiaoCount).sort((a, b) => a.localeCompare(b));
        const orderedValues = orderedStates.map(k => regiaoCount[k]);

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
                        ticks: {
                            color: textColor,
                            stepSize: 1,
                            precision: 0
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

window.switchMember = function (name) {
    currentMember = name;
    renderizarBotoesEquipe();
    renderizarProjetosList();
}

function renderizarBotoesEquipe() {
    const container = document.getElementById('membrosEquipeContainer');
    if (!container) return;
    container.innerHTML = '';
    membrosEquipe.forEach(m => {
        const btn = document.createElement('button');
        btn.className = m.nome === currentMember 
            ? 'px-4 py-2 rounded-lg bg-[var(--primary)] text-white border border-[var(--primary)] font-semibold shadow-sm transition-all text-sm' 
            : 'px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] font-semibold transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] text-sm';
        btn.innerText = m.nome;
        btn.onclick = () => window.switchMember(m.nome);
        container.appendChild(btn);
    });
}

window.salvarProjeto = async function () {
    if (!currentMember) return showToast("Selecione ou crie um membro da equipe antes", "error");
    const desc = document.getElementById('projDesc').value;
    const dem = document.getElementById('projDemand').value;
    const dt = document.getElementById('projDate').value;
    const status = document.getElementById('projStatus').value;
    const fileInput = document.getElementById('projAnexo');

    if (!desc || !dem || !dt) return showToast("Preencha os dados do projeto", "error");
    const [y, m, d] = dt.split('-');

    let anexoUrl = fileInput ? fileInput.value.trim() : null;

    try {
        await addDoc(collection(db, "projetos"), {
            membroResponsavel: currentMember,
            dataAtv: `${d}/${m}/${y}`,
            desc: desc,
            demandante: dem,
            status: status,
            anexoUrl: anexoUrl,
            autor: currentUser,
            timestamp: Date.now()
        });
        document.getElementById('projDesc').value = '';
        document.getElementById('projDemand').value = '';
        document.getElementById('projStatus').value = 'Pendente';
        if (fileInput) fileInput.value = '';
        showToast("Tarefa registrada");
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar tarefa", "error");
    }
}

window.deletarProjeto = async function (firebaseId) {
    if (!confirm("Remover este registro?")) return;
    try {
        await deleteDoc(doc(db, "projetos", firebaseId));
        showToast("Tarefa removida");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover tarefa", "error");
    }
}

function renderizarProjetosList() {
    const container = document.getElementById('projetos-list');
    if (!container) return;

    const projs = sysProjetos[currentMember] || [];
    container.innerHTML = '';

    if (projs.length === 0) return container.innerHTML = `<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] col-span-1 lg:col-span-3 rounded-xl border border-dashed border-[var(--border)] w-full"><i class="ph ph-kanban text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum registro para ${currentMember || 'esta equipe'}</h2></div>`;

    const colunas = [
        { id: 'Pendente', titulo: 'Pendentes', classBadge: 'bg-[rgba(218,13,23,0.1)] text-[var(--sp-red)] dark:bg-[rgba(218,13,23,0.2)] dark:text-red-400 border-[var(--sp-red)]/20', borderColor: 'var(--sp-red)' },
        { id: 'Em Andamento', titulo: 'Em Andamento', classBadge: 'bg-[rgba(38,93,124,0.1)] text-[var(--sp-aoleite)] dark:bg-[rgba(38,93,124,0.2)] dark:text-blue-400 border-[var(--sp-aoleite)]/20', borderColor: 'var(--sp-aoleite)' },
        { id: 'Concluído', titulo: 'Concluídos', classBadge: 'bg-[rgba(16,185,129,0.1)] text-[var(--success)] dark:bg-[rgba(16,185,129,0.2)] dark:text-emerald-400 border-[var(--success)]/20', borderColor: 'var(--success)' }
    ];

    colunas.forEach(col => {
        const projsNestaColuna = projs.filter(p => (p.status || 'Pendente') === col.id);

        const colDiv = document.createElement('div');
        colDiv.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col h-full overflow-hidden shadow-sm';
        colDiv.innerHTML = `
            <div class="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center bg-black/5 dark:bg-black/20" style="border-top: 3px solid ${col.borderColor}">
                <h3 class="text-lg font-bold text-[var(--text-main)] m-0 flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${col.borderColor}"></div>
                    ${col.titulo}
                </h3>
                <span class="bg-[var(--bg-color)] px-2.5 py-1 rounded-md text-xs font-bold text-[var(--text-main)] border border-[var(--border)] shadow-sm">${projsNestaColuna.length}</span>
            </div>
            <div class="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 kanban-items bg-[var(--bg-color)]/50"></div>
        `;
        const itemsContainer = colDiv.querySelector('.kanban-items');

        projsNestaColuna.forEach(p => {
            const div = document.createElement('div');
            div.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-move group relative';

            let actionBtns = '';
            actionBtns += `<button class="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--bg-color)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors" onclick="window.abrirModalEditProj('${p.firebaseId}')"><i class="ph ph-pencil"></i></button>`;
            actionBtns += `<button class="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--bg-color)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onclick="window.deletarProjeto('${p.firebaseId}')"><i class="ph ph-trash"></i></button>`;

            let urlBadge = '';
            if (p.anexoUrl) {
                const isImg = p.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
                if (isImg) {
                    urlBadge = `<a href="${p.anexoUrl}" target="_blank" class="shrink-0"><img src="${p.anexoUrl}" class="h-6 rounded border border-[var(--border)] object-cover shadow-sm hover:opacity-80 transition-opacity"></a>`;
                } else {
                    urlBadge = `<a href="${p.anexoUrl}" target="_blank" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-color)] text-[var(--text-main)] text-xs font-bold border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline shrink-0"><i class="ph ph-link"></i> Link</a>`;
                }
            }

            div.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border ${col.classBadge}"><i class="ph ph-calendar"></i> ${p.dataAtv}</span>
                    <div class="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">${actionBtns}</div>
                </div>
                <h4 class="text-sm font-semibold text-[var(--text-main)] m-0 mb-3 leading-snug break-words group-hover:text-[var(--primary)] transition-colors">${p.desc}</h4>
                <div class="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                    <span class="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate pr-2" title="Demandante: ${p.demandante}"><i class="ph-fill ph-user text-[var(--border)] drop-shadow-sm text-sm"></i> <span class="truncate font-medium text-[var(--text-main)]">${p.demandante}</span></span>
                    ${urlBadge}
                </div>
            `;
            itemsContainer.appendChild(div);
        });

        container.appendChild(colDiv);
    });
}

// ====== LÓGICA DE EDIÇÃO: CHAMADOS ======
window.abrirModalEditLog = function (firebaseId) {
    const log = (sysLogs[lojaAtualId] || []).find(l => l.firebaseId === firebaseId);
    if (!log) return;

    document.getElementById('editLogId').value = firebaseId;
    document.getElementById('editLogTexto').value = log.texto;
    document.getElementById('editLogTag').value = log.tag || 'Hardware';
    document.getElementById('editLogSetor').value = log.setor || '';

    document.getElementById('modalEditLog').classList.add('show');
}

window.fecharModalEditLog = function () {
    document.getElementById('modalEditLog').classList.remove('show');
}

window.confirmarEdicaoLog = async function () {
    const id = document.getElementById('editLogId').value;
    const texto = document.getElementById('editLogTexto').value;
    const tag = document.getElementById('editLogTag').value;
    const setor = document.getElementById('editLogSetor').value;

    if (!texto.trim()) return showToast("A descrição é obrigatória", "error");

    try {
        await updateDoc(doc(db, "logs", id), { texto, tag, setor });
        window.fecharModalEditLog();
        showToast("Chamado atualizado com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar chamado", "error");
    }
}

// ====== LÓGICA DE EDIÇÃO E STATUS: TAREFAS/PROJETOS ======
window.abrirModalEditProj = function (firebaseId) {
    const p = sysProjetos[currentMember].find(x => x.firebaseId === firebaseId);
    if (!p) return;
    document.getElementById('editProjId').value = p.firebaseId;
    document.getElementById('editProjDesc').value = p.desc;
    document.getElementById('editProjDemand').value = p.demandante;
    const [d, m, y] = p.dataAtv.split('/');
    document.getElementById('editProjDate').value = `${y}-${m}-${d}`;
    document.getElementById('editProjStatus').value = p.status;

    // Popula dropdown de membros
    const mbSelect = document.getElementById('editProjMember');
    mbSelect.innerHTML = membrosEquipe.map(mb => `<option value="${mb.nome}">${mb.nome}</option>`).join('');
    mbSelect.value = p.membroResponsavel;

    document.getElementById('modalEditProj').classList.add('show');
}

window.fecharModalEditProj = function () {
    document.getElementById('modalEditProj').classList.remove('show');
}

window.confirmarEdicaoProj = async function () {
    const id = document.getElementById('editProjId').value;
    const desc = document.getElementById('editProjDesc').value;
    const dem = document.getElementById('editProjDemand').value;
    const dt = document.getElementById('editProjDate').value;
    const status = document.getElementById('editProjStatus').value;
    const newMember = document.getElementById('editProjMember').value;

    if (!desc || !dem || !dt || !newMember) return showToast("Preencha todos os campos da tarefa", "error");
    const [y, m, d] = dt.split('-');

    try {
        await updateDoc(doc(db, "projetos", id), {
            desc: desc,
            demandante: dem,
            dataAtv: `${d}/${m}/${y}`,
            status: status,
            membroResponsavel: newMember
        });
        window.fecharModalEditProj();
        showToast("Tarefa atualizada com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar tarefa", "error");
    }
}

// ====== LÓGICA DA EQUIPE ======
window.abrirModalEquipe = function () {
    document.getElementById('modalEquipe').classList.add('show');
}

window.fecharModalEquipe = function () {
    document.getElementById('modalEquipe').classList.remove('show');
}

window.adicionarMembro = async function () {
    const nome = document.getElementById('novoMembroNome').value.trim();
    if (!nome) return showToast("Digite um nome", "error");

    if (membrosEquipe.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
        return showToast("Membro já existe", "error");
    }

    try {
        await addDoc(collection(db, "equipe"), { nome });
        document.getElementById('novoMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function (idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe? (Suas tarefas não sumirão fisicamente, mas a guia de visão com este nome desaparecerá).`)) return;
    try {
        await deleteDoc(doc(db, "equipe", idMembro));
        if (currentMember === nomeMembro) currentMember = null;
        showToast("Membro removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaEquipeGerenciar() {
    const container = document.getElementById('listaEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';
    if (membrosEquipe.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center">Nenhum membro.</p>';
        return;
    }
    membrosEquipe.forEach(m => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML = `
            <span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ${m.nome}</span>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onclick="window.removerMembro('${m.firebaseId}', '${m.nome}')"><i class="ph ph-trash"></i></button>
        `;
        container.appendChild(div);
    });
}

if (currentUser) initApp();

document.addEventListener("DOMContentLoaded", () => {
    const elDev = document.getElementById('devNameDisplay');
    const elVer = document.getElementById('appVersionDisplay');
    if (elDev) elDev.innerText = appConfig.desenvolvedor;
    if (elVer) elVer.innerText = appConfig.versao;
});

// ====== LÓGICA DE ATAS DE REUNIÃO ======
window.salvarAta = async function () {
    const titulo = document.getElementById('ataTitulo').value.trim();
    const texto = document.getElementById('ataTexto').value.trim();
    if (!titulo || !texto) return showToast("Preencha o título e o texto da ata", "error");

    const dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await addDoc(collection(db, "atas"), {
            titulo: titulo,
            texto: texto,
            autor: currentUser,
            dataStr: dStr,
            timestamp: Date.now()
        });
        document.getElementById('ataTitulo').value = '';
        document.getElementById('ataTexto').value = '';
        showToast("Ata salva com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar ata", "error");
    }
}

window.deletarAta = async function (id) {
    if (!confirm("Atenção: Tem certeza que deseja excluir esta Ata permanentemente?")) return;
    try {
        await deleteDoc(doc(db, "atas", id));
        showToast("Ata apagada.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao apagar", "error");
    }
}

function renderizarAtas() {
    const container = document.getElementById('listaAtasContainer');
    if (!container) return;

    container.innerHTML = '';

    if (sysAtas.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]"><i class="ph ph-file-text text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhuma ata registrada</h2></div>`;
        return;
    }

    sysAtas.forEach(a => {
        const div = document.createElement('div');
                <div>
                    <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: var(--text-main);">${a.titulo}</h3>
                    <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="ph ph-calendar"></i> Registrado em ${a.dataStr} por <strong>${a.autor}</strong></div>
                </div>
                <div>
                    <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="window.deletarAta('${a.firebaseId}')"><i class="ph ph-trash"></i> Excluir</button>
                </div>
            </div>
            <div style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">${a.texto}</div>
        `;

        div.innerHTML = header;
        container.appendChild(div);
    });
}


