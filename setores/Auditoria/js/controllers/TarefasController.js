// js/controllers/TarefasController.js — Kanban de tarefas + equipe + CSV export
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

window.audiProjetos = {};
window.audiEquipe = [];
window.audiCurrentMember = null;

window.initTarefasListeners = function () {
    try {
        // Listener de Projetos/Tarefas
        var qAudiProj = query(collection(db, "auditoria_projetos"), orderBy("timestamp", "desc"));
        onSnapshot(qAudiProj, function (snapshot) {
            window.audiProjetos = {};
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                data.firebaseId = docSnap.id;
                if (!window.audiProjetos[data.membroResponsavel]) window.audiProjetos[data.membroResponsavel] = [];
                window.audiProjetos[data.membroResponsavel].push(data);
            });
            renderizarAudiProjetosList();
        }, function (err) { console.error("Erro Projetos Audi:", err); });

        // Listener de Equipe
        var qAudiEquipe = query(collection(db, "auditoria_equipe"), orderBy("nome"));
        onSnapshot(qAudiEquipe, function (snapshot) {
            window.audiEquipe = [];
            snapshot.forEach(function (docSnap) { window.audiEquipe.push({ firebaseId: docSnap.id, ...docSnap.data() }); });
            if (window.audiEquipe.length > 0 && (!window.audiCurrentMember || !window.audiEquipe.find(function (m) { return m.nome === window.audiCurrentMember; }))) {
                window.audiCurrentMember = window.audiEquipe[0].nome;
            }
            renderizarBotoesAudiEquipe();
            renderizarAudiProjetosList();
            renderizarListaAudiEquipeGerenciar();
            if (typeof window.popularSelectAuditoresMapeamento === 'function') window.popularSelectAuditoresMapeamento();
        }, function (err) { console.error("Erro Equipe Audi:", err); });
    } catch (e) {
        console.error("Erro ao iniciar listeners tarefas/equipe", e);
    }
}

window.switchAudiMember = function (name) {
    window.audiCurrentMember = name;
    renderizarBotoesAudiEquipe();
    renderizarAudiProjetosList();
}

function renderizarBotoesAudiEquipe() {
    var container = document.getElementById('audiMembrosEquipeContainer');
    if (!container) return;
    container.innerHTML = '';
    window.audiEquipe.forEach(function (m) {
        var btn = document.createElement('button');
        btn.className = m.nome === window.audiCurrentMember
            ? 'px-4 py-2 rounded-full font-semibold transition-colors bg-[var(--primary)] text-white shadow-sm border border-[var(--primary)]'
            : 'px-4 py-2 rounded-full font-semibold transition-colors bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm';
        btn.innerText = m.nome;
        btn.onclick = function () { window.switchAudiMember(m.nome); };
        container.appendChild(btn);
    });
}

