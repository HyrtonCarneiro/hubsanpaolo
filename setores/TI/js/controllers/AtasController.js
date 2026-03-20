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
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] animate-fadeIn"><i class="ph ph-file-text text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhuma ata registrada</h2></div>';
        return;
    }

    window.sysAtas.forEach(function (ata) {
        var div = document.createElement('div');
        div.className = 'bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300 animate-fadeIn';
        
        var header = 
            '<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--border)] pb-4">' +
                '<div>' +
                    '<h4 class="text-lg font-black text-[var(--text-main)] m-0 flex items-center gap-2 tracking-tight"><i class="ph-fill ph-notebook text-[var(--primary)]"></i> ' + ata.titulo + '</h4>' +
                    '<p class="text-[0.65rem] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 flex items-center gap-2 opacity-60">' +
                        '<i class="ph-fill ph-calendar-blank"></i> ' + (ata.dataStr || 'Sem data') + 
                        (ata.autor ? ' <span class="mx-1">•</span> <i class="ph-fill ph-user"></i> ' + ata.autor : '') +
                    '</p>' +
                '</div>' +
                '<div class="flex gap-2">' +
                    '<button class="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm" onclick="window.editarAta(\'' + ata.firebaseId + '\')" title="Editar Ata"><i class="ph ph-pencil-simple text-lg font-bold"></i></button>' +
                    '<button class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" onclick="window.deletarAta(\'' + ata.firebaseId + '\')" title="Apagar Registro"><i class="ph ph-trash text-lg font-bold"></i></button>' +
                '</div>' +
            '</div>';

        var body = 
            '<div class="rich-text-content text-sm leading-relaxed text-[var(--text-main)] bg-[var(--bg-color)]/30 p-5 rounded-xl border border-[var(--border)]/50 max-h-[300px] overflow-y-auto custom-scrollbar">' + 
                ata.texto + 
            '</div>';
        
        var footer = ata.autorAlteracao ? 
            '<div class="mt-4 pt-3 border-t border-[var(--border)] border-dashed flex justify-end">' +
                '<span class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter italic">Editado por ' + ata.autorAlteracao + ' em ' + (ata.dataAlteracaoStr || '') + '</span>' +
            '</div>' : '';

        div.innerHTML = header + body + footer;
        container.appendChild(div);
    });
}
