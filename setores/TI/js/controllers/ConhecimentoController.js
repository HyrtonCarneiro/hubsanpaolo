// js/controllers/ConhecimentoController.js — Knowledge Base CRUD + rendering
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

window.sysKbCategories = [];
window.sysKbDocs = [];
let currentKbDocId = null;

window.initConhecimentoListeners = function () {
    try {
        // Listen categories
        const qCat = query(collection(db, "kb_categories"), orderBy("name"));
        onSnapshot(qCat, function (snapshot) {
            window.sysKbCategories = [];
            snapshot.forEach(docSnap => window.sysKbCategories.push({ id: docSnap.id, ...docSnap.data() }));
            window.atualizarSelectsCategorias();
            window.renderizarConhecimento();
        });

        // Listen documentations
        const qDocs = query(collection(db, "kb_docs"), orderBy("timestamp", "desc"));
        onSnapshot(qDocs, function (snapshot) {
            window.sysKbDocs = [];
            snapshot.forEach(docSnap => window.sysKbDocs.push({ id: docSnap.id, ...docSnap.data() }));
            window.renderizarConhecimento();
        });
    } catch (e) {
        console.error("Erro ao iniciar listeners KB", e);
    }
}

window.atualizarSelectsCategorias = function () {
    const selects = ['kbEditCategory', 'kbNovoDocCategoria'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = window.sysKbCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    });
}

