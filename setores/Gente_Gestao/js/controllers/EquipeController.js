// js/controllers/EquipeController.js - Gente e Gestão
// Responsável por gerenciar os membros da equipe no modal do setor

window.abrirModalEquipe = function() {
    document.getElementById('modalEquipe').classList.add('show');
    window.carregarUsuariosSistema();
}

window.fecharModalEquipe = function() {
    document.getElementById('modalEquipe').classList.remove('show');
}

window.carregarUsuariosSistema = async function() {
    const select = document.getElementById('novoMembroSelecionado');
    if (!select) return;
    select.innerHTML = '<option value="">Carregando...</option>';
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let users = [];
        querySnapshot.forEach(docSnap => users.push(docSnap.data().user));
        users.sort();
        select.innerHTML = '<option value="">Selecione um usuário...</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.innerText = u;
            select.appendChild(opt);
        });
    } catch(e) {
        console.error(e);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

window.adicionarMembro = async function() {
    const nome = document.getElementById('novoMembroSelecionado').value;
    if (!nome) return showToast("Selecione um usuário", "error");
    if (equipeCache.find(m => m.nome.toLowerCase() === nome.toLowerCase())) {
        return showToast("Membro já existe", "error");
    }
    try {
        await addDoc(collection(db, "gente_gestao_equipe"), { nome });
        document.getElementById('novoMembroSelecionado').value = '';
        showToast("Membro adicionado!");
    } catch(e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function(idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
    try {
        await deleteDoc(doc(db, "gente_gestao_equipe", idMembro));
        showToast("Membro removido.");
    } catch(e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

window.renderizarListaEquipeGerenciar = function() {
    const container = document.getElementById('listaEquipeGerenciar');
    if (!container) return;
    container.innerHTML = '';
    
    if (equipeCache.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-sm text-center">Nenhum membro.</p>';
        return;
    }
    
    equipeCache.forEach(m => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] group hover:border-[var(--primary)] transition-colors';
        div.innerHTML = `
            <span class="font-semibold text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-user-circle text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"></i> ${m.nome}</span>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onclick="window.removerMembro('${m.firebaseId}', '${m.nome}')"><i class="ph ph-trash"></i></button>
        `;
        container.appendChild(div);
    });
}
