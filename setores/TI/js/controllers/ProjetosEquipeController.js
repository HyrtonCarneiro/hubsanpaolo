// js/controllers/ProjetosEquipeController.js — Kanban de projetos + equipe CRUD + CSV export
// Depends on: firebase-init.js, AppController.js (showToast, currentUser, currentMember)

window.sysProjetos = {};
window.membrosEquipe = [];

window.initProjetosEquipeListeners = function () {
    try {
        var qProjetos = query(collection(db, "projetos"), orderBy("timestamp", "desc"));
        onSnapshot(qProjetos, function (snapshot) {
            window.sysProjetos = {};
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                data.firebaseId = docSnap.id;
                if (!window.sysProjetos[data.membroResponsavel]) {
                    window.sysProjetos[data.membroResponsavel] = [];
                }
                window.sysProjetos[data.membroResponsavel].push(data);
            });
            renderizarProjetosList();
            if (typeof window.atualizarGraficos === 'function') window.atualizarGraficos();
        });

        var qEquipe = query(collection(db, "equipe"), orderBy("nome"));
        onSnapshot(qEquipe, function (snapshot) {
            window.membrosEquipe = [];
            snapshot.forEach(function (docSnap) { window.membrosEquipe.push({ firebaseId: docSnap.id, ...docSnap.data() }); });
            if (window.membrosEquipe.length > 0 && (!window.currentMember || !window.membrosEquipe.find(function (m) { return m.nome === window.currentMember; }))) {
                window.currentMember = window.membrosEquipe[0].nome;
            }
            renderizarBotoesEquipe();
            renderizarSelectResponsaveis();
            renderizarProjetosList();
            renderizarListaEquipeGerenciar();
        });
    } catch (e) {
        console.error("Erro ao iniciar listeners projetos/equipe", e);
    }
}

window.switchMember = function (name) {
    window.currentMember = name;
    renderizarBotoesEquipe();
    renderizarProjetosList();
}

function renderizarBotoesEquipe() {
    var container = document.getElementById('membrosEquipeContainer');
    if (!container) return;
    container.innerHTML = '';
    window.membrosEquipe.forEach(function (m) {
        var btn = document.createElement('button');
        btn.className = m.nome === window.currentMember
            ? 'px-4 py-2 rounded-lg bg-[var(--primary)] text-white border border-[var(--primary)] font-semibold shadow-sm transition-all text-sm'
            : 'px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] font-semibold transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] text-sm';
        btn.innerText = m.nome;
        btn.onclick = function () { window.switchMember(m.nome); };
        container.appendChild(btn);
    });
}

function renderizarSelectResponsaveis() {
    var select = document.getElementById('projResp');
    if (!select) return;
    select.innerHTML = window.membrosEquipe.map(function (m) {
        return '<option value="' + m.nome + '" ' + (m.nome === window.currentMember ? 'selected' : '') + '>' + m.nome + '</option>';
    }).join('');
}