window.renderizarConhecimento = function () {
    const container = document.getElementById('kbCategoryList');
    if (!container) return;

    if (window.sysKbCategories.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest opacity-40">Nenhuma categoria</div>';
        return;
    }

    let html = '';
    window.sysKbCategories.forEach(cat => {
        const catDocs = window.sysKbDocs.filter(d => d.categoryId === cat.id);
        
        html += `
            <div class="mb-5">
                <div class="flex items-center justify-between px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl group hover:shadow-sm transition-all shadow-sm mb-2">
                    <span class="flex items-center gap-2.5 font-bold text-sm text-[var(--text-main)] truncate">
                        <i class="ph-fill ph-folder-open text-lg text-[var(--primary)]"></i> ${cat.name}
                    </span>
                    <div class="flex items-center gap-0.5 shrink-0">
                        <button onclick="window.abrirModalNovoDoc('${cat.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-all" title="Novo Documento"><i class="ph ph-plus-circle text-lg"></i></button>
                        <button onclick="window.abrirModalEditarCategoria('${cat.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-500 transition-all" title="Editar Categoria"><i class="ph ph-pencil-simple text-lg"></i></button>
                        <button onclick="window.deletarCategoria('${cat.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all" title="Excluir Categoria"><i class="ph ph-trash text-lg"></i></button>
                    </div>
                </div>
                <div class="mt-1 space-y-0.5 pl-2">
                    ${catDocs.map(doc => `
                        <button onclick="window.abrirDocConhecimento('${doc.id}')" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-main)] rounded-lg hover:bg-[var(--primary)]/5 transition-all text-left group ${currentKbDocId === doc.id ? 'bg-[var(--primary)]/10 font-bold border-l-4 border-[var(--primary)]' : ''}">
                            <i class="ph ph-file-text text-[var(--text-muted)] group-hover:text-[var(--primary)]"></i>
                            <span class="truncate">${doc.title}</span>
                        </button>
                    `).join('')}
                    ${catDocs.length === 0 ? '<p class="text-[10px] text-[var(--text-muted)] italic px-3 opacity-50">Vazio</p>' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Refresh reader if doc is open
    if (currentKbDocId) {
        const doc = window.sysKbDocs.find(d => d.id === currentKbDocId);
        if (doc) window.atualizarLeitorKb(doc);
    }
}

// Logic for Category Modal
window.abrirModalNovaCategoria = function () {
    document.getElementById('kbNovaCategoriaNome').value = '';
    document.getElementById('modalKbCategoria').classList.add('show');
}
window.fecharModalNovaCategoria = function () {
    document.getElementById('modalKbCategoria').classList.remove('show');
}
window.salvarNovaCategoria = async function () {
    const nome = document.getElementById('kbNovaCategoriaNome').value.trim();
    if (!nome) return showToast("Digite o nome da categoria", "error");

    try {
        await addDoc(collection(db, "kb_categories"), { name: nome, order: window.sysKbCategories.length });
        showToast("Categoria criada!");
        window.fecharModalNovaCategoria();
    } catch (e) {
        showToast("Erro ao criar categoria", "error");
    }
}

window.abrirModalEditarCategoria = function (id) {
    const cat = window.sysKbCategories.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('kbEditCategoryId').value = cat.id;
    document.getElementById('kbEditCategoryNome').value = cat.name;
    document.getElementById('modalKbEditCategoria').classList.add('show');
}

window.fecharModalEditarCategoria = function () {
    document.getElementById('modalKbEditCategoria').classList.remove('show');
}

window.confirmarEdicaoCategoria = async function () {
    const id = document.getElementById('kbEditCategoryId').value;
    const nome = document.getElementById('kbEditCategoryNome').value.trim();
    if (!nome) return showToast("O nome não pode ser vazio", "error");

    try {
        await updateDoc(doc(db, "kb_categories", id), { name: nome });
        showToast("Categoria atualizada!");
        window.fecharModalEditarCategoria();
    } catch (e) {
        showToast("Erro ao atualizar", "error");
    }
}
window.deletarCategoria = async function (id) {
    const catDocs = window.sysKbDocs.filter(d => d.categoryId === id);
    if (catDocs.length > 0) return showToast("Não é possível excluir categorias com documentos.", "warning");
    if (!confirm("Excluir esta categoria?")) return;

    try {
        await deleteDoc(doc(db, "kb_categories", id));
        showToast("Categoria removida.");
    } catch (e) {
        showToast("Erro ao remover", "error");
    }
}

// Logic for Doc Modal
window.abrirModalNovoDoc = function (catId) {
    document.getElementById('kbNovoDocTitulo').value = '';
    if (catId) document.getElementById('kbNovoDocCategoria').value = catId;
    document.getElementById('modalKbDoc').classList.add('show');
}
window.fecharModalNovoDoc = function () {
    document.getElementById('modalKbDoc').classList.remove('show');
}
window.criarNovoDocKb = async function () {
    const titulo = document.getElementById('kbNovoDocTitulo').value.trim();
    const catId = document.getElementById('kbNovoDocCategoria').value;
    if (!titulo || !catId) return showToast("Preencha todos os campos", "error");

    try {
        const docRef = await addDoc(collection(db, "kb_docs"), {
            title: titulo,
            categoryId: catId,
            content: '',
            author: currentUser,
            timestamp: Date.now()
        });
        showToast("Documento criado!");
        window.fecharModalNovoDoc();
        window.abrirDocConhecimento(docRef.id);
        window.editarDocConhecimento();
    } catch (e) {
        showToast("Erro ao criar documento", "error");
    }
}

// Logic for Reader/Editor
window.abrirDocConhecimento = function (id) {
    currentKbDocId = id;
    const doc = window.sysKbDocs.find(d => d.id === id);
    if (!doc) return;

    window.atualizarLeitorKb(doc);
    
    document.getElementById('kbWelcomeView').classList.add('hidden');
    document.getElementById('kbReaderView').classList.remove('hidden');
    document.getElementById('kbEditorView').classList.add('hidden');
    document.getElementById('kbActionButtonContainer').classList.remove('hidden');

    window.renderizarConhecimento(); // For active item highlight
}

window.atualizarLeitorKb = function (doc) {
    const cat = window.sysKbCategories.find(c => c.id === doc.categoryId);
    document.getElementById('kbReaderCategory').innerText = cat ? cat.name : 'Sem categoria';
    document.getElementById('kbReaderTitle').innerText = doc.title;
    document.getElementById('kbReaderAuthor').innerText = doc.author || '---';
    document.getElementById('kbReaderDate').innerText = doc.timestamp ? new Date(doc.timestamp).toLocaleDateString('pt-BR') : '---';
    document.getElementById('kbReaderContent').innerHTML = doc.content || '<p class="text-[var(--text-muted)] italic">Nenhum conteúdo registrado ainda. Clique em editar para começar.</p>';
}

window.editarDocConhecimento = function () {
    const doc = window.sysKbDocs.find(d => d.id === currentKbDocId);
    if (!doc) return;

    document.getElementById('kbEditTitle').value = doc.title;
    document.getElementById('kbEditCategory').value = doc.categoryId;
    document.getElementById('kbEditText').innerHTML = doc.content || '';

    document.getElementById('kbReaderView').classList.add('hidden');
    document.getElementById('kbEditorView').classList.remove('hidden');
    document.getElementById('kbActionButtonContainer').classList.add('hidden');
}

window.cancelarEdicaoKb = function () {
    document.getElementById('kbEditorView').classList.add('hidden');
    document.getElementById('kbReaderView').classList.remove('hidden');
    document.getElementById('kbActionButtonContainer').classList.remove('hidden');
}

window.formatDocKb = function (cmd, val) {
    document.execCommand(cmd, false, val);
}

window.salvarKb = async function () {
    const titulo = document.getElementById('kbEditTitle').value.trim();
    const catId = document.getElementById('kbEditCategory').value;
    const content = document.getElementById('kbEditText').innerHTML.trim();

    if (!titulo || !catId) return showToast("Título e categoria são obrigatórios", "error");

    try {
        await updateDoc(doc(db, "kb_docs", currentKbDocId), {
            title: titulo,
            categoryId: catId,
            content: content,
            lastUpdate: Date.now(),
            authorUpdate: currentUser
        });
        showToast("Documento salvo com sucesso!");
        window.cancelarEdicaoKb();
    } catch (e) {
        showToast("Erro ao salvar: " + e.message, "error");
    }
}

window.deletarKb = async function () {
    if (!currentKbDocId) return;
    if (!confirm("Deseja EXCLUIR permanentemente este documento?")) return;

    try {
        await deleteDoc(doc(db, "kb_docs", currentKbDocId));
        showToast("Documento excluído.");
        currentKbDocId = null;
        document.getElementById('kbReaderView').classList.add('hidden');
        document.getElementById('kbWelcomeView').classList.remove('hidden');
        document.getElementById('kbActionButtonContainer').classList.add('hidden');
    } catch (e) {
        showToast("Erro ao excluir: " + e.message, "error");
    }
}
