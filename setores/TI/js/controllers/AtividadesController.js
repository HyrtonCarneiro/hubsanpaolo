// js/controllers/AtividadesController.js — Feed de atividades em tempo real
// Depends on: firebase-init.js, AppController.js

window.registrarAtividade = async function (tipo, descricao) {
    try {
        await addDoc(collection(db, "atividades"), {
            tipo: tipo, // 'chamado', 'projeto', 'ata', 'equipe'
            descricao: descricao,
            usuario: window.currentUser || 'Sistema',
            timestamp: Date.now()
        });

        // Limpeza: Manter apenas os 10 mais recentes
        var qAtv = query(collection(db, "atividades"), orderBy("timestamp", "desc"));
        var snapshot = await getDocs(qAtv);
        if (snapshot.size > 10) {
            var docs = [];
            snapshot.forEach(function(d) { docs.push(d); });
            // Deletar a partir do índice 10
            for (var i = 10; i < docs.length; i++) {
                await deleteDoc(doc(db, "atividades", docs[i].id));
            }
        }
    } catch (e) {
        console.error("Erro ao registrar atividade:", e);
    }
};

window.initAtividadesListener = function () {
    try {
        var qAtv = query(collection(db, "atividades"), orderBy("timestamp", "desc"), limit(10));
        onSnapshot(qAtv, function (snapshot) {
            var atividades = [];
            snapshot.forEach(function (docSnap) {
                atividades.push(docSnap.data());
            });
            renderizarFeed(atividades);
        });
    } catch (e) {
        console.error("Erro ao iniciar listener de atividades:", e);
    }
};

function renderizarFeed(atividades) {
    var container = document.getElementById('activityFeedList');
    if (!container) return;

    if (atividades.length === 0) {
        container.innerHTML = '<p class="text-sm text-[var(--text-muted)] text-center py-8 col-span-full font-medium">Nenhuma atividade recente registrada.</p>';
        return;
    }

    var html = atividades.map(function (atv) {
        var icon = 'ph-clock';
        var color = 'text-[var(--text-muted)]';
        var bgColor = 'bg-[var(--bg-color)]';
        
        if (atv.tipo === 'chamado') { icon = 'ph-warning-circle'; color = 'text-red-500'; }
        if (atv.tipo === 'projeto') { icon = 'ph-kanban'; color = 'text-blue-500'; }
        if (atv.tipo === 'ata') { icon = 'ph-file-text'; color = 'text-emerald-500'; }
        if (atv.tipo === 'equipe') { icon = 'ph-users'; color = 'text-purple-500'; }

        var date = new Date(atv.timestamp);
        var time = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');

        return (
            '<div class="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-color)] shadow-sm hover:border-[var(--primary)] hover:shadow-md transition-all group">' +
                '<div class="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center shrink-0 border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors">' +
                    '<i class="ph ' + icon + ' ' + color + ' text-xl"></i>' +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="text-sm text-[var(--text-main)] leading-snug font-semibold mb-1 line-clamp-2">' + atv.descricao + '</div>' +
                    '<div class="flex items-center gap-2 text-[0.65rem] text-[var(--text-muted)] font-extrabold uppercase tracking-widest">' +
                        '<span>' + (atv.usuario || 'Sistema') + '</span>' +
                        '<span class="w-1 h-1 rounded-full bg-[var(--border)]"></span>' +
                        '<span>' + time + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }).join('');

    container.innerHTML = html;
}