window.salvarAudiProjeto = async function () {
    if (!window.audiCurrentMember) return showToast("Selecione ou crie um membro da equipe antes", "error");
    var desc = document.getElementById('audiProjDesc').value;
    var dem = document.getElementById('audiProjDemand').value;
    var dt = document.getElementById('audiProjDate').value;
    var status = document.getElementById('audiProjStatus').value;
    var fileInput = document.getElementById('audiProjAnexo');

    if (!desc || !dem || !dt) return showToast("Preencha os dados da tarefa", "error");
    var parts = dt.split('-');
    var anexoUrl = fileInput ? fileInput.value.trim() : null;

    try {
        await addDoc(collection(db, "auditoria_projetos"), {
            membroResponsavel: window.audiCurrentMember,
            dataAtv: parts[2] + '/' + parts[1] + '/' + parts[0],
            desc: desc, demandante: dem, status: status,
            anexoUrl: anexoUrl, autor: currentUser, timestamp: Date.now()
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
    var container = document.getElementById('audi-projetos-list');
    if (!container) return;
    var projs = window.audiProjetos[window.audiCurrentMember] || [];
    container.innerHTML = '';

    if (projs.length === 0) {
        container.innerHTML =
            '<div class="flex flex-col items-center justify-center p-10 w-full bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed text-center">' +
                '<i class="ph ph-kanban text-4xl text-[var(--primary)] mb-3 opacity-50"></i>' +
                '<h2 class="text-lg font-bold text-[var(--text-main)] m-0">Nenhum registro para ' + (window.audiCurrentMember || 'esta equipe') + '</h2>' +
                '<p class="text-sm text-[var(--text-muted)] mt-1">Clique e registre uma nova demanda acima para começar a preencher o quadro.</p>' +
            '</div>';
        return;
    }

    var colunas = [
        { id: 'Pendente', titulo: 'Pendentes', badgeBg: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900', iconColor: 'text-red-500' },
        { id: 'Em Andamento', titulo: 'Em Andamento', badgeBg: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900', iconColor: 'text-yellow-500' },
        { id: 'Concluído', titulo: 'Concluídos', badgeBg: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900', iconColor: 'text-green-500' }
    ];

    colunas.forEach(function (col) {
        var projsNestaColuna = projs.filter(function (p) { return (p.status || 'Pendente') === col.id; });
        var colDiv = document.createElement('div');
        colDiv.className = 'flex flex-col flex-1 min-w-[300px] bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border)] overflow-hidden';
        colDiv.innerHTML =
            '<div class="px-4 py-3 flex justify-between items-center border-b border-[var(--border)] bg-[var(--surface)]">' +
                '<h3 class="m-0 font-bold text-[var(--text-main)] text-sm flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-current ' + col.iconColor + '"></div> ' + col.titulo + '</h3>' +
                '<span class="bg-[var(--bg-color)] text-[var(--text-muted)] text-xs font-bold px-2.5 py-1 rounded-full border border-[var(--border)]">' + projsNestaColuna.length + '</span>' +
            '</div>' +
            '<div class="kanban-items p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3 min-h-[300px]"></div>';
        var itemsContainer = colDiv.querySelector('.kanban-items');

        projsNestaColuna.forEach(function (p) {
            var div = document.createElement('div');
            div.className = 'bg-[var(--surface)] border-l-4 border-transparent hover:border-[var(--primary)] p-4 rounded-lg border border-[var(--border)] shadow-sm hover:shadow-md transition-all group flex flex-col gap-2 relative';

            var actionBtns = '';
            actionBtns += '<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Editar" onclick="window.abrirModalEditAudiProj(\'' + p.firebaseId + '\')"><i class="ph ph-pencil-simple text-sm"></i></button>';
            actionBtns += '<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Remover" onclick="window.deletarAudiProjeto(\'' + p.firebaseId + '\')"><i class="ph ph-trash text-sm"></i></button>';

            var urlBadge = '';
            if (p.anexoUrl) {
                var isImg = p.anexoUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
                if (isImg) {
                    urlBadge = '<a href="' + p.anexoUrl + '" target="_blank" class="block w-full mt-2 rounded-lg border border-[var(--border)] overflow-hidden hover:brightness-95 transition-all"><img src="' + p.anexoUrl + '" class="w-full h-24 object-cover" alt="Anexo"></a>';
                } else {
                    urlBadge = '<a href="' + p.anexoUrl + '" target="_blank" class="inline-flex mt-2 items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-color)] text-[var(--text-main)] text-xs font-medium border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"><i class="ph ph-link"></i> Abrir Link Anexo</a>';
                }
            }

            div.innerHTML =
                '<div class="flex justify-between items-start gap-2">' +
                    '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ' + col.badgeBg + '"><i class="ph ph-calendar-blank"></i> ' + p.dataAtv + '</span>' +
                    '<div class="flex items-center gap-1 bg-[var(--surface)] rounded-lg shadow-sm border border-[var(--border)] ml-auto absolute top-2 right-2 p-0.5 pointer-events-none group-hover:pointer-events-auto">' + actionBtns + '</div>' +
                '</div>' +
                '<h4 class="mt-2 mb-1 font-semibold text-sm text-[var(--text-main)] leading-relaxed break-words">' + p.desc + '</h4>' +
                (urlBadge ? '<div>' + urlBadge + '</div>' : '') +
                '<div class="mt-3 pt-3 border-t border-dashed border-[var(--border)] flex justify-between items-center text-xs text-[var(--text-muted)]">' +
                    '<span class="flex items-center gap-1" title="Demandante"><i class="ph-fill ph-user-circle text-lg"></i> <span class="font-medium text-[var(--text-main)] truncate max-w-[120px]">' + p.demandante + '</span></span>' +
                '</div>';
            itemsContainer.appendChild(div);
        });
        container.appendChild(colDiv);
    });
}

// ====== EDIÇÃO DE TAREFAS ======
window.abrirModalEditAudiProj = function (firebaseId) {
    var p = null;
    Object.values(window.audiProjetos).forEach(function (arr) {
        var found = arr.find(function (x) { return x.firebaseId === firebaseId; });
        if (found) p = found;
    });
    if (!p) return;

    document.getElementById('editAudiProjId').value = p.firebaseId;
    document.getElementById('editAudiProjDesc').value = p.desc;
    document.getElementById('editAudiProjDemand').value = p.demandante;
    var parts = p.dataAtv.split('/');
    document.getElementById('editAudiProjDate').value = parts[2] + '-' + parts[1] + '-' + parts[0];
    document.getElementById('editAudiProjStatus').value = p.status;

    var mbSelect = document.getElementById('editAudiProjMember');
    mbSelect.innerHTML = window.audiEquipe.map(function (mb) { return '<option value="' + mb.nome + '">' + mb.nome + '</option>'; }).join('');
    mbSelect.value = p.membroResponsavel;

    document.getElementById('modalEditAudiProj').classList.add('show');
}

window.fecharModalEditAudiProj = function () {
    document.getElementById('modalEditAudiProj').classList.remove('show');
}

window.confirmarEdicaoAudiProj = async function () {
    var id = document.getElementById('editAudiProjId').value;
    var desc = document.getElementById('editAudiProjDesc').value;
    var dem = document.getElementById('editAudiProjDemand').value;
    var dt = document.getElementById('editAudiProjDate').value;
    var status = document.getElementById('editAudiProjStatus').value;
    var newMember = document.getElementById('editAudiProjMember').value;

    if (!desc || !dem || !dt || !newMember) return showToast("Preencha todos os campos da tarefa", "error");
    var parts = dt.split('-');

    try {
        await updateDoc(doc(db, "auditoria_projetos", id), {
            desc: desc, demandante: dem, dataAtv: parts[2] + '/' + parts[1] + '/' + parts[0], status: status, membroResponsavel: newMember
        });
        window.fecharModalEditAudiProj();
        showToast("Tarefa atualizada com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar tarefa", "error");
    }
}

// ====== EQUIPE ======
window.abrirModalAudiEquipe = function () {
    document.getElementById('modalAudiEquipe').classList.add('show');
}

window.fecharModalAudiEquipe = function () {
    document.getElementById('modalAudiEquipe').classList.remove('show');
}

window.adicionarAudiMembro = async function () {
    var nome = document.getElementById('novoAudiMembroNome').value.trim();
    if (!nome) return showToast("Digite um nome", "error");
    if (window.audiEquipe.find(function (m) { return m.nome.toLowerCase() === nome.toLowerCase(); })) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "auditoria_equipe"), { nome: nome });
        document.getElementById('novoAudiMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerAudiMembro = async function (idMembro, nomeMembro) {
    if (!confirm('Excluir ' + nomeMembro + ' da equipe?')) return;
    try {
        await deleteDoc(doc(db, "auditoria_equipe", idMembro));
        if (window.audiCurrentMember === nomeMembro) window.audiCurrentMember = null;
        showToast("Membro removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaAudiEquipeGerenciar() {
    var container = document.getElementById('listaAudiEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';

    if (window.audiEquipe.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center py-4">Nenhum membro.</p>';
        return;
    }

    window.audiEquipe.forEach(function (m) {
        var div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML =
            '<span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ' + m.nome + '</span>' +
            '<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100" onclick="window.removerAudiMembro(\'' + m.firebaseId + '\', \'' + m.nome + '\')">' +
                '<i class="ph ph-trash"></i>' +
            '</button>';
        container.appendChild(div);
    });
}

// ====== CSV EXPORT ======
function escapeCSV(text) {
    if (!text) return '';
    var str = String(text);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

window.exportarAudiProjetosCSV = function () {
    var csvContent = "\uFEFFResponsavel,Data_Atividade,Status,Descricao,Demandante,Registrado_Por\n";
    Object.keys(window.audiProjetos).forEach(function (membro) {
        var projetos = window.audiProjetos[membro] || [];
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
    link.setAttribute("download", "relatorio_auditoria_tarefas_" + new Date().getTime() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download de tarefas iniciado");
}
