// js/controllers/LojasChamadosController.js — Cards de lojas + modal + CRUD de chamados
// Depends on: firebase-init.js, data.js (lojasIniciais), AppController.js (showToast, currentUser)

window.sysLogs = {};
let lojaAtualId = null;
window.tempResponsaveisLogCriacao = [];
window.tempResponsaveisLogEdit = [];

function renderizarTagsResponsaveisLog(containerId, lista, removeFnName) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    lista.forEach(function (nome) {
        var tag = document.createElement('span');
        tag.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold shadow-sm animate-fadeIn';
        tag.innerHTML = '<span>' + nome + '</span><i class="ph ph-x cursor-pointer hover:text-black/50 transition-colors" onclick="' + removeFnName + '(\'' + nome + '\')"></i>';
        container.appendChild(tag);
    });
}

window.adicionarResponsavelLogCriacao = function (nome) {
    if (!nome || window.tempResponsaveisLogCriacao.indexOf(nome) !== -1) return;
    window.tempResponsaveisLogCriacao.push(nome);
    renderizarTagsResponsaveisLog('selectedResponsaveisLogCreation', window.tempResponsaveisLogCriacao, 'window.removerResponsavelLogCriacao');
}

window.removerResponsavelLogLogCriacao = function (nome) {
    window.tempResponsaveisLogCriacao = window.tempResponsaveisLogCriacao.filter(function (n) { return n !== nome; });
    renderizarTagsResponsaveisLog('selectedResponsaveisLogCreation', window.tempResponsaveisLogCriacao, 'window.removerResponsavelLogLogCriacao');
}

// Pequeno fix no nome para bater com o onchange do HTML
window.removerResponsavelLogCriacao = window.removerResponsavelLogLogCriacao;

window.adicionarResponsavelLogEdit = function (nome) {
    if (!nome || window.tempResponsaveisLogEdit.indexOf(nome) !== -1) return;
    window.tempResponsaveisLogEdit.push(nome);
    renderizarTagsResponsaveisLog('selectedResponsaveisLogEdit', window.tempResponsaveisLogEdit, 'window.removerResponsavelLogEdit');
}

window.removerResponsavelLogEdit = function (nome) {
    window.tempResponsaveisLogEdit = window.tempResponsaveisLogEdit.filter(function (n) { return n !== nome; });
    renderizarTagsResponsaveisLog('selectedResponsaveisLogEdit', window.tempResponsaveisLogEdit, 'window.removerResponsavelLogEdit');
}

window.initLojasChamadosListeners = function () {
    try {
        var qLogs = query(collection(db, "logs"), orderBy("timestamp", "desc"));
        onSnapshot(qLogs, function (snapshot) {
            window.sysLogs = {};
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                data.firebaseId = docSnap.id;
                if (!window.sysLogs[data.lojaId]) window.sysLogs[data.lojaId] = [];
                window.sysLogs[data.lojaId].push(data);
            });
            window.renderizarLojas();
            if (typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
            if (typeof window.atualizarGraficoChamados === 'function') window.atualizarGraficoChamados();
            if (typeof window.renderizarMarcadoresMapa === 'function') window.renderizarMarcadoresMapa();
            if (lojaAtualId !== null) renderizarComentarios(window.sysLogs[lojaAtualId] || []);

            // Executar correção retroativa uma única vez se necessário
            if (!localStorage.getItem('fix_resolucao_20260320')) {
                window.corrigirResolvidosRetroativo().then(() => {
                    localStorage.setItem('fix_resolucao_20260320', 'true');
                });
            }
        });
    } catch (e) {
        console.error("Erro ao iniciar listener logs", e);
    }
}

