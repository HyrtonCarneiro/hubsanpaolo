// js/controllers/AdminController.js
// Responsável pela interface do Super Admin (Gerenciar Usuários e Permissões)

let allUsersCache = [];

window.abrirModalAdmin = async function () {
    const el = document.getElementById('modalAdminUsers');
    if (!el) return;
    el.style.display = 'flex';
    setTimeout(() => { el.classList.add('show'); }, 10);
    window.carregarUsuariosAdmin();
}

window.fecharModalAdmin = function () {
    const el = document.getElementById('modalAdminUsers');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(() => { el.style.display = 'none'; }, 200);
}

window.carregarUsuariosAdmin = async function () {
    const listHtml = document.getElementById('adminUsersList');
    if (!listHtml) return;
    listHtml.innerHTML = '<p style="padding:20px; text-align:center;">Carregando usuários...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allUsersCache = [];
        querySnapshot.forEach(doc => {
            allUsersCache.push({ id: doc.id, ...doc.data() });
        });

        allUsersCache.sort((a, b) => {
            if (a.user === 'admin') return -1;
            if (b.user === 'admin') return 1;
            return a.user.localeCompare(b.user);
        });

        window.renderAdminUsersList();
    } catch (e) {
        console.error(e);
        listHtml.innerHTML = '<p style="padding:20px; color:var(--danger); text-align:center;">Erro ao carregar usuários do Firebase.</p>';
    }
}

window.renderAdminUsersList = function () {
    const listHtml = document.getElementById('adminUsersList');
    if (!listHtml) return;
    listHtml.innerHTML = '';

    const termo = document.getElementById('buscaUsuarioAdmin') ? document.getElementById('buscaUsuarioAdmin').value.toLowerCase().trim() : '';

    let usuariosFiltrados = allUsersCache.filter(u => u.user.toLowerCase().includes(termo));

    if (usuariosFiltrados.length === 0) {
        listHtml.innerHTML = '<p class="text-center text-mutedText p-4">Nenhum usuário encontrado.</p>';
        return;
    }

    usuariosFiltrados.forEach(u => {
        const currentPerms = Array.isArray(u.setores_permitidos) ? u.setores_permitidos : ["Auditoria"];

        let checksHtml = window.appConfig.sectors.map(sec => {
            const isChecked = currentPerms.includes(sec.id);
            const isAdminStr = u.user === 'admin' ? 'disabled' : '';
            return `
                <label class="inline-flex items-center gap-2 text-sm p-2 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" value="${sec.id}" class="chk-sector-${u.id} rounded text-brandOrange focus:ring-brandOrange" ${isChecked ? 'checked' : ''} ${isAdminStr}> 
                    <span class="text-mainText">${sec.id}</span>
                </label>
            `;
        }).join('');

        const d = document.createElement('div');
        d.className = 'border border-gray-200 p-4 mb-4 rounded-lg bg-white shadow-sm';

        const adminBadge = (u.user === 'admin' || u.isSuperAdmin) ? '<span class="bg-brandOrange text-white text-xs px-2 py-1 rounded">Super Admin</span>' : '';
        const isSelf = u.user === 'admin';
        
        const superAdminToggle = !isSelf ? `
            <label class="inline-flex items-center gap-2 mb-4 p-3 bg-brandOrange/10 border border-brandOrange/20 rounded-lg cursor-pointer w-full">
                <input type="checkbox" id="superAdmin-${u.id}" class="rounded text-brandOrange focus:ring-brandOrange" ${u.isSuperAdmin ? 'checked' : ''}> 
                <span class="text-sm font-bold text-brandOrange">Conceder Acesso Total (Super Admin)</span>
            </label>
        ` : '';

        const btnEditNome = Button({ text: "Editar", icon: "<i class='ph ph-pencil-simple mr-1'></i>", variant: "outline", onClick: `window.editarNomeUsuario('${u.id}', '${u.user}')` });
        const btnAlterarSenha = Button({ text: "Senha", icon: "<i class='ph ph-key mr-1'></i>", variant: "outline", onClick: `window.alterarSenhaUsuario('${u.id}', '${u.user}')` });
        const btnDelete = !isSelf ? Button({ text: "Excluir", icon: "<i class='ph ph-trash mr-1'></i>", variant: "outline", onClick: `window.deletarUsuario('${u.id}', '${u.user}')` }) : '';
        const btnSave = !isSelf ? Button({ text: "Salvar Permissões", icon: "<i class='ph ph-floppy-disk mr-1'></i>", variant: "primary", onClick: `window.salvarPermissoesUsuario('${u.id}')` }) : '<p class="text-xs text-mutedText italic">Permissões de administrador raiz não podem ser alteradas.</p>';

        d.innerHTML = `
            <div class="flex justify-between items-center mb-4 gap-4 flex-wrap sm:flex-nowrap">
                <div class="flex items-center gap-2 text-lg font-bold text-mainText">
                    <i class="ph ph-user"></i> ${u.user}
                    ${adminBadge}
                </div>
                <div class="flex flex-wrap gap-2 relative z-10 sm:justify-end">
                    ${btnEditNome}
                    ${btnAlterarSenha}
                    ${btnDelete}
                </div>
            </div>
            ${superAdminToggle}
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                ${checksHtml}
            </div>
            <div class="mt-4 relative z-10">
                ${btnSave}
            </div>
        `;
        listHtml.appendChild(d);
    });
}

