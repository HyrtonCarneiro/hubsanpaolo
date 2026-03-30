// js/controllers/TarefasController.js — Kanban de demandas + equipe + Comentários + Checklist (Marketing)
// Depends on: firebase-init.js, app.js (showToast, currentUser)

window.marketingProjetos = {};
window.marketingEquipe = [];
window.marketingCurrentMember = null;
window.tempMarketingChecklist = []; // Itens temporários na criação
window.tempMarketingResponsaveisCriacao = []; // Responsáveis na criação
window.tempMarketingResponsaveisEdit = [];    // Responsáveis na edição

window.initMarketingTarefasListeners = function () {
    try {
        console.log("Iniciando listeners de Marketing...");
        // Listener de Projetos/Tarefas de Marketing
        var qMarkProj = query(collection(db, "marketing_projetos"), orderBy("timestamp", "desc"));
        onSnapshot(qMarkProj, function (snapshot) {
            window.marketingProjetos = {};
            snapshot.forEach(function (docSnap) {
                var data = docSnap.data();
                data.firebaseId = docSnap.id;
                
                // Tratar múltiplos responsáveis ou legado
                var resps = data.responsaveis && data.responsaveis.length > 0 ? data.responsaveis : [data.membroResponsavel || 'Geral'];
                resps.forEach(function(r) {
                    if (!window.marketingProjetos[r]) window.marketingProjetos[r] = [];
                    window.marketingProjetos[r].push(data);
                });
            });
            renderizarMarketingProjetosList();
        }, function (err) { console.error("Erro Projetos Marketing:", err); });

        // Listener de Equipe de Marketing
        var qMarkEquipe = query(collection(db, "marketing_equipe"), orderBy("nome"));
        onSnapshot(qMarkEquipe, function (snapshot) {
            window.marketingEquipe = [];
            snapshot.forEach(function (docSnap) { window.marketingEquipe.push({ firebaseId: docSnap.id, ...docSnap.data() }); });
            
            // Sincronizar com o cache em app.js se necessário
            if (typeof window.equipeCache !== 'undefined') window.equipeCache = window.marketingEquipe;

            if (window.marketingEquipe.length > 0 && (!window.marketingCurrentMember || !window.marketingEquipe.find(function (m) { return m.nome === window.marketingCurrentMember; }))) {
                window.marketingCurrentMember = window.marketingEquipe[0].nome;
            }
            
            renderizarBotoesMarketingEquipe();
            renderizarSelectResponsaveisMarketing();
            renderizarMarketingProjetosList();
            renderizarListaMarketingEquipeGerenciar();

        }, function (err) { console.error("Erro Equipe Marketing:", err); });
    } catch (e) {
        console.error("Erro ao iniciar listeners marketing", e);
    }
}

window.switchMarketingMember = function (name) {
    window.marketingCurrentMember = name;
    window.tempMarketingChecklist = [];
    window.tempMarketingResponsaveisCriacao = name !== 'Geral' ? [name] : [];
    
    renderizarChecklistCreationMarketing();
    renderizarTagsResponsaveisMarketing('selectedResponsaveisCreation', window.tempMarketingResponsaveisCriacao, 'window.removerResponsavelCriacaoMarketing');
    renderizarBotoesMarketingEquipe();
    renderizarMarketingProjetosList();
}