window.salvarProjeto = async function () {
    if (!window.currentMember) return showToast("Selecione ou crie um membro da equipe antes", "error");
    var desc = document.getElementById('projDesc').value;
    var dem = document.getElementById('projDemand').value;
    var dt = document.getElementById('projDate').value;
    var status = document.getElementById('projStatus').value;
    var fileInput = document.getElementById('projAnexo');

    var resp = document.getElementById('projResp').value;

    if (!desc || !dem || !dt || !resp) return showToast("Preencha os dados do projeto", "error");
    var parts = dt.split('-');
    var anexoUrl = fileInput ? fileInput.value.trim() : null;

    try {
        await addDoc(collection(db, "projetos"), {
            membroResponsavel: resp,
            dataAtv: parts[2] + '/' + parts[1] + '/' + parts[0],
            desc: desc, demandante: dem, status: status,
            anexoUrl: anexoUrl, autor: currentUser, timestamp: Date.now(),
            comentarios: []
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
    var container = document.getElementById('projetos-list');
    if (!container) return;
    var projs = window.sysProjetos[window.currentMember] || [];
    container.innerHTML = '';

    if (projs.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] col-span-1 lg:col-span-3 rounded-xl border border-dashed border-[var(--border)] w-full"><i class="ph ph-kanban text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum registro para ' + (window.currentMember || 'esta equipe') + '</h2></div>';
        return;
    }

    var colunas = [
        { id: 'Pendente', titulo: 'Pendentes', classBadge: 'bg-[rgba(218,13,23,0.1)] text-[var(--sp-red)] dark:bg-[rgba(218,13,23,0.2)] dark:text-red-400 border-[var(--sp-red)]/20', borderColor: 'var(--sp-red)' },
        { id: 'Em Andamento', titulo: 'Em Andamento', classBadge: 'bg-[rgba(38,93,124,0.1)] text-[var(--sp-aoleite)] dark:bg-[rgba(38,93,124,0.2)] dark:text-blue-400 border-[var(--sp-aoleite)]/20', borderColor: 'var(--sp-aoleite)' },
        { id: 'Concluído', titulo: 'Concluídos', classBadge: 'bg-[rgba(16,185,129,0.1)] text-[var(--success)] dark:bg-[rgba(16,185,129,0.2)] dark:text-emerald-400 border-[var(--success)]/20', borderColor: 'var(--success)' }
    ];

    colunas.forEach(function (col) {
        var projsNestaColuna = projs.filter(function (p) { return (p.status || 'Pendente') === col.id; });

        var colDiv = document.createElement('div');
        colDiv.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col h-full overflow-hidden shadow-sm';
        colDiv.innerHTML =
            '<div class="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center bg-black/5 dark:bg-black/20" style="border-top: 3px solid ' + col.borderColor + '">' +
                '<h3 class="text-lg font-bold text-[var(--text-main)] m-0 flex items-center gap-2">' +
                    '<div class="w-2.5 h-2.5 rounded-full" style="background-color: ' + col.borderColor + '"></div>' +
                    col.titulo +
                '</h3>' +
                '<span class="bg-[var(--bg-color)] px-2.5 py-1 rounded-md text-xs font-bold text-[var(--text-main)] border border-[var(--border)] shadow-sm">' + projsNestaColuna.length + '</span>' +
            '</div>' +
            '<div class="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 kanban-items bg-[var(--bg-color)]/50"></div>';
        var itemsContainer = colDiv.querySelector('.kanban-items');

        projsNestaColuna.forEach(function (p) {
            var div = document.createElement('div');
            div.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-move group relative';

            var actionBtns = '';
            actionBtns += '<button class="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--bg-color)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors" onclick="window.abrirModalEditProj(\'' + p.firebaseId + '\')"><i class="ph ph-pencil"></i></button>';
            actionBtns += '<button class="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--bg-color)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onclick="window.deletarProjeto(\'' + p.firebaseId + '\')"><i class="ph ph-trash"></i></button>';

            var urlBadge = '';
            if (p.anexoUrl) {
                var isImg = p.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
                if (isImg) {
                    urlBadge = '<a href="' + p.anexoUrl + '" target="_blank" class="shrink-0"><img src="' + p.anexoUrl + '" class="h-6 rounded border border-[var(--border)] object-cover shadow-sm hover:opacity-80 transition-opacity"></a>';
                } else {
                    urlBadge = '<a href="' + p.anexoUrl + '" target="_blank" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-color)] text-[var(--text-main)] text-xs font-bold border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline shrink-0"><i class="ph ph-link"></i> Link</a>';
                }
            }

            var totalComments = (p.comentarios || []).length;
            var recentCommentsHtml = '';
            var lastTwo = (p.comentarios || []).slice(-2).reverse();
            if (lastTwo.length > 0) {
                recentCommentsHtml = '<div class="mt-2 mb-3 flex flex-col gap-1.5">';
                lastTwo.forEach(c => {
                    recentCommentsHtml += 
                        '<div class="text-[0.65rem] text-[var(--text-muted)] italic line-clamp-1 border-l-2 border-[var(--primary)]/30 pl-2">' +
                            '<span class="font-bold not-italic text-[var(--primary)]">' + c.autor + ':</span> ' + c.texto +
                        '</div>';
                });
                recentCommentsHtml += '</div>';
            }

            var commentBadge = '<button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[var(--text-main)] text-[0.7rem] font-bold border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all" onclick="window.abrirModalEditProj(\'' + p.firebaseId + '\')"><i class="ph ph-chat-centered-text text-sm"></i> ' + (totalComments > 0 ? totalComments : 'Comentar') + '</button>';

            div.innerHTML =
                '<div class="flex justify-between items-start mb-3">' +
                    '<div class="flex flex-col gap-1">' +
                        '<span class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase ml-1">Prazo</span>' +
                        '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border ' + col.classBadge + '"><i class="ph ph-calendar"></i> ' + p.dataAtv + '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">' + actionBtns + '</div>' +
                '</div>' +
                '<h4 class="text-sm font-semibold text-[var(--text-main)] m-0 mb-3 leading-snug break-words group-hover:text-[var(--primary)] transition-colors">' + p.desc + '</h4>' +
                '<div class="flex justify-between items-center py-3 border-y border-[var(--border)] mb-2 gap-2">' +
                    '<span class="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate" title="Demandante: ' + p.demandante + '"><i class="ph-fill ph-user text-[var(--border)] drop-shadow-sm text-sm"></i> <span class="truncate font-medium text-[var(--text-main)]">' + p.demandante + '</span></span>' +
                    urlBadge +
                '</div>' +
                recentCommentsHtml +
                '<div class="flex justify-end pt-2 border-t border-[var(--border)] border-dashed mt-auto">' + commentBadge + '</div>';
            itemsContainer.appendChild(div);
        });

        container.appendChild(colDiv);
    });
}

// ====== COMENTÁRIOS DE PROJETOS ======
window.abrirModalCommentsProj = function (firebaseId) {
    var p = null;
    Object.keys(window.sysProjetos).forEach(function (m) {
        var found = window.sysProjetos[m].find(function (x) { return x.firebaseId === firebaseId; });
        if (found) p = found;
    });

    if (!p) return;
    document.getElementById('commentProjId').value = p.firebaseId;
    document.getElementById('commentProjTitle').innerText = p.desc;
    renderizarComentariosTarefa(p.comentarios || []);
    document.getElementById('modalCommentsProj').classList.add('show');
}

window.fecharModalCommentsProj = function () {
    document.getElementById('modalCommentsProj').classList.remove('show');
}

function renderizarComentariosTarefa(comentarios) {
    var container = document.getElementById('listaComentariosProj');
    if (!container) return;
    container.innerHTML = '';

    if (comentarios.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]"><i class="ph ph-chat-circle-dots text-4xl mb-3 opacity-20"></i><p class="m-0 text-sm">Nenhum comentário ainda.<br>Seja o primeiro a comentar!</p></div>';
        return;
    }

    comentarios.forEach(function (c) {
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

window.salvarComentarioProjeto = async function () {
    var id = document.getElementById('commentProjId').value;
    var texto = document.getElementById('novoComentarioProj').value.trim();
    if (!texto) return;

    var p = null;
    var membroKey = null;
    Object.keys(window.sysProjetos).forEach(function (m) {
        var found = window.sysProjetos[m].find(function (x) { return x.firebaseId === id; });
        if (found) { p = found; membroKey = m; }
    });

    if (!p) return;

    var novosComentarios = p.comentarios || [];
    novosComentarios.push({
        autor: currentUser,
        texto: texto,
        data: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    });

    try {
        await updateDoc(doc(db, "projetos", id), { comentarios: novosComentarios });
        document.getElementById('novoComentarioProj').value = '';
        renderizarComentariosTarefa(novosComentarios);
        showToast("Comentário adicionado");
    } catch (e) {
        console.error(e);
        showToast("Erro ao comentar", "error");
    }
}

// ====== EDIÇÃO DE PROJETOS ======
window.abrirModalEditProj = function (firebaseId) {
    var p = null;
    Object.keys(window.sysProjetos).forEach(function (m) {
        var found = window.sysProjetos[m].find(function (x) { return x.firebaseId === firebaseId; });
        if (found) p = found;
    });
    
    if (!p) return;
    
    // Preencher campos de edição
    document.getElementById('editProjId').value = p.firebaseId;
    document.getElementById('editProjDesc').value = p.desc;
    document.getElementById('editProjDemand').value = p.demandante;
    var parts = p.dataAtv.split('/');
    if (parts.length === 3) document.getElementById('editProjDate').value = parts[2] + '-' + parts[1] + '-' + parts[0];
    document.getElementById('editProjStatus').value = p.status;

    var mbSelect = document.getElementById('editProjMember');
    if (mbSelect) {
        mbSelect.innerHTML = (window.membrosEquipe || []).map(function (mb) { 
            return '<option value="' + mb.nome + '">' + mb.nome + '</option>'; 
        }).join('');
        mbSelect.value = p.membroResponsavel;
    }

    // Preencher campos de visualização (Detail View)
    document.getElementById('viewProjDemand').innerText = p.demandante;
    document.getElementById('viewProjDate').innerText = p.dataAtv;
    document.getElementById('viewProjResp').innerText = p.membroResponsavel;
    document.getElementById('viewProjStatus').innerText = p.status;
    document.getElementById('viewProjDesc').innerText = p.desc;
    
    // Anexo
    var anexoDiv = document.getElementById('viewProjAnexo');
    anexoDiv.innerHTML = '';
    if (p.anexoUrl) {
        var isImg = p.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
        if (isImg) {
            anexoDiv.innerHTML = '<img src="' + p.anexoUrl + '" class="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-cover shadow-sm">';
        } else {
            anexoDiv.innerHTML = '<a href="' + p.anexoUrl + '" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text-main)] text-sm font-bold border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline"><i class="ph ph-link"></i> Ver Anexo</a>';
        }
    }

    // Comentários no detalhe
    renderizarComentariosTarefaDetalhe(p.comentarios || []);

    // Reset para modo visualização
    var editMode = document.getElementById('taskEditMode');
    var viewMode = document.getElementById('taskViewMode');
    var btnSwitch = document.getElementById('btnSwitchToEditProj');
    var title = document.getElementById('taskModalTitle');

    if (editMode && viewMode && btnSwitch && title) {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        btnSwitch.classList.remove('hidden');
        title.innerText = 'Detalhes da Tarefa';
    }

    document.getElementById('modalEditProj').classList.add('show');
}

window.toggleEditModeProj = function() {
    var editMode = document.getElementById('taskEditMode');
    var viewMode = document.getElementById('taskViewMode');
    var btnSwitch = document.getElementById('btnSwitchToEditProj');
    var title = document.getElementById('taskModalTitle');
    if (!editMode || !viewMode || !btnSwitch || !title) return;

    if (editMode.classList.contains('hidden')) {
        editMode.classList.remove('hidden');
        viewMode.classList.add('hidden');
        btnSwitch.classList.add('hidden');
        title.innerText = 'Editar Tarefa';
    } else {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        btnSwitch.classList.remove('hidden');
        title.innerText = 'Detalhes da Tarefa';
    }
}

function renderizarComentariosTarefaDetalhe(comentarios) {
    var container = document.getElementById('listaComentariosProjDetalhe');
    if (!container) return;
    container.innerHTML = '';

    if (!comentarios || comentarios.length === 0) {
        container.innerHTML = '<p class="text-xs text-[var(--text-muted)] italic">Nenhum comentário.</p>';
        return;
    }

    comentarios.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border)] text-sm';
        div.innerHTML = 
            '<div class="flex justify-between mb-1">' +
                '<span class="font-bold text-xs text-[var(--primary)]">' + c.autor + '</span>' +
                '<span class="text-[0.65rem] text-[var(--text-muted)]">' + c.data + '</span>' +
            '</div>' +
            '<div class="text-[var(--text-main)]">' + c.texto + '</div>';
        container.appendChild(div);
    });
}

