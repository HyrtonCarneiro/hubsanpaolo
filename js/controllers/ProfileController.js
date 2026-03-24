// js/controllers/ProfileController.js
// Responsável por gerenciar o modal de "Minha Conta" e alteração de senha do usuário logado

window.abrirModalPerfil = async function () {
    const el = document.getElementById('modalPerfil');
    if (!el) return;
    el.style.display = 'flex';
    document.getElementById('perfilUserName').textContent = currentUser || '...';

    try {
        const sectors = JSON.parse(localStorage.getItem('userSectors')) || [];
        const sectorNames = {};
        if (window.appConfig && window.appConfig.sectors) {
            window.appConfig.sectors.forEach(s => sectorNames[s.id] = s.title);
        }
        
        const nomes = sectors.map(s => sectorNames[s] || s);
        const nameEl = document.getElementById('perfilUserSetores');
        if (nameEl) {
            nameEl.textContent = nomes.length > 3
                ? nomes.slice(0, 3).join(', ') + ` (+${nomes.length - 3})`
                : nomes.join(', ') || 'Nenhum setor';
        }
    } catch (e) {
        if (document.getElementById('perfilUserSetores')) {
            document.getElementById('perfilUserSetores').textContent = '';
        }
    }

    if (document.getElementById('perfilSenhaAtual')) document.getElementById('perfilSenhaAtual').value = '';
    if (document.getElementById('perfilNovaSenha')) document.getElementById('perfilNovaSenha').value = '';
    if (document.getElementById('perfilConfirmarSenha')) document.getElementById('perfilConfirmarSenha').value = '';
}

window.fecharModalPerfil = function () {
    const el = document.getElementById('modalPerfil');
    if (el) el.style.display = 'none';
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
        const q = query(collection(db, "users"), where("user", "==", currentUser));
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