function renderizarBotoesMarketingEquipe() {
    var container = document.getElementById('membrosEquipeContainer');
    if (!container) return;
    container.innerHTML = '';

    // Botão Geral
    var btnGeral = document.createElement('button');
    btnGeral.className = window.marketingCurrentMember === 'Geral'
        ? 'px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white border border-[var(--primary)] font-bold shadow-md transition-all duration-300 text-sm flex items-center gap-2 active:scale-95'
        : 'px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] font-semibold transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 text-sm flex items-center gap-2 active:scale-95 shadow-sm';
    btnGeral.innerHTML = '<i class="ph-fill ph-users-three"></i> GERAL';
    btnGeral.onclick = function () { window.switchMarketingMember('Geral'); };
    container.appendChild(btnGeral);

    // Divisor
    var divider = document.createElement('div');
    divider.className = 'w-px h-8 bg-[var(--border)] mx-2 hidden sm:block';
    container.appendChild(divider);

    window.marketingEquipe.forEach(function (m) {
        var btn = document.createElement('button');
        btn.className = m.nome === window.marketingCurrentMember
            ? 'px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white border border-[var(--primary)] font-bold shadow-md transition-all duration-300 text-sm active:scale-95'
            : 'px-5 py-2.5 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-main)] font-semibold transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 text-sm active:scale-95 shadow-sm';
        btn.innerText = m.nome;
        btn.onclick = function () { window.switchMarketingMember(m.nome); };
        container.appendChild(btn);
    });
}

function renderizarSelectResponsaveisMarketing() {
    const selectIds = ['projRespSelect', 'editMarketingProjMember'];
    selectIds.forEach(id => {
        var select = document.getElementById(id);
        if (!select) return;
        var options = '<option value="" selected disabled>+ Adicionar Responsável</option>';
        options += window.marketingEquipe.map(function (m) {
            return '<option value="' + m.nome + '">' + m.nome + '</option>';
        }).join('');
        select.innerHTML = options;
    });

    if (window.tempMarketingResponsaveisCriacao.length === 0 && window.marketingCurrentMember && window.marketingCurrentMember !== 'Geral') {
        window.tempMarketingResponsaveisCriacao = [window.marketingCurrentMember];
        renderizarTagsResponsaveisMarketing('selectedResponsaveisCreation', window.tempMarketingResponsaveisCriacao, 'window.removerResponsavelCriacaoMarketing');
    }
}

function renderizarTagsResponsaveisMarketing(containerId, lista, removeFnName) {
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

window.adicionarResponsavelCriacaoMarketing = function (nome) {
    if (!nome || window.tempMarketingResponsaveisCriacao.indexOf(nome) !== -1) return;
    window.tempMarketingResponsaveisCriacao.push(nome);
    renderizarTagsResponsaveisMarketing('selectedResponsaveisCreation', window.tempMarketingResponsaveisCriacao, 'window.removerResponsavelCriacaoMarketing');
}

window.removerResponsavelCriacaoMarketing = function (nome) {
    window.tempMarketingResponsaveisCriacao = window.tempMarketingResponsaveisCriacao.filter(function (n) { return n !== nome; });
    renderizarTagsResponsaveisMarketing('selectedResponsaveisCreation', window.tempMarketingResponsaveisCriacao, 'window.removerResponsavelCriacaoMarketing');
}

window.adicionarResponsavelEditMarketing = function (nome) {
    if (!nome || window.tempMarketingResponsaveisEdit.indexOf(nome) !== -1) return;
    window.tempMarketingResponsaveisEdit.push(nome);
    renderizarTagsResponsaveisMarketing('selectedResponsaveisEdit', window.tempMarketingResponsaveisEdit, 'window.removerResponsavelEditMarketing');
}

window.removerResponsavelEditMarketing = function (nome) {
    window.tempMarketingResponsaveisEdit = window.tempMarketingResponsaveisEdit.filter(function (n) { return n !== nome; });
    renderizarTagsResponsaveisMarketing('selectedResponsaveisEdit', window.tempMarketingResponsaveisEdit, 'window.removerResponsavelEditMarketing');
}

window.toggleFormTarefa = function() {
    var form = document.getElementById('formNovaTarefa');
    var btn = document.getElementById('btnNovaTarefaContainer');
    if (!form || !btn) return;

    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.classList.add('hidden');
    } else {
        form.classList.add('hidden');
        btn.classList.remove('hidden');
    }
}

