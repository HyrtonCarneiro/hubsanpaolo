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

window.salvarAta = async function () {
    var titulo = document.getElementById('ataTitulo').value.trim();
    var texto = document.getElementById('ataTexto').value.trim();
    if (!titulo || !texto) return showToast("Preencha o título e o texto da ata", "error");

    var dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await addDoc(collection(db, "atas"), {
            titulo: titulo, texto: texto, autor: currentUser,
            dataStr: dStr, timestamp: Date.now()
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
        div.innerHTML =
            '<div class="flex justify-between items-start mb-3">' +
                '<div>' +
                    '<h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: var(--text-main);">' + a.titulo + '</h3>' +
                    '<div style="font-size: 0.8rem; color: var(--text-muted);"><i class="ph ph-calendar"></i> Registrado em ' + a.dataStr + ' por <strong>' + a.autor + '</strong></div>' +
                '</div>' +
                '<div>' +
                    '<button class="px-2.5 py-1.5 bg-[#fef2f2] text-[var(--danger)] border border-[var(--danger)]/20 hover:bg-[var(--danger)] hover:text-white rounded-md text-sm transition-colors" onclick="window.deletarAta(\'' + a.firebaseId + '\')"><i class="ph ph-trash"></i> Excluir</button>' +
                '</div>' +
            '</div>' +
            '<div style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">' + a.texto + '</div>';
        container.appendChild(div);
    });
}
