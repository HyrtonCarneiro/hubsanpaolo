// js/controllers/EquipeController.js
// Shared controller for managing team members across all sectors

window.EquipeController = {
    collectionName: '',
    equipeCache: [],

    init: function (collectionName) {
        this.collectionName = collectionName;
        this.iniciarListener();
    },

    iniciarListener: function () {
        if (!this.collectionName) return;
        try {
            const q = query(collection(db, this.collectionName), orderBy("nome"));
            onSnapshot(q, (snapshot) => {
                this.equipeCache = [];
                snapshot.forEach(docSnap => {
                    this.equipeCache.push({ firebaseId: docSnap.id, ...docSnap.data() });
                });
                // Update the app's local cache if it exists (backward compatibility)
                if (typeof window.equipeCache !== 'undefined') {
                    window.equipeCache = this.equipeCache;
                }
                this.renderizarLista();
            }, (err) => console.error("Erro Equipe Listener:", err));
        } catch (e) {
            console.error("Erro ao iniciar listener equipe", e);
        }
    },

    abrirModal: function () {
        const modal = document.getElementById('modalEquipe');
        if (modal) {
            modal.classList.add('show');
            this.carregarUsuariosSistema();
        }
    },

    fecharModal: function () {
        const modal = document.getElementById('modalEquipe');
        if (modal) modal.classList.remove('show');
    },

    carregarUsuariosSistema: async function () {
        const select = document.getElementById('novoMembroSelecionado');
        if (!select) return;
        select.innerHTML = '<option value="">Carregando...</option>';
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            let users = [];
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.user) users.push(data.user);
            });
            users.sort();
            select.innerHTML = '<option value="">Selecione um usuário...</option>';
            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.innerText = u;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error(e);
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    },

    adicionarMembro: async function () {
        const select = document.getElementById('novoMembroSelecionado');
        const nome = select ? select.value : '';
        if (!nome) {
            if (typeof showToast === 'function') showToast("Selecione um usuário", "error");
            return;
        }

        if (this.equipeCache.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
            if (typeof showToast === 'function') showToast("Membro já existe", "error");
            return;
        }

        try {
            await addDoc(collection(db, this.collectionName), { nome });
            if (select) select.value = '';
            if (typeof showToast === 'function') showToast("Membro adicionado!");
        } catch (e) {
            console.error(e);
            if (typeof showToast === 'function') showToast("Erro ao adicionar", "error");
        }
    },

    removerMembro: async function (idMembro, nomeMembro) {
        if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
        try {
            await deleteDoc(doc(db, this.collectionName, idMembro));
            if (typeof showToast === 'function') showToast("Membro removido.");
        } catch (e) {
            console.error(e);
            if (typeof showToast === 'function') showToast("Erro ao remover", "error");
        }
    },

    renderizarLista: function () {
        const container = document.getElementById('listaEquipeGerenciar');
        if (!container) return;
        container.innerHTML = '';

        if (this.equipeCache.length === 0) {
            container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center">Nenhum membro.</p>';
            return;
        }

        this.equipeCache.forEach(m => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
            div.innerHTML = `
                <span class="font-semibold text-[var(--text-main)] flex items-center gap-2">
                    <i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> 
                    ${m.nome}
                </span>
                <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" 
                    onclick="window.EquipeController.removerMembro('${m.firebaseId}', '${m.nome}')">
                    <i class="ph ph-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }
};

// Aliases for backward compatibility in HTML onclick attributes
window.abrirModalEquipe = () => window.EquipeController.abrirModal();
window.fecharModalEquipe = () => window.EquipeController.fecharModal();
window.adicionarMembro = () => window.EquipeController.adicionarMembro();
window.removerMembro = (id, nome) => window.EquipeController.removerMembro(id, nome);
