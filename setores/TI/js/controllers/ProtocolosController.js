// js/controllers/ProtocolosController.js — Protocolos de Suporte CRUD + rendering
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

window.sysProtocolos = [];

window.initProtocolosListeners = function () {
    try {
        var qProtocolos = query(collection(db, "protocolos_suporte"), orderBy("timestamp", "desc"));
        onSnapshot(qProtocolos, function (snapshot) {
            window.sysProtocolos = [];
            snapshot.forEach(function (docSnap) { 
                window.sysProtocolos.push({ firebaseId: docSnap.id, ...docSnap.data() }); 
            });
            window.renderizarProtocolos();
        });
    } catch (e) {
        console.error("Erro ao iniciar listener protocolos", e);
    }
}

window.salvarProtocolo = async function () {
    var sistema = document.getElementById('protocoloSistema').value;
    var numero = document.getElementById('protocoloNumero').value.trim();
    var descricao = document.getElementById('protocoloDescricao').value.trim();

    if (!numero || !descricao) return showToast("Preencha o número e a descrição do protocolo", "error");

    var dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await addDoc(collection(db, "protocolos_suporte"), {
            sistema: sistema,
            numero: numero,
            descricao: descricao,
            autor: currentUser,
            dataStr: dStr,
            timestamp: Date.now()
        });
        
        // Limpar campos
        document.getElementById('protocoloNumero').value = '';
        document.getElementById('protocoloDescricao').value = '';
        
        showToast("Protocolo registrado com sucesso!");
        
        if (typeof window.registrarAtividade === 'function') {
            window.registrarAtividade('chamado', `Novo protocolo ${sistema}: ${numero}`);
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao registrar protocolo", "error");
    }
}

window.deletarProtocolo = async function (id) {
    if (!confirm("Tem certeza que deseja excluir este protocolo?")) return;
    try {
        await deleteDoc(doc(db, "protocolos_suporte", id));
        showToast("Protocolo removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir protocolo", "error");
    }
}

window.renderizarProtocolos = function () {
    var container = document.getElementById('listaProtocolosContainer');
    if (!container) return;

    container.innerHTML = '';

    if (window.sysProtocolos.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] animate-fadeIn"><i class="ph ph-ticket text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum protocolo registrado</h2></div>';
        return;
    }

    window.sysProtocolos.forEach(function (p) {
        var div = document.createElement('div');
        div.className = 'bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300 animate-fadeIn';
        
        var iconClass = "ph-fill ph-ticket";
        var systemColor = "var(--primary)";
        
        if (p.sistema === 'Athenas') { iconClass = "ph-fill ph-cpu"; systemColor = "#265d7c"; }
        if (p.sistema === 'Degust') { iconClass = "ph-fill ph-fork-knife"; systemColor = "#da5513"; }
        if (p.sistema === 'Delivery\'s') { iconClass = "ph-fill ph-moped"; systemColor = "#da0d17"; }

        var header = 
            '<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--border)] pb-4">' +
                '<div class="flex items-center gap-4">' +
                    '<div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background-color: ' + systemColor + '20; color: ' + systemColor + '">' +
                        '<i class="' + iconClass + '"></i>' +
                    '</div>' +
                    '<div>' +
                        '<h4 class="text-lg font-bold text-[var(--text-main)] m-0 tracking-tight">Protocolo: ' + (p.numero || p.titulo || '---') + '</h4>' +
                        '<div class="flex items-center gap-3 mt-1">' +
                            '<span class="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-wider" style="background-color: ' + systemColor + '; color: white">' + p.sistema + '</span>' +
                            '<p class="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 opacity-60 m-0">' +
                                '<i class="ph ph-calendar"></i> ' + p.dataStr + 
                                ' <span class="mx-1">•</span> <i class="ph ph-user"></i> ' + p.autor +
                            '</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<button class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" onclick="window.deletarProtocolo(\'' + p.firebaseId + '\')" title="Excluir Protocolo"><i class="ph ph-trash text-lg font-bold"></i></button>' +
                '</div>' +
            '</div>';

        var body = 
            '<div class="text-sm leading-relaxed text-[var(--text-main)] bg-[var(--bg-color)]/30 p-5 rounded-xl border border-[var(--border)]/50 whitespace-pre-line">' + 
                p.descricao + 
            '</div>';

        div.innerHTML = header + body;
        container.appendChild(div);
    });
}