window.criarCardLojaHTML = function (loja, logs) {
    var pendentes = logs.filter(function (l) { return !l.resolvido; });
    var temPendente = pendentes.length > 0;
    var statusColor = logs.length > 0 ? (temPendente ? 'var(--sp-red)' : 'var(--success)') : 'var(--border)';
    var statusBg = logs.length > 0 ? (temPendente ? 'rgba(218,13,23,0.1)' : 'rgba(16,185,129,0.1)') : 'var(--bg-color)';
    var darkStatusBg = logs.length > 0 ? (temPendente ? 'rgba(218,13,23,0.2)' : 'rgba(16,185,129,0.2)') : 'transparent';

    var card = document.createElement('div');
    card.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer relative overflow-hidden group';
    card.style.borderLeftColor = statusColor;
    card.style.borderLeftWidth = '4px';
    card.onclick = function () { abrirModal(loja.id, loja.nome, loja.estado); };

    var preview = '<div class="mt-4"><div class="flex flex-col items-center justify-center p-4 text-center text-[var(--text-muted)] bg-[var(--bg-color)] rounded-lg border border-dashed border-[var(--border)]"><i class="ph ph-check-circle text-2xl mb-2"></i><p class="m-0 text-sm font-medium">Sistema operando normalmente</p></div></div>';

    if (logs.length > 0) {
        var logsExibidos = temPendente ? pendentes : [logs[0]];
        var logsHtml = '';

        logsExibidos.forEach(function (logItem, index) {
            var iconStatus = logItem.resolvido ? '<i class="ph-fill ph-check-circle text-[var(--success)]"></i>' : '<i class="ph-fill ph-warning-circle text-[var(--danger)]"></i>';
            var marginStyle = index < logsExibidos.length - 1 ? 'mb-3 pb-3 border-b border-[var(--border)]' : '';
            logsHtml +=
                '<div class="' + marginStyle + '">' +
                    '<div class="flex justify-between items-center text-xs text-[var(--text-muted)] mb-2 font-semibold">' +
                        '<span class="flex items-center gap-1.5">' + iconStatus + ' ' + logItem.dataStr + '</span>' +
                        '<span class="flex items-center gap-1"><i class="ph ph-user"></i> ' + logItem.autor + '</span>' +
                    '</div>' +
                    '<div class="text-sm text-[var(--text-main)] leading-relaxed line-clamp-2">' + logItem.texto + '</div>' +
                    '<span class="inline-block px-2 py-0.5 mt-2 rounded-md text-xs font-bold bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] dark:bg-[rgba(var(--primary-rgb),0.2)] dark:text-blue-400 border border-[var(--primary)]/20">' + (logItem.tag || 'Geral') + '</span>' +
                '</div>';
        });

        preview =
            '<div class="mt-4 bg-[var(--bg-color)] rounded-lg p-3 border border-[var(--border)] max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">' +
                '<div class="text-[0.75rem] text-[var(--text-muted)] mb-2 font-bold pb-1 border-b border-[var(--border)]">' +
                    (temPendente ? (pendentes.length + ' ocorrência(s) pendente(s)') : 'Última ocorrência:') +
                '</div>' +
                logsHtml +
            '</div>';
    }

    card.innerHTML =
        '<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[' + statusBg + '] dark:from-[' + darkStatusBg + '] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>' +
        '<div class="flex justify-between items-start mb-1 relative z-10">' +
            '<h3 class="text-lg font-bold text-[var(--text-main)] m-0 group-hover:text-[var(--primary)] transition-colors">' + loja.nome + '</h3>' +
            '<span class="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border)] shadow-sm">' + loja.estado + '</span>' +
        '</div>' +
        preview;
    return card;
}