// Drag & Drop
window.handleDragStartMarketing = function (e, id) {
    e.dataTransfer.setData('markProjId', id);
    e.currentTarget.classList.add('opacity-40');
};

window.handleDragEndMarketing = function (e) {
    e.currentTarget.classList.remove('opacity-40');
};

window.handleDragOverMarketing = function (e) {
    e.preventDefault();
    e.currentTarget.classList.add('bg-[var(--primary)]/5');
};

window.handleDragLeaveMarketing = function (e) {
    e.currentTarget.classList.remove('bg-[var(--primary)]/5');
};

window.handleDropMarketing = async function (e, newStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-[var(--primary)]/5');
    const id = e.dataTransfer.getData('markProjId');
    if (!id) return;

    try {
        await updateDoc(doc(db, "marketing_projetos", id), { status: newStatus });
        showToast("Status atualizado!");
    } catch (err) {
        console.error(err);
        showToast("Erro ao mover tarefa", "error");
    }
};

window.salvarMarketingProjeto = async function () {
    if (!window.marketingCurrentMember) return showToast("Selecione ou crie um membro da equipe antes", "error");
    var desc = document.getElementById('markProjDesc').value;
    var dem = document.getElementById('markProjDemand').value;
    var dt = document.getElementById('markProjDate').value;
    var status = document.getElementById('markProjStatus').value;
    var fileInput = document.getElementById('markProjAnexo');

    if (!desc || !dem || !dt || window.tempMarketingResponsaveisCriacao.length === 0) return showToast("Preencha todos os dados", "error");
    var parts = dt.split('-');
    var dAtv = parts[2] + '/' + parts[1] + '/' + parts[0];
    var anexoUrl = fileInput ? fileInput.value.trim() : null;

    try {
        await addDoc(collection(db, "marketing_projetos"), {
            desc: desc, demandante: dem, dataAtv: dAtv, status: status,
            membroResponsavel: window.tempMarketingResponsaveisCriacao[0],
            responsaveis: window.tempMarketingResponsaveisCriacao,
            anexoUrl: anexoUrl || null,
            checklist: window.tempMarketingChecklist || [],
            autor: currentUser,
            timestamp: Date.now()
        });
        
        document.getElementById('markProjDesc').value = '';
        document.getElementById('markProjDemand').value = '';
        document.getElementById('markProjDate').value = '';
        if (fileInput) fileInput.value = '';
        window.tempMarketingChecklist = [];
        window.tempMarketingResponsaveisCriacao = window.marketingCurrentMember !== 'Geral' ? [window.marketingCurrentMember] : [];
        renderizarChecklistCreationMarketing();
        renderizarTagsResponsaveisMarketing('selectedResponsaveisCreation', window.tempMarketingResponsaveisCriacao, 'window.removerResponsavelCriacaoMarketing');
        
        window.toggleFormTarefa();
        showToast("Tarefa registrada com sucesso!");
        
        if (typeof window.emitNotification === 'function') {
            window.tempMarketingResponsaveisCriacao.forEach(r => {
                if (r !== 'Geral') {
                    window.emitNotification(r, `Nova tarefa de Marketing: ${desc.substring(0, 30)}...`, "setores/Marketing/index.html?view=tarefas");
                }
            });
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar tarefa", "error");
    }
}

window.deletarMarketingProjeto = async function (firebaseId) {
    if (!confirm("Remover este registro?")) return;
    try {
        await deleteDoc(doc(db, "marketing_projetos", firebaseId));
        showToast("Tarefa removida");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover tarefa", "error");
    }
}

function renderizarMarketingProjetosList() {
    var container = document.getElementById('marketing-projetos-list');
    if (!container) return;
    
    container.className = 'grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] p-2 w-full overflow-hidden';
    container.innerHTML = '';

    if (window.marketingCurrentMember === 'Geral') {
        renderizarVisaoUnificadaMarketing(container);
        return;
    }

    var projs = window.marketingProjetos[window.marketingCurrentMember] || [];
    
    // Filtro de Busca
    var search = (document.getElementById('taskSearchInput')?.value || '').toLowerCase();
    if (search) {
        projs = projs.filter(p => 
            (p.desc || '').toLowerCase().includes(search) || 
            (p.demandante || '').toLowerCase().includes(search)
        );
    }

    if (projs.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] col-span-1 lg:col-span-3 rounded-2xl border border-dashed border-[var(--border)] w-full animate-fadeIn"><i class="ph ph-kanban text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum registro encontrado</h2><p class="text-sm mt-2">Tente ajustar sua busca ou selecione outro membro.</p></div>';
        return;
    }

    var colunas = [
        { id: 'Pendente', titulo: 'Pendentes', classBadge: 'bg-red-500/10 text-red-500 border-red-500/20', borderColor: '#ef4444' },
        { id: 'Em Andamento', titulo: 'Em Andamento', classBadge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', borderColor: '#3b82f6' },
        { id: 'Concluído', titulo: 'Concluídos', classBadge: 'bg-green-500/10 text-green-500 border-green-500/20', borderColor: '#10b981' }
    ];

    colunas.forEach(function (col) {
        var projsNestaColuna = projs.filter(function (p) { return (p.status || 'Pendente') === col.id; });

        var colDiv = document.createElement('div');
        colDiv.className = 'bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]/30 flex flex-col h-full overflow-hidden transition-all duration-300 group/col';
        colDiv.ondragover = (e) => window.handleDragOverMarketing(e);
        colDiv.ondragleave = (e) => window.handleDragLeaveMarketing(e);
        colDiv.ondrop = (e) => window.handleDropMarketing(e, col.id);

        colDiv.innerHTML =
            '<div class="px-5 py-4 flex justify-between items-center border-b border-[var(--border)]/30 bg-[var(--bg-color)]/30" style="border-top: 4px solid ' + col.borderColor + '">' +
                '<h3 class="text-[0.65rem] font-black text-[var(--text-main)] m-0 flex items-center gap-2 uppercase tracking-widest opacity-60">' +
                    '<div class="w-2 h-2 rounded-full" style="background-color: ' + col.borderColor + '"></div>' +
                    col.titulo +
                '</h3>' +
                '<span class="bg-[var(--surface)] px-2 py-0.5 rounded-full text-[10px] font-black text-[var(--text-main)] border border-[var(--border)] shadow-sm">' + projsNestaColuna.length + '</span>' +
            '</div>' +
            '<div class="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 kanban-items animate-fadeIn"></div>';
        
        var itemsContainer = colDiv.querySelector('.kanban-items');

        projsNestaColuna.forEach(function (p) {
            itemsContainer.appendChild(criarCardTarefaMarketing(p, col.classBadge));
        });

        container.appendChild(colDiv);
    });
}

function criarCardTarefaMarketing(p, classBadge) {
    var div = document.createElement('div');
    div.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-move group relative active:scale-[0.98]';
    div.draggable = true;
    div.ondragstart = (e) => window.handleDragStartMarketing(e, p.firebaseId);
    div.ondragend = (e) => window.handleDragEndMarketing(e);
    div.onclick = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        window.abrirModalEditMarketingProj(p.firebaseId);
    };

    var resps = p.responsaveis && p.responsaveis.length > 0 ? p.responsaveis : [p.membroResponsavel || 'Geral'];
    var responsavelBadges = resps.map(function(r) {
        return '<span class="px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[0.6rem] font-bold border border-[var(--primary)]/20">' + r + '</span>';
    }).join(' ');

    var urlBadge = '';
    if (p.anexoUrl) {
        urlBadge = '<i class="ph ph-link text-[var(--primary)] text-sm"></i>';
    }

    var totalComments = (p.comentarios || []).length;
    var checklist = p.checklist || [];
    var totalCheck = checklist.length;
    var completedCheck = checklist.filter(function(i){ return i.concluido; }).length;

    div.innerHTML =
        '<div class="flex justify-between items-start mb-2">' +
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[0.65rem] font-bold border ' + classBadge + '"><i class="ph ph-calendar"></i> ' + p.dataAtv + '</span>' +
            '<button class="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" onclick="window.deletarMarketingProjeto(\'' + p.firebaseId + '\')"><i class="ph ph-trash"></i></button>' +
        '</div>' +
        '<h4 class="text-xs font-bold text-[var(--text-main)] m-0 mb-3 leading-snug break-words group-hover:text-[var(--primary)] transition-colors">' + p.desc + '</h4>' +
        '<div class="flex flex-wrap gap-1.5 mb-3">' + responsavelBadges + '</div>' +
        '<div class="flex justify-between items-center pt-2 border-t border-[var(--border)] border-dashed mt-auto">' +
            '<div class="flex items-center gap-2">' +
                (totalCheck > 0 ? '<span class="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1"><i class="ph ph-check-square"></i> ' + completedCheck + '/' + totalCheck + '</span>' : '') +
                (totalComments > 0 ? '<span class="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1"><i class="ph ph-chat-centered-text"></i> ' + totalComments + '</span>' : '') +
            '</div>' +
            '<div>' + urlBadge + '</div>' +
        '</div>';
    return div;
}