window.salvarPermissoesUsuario = async function (userId) {
    const checkboxes = document.querySelectorAll('.chk-sector-' + userId);
    let novasPermissoes = [];
    checkboxes.forEach(chk => {
        if (chk.checked) novasPermissoes.push(chk.value);
    });

    if (novasPermissoes.length === 0) return showToast("Selecione pelo menos um setor", "error");

    const isSuper = document.getElementById('superAdmin-' + userId)?.checked || false;

    try {
        await updateDoc(doc(db, "users", userId), {
            setores_permitidos: novasPermissoes,
            isSuperAdmin: isSuper
        });
        showToast("Permissões atualizadas com sucesso!");
        window.carregarUsuariosAdmin();
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar permissões", "error");
    }
}

window.deletarUsuario = async function (userId, userName) {
    if (!confirm(`Tem certeza que deseja apagar o usuário '${userName}' permanentemente?`)) return;

    try {
        await deleteDoc(doc(db, "users", userId));
        showToast("Usuário deletado");
        window.carregarUsuariosAdmin();
    } catch (e) {
        console.error(e);
        showToast("Erro ao deletar usuário", "error");
    }
}

window.criarUsuarioAdmin = async function () {
    const user = document.getElementById('novoUsuarioAdmin').value.trim();
    const pass = document.getElementById('novaSenhaAdmin').value.trim();

    if (!user || !pass) return showToast("Preencha usuário e senha", "error");

    try {
        const q = query(collection(db, "users"), where("user", "==", user));
        const qs = await getDocs(q);
        if (!qs.empty) return showToast("Usuário já existe", "error");

        await addDoc(collection(db, "users"), { user, pass, setores_permitidos: ["Auditoria"] });
        showToast("Usuário criado com sucesso!");
        document.getElementById('novoUsuarioAdmin').value = '';
        document.getElementById('novaSenhaAdmin').value = '';
        window.carregarUsuariosAdmin();
    } catch (e) {
        console.error(e);
        showToast("Erro ao criar usuário", "error");
    }
}

window.alterarSenhaUsuario = async function (userId, userName) {
    const novaSenha = prompt(`Digite a nova senha para o usuário '${userName}':`);
    if (novaSenha === null) return;
    if (!novaSenha.trim()) return showToast("Senha não pode ser vazia", "error");

    try {
        await updateDoc(doc(db, "users", userId), { pass: novaSenha.trim() });
        showToast("Senha alterada com sucesso!");
    } catch (e) {
        console.error(e);
        showToast("Erro ao alterar senha", "error");
    }
}

window.editarNomeUsuario = async function (userId, oldUserName) {
    const newName = prompt(`Digite o novo nome para o usuário '${oldUserName}':\n\nIsso atualizará o nome deste usuário em todas as equipes, tarefas e protocolos do Hub.`, oldUserName);
    
    if (newName === null) return;
    if (!newName.trim() || newName.trim() === oldUserName) return;

    try {
        const qCheck = query(collection(db, "users"), where("user", "==", newName.trim()));
        const snapCheck = await getDocs(qCheck);
        if (!snapCheck.empty) return showToast("Este nome de usuário já está em uso por outra conta.", "error");

        showToast("Sincronizando atualização, por favor aguarde...", "warning");

        await updateDoc(doc(db, "users", userId), { user: newName.trim() });

        // 2. Collections de Equipes (Dinâmico via config)
        for (let sec of window.appConfig.sectors) {
            if (!sec.equipeCol) continue;
            const q = query(collection(db, sec.equipeCol), where("nome", "==", oldUserName));
            const snaps = await getDocs(q);
            snaps.forEach(async (d) => {
                await updateDoc(doc(db, sec.equipeCol, d.id), { nome: newName.trim() });
            });
        }

        // 3. Collections genéricas
        const genericCollections = [
            "auditoria_projetos", "protocolos_suporte", "atas", "logs", "notifications"
        ];

        for (let col of genericCollections) {
            const fields = ["autor", "responsavel", "membroResponsavel", "user"];
            for (let f of fields) {
                const q = query(collection(db, col), where(f, "==", oldUserName));
                const s = await getDocs(q);
                s.forEach(async (d) => {
                    const updateObj = {};
                    updateObj[f] = newName.trim();
                    await updateDoc(doc(db, col, d.id), updateObj);
                });
            }

            const qArray = query(collection(db, col), where("responsaveis", "array-contains", oldUserName));
            const sArray = await getDocs(qArray);
            sArray.forEach(async (d) => { 
                const data = d.data();
                if(data.responsaveis) {
                    const newArr = data.responsaveis.map(r => r === oldUserName ? newName.trim() : r);
                    await updateDoc(doc(db, col, d.id), { responsaveis: newArr });
                }
            });
        }

        if (window.currentUser === oldUserName) {
            localStorage.setItem('loggedUser', newName.trim());
            window.currentUser = newName.trim();
        }

        showToast("Usuário atualizado com sucesso em todos os registros!");
        window.carregarUsuariosAdmin(); 

    } catch (e) {
        console.error(e);
        showToast("Erro durante a atualização em cascata", "error");
    }
}