window.renderizarLojas = function () {
    var container = document.getElementById('lojas-container');
    if (!container) return;

    var filterStatus = document.getElementById('statusFilter').value;
    var filterTag = document.getElementById('tagFilter') ? document.getElementById('tagFilter').value : 'todas';
    var filterSetor = document.getElementById('setorFilter') ? document.getElementById('setorFilter').value : 'todos';
    var sortOrder = document.getElementById('sortOrder').value;
    var search = document.getElementById('searchInput').value.toLowerCase();

    container.innerHTML = '';

    var lojasProcessadas = [];
    lojasIniciais.forEach(function (loja) {
        if (!loja.nome.toLowerCase().includes(search) && !loja.estado.toLowerCase().includes(search)) return;

        var logs = window.sysLogs[loja.id] || [];
        if (filterTag !== 'todas') logs = logs.filter(function (l) { return (l.tag || 'Geral') === filterTag || (filterTag === 'Geral' && !l.tag); });
        if (filterSetor !== 'todos') logs = logs.filter(function (l) { return (l.setor || '') === filterSetor; });
        if ((filterTag !== 'todas' || filterSetor !== 'todos') && logs.length === 0) return;

        var pendentes = logs.filter(function (l) { return !l.resolvido; });
        if (filterStatus === 'pendente' && pendentes.length === 0) return;
        if (filterStatus === 'resolvido' && (logs.length === 0 || pendentes.length > 0)) return;

        lojasProcessadas.push({ loja: loja, logs: logs });
    });

    if (lojasProcessadas.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]"><i class="ph ph-magnifying-glass text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum resultado encontrado</h2></div>';
        return;
    }

    if (sortOrder === 'estado-az') {
        var estadosUnicos = [];
        lojasProcessadas.forEach(function (lp) { if (estadosUnicos.indexOf(lp.loja.estado) === -1) estadosUnicos.push(lp.loja.estado); });
        estadosUnicos.sort();
        estadosUnicos.forEach(function (est) {
            var section = document.createElement('div');
            section.className = 'mb-8';
            section.innerHTML = '<h2 class="text-xl font-bold text-[var(--primary)] mb-4 border-b border-[var(--border)] pb-2">Regional ' + est + '</h2>';
            var grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

            lojasProcessadas.filter(function (lp) { return lp.loja.estado === est; })
                .sort(function (a, b) { return a.loja.nome.localeCompare(b.loja.nome); })
                .forEach(function (lp) { grid.appendChild(criarCardLojaHTML(lp.loja, lp.logs)); });

            section.appendChild(grid);
            container.appendChild(section);
        });
    } else {
        var grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

        if (sortOrder === 'recentes') {
            lojasProcessadas.sort(function (a, b) {
                var timeA = a.logs.length > 0 ? a.logs[0].timestamp : 0;
                var timeB = b.logs.length > 0 ? b.logs[0].timestamp : 0;
                return timeB - timeA;
            });
        } else if (sortOrder === 'pendentes-topo') {
            lojasProcessadas.sort(function (a, b) {
                var pendentesA = a.logs.filter(function (l) { return !l.resolvido; }).length > 0 ? 1 : 0;
                var pendentesB = b.logs.filter(function (l) { return !l.resolvido; }).length > 0 ? 1 : 0;
                if (pendentesA !== pendentesB) return pendentesB - pendentesA;
                return a.loja.nome.localeCompare(b.loja.nome);
            });
        } else {
            lojasProcessadas.sort(function (a, b) { return a.loja.nome.localeCompare(b.loja.nome); });
        }

        lojasProcessadas.forEach(function (lp) { grid.appendChild(criarCardLojaHTML(lp.loja, lp.logs)); });
        container.appendChild(grid);
    }
}

function abrirModal(id, nome, estado) {
    lojaAtualId = id;
    document.getElementById('modalTitle').innerText = nome;
    document.getElementById('modalEstado').innerText = estado;
    
    // Popular responsáveis
    var ids = ['tagRespLog', 'editLogResp'];
    ids.forEach(id => {
        var select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="" selected disabled>+ Selecionar...</option>' + (window.membrosEquipe || []).map(function (m) {
                return '<option value="' + m.nome + '">' + m.nome + '</option>';
            }).join('');
        }
    });

    // Inicializar responsáveis na criação com o usuário logado
    var user = localStorage.getItem('loggedUser') || '';
    if (user && window.tempResponsaveisLogCriacao.length === 0) {
        window.tempResponsaveisLogCriacao = [user];
    }
    renderizarTagsResponsaveisLog('selectedResponsaveisLogCreation', window.tempResponsaveisLogCriacao, 'window.removerResponsavelLogCriacao');

    document.getElementById('modalLoja').classList.add('show');
    
    // Esconder formulário por padrão ao abrir
    var form = document.getElementById('formNovaOcorrencia');
    if (form) form.classList.add('hidden');
    var btn = document.getElementById('btnNovaOcorrenciaContainer');
    if (btn) btn.classList.remove('hidden');

    renderizarComentarios(window.sysLogs[lojaAtualId] || []);
}