window.salvarComentarioProjetoDetalhe = async function() {
    var id = document.getElementById('editProjId').value;
    var texto = document.getElementById('novoComentarioProjDetalhe').value.trim();
    if (!texto) return;

    var p = null;
    var membroKey = null;
    Object.keys(window.sysProjetos).forEach(function (m) {
        var found = window.sysProjetos[m].find(function (x) { return x.firebaseId === id; });
        if (found) { p = found; membroKey = m; }
    });

    if (!p) return;

    var user = sessionStorage.getItem('loggedUser') || 'Usuário';
    var dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    var novoArr = (p.comentarios || []);
    novoArr.push({ autor: user, texto: texto, data: dStr });

    try {
        await updateDoc(doc(db, "projetos", id), { comentarios: novoArr });
        document.getElementById('novoComentarioProjDetalhe').value = '';
        renderizarComentariosTarefaDetalhe(novoArr);
        showToast("Comentário adicionado");
    } catch (e) {
        console.error(e);
        showToast("Erro ao salvar comentário", "error");
    }
}

window.fecharModalEditProj = function () {
    document.getElementById('modalEditProj').classList.remove('show');
}

window.confirmarEdicaoProj = async function () {
    var id = document.getElementById('editProjId').value;
    var desc = document.getElementById('editProjDesc').value;
    var dem = document.getElementById('editProjDemand').value;
    var dt = document.getElementById('editProjDate').value;
    var status = document.getElementById('editProjStatus').value;
    var newMember = document.getElementById('editProjMember').value;

    if (!desc || !dem || !dt || !newMember) return showToast("Preencha todos os campos da tarefa", "error");
    var parts = dt.split('-');

    try {
        await updateDoc(doc(db, "projetos", id), {
            desc: desc, demandante: dem, dataAtv: parts[2] + '/' + parts[1] + '/' + parts[0],
            status: status, membroResponsavel: newMember
        });
        window.fecharModalEditProj();
        showToast("Tarefa atualizada com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar tarefa", "error");
    }
}

