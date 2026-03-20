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
    } catch (e) {
        console.error("Erro ao registrar atividade:", e);
    }
};

window.initAtividadesListener = function () {
    const q = query(collection(db, "atividades"), orderBy("timestamp", "desc"), limit(6));
    onSnapshot(q, (snapshot) => {
        const atividades = [];
        snapshot.forEach(doc => atividades.push(doc.data()));
        renderizarFeed(atividades);
    });
};

function renderizarFeed(atividades) {
    const container = document.getElementById('activityFeedList');
    if (!container) return;

    if (atividades.length === 0) {
        container.innerHTML = '<p class="text-[0.7rem] text-[var(--text-muted)] text-center py-4">Nenhuma atividade recente.</p>';
        return;
    }

    container.innerHTML = atividades.map(atv => {
        let icon = 'ph-clock';
        let color = 'text-[var(--text-muted)]';
        
        if (atv.tipo === 'chamado') { icon = 'ph-warning-circle'; color = 'text-red-500'; }
        if (atv.tipo === 'projeto') { icon = 'ph-kanban'; color = 'text-blue-500'; }
        if (atv.tipo === 'ata') { icon = 'ph-file-text'; color = 'text-emerald-500'; }
        if (atv.tipo === 'equipe') { icon = 'ph-users'; color = 'text-purple-500'; }

        const time = new Date(atv.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0 group">
                <div class="w-8 h-8 rounded-lg bg-[var(--bg-color)] flex items-center justify-center shrink-0 border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors">
                    <i class="ph ${icon} ${color} text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-[0.75rem] text-[var(--text-main)] leading-tight font-medium mb-0.5 line-clamp-2">${atv.descricao}</div>
                    <div class="flex items-center gap-2 text-[0.6rem] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        <span>${atv.usuario}</span>
                        <span class="w-1 h-1 rounded-full bg-[var(--border)]"></span>
                        <span>${time}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
