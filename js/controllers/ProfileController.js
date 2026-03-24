// js/controllers/ProfileController.js
// Responsável pelo perfil do usuário logado (Alterar Senha e Informações)

window.abrirModalPerfil = async function () {
    const el = document.getElementById('modalPerfil');
    if (!el) return;
    el.style.display = 'flex';

    document.getElementById('perfilUserName').textContent = window.currentUser || '...';

    // Carregar setores do usuário
    try {
        const sectors = JSON.parse(localStorage.getItem('userSectors')) || [];
        const sectorNames = {};
        window.appConfig.sectors.forEach(s => sectorNames[s.id] = s.title);
        
        const nomes = sectors.map(s => sectorNames[s] || s);
        document.getElementById('perfilUserSetores').textContent = nomes.length > 3
            ? nomes.slice(0, 3).join(', ') + ` (+${nomes.length - 3})`
            : nomes.join(', ') || 'Nenhum setor';
    } catch (e) {
        document.getElementById('perfilUserSetores').textContent = '';
    }

    // Limpar campos
    document.getElementById('perfilSenhaAtual').value = '';
    document.getElementById('perfilNovaSenha').value = '';
    document.getElementById('perfilConfirmarSenha').value = '';
}

window.fecharModalPerfil = function () {
    const el = document.getElementById('modalPerfil');
    if (!el) return;
    el.style.display = 'none';
}

window.salvarNovaSenha = async function () {
    const senhaAtual = document.getElementById('perfilSenhaAtual').value.trim();
    const novaSenha = document.getElementById('perfilNovaSenha').value.trim();
    const confirmar = document.getElementById('perfilConfirmarSenha').value.trim();

    if (!senhaAtual) return showToast("Digite sua senha atual", "error");
    if (!novaSenha) return showToast("Digite a nova senha", "error");
    if (novaSenha.length < 4) return showToast("A nova senha deve ter no mínimo 4 caracteres", "error");
    if (novaSenha !== confirmar) return showToast("As senhas não conferem", "error");

    try {
        const q = query(collection(db, "users"), where("user", "==", window.currentUser));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return showToast("Usuário não encontrado", "error");

        const docRef = querySnapshot.docs[0];
        const userData = docRef.data();

        if (userData.pass !== senhaAtual) return showToast("Senha atual incorreta", "error");

        await updateDoc(doc(db, "users", docRef.id), { pass: novaSenha });
        showToast("Senha alterada com sucesso!");
        window.fecharModalPerfil();
    } catch (e) {
        console.error(e);
        showToast("Erro ao alterar senha", "error");
    }
}