// ====== EQUIPE ======
window.abrirModalEquipe = function () {
    document.getElementById('modalEquipe').classList.add('show');
}

window.fecharModalEquipe = function () {
    document.getElementById('modalEquipe').classList.remove('show');
}

window.adicionarMembro = async function () {
    var nome = document.getElementById('novoMembroNome').value.trim();
    if (!nome) return showToast("Digite um nome", "error");
    if (window.membrosEquipe.find(function (m) { return m.nome.toLowerCase() === nome.toLowerCase(); })) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "equipe"), { nome: nome });
        document.getElementById('novoMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function (idMembro, nomeMembro) {
    if (!confirm('Excluir ' + nomeMembro + ' da equipe? (Suas tarefas não sumirão fisicamente, mas a guia de visão com este nome desaparecerá).')) return;
    try {
        await deleteDoc(doc(db, "equipe", idMembro));
        if (window.currentMember === nomeMembro) window.currentMember = null;
        showToast("Membro removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaEquipeGerenciar() {
    var container = document.getElementById('listaEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';
    if (window.membrosEquipe.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center">Nenhum membro.</p>';
        return;
    }
    window.membrosEquipe.forEach(function (m) {
        var div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML =
            '<span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ' + m.nome + '</span>' +
            '<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onclick="window.removerMembro(\'' + m.firebaseId + '\', \'' + m.nome + '\')"><i class="ph ph-trash"></i></button>';
        container.appendChild(div);
    });
}

// ====== CSV EXPORT PROJETOS ======
window.exportarProjetosCSV = function () {
    var escapeCSV = window.escapeCSV || function (t) { return t == null ? '' : String(t); };
    var csvContent = "\uFEFFResponsavel,Data_Atividade,Status,Descricao,Demandante,Registrado_Por\n";
    Object.keys(window.sysProjetos).forEach(function (membro) {
        var projetos = window.sysProjetos[membro] || [];
        projetos.forEach(function (p) {
            var row = [
                membro, p.dataAtv, p.status || 'Pendente',
                p.desc || "", p.demandante || "", p.autor || ""
            ].map(escapeCSV).join(",");
            csvContent += row + "\n";
        });
    });
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var encodedUri = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_ti_projetos_" + new Date().getTime() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de tarefas iniciado");
}

