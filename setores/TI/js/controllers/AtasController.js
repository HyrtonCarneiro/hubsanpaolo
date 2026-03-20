// js/controllers/AtasController.js — Atas de reunião CRUD + rendering
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

window.sysAtas = [];

window.initAtasListeners = function () {
    try {
        var qAtas = query(collection(db, "atas"), orderBy("timestamp", "desc"));
        onSnapshot(qAtas, function (snapshot) {
            window.sysAtas = [];
            snapshot.forEach(function (docSnap) { window.sysAtas.push({ firebaseId: docSnap.id, ...docSnap.data() }); });
            window.renderizarAtas();
        });
    } catch (e) {
        console.error("Erro ao iniciar listener atas", e);
    }
}

window.formatDoc = function (cmd, val) {
    document.execCommand(cmd, false, val);
}

window.salvarAta = async function () {
    var titulo = document.getElementById('ataTitulo').value.trim();
    var texto = document.getElementById('ataTexto').innerHTML.trim();
    var editId = document.getElementById('editAtaId').value;

    if (!titulo || !texto || texto === '<br>') return showToast("Preencha o título e o texto da ata", "error");

    var dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        if (editId) {
            // Update existing
            await updateDoc(doc(db, "atas", editId), {
                titulo: titulo, texto: texto, autorAlteracao: currentUser,
                dataAlteracaoStr: dStr, lastUpdate: Date.now()
            });
            showToast("Ata atualizada com sucesso!");
        } else {
            // Create new
            await addDoc(collection(db, "atas"), {
                titulo: titulo, texto: texto, autor: currentUser,
                dataStr: dStr, timestamp: Date.now()
            });
            showToast("Ata salva com sucesso!");
        }
        window.cancelarEdicaoAta();
    } catch (e) {
        console.error(e);
        showToast("Erro ao processar ata", "error");
    }
}

window.editarAta = function (id) {
    var ata = window.sysAtas.find(a => a.firebaseId === id);
    if (!ata) return;

    document.getElementById('editAtaId').value = id;
    document.getElementById('ataTitulo').value = ata.titulo;
    document.getElementById('ataTexto').innerHTML = ata.texto;

    document.getElementById('btnSalvarAtaText').innerText = "Salvar Alterações";
    document.getElementById('btnCancelarEdicao').classList.remove('hidden');

    // Scroll to form
    document.getElementById('view-atas').scrollTop = 0;
}

window.cancelarEdicaoAta = function () {
    document.getElementById('editAtaId').value = '';
    document.getElementById('ataTitulo').value = '';
    document.getElementById('ataTexto').innerHTML = '';

    document.getElementById('btnSalvarAtaText').innerText = "Registrar Ata";
    document.getElementById('btnCancelarEdicao').classList.add('hidden');
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

window.renderizarAtas = function () {
    var container = document.getElementById('listaAtasContainer');
    if (!container) return;

    container.innerHTML = '';

    if (window.sysAtas.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]"><i class="ph ph-file-text text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhuma ata registrada</h2></div>';
        return;
    }

    window.sysAtas.forEach(function (a) {
        var div = document.createElement('div');
        div.className = 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-4 shadow-sm';
        
        var editInfo = a.dataAlteracaoStr ? '<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">(Editado em ' + a.dataAlteracaoStr + ' por ' + a.autorAlteracao + ')</div>' : '';

        div.innerHTML =
            '<div class="flex justify-between items-start mb-3">' +
                '<div>' +
                    '<h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: var(--text-main);">' + a.titulo + '</h3>' +
                    '<div style="font-size: 0.8rem; color: var(--text-muted);"><i class="ph ph-calendar"></i> Registrado em ' + a.dataStr + ' por <strong>' + a.autor + '</strong></div>' +
                    editInfo +
                '</div>' +
                '<div class="flex gap-2">' +
                    '<button class="px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-md text-sm transition-colors" onclick="window.editarAta(\'' + a.firebaseId + '\')"><i class="ph ph-pencil-simple"></i> Editar</button>' +
                    '<button class="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-md text-sm transition-colors" onclick="window.deletarAta(\'' + a.firebaseId + '\')"><i class="ph ph-trash"></i> Excluir</button>' +
                '</div>' +
            '</div>' +
            '<div class="rich-text-content" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">' + a.texto + '</div>';
        container.appendChild(div);
    });
}