function renderizarVisaoUnificadaMarketing(container) {
    container.classList.remove('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    container.className = 'flex flex-col gap-8 w-full h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar';

    const colunas = [
        { id: 'Pendente', titulo: 'Pendentes', badge: 'bg-red-50 text-red-600 border-red-100' },
        { id: 'Em Andamento', titulo: 'Em Andamento', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
        { id: 'Concluído', titulo: 'Concluídos', badge: 'bg-green-50 text-green-600 border-green-100' }
    ];

    window.marketingEquipe.forEach(m => {
        const projs = window.marketingProjetos[m.nome] || [];
        if (projs.length === 0) return;

        const row = document.createElement('div');
        row.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm shrink-0';
        
        let rowHtml = `
            <div class="px-6 py-4 bg-[var(--bg-color)]/50 border-b border-[var(--border)] flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shadow-sm">${m.nome.charAt(0)}</div>
                <div>
                    <h3 class="text-sm font-bold text-[var(--text-main)] m-0 uppercase tracking-tight">${m.nome}</h3>
                    <p class="text-[0.6rem] text-[var(--text-muted)] font-bold uppercase tracking-widest">${projs.length} Itens Ativos</p>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 divide-x divide-[var(--border)] bg-[var(--bg-color)]/20">
        `;

        colunas.forEach(col => {
            const pNestaColuna = projs.filter(p => (p.status || 'Pendente') === col.id);
            rowHtml += `<div class="p-4 flex flex-col gap-3 min-h-[100px]">`;
            
            pNestaColuna.forEach(p => {
                rowHtml += `
                    <div class="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-sm hover:border-[var(--primary)] transition-all cursor-pointer" onclick="window.abrirModalEditMarketingProj('${p.firebaseId}')">
                        <div class="text-[0.75rem] font-bold text-[var(--text-main)] mb-1 line-clamp-1">${p.desc}</div>
                        <div class="flex justify-between items-center text-[0.6rem] text-[var(--text-muted)] font-bold uppercase">
                            <span>${p.dataAtv}</span>
                            <span>${p.demandante}</span>
                        </div>
                    </div>
                `;
            });

            rowHtml += `</div>`;
        });

        rowHtml += `</div>`;
        row.innerHTML = rowHtml;
        container.appendChild(row);
    });
}

// EDIÇÃO
window.abrirModalEditMarketingProj = function (firebaseId) {
    var p = null;
    Object.keys(window.marketingProjetos).forEach(function (m) {
        var found = window.marketingProjetos[m].find(function (x) { return x.firebaseId === firebaseId; });
        if (found) p = found;
    });
    if (!p) return;

    document.getElementById('editMarketingProjId').value = p.firebaseId;
    document.getElementById('editMarketingProjDesc').value = p.desc;
    document.getElementById('editMarketingProjDemand').value = p.demandante;
    var parts = p.dataAtv.split('/');
    if (parts.length === 3) document.getElementById('editMarketingProjDate').value = parts[2] + '-' + parts[1] + '-' + parts[0];
    document.getElementById('editMarketingProjStatus').value = p.status;

    // Detalhe
    document.getElementById('viewProjDemand').innerText = p.demandante;
    document.getElementById('viewProjDate').innerText = p.dataAtv;
    document.getElementById('viewProjDesc').innerText = p.desc;
    document.getElementById('viewProjStatus').innerText = p.status;

    var resps = p.responsaveis && p.responsaveis.length > 0 ? p.responsaveis : [p.membroResponsavel || 'Geral'];
    document.getElementById('viewProjResp').innerHTML = resps.map(r => `<span class="px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20">${r}</span>`).join(' ');

    window.tempMarketingResponsaveisEdit = [...resps];
    renderizarTagsResponsaveisMarketing('selectedResponsaveisEdit', window.tempMarketingResponsaveisEdit, 'window.removerResponsavelEditMarketing');

    // Checklist e Comentários
    renderizarChecklistViewMarketing(p.checklist || []);
    renderizarComentariosTarefaDetalheMarketing(p.comentarios || []);

    // Reset modals
    var editMode = document.getElementById('taskEditMode');
    var viewMode = document.getElementById('taskViewMode');
    var btnEdit = document.getElementById('btnSwitchToEditProj');
    if (editMode && viewMode) {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        btnEdit.classList.remove('hidden');
    }

    document.getElementById('modalEditMarketingProj').classList.add('show');
}

window.fecharModalEditMarketingProj = function () {
    document.getElementById('modalEditMarketingProj').classList.remove('show');
}

window.toggleEditModeProj = function() {
    var editMode = document.getElementById('taskEditMode');
    var viewMode = document.getElementById('taskViewMode');
    var btnEdit = document.getElementById('btnSwitchToEditProj');
    if (editMode.classList.contains('hidden')) {
        editMode.classList.remove('hidden');
        viewMode.classList.add('hidden');
        btnEdit.classList.add('hidden');
        window.renderizarChecklistEditMarketing();
    } else {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        btnEdit.classList.remove('hidden');
    }
}

// CHECKLIST
window.addCheckItemCreationMarketing = function() {
    const input = document.getElementById('newCheckItemCreationMarketing');
    const texto = input.value.trim();
    if (!texto) return;
    window.tempMarketingChecklist.push({ texto, concluido: false });
    input.value = '';
    renderizarChecklistCreationMarketing();
}

function renderizarChecklistCreationMarketing() {
    const container = document.getElementById('creationChecklistListMarketing');
    if (!container) return;
    container.innerHTML = window.tempMarketingChecklist.map((item, idx) => `
        <div class="flex items-center gap-2 bg-[var(--surface)] p-2 rounded border border-[var(--border)] group animate-fadeIn">
            <span class="text-xs flex-1">${item.texto}</span>
            <button class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100" onclick="window.removeCheckItemCreationMarketing(${idx})"><i class="ph ph-trash"></i></button>
        </div>
    `).join('');
}

window.removeCheckItemCreationMarketing = function(idx) {
    window.tempMarketingChecklist.splice(idx, 1);
    renderizarChecklistCreationMarketing();
}

function renderizarChecklistViewMarketing(checklist) {
    const container = document.getElementById('listaChecklistView');
    const wrapper = document.getElementById('checklistViewContainer');
    if (!container || !wrapper) return;
    if (!checklist || checklist.length === 0) {
        wrapper.classList.add('hidden');
        return;
    }
    wrapper.classList.remove('hidden');
    container.innerHTML = checklist.map((item, idx) => `
        <div class="flex items-center gap-2 p-1">
            <input type="checkbox" ${item.concluido ? 'checked' : ''} onchange="window.toggleItemChecklistMarketing(${idx})" class="w-4 h-4 cursor-pointer">
            <label class="text-sm ${item.concluido ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'} cursor-pointer flex-1">${item.texto}</label>
        </div>
    `).join('');
}

window.renderizarChecklistEditMarketing = function() {
    const id = document.getElementById('editMarketingProjId').value;
    let p = null;
    Object.keys(window.marketingProjetos).forEach(m => {
        const found = window.marketingProjetos[m].find(x => x.firebaseId === id);
        if (found) p = found;
    });
    const container = document.getElementById('listaChecklistEdit');
    if (!container || !p) return;
    const checklist = p.checklist || [];
    container.innerHTML = checklist.map((item, idx) => `
        <div class="flex items-center justify-between bg-[var(--surface)] p-2 rounded border border-[var(--border)] mb-2">
            <span class="text-xs ${item.concluido ? 'line-through opacity-50' : ''}">${item.texto}</span>
            <button class="text-red-500" onclick="window.removerItemChecklistMarketing(${idx})"><i class="ph ph-trash"></i></button>
        </div>
    `).join('');
}

window.adicionarItemChecklistMarketing = async function() {
    const id = document.getElementById('editMarketingProjId').value;
    const input = document.getElementById('novoItemChecklist');
    const texto = input.value.trim();
    if (!texto) return;
    let p = null;
    Object.keys(window.marketingProjetos).forEach(m => {
        const found = window.marketingProjetos[m].find(x => x.firebaseId === id);
        if (found) p = found;
    });
    const checklist = p.checklist || [];
    checklist.push({ texto, concluido: false });
    await updateDoc(doc(db, "marketing_projetos", id), { checklist });
    input.value = '';
    window.renderizarChecklistEditMarketing();
    renderizarChecklistViewMarketing(checklist);
}

window.toggleItemChecklistMarketing = async function(idx) {
    const id = document.getElementById('editMarketingProjId').value;
    let p = null;
    Object.keys(window.marketingProjetos).forEach(m => {
        const found = window.marketingProjetos[m].find(x => x.firebaseId === id);
        if (found) p = found;
    });
    const checklist = p.checklist || [];
    if (checklist[idx]) checklist[idx].concluido = !checklist[idx].concluido;
    await updateDoc(doc(db, "marketing_projetos", id), { checklist });
    renderizarChecklistViewMarketing(checklist);
}

window.removerItemChecklistMarketing = async function(idx) {
    const id = document.getElementById('editMarketingProjId').value;
    let p = null;
    Object.keys(window.marketingProjetos).forEach(m => {
        const found = window.marketingProjetos[m].find(x => x.firebaseId === id);
        if (found) p = found;
    });
    const checklist = p.checklist || [];
    checklist.splice(idx, 1);
    await updateDoc(doc(db, "marketing_projetos", id), { checklist });
    window.renderizarChecklistEditMarketing();
}

// COMENTÁRIOS
function renderizarComentariosTarefaDetalheMarketing(comentarios) {
    var container = document.getElementById('listaComentariosProjDetalhe');
    if (!container) return;
    container.innerHTML = comentarios.map(c => `
        <div class="p-3 bg-[var(--bg-color)]/30 rounded-xl border border-[var(--border)] text-xs animate-fadeIn">
            <div class="flex justify-between mb-1 font-bold">
                <span class="text-[var(--primary)]">${c.autor}</span>
                <span class="opacity-50">${c.data}</span>
            </div>
            <p class="m-0">${c.texto}</p>
        </div>
    `).join('');
}

window.salvarComentarioMarketingProjetoDetalhe = async function() {
    var id = document.getElementById('editMarketingProjId').value;
    var input = document.getElementById('novoComentarioProjDetalhe');
    var texto = input.value.trim();
    if (!texto) return;
    let p = null;
    Object.keys(window.marketingProjetos).forEach(m => {
        const found = window.marketingProjetos[m].find(x => x.firebaseId === id);
        if (found) p = found;
    });
    var novos = p.comentarios || [];
    novos.push({
        autor: currentUser, texto,
        data: new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    });
    await updateDoc(doc(db, "marketing_projetos", id), { comentarios: novos });
    input.value = '';
    renderizarComentariosTarefaDetalheMarketing(novos);
}

window.confirmarEdicaoMarketingProj = async function () {
    var id = document.getElementById('editMarketingProjId').value;
    var desc = document.getElementById('editMarketingProjDesc').value;
    var dem = document.getElementById('editMarketingProjDemand').value;
    var dt = document.getElementById('editMarketingProjDate').value;
    var status = document.getElementById('editMarketingProjStatus').value;

    if (!desc || !dem || !dt || window.tempMarketingResponsaveisEdit.length === 0) return showToast("Preencha todos os campos", "error");
    var parts = dt.split('-');
    
    try {
        await updateDoc(doc(db, "marketing_projetos", id), {
            desc, demandante: dem, status,
            dataAtv: parts[2] + '/' + parts[1] + '/' + parts[0],
            membroResponsavel: window.tempMarketingResponsaveisEdit[0],
            responsaveis: window.tempMarketingResponsaveisEdit
        });
        window.fecharModalEditMarketingProj();
        showToast("Tarefa atualizada!");

        if (typeof window.emitNotification === 'function') {
            window.tempMarketingResponsaveisEdit.forEach(r => {
                if (r !== 'Geral') {
                    window.emitNotification(r, `A tarefa de Marketing "${desc.substring(0, 25)}..." foi atualizada.`, "setores/Marketing/index.html?view=tarefas");
                }
            });
        }
    } catch (e) {
        console.error(e);
    }
}

// EQUIPE - Adaptando do original em app.js para manter centralizado
window.carregarUsuariosSistemaMarketing = async function() {
    var select = document.getElementById('novoMembroSelecionado');
    if (!select) return;
    try {
        var snap = await getDocs(collection(db, "users"));
        var users = [];
        snap.forEach(d => users.push(d.data().user));
        users.sort();
        select.innerHTML = '<option value="">Selecione um usuário...</option>' + 
            users.map(u => `<option value="${u}">${u}</option>`).join('');
    } catch(e) { console.error(e); }
}

function renderizarListaMarketingEquipeGerenciar() {
    var container = document.getElementById('listaEquipeGerenciar');
    if (!container) return;
    container.innerHTML = window.marketingEquipe.map(m => `
        <div class="flex justify-between items-center p-2 rounded bg-black/5 mb-1">
            <span class="text-sm font-bold">${m.nome}</span>
            <button class="text-red-500" onclick="window.removerMembro('${m.firebaseId}', '${m.nome}')"><i class="ph ph-trash"></i></button>
        </div>
    `).join('');
}

window.exportarMarketingProjetosCSV = function () {
    var projs = [];
    Object.values(window.marketingProjetos).forEach(arr => projs = projs.concat(arr));
    // Remover duplicatas por ID (caso multi-resp)
    var unique = Array.from(new Set(projs.map(a => a.firebaseId))).map(id => projs.find(a => a.firebaseId === id));
    
    var csv = "\uFEFFResponsavel,Data,Status,Descricao,Demandante\n";
    unique.forEach(p => {
        csv += `"${p.responsaveis?.join(';') || p.membroResponsavel}","${p.dataAtv}","${p.status}","${p.desc}","${p.demandante}"\n`;
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "marketing_tarefas.csv";
    link.click();
}