window.toggleFormOcorrencia = function() {
    var form = document.getElementById('formNovaOcorrencia');
    var btn = document.getElementById('btnNovaOcorrenciaContainer');
    if (!form || !btn) return;

    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.classList.add('hidden');
    } else {
        form.classList.add('hidden');
        btn.classList.remove('hidden');
    }
}

window.fecharModal = function () {
    document.getElementById('modalLoja').classList.remove('show');
    lojaAtualId = null;
}

window.salvarComentario = async function () {
    var texto = document.getElementById('novoComentario').value;
    var tag = document.getElementById('tagComentario').value;
    var setor = document.getElementById('setorComentario').value;
    var inputAnexo = document.getElementById('anexoComentario');
    var anexoUrl = inputAnexo ? inputAnexo.value.trim() : null;
    if (!texto.trim() || window.tempResponsaveisLogCriacao.length === 0) return showToast("Descrição e responsáveis são obrigatórios", "error");

    var dt = document.getElementById('tagPrazoLog').value;
    var dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    var prazoFormatado = null;
    if (dt) {
        var parts = dt.split('-');
        prazoFormatado = parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    try {
        await addDoc(collection(db, "logs"), {
            lojaId: lojaAtualId, dataStr: dStr, texto: texto, tag: tag,
            setor: setor, anexoUrl: anexoUrl || null, resolvido: false,
            autor: currentUser, timestamp: Date.now(),
            prazo: prazoFormatado, 
            responsavel: window.tempResponsaveisLogCriacao[0],
            responsaveis: window.tempResponsaveisLogCriacao,
            atualizacoes: []
        });

        if (typeof window.emitNotification === 'function') {
            window.tempResponsaveisLogCriacao.forEach(r => {
                if (r !== 'Geral') {
                    window.emitNotification(r, `Você foi marcado em um chamado: ${document.getElementById('modalTitle').innerText}`, "setores/TI/index.html?view=lojas");
                }
            });
        }

        document.getElementById('novoComentario').value = '';
        document.getElementById('setorComentario').value = '';
        document.getElementById('tagPrazoLog').value = '';
        if (inputAnexo) inputAnexo.value = '';
        
        window.tempResponsaveisLogCriacao = [localStorage.getItem('loggedUser') || ''];
        renderizarTagsResponsaveisLog('selectedResponsaveisLogCreation', window.tempResponsaveisLogCriacao, 'window.removerResponsavelLogCriacao');
        
        window.toggleFormOcorrencia(); // Esconder após salvar
        showToast("Ocorrência registrada");
        if (typeof window.registrarAtividade === 'function') {
            window.registrarAtividade('chamado', `Novo chamado para ${document.getElementById('modalTitle').innerText}: ${texto.substring(0, 30)}...`);
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar no servidor", "error");
    }
}

window.resolverComentario = async function (firebaseId) {
    try {
        // Encontrar o log nos dados locais para pegar os responsáveis
        var log = null;
        Object.keys(window.sysLogs).forEach(function(lojaId) {
            var found = window.sysLogs[lojaId].find(function(l) { return l.firebaseId === firebaseId; });
            if (found) log = found;
        });

        if (!log) return showToast("Log não encontrado", "error");

        var resps = log.responsaveis && log.responsaveis.length > 0 ? log.responsaveis : [log.responsavel || log.autor];
        var autores = resps.join(', ');

        var dataResolucao = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        await updateDoc(doc(db, "logs", firebaseId), {
            resolvido: true, 
            autorResolucao: autores, 
            dataResolucao: dataResolucao,
            timestampResolvido: Date.now()
        });
        showToast("Ocorrência marcada como resolvida");
        if (typeof window.registrarAtividade === 'function') {
            window.registrarAtividade('chamado', `Chamado resolvido (Atribuído a ${autores}) por ${currentUser}`);
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar registro", "error");
    }
}

// Função para corrigir chamados já resolvidos retroativamente
window.corrigirResolvidosRetroativo = async function() {
    try {
        showToast("Iniciando correção retroativa...");
        const qSnapshot = await getDocs(collection(db, "logs"));
        let count = 0;
        
        for (const docSnap of qSnapshot.docs) {
            const data = docSnap.data();
            if (data.resolvido && data.autorResolucao) {
                const resps = data.responsaveis && data.responsaveis.length > 0 ? data.responsaveis : [data.responsavel || data.autor];
                const novoAutor = resps.join(', ');
                
                // Só atualiza se for diferente para evitar gravações desnecessárias
                if (data.autorResolucao !== novoAutor) {
                    await updateDoc(doc(db, "logs", docSnap.id), { autorResolucao: novoAutor });
                    count++;
                }
            }
        }
        showToast("Correção finalizada! " + count + " chamados atualizados.");
    } catch (e) {
        console.error("Erro na correção retroativa:", e);
        showToast("Erro ao processar correção retroativa", "error");
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

window.reabrirComentario = async function (firebaseId) {
    try {
        await updateDoc(doc(db, "logs", firebaseId), {
            resolvido: false,
            autorResolucao: deleteField(), // Usando o wrapper global definido no firebase-init.js
            dataResolucao: deleteField(),
            timestampResolvido: deleteField()
        });
        showToast("Ocorrência reaberta");
        if (typeof window.registrarAtividade === 'function') {
            window.registrarAtividade('chamado', `Chamado reaberto por ${currentUser}`);
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao reabrir ocorrência: " + (e.message || e), "error");
    }
}

function renderizarComentarios(hist) {
    var container = document.getElementById('listaComentarios');
    if (!container) return;
    container.innerHTML = '';

    if (hist.length === 0) {
        container.innerHTML = '<p class="text-center text-[var(--text-muted)] p-5">Nenhum histórico.</p>';
        return;
    }

    hist.forEach(function (c) {
        var div = document.createElement('div');
        var resolveColor = c.resolvido ? 'var(--success)' : 'var(--sp-red)';
        var resolveBg = c.resolvido ? 'rgba(16,185,129,0.05)' : 'rgba(218,13,23,0.05)';
        div.className = 'p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-color)] shadow-sm relative overflow-hidden group';
        div.style.borderLeftColor = resolveColor;
        div.style.borderLeftWidth = '4px';

        var badgePrazo = c.prazo ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-extrabold bg-black/5 dark:bg-white/10 border border-[var(--border)] text-[var(--text-main)]"><i class="ph ph-calendar"></i> ' + c.prazo + '</span>' : '';
        
        var resps = c.responsaveis && c.responsaveis.length > 0 ? c.responsaveis : [c.responsavel || c.autor];
        var badgeResp = resps.map(r => '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-extrabold bg-[var(--primary)] text-white border border-[var(--primary)]"><i class="ph ph-user-check"></i> ' + r + '</span>').join(' ');

        var totalComments = (c.atualizacoes || []).length;
        var commentBtn = '<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.7rem] font-bold rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all" onclick="window.abrirModalCommentsLog(\'' + c.firebaseId + '\')"><i class="ph ph-chat-centered-dots"></i> ' + (totalComments > 0 ? totalComments + ' Comentários' : 'Comentar') + '</button>';

        var htmlButtons = '';
        htmlButtons += '<div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">';
        htmlButtons += '<button class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm transition-colors" onclick="window.abrirModalEditLog(\'' + c.firebaseId + '\')" title="Editar"><i class="ph ph-pencil"></i></button>';
        htmlButtons += '<button class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-colors" onclick="window.deletarComentario(\'' + c.firebaseId + '\')" title="Excluir"><i class="ph ph-trash"></i></button>';
        htmlButtons += '</div>';

        var resolveSection = '';
        if (!c.resolvido) {
            resolveSection = '<button class="inline-flex items-center justify-center gap-1.5 px-4 py-2 font-semibold rounded-lg bg-[var(--success)] text-white shadow hover:brightness-110 transition-all text-xs" onclick="window.resolverComentario(\'' + c.firebaseId + '\')"><i class="ph ph-check font-bold"></i> Resolver</button>';
        } else {
            resolveSection = '<div class="flex flex-col gap-0.5"><span class="text-[var(--success)] font-bold text-[0.7rem] flex items-center gap-1"><i class="ph-fill ph-check-circle text-base"></i> Resolvido</span>' +
                             '<button class="text-[0.6rem] font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1 mt-0.5" onclick="window.reabrirComentario(\'' + c.firebaseId + '\')"><i class="ph ph-arrow-u-up-left"></i> Reabrir</button></div>';
        }

        var setorBadge = c.setor ? '<span class="inline-block px-2 py-0.5 rounded-md text-[0.65rem] font-bold bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] ml-1">📍 ' + c.setor + '</span>' : '';

        var anexoHtml = '';
        if (c.anexoUrl) {
            var isImg = c.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
            if (isImg) {
                anexoHtml = '<div class="mt-3"><a href="' + c.anexoUrl + '" target="_blank"><img src="' + c.anexoUrl + '" class="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-cover shadow-sm"></a></div>';
            } else {
                anexoHtml = '<div class="mt-3"><a href="' + c.anexoUrl + '" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text-main)] text-[0.7rem] font-bold border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline"><i class="ph ph-link"></i> Ver Link/Anexo</a></div>';
            }
        }

        var recentUpdatesHtml = '';
        var updates = (c.atualizacoes || []).sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
        if (updates.length > 0) {
            recentUpdatesHtml = '<div class="mt-3 pt-3 border-t border-[var(--border)] border-dashed flex flex-col gap-2">';
            updates.forEach(up => {
                recentUpdatesHtml += 
                    '<div class="flex items-start gap-2 text-[0.7rem] bg-black/5 dark:bg-white/5 p-2 rounded-lg">' +
                        '<span class="font-bold text-[var(--primary)] shrink-0">' + up.autor + ':</span>' +
                        '<span class="text-[var(--text-main)] font-medium leading-tight">' + up.texto + '</span>' +
                    '</div>';
            });
            recentUpdatesHtml += '</div>';
        }

        div.innerHTML =
            '<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[' + resolveBg + '] to-transparent pointer-events-none opacity-30"></div>' +
            htmlButtons +
            '<div class="flex justify-between items-start mb-3 relative z-10 flex-wrap gap-2 pr-10">' + 
                '<div class="flex flex-col">' +
                    '<span class="font-bold text-[var(--text-main)] flex items-center gap-1.5 text-sm md:text-base"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)]"></i> ' + c.autor + '</span>' +
                    '<span class="text-[0.65rem] text-[var(--text-muted)] mt-0.5">' + c.dataStr + '</span>' +
                '</div>' +
                '<div class="flex flex-wrap gap-1 items-center">' +
                    '<span class="inline-block px-2.5 py-1 rounded-md text-[0.65rem] font-bold bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] dark:bg-[rgba(var(--primary-rgb),0.2)] dark:text-blue-400 border border-[var(--primary)]/20">' + (c.tag || 'Geral') + '</span>' +
                    setorBadge +
                '</div>' +
            '</div>' +
            '<div class="text-[var(--text-main)] text-sm leading-relaxed whitespace-pre-line mb-4 relative z-10 px-1">' + c.texto + anexoHtml + recentUpdatesHtml + '</div>' +
            '<div class="flex flex-wrap justify-between items-center pt-3 border-t border-[var(--border)] gap-y-3 relative z-10">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                    resolveSection +
                    commentBtn +
                '</div>' +
                '<div class="flex flex-wrap items-center gap-1.5 justify-end flex-1 ml-4">' +
                    badgePrazo + ' ' + badgeResp +
                '</div>' +
            '</div>';
        container.appendChild(div);
    });
}

// ====== EDIÇÃO DE CHAMADOS ======
window.abrirModalEditLog = function (firebaseId) {
    var log = (window.sysLogs[lojaAtualId] || []).find(function (l) { return l.firebaseId === firebaseId; });
    if (!log) return;
    document.getElementById('editLogId').value = firebaseId;
    document.getElementById('editLogTexto').value = log.texto;
    document.getElementById('editLogTag').value = log.tag || 'Hardware';
    document.getElementById('editLogSetor').value = log.setor || '';
    
    var viewResps = log.responsaveis && log.responsaveis.length > 0 ? log.responsaveis : [log.responsavel || log.autor];
    window.tempResponsaveisLogEdit = [...viewResps];
    renderizarTagsResponsaveisLog('selectedResponsaveisLogEdit', window.tempResponsaveisLogEdit, 'window.removerResponsavelLogEdit');

    // Datas na edição
    if (log.prazo) {
        var pParts = log.prazo.split('/');
        document.getElementById('editLogPrazo').value = pParts[2] + '-' + pParts[1] + '-' + pParts[0];
    } else {
        document.getElementById('editLogPrazo').value = '';
    }

    document.getElementById('modalEditLog').classList.add('show');
}

window.fecharModalEditLog = function () {
    document.getElementById('modalEditLog').classList.remove('show');
}

window.confirmarEdicaoLog = async function () {
    var id = document.getElementById('editLogId').value;
    var texto = document.getElementById('editLogTexto').value;
    var tag = document.getElementById('editLogTag').value;
    var setor = document.getElementById('editLogSetor').value;
    var dt = document.getElementById('editLogPrazo').value;

    if (!texto.trim() || window.tempResponsaveisLogEdit.length === 0) return showToast("Descrição e responsáveis são obrigatórios", "error");

    var prazoFormatado = null;
    if (dt) {
        var parts = dt.split('-');
        prazoFormatado = parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    try {
        await updateDoc(doc(db, "logs", id), { 
            texto: texto, tag: tag, setor: setor,
            prazo: prazoFormatado, 
            responsavel: window.tempResponsaveisLogEdit[0],
            responsaveis: window.tempResponsaveisLogEdit
        });

        if (typeof window.emitNotification === 'function') {
            window.tempResponsaveisLogEdit.forEach(r => {
                if (r !== 'Geral') {
                    window.emitNotification(r, `Um chamado foi atualizado: ${texto.substring(0, 30)}...`, "setores/TI/index.html?view=lojas");
                }
            });
        }

        window.fecharModalEditLog();
        showToast("Chamado atualizado com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar chamado", "error");
    }
}

// ====== COMENTÁRIOS DE CHAMADOS (NESTED) ======
window.abrirModalCommentsLog = function (firebaseId) {
    var log = (window.sysLogs[lojaAtualId] || []).find(function (l) { return l.firebaseId === firebaseId; });
    if (!log) return;

    document.getElementById('commentLogId').value = log.firebaseId;
    document.getElementById('commentLogLoja').innerText = "Loja: " + document.getElementById('modalTitle').innerText;
    document.getElementById('commentLogTexto').innerText = log.texto;

    renderizarAtualizacoesChamado(log.atualizacoes || []);
    document.getElementById('modalCommentsLog').classList.add('show');
}

window.fecharModalCommentsLog = function () {
    document.getElementById('modalCommentsLog').classList.remove('show');
}

function renderizarAtualizacoesChamado(lista) {
    var container = document.getElementById('listaComentariosLog');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"><i class="ph ph-chat-circle-text text-4xl mb-3 opacity-20"></i><p class="m-0 text-sm">Nenhuma atualização registrada.</p></div>';
        return;
    }

    lista.sort((a,b) => a.timestamp - b.timestamp).forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'mb-4 last:mb-0';
        div.innerHTML =
            '<div class="flex gap-3">' +
                '<div class="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shrink-0">' + (c.autor ? c.autor.charAt(0).toUpperCase() : '?') + '</div>' +
                '<div class="flex-1">' +
                    '<div class="flex items-center gap-2 mb-1">' +
                        '<span class="font-bold text-xs text-[var(--text-main)]">' + c.autor + '</span>' +
                        '<span class="text-[0.65rem] text-[var(--text-muted)]">' + c.data + '</span>' +
                    '</div>' +
                    '<div class="bg-[var(--bg-color)] p-3 rounded-2xl rounded-tl-none border border-[var(--border)] text-sm text-[var(--text-main)] shadow-sm">' + c.texto + '</div>' +
                '</div>' +
            '</div>';
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

window.salvarComentarioLog = async function () {
    var id = document.getElementById('commentLogId').value;
    var texto = document.getElementById('novoComentarioLog').value.trim();
    if (!texto) return;

    var log = (window.sysLogs[lojaAtualId] || []).find(function (l) { return l.firebaseId === id; });
    if (!log) return;

    var novasAtualizacoes = log.atualizacoes || [];
    novasAtualizacoes.push({
        autor: currentUser,
        texto: texto,
        timestamp: Date.now(),
        data: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    });

    try {
        await updateDoc(doc(db, "logs", id), { atualizacoes: novasAtualizacoes });

        if (typeof window.emitNotification === 'function' && log.responsaveis) {
            var lojaDisplay = document.getElementById('commentLogLoja') ? document.getElementById('commentLogLoja').innerText.replace('Loja: ','') : 'Loja';
            log.responsaveis.forEach(r => {
                if (r !== currentUser && r !== 'Geral') {
                    window.emitNotification(r, `Nova atualização de chamado (${lojaDisplay}): ${texto.substring(0, 30)}...`, "setores/TI/index.html?view=lojas");
                }
            });
        }

        document.getElementById('novoComentarioLog').value = '';
        renderizarAtualizacoesChamado(novasAtualizacoes);
        showToast("Atualização registrada");
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar atualização", "error");
    }
}

// CSV Export de Chamados
function escapeCSV(text) {
    if (text == null) return "N/A";
    var str = String(text);
    if (str.search(/("|,|\n)/g) >= 0) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}
window.escapeCSV = escapeCSV;

window.exportarCSV = function () {
    var csvContent = "\uFEFFID_Loja,Nome_Loja,Estado,Data_Criacao,Autor,Tag,Setor,Status,Autor_Resolucao,Data_Resolucao,Descricao\n";
    lojasIniciais.forEach(function (loja) {
        var hist = window.sysLogs[loja.id] || [];
        hist.forEach(function (l) {
            var status = l.resolvido ? "Resolvido" : "Pendente";
            var row = [
                loja.id, loja.nome, loja.estado, l.dataStr, l.autor,
                l.tag || 'Geral', l.setor || 'N/A', status,
                l.autorResolucao || "N/A", l.dataResolucao || "N/A",
                l.texto || ""
            ].map(escapeCSV).join(",");
            csvContent += row + "\n";
        });
    });
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var encodedUri = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_ti_chamados_" + new Date().getTime() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de chamados iniciado");
}

window.limparFiltrosLojas = function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const tagFilter = document.getElementById('tagFilter');
    const setorFilter = document.getElementById('setorFilter');
    const sortOrder = document.getElementById('sortOrder');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'todos';
    if (tagFilter) tagFilter.value = 'todas';
    if (setorFilter) setorFilter.value = 'todos';
    if (sortOrder) sortOrder.value = 'recentes';

    window.renderizarLojas();
    showToast('Filtros limpos', 'success');
}
