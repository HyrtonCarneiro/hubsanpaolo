// js/main.js
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where → from firebase-init.js (window globals)
// Button → from js/components/atoms/Button.js (window global)
// SectorCard → from js/components/molecules/SectorCard.js (window global)

let currentUser = localStorage.getItem('loggedUser') || null;
let allUsersCache = [];

function showToast(msg, type = 'success') {
    Toastify({
        text: msg, duration: 3000, gravity: "bottom", position: "right",
        style: { background: type === 'success' ? "var(--success)" : "var(--danger)", borderRadius: "6px", fontFamily: "Inter" }
    }).showToast();
}

window.handleAuth = async function () {
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();

    if (!user || !pass) return showToast("Preencha todos os campos", "error");

    try {
        const q = query(collection(db, "users"), where("user", "==", user));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            if (user === 'admin' && pass === '$@np@010') {
                const allSectors = ["Diretoria", "Auditoria", "Centro_Distribuicao", "Controladoria", "Expansao", "Financeiro", "Fiscal", "Gente_Gestao", "Marketing", "Operacao", "TI", "Varejo"];
                await addDoc(collection(db, "users"), { user: 'admin', pass: '$@np@010', setores_permitidos: allSectors, isSuperAdmin: true });
                localStorage.setItem('loggedUser', user);
                localStorage.setItem('userSectors', JSON.stringify(allSectors));
                localStorage.setItem('isSuperAdmin', 'true');
                currentUser = user;
                initApp();
            } else {
                showToast("Credenciais inválidas", "error");
            }
            return;
        }

        const docRef = querySnapshot.docs[0];
        const userData = docRef.data();

        // Corrige senha do admin se ele já existia mas com a credencial antiga
        if (user === 'admin' && pass === '$@np@010' && userData.pass !== '$@np@010') {
            await updateDoc(doc(db, "users", docRef.id), { pass: '$@np@010' });
            userData.pass = '$@np@010';
        }

        if (userData.pass === pass) {
            let sectors = userData.setores_permitidos || ["TI"];
            if (user === 'admin') {
                sectors = ["Diretoria", "Auditoria", "Centro_Distribuicao", "Controladoria", "Expansao", "Financeiro", "Fiscal", "Gente_Gestao", "Marketing", "Operacao", "TI", "Varejo"];
            }
            localStorage.setItem('userSectors', JSON.stringify(sectors));
            localStorage.setItem('loggedUser', user);
            localStorage.setItem('isSuperAdmin', (user === 'admin' || userData.isSuperAdmin) ? 'true' : 'false');
            currentUser = user;
            initApp();
        } else {
            showToast("Credenciais inválidas", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Erro na autenticação", "error");
    }
}

window.logout = function () {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userSectors');
    localStorage.removeItem('isSuperAdmin');
    location.reload();
}

function initApp() {
    document.getElementById('login-container').style.display = 'none';

    let sectors = [];
    try {
        sectors = JSON.parse(localStorage.getItem('userSectors')) || ["TI"];
    } catch (e) {
        sectors = ["TI"];
    }

    const urlParams = new URLSearchParams(window.location.search);
    const forceHub = urlParams.get('hub') === '1';

    if (sectors.length === 1 && sectors[0] !== 'Admin' && !forceHub) {
        window.location.href = `./setores/${sectors[0]}/index.html`;
        return;
    }

    document.getElementById('hub-container').style.display = 'block';

    const allHubSectors = [
        { id: "Diretoria", title: "Painel Diretoria", icon: "ph-fill ph-crown", color: true },
        { id: "Auditoria", title: "Auditoria", icon: "ph-fill ph-magnifying-glass", color: false },
        { id: "Centro_Distribuicao", title: "Centro de Distribuição", icon: "ph-fill ph-package", color: false },
        { id: "Controladoria", title: "Controladoria", icon: "ph-fill ph-chart-line-up", color: false },
        { id: "Expansao", title: "Expansão", icon: "ph-fill ph-map-pin-line", color: false },
        { id: "Financeiro", title: "Financeiro", icon: "ph-fill ph-bank", color: false },
        { id: "Fiscal", title: "Fiscal", icon: "ph-fill ph-receipt", color: false },
        { id: "Gente_Gestao", title: "Gente e Gestão", icon: "ph-fill ph-users-three", color: false },
        { id: "Marketing", title: "Marketing", icon: "ph-fill ph-megaphone", color: false },
        { id: "Operacao", title: "Operação", icon: "ph-fill ph-gear", color: false },
        { id: "TI", title: "Tecnologia (TI)", icon: "ph-fill ph-hard-drives", color: false },
        { id: "Varejo", title: "Varejo", icon: "ph-fill ph-storefront", color: false }
    ];

    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';

    const hubGrid = document.getElementById('hub-grid');
    if (hubGrid) {
        let gridHTML = '';
        allHubSectors.forEach(sec => {
            const isActive = sectors.includes(sec.id) || isSuperAdmin;
            if (isActive) {
                gridHTML += SectorCard({
                    id: sec.id,
                    title: sec.title,
                    icon: sec.icon,
                    active: true,
                    brandColor: sec.color,
                    onClickDir: `window.goToSector('${sec.id}')`
                });
            }
        });
        hubGrid.innerHTML = gridHTML;
    }

    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        if (isSuperAdmin) adminBtn.style.display = 'inline-flex';
        else adminBtn.style.display = 'none';
    }
}

window.goToSector = function (sector) {
    window.location.href = `./setores/${sector}/index.html`;
}

// =================== ADMIN PANEL ===================
window.abrirModalAdmin = async function () {
    const el = document.getElementById('modalAdminUsers');
    el.style.display = 'flex';
    // Timeout to allow display:flex to apply before opacity transition
    setTimeout(() => { el.classList.add('show'); }, 10);
    carregarUsuariosAdmin();
}

window.fecharModalAdmin = function () {
    const el = document.getElementById('modalAdminUsers');
    el.classList.remove('show');
    setTimeout(() => { el.style.display = 'none'; }, 200);
}

async function carregarUsuariosAdmin() {
    const listHtml = document.getElementById('adminUsersList');
    listHtml.innerHTML = '<p style="padding:20px; text-align:center;">Carregando usuários...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allUsersCache = [];
        querySnapshot.forEach(doc => {
            allUsersCache.push({ id: doc.id, ...doc.data() });
        });

        // Põe o admin em primeiro
        allUsersCache.sort((a, b) => {
            if (a.user === 'admin') return -1;
            if (b.user === 'admin') return 1;
            return a.user.localeCompare(b.user);
        });

        renderAdminUsersList();
    } catch (e) {
        console.error(e);
        listHtml.innerHTML = '<p style="padding:20px; color:var(--danger); text-align:center;">Erro ao carregar usuários do Firebase.</p>';
    }
}

function renderAdminUsersList() {
    const listHtml = document.getElementById('adminUsersList');
    if (!listHtml) return;
    listHtml.innerHTML = '';

    const termo = document.getElementById('buscaUsuarioAdmin') ? document.getElementById('buscaUsuarioAdmin').value.toLowerCase().trim() : '';
    const allSectors = ["Diretoria", "Auditoria", "Centro_Distribuicao", "Controladoria", "Expansao", "Financeiro", "Fiscal", "Gente_Gestao", "Marketing", "Operacao", "TI", "Varejo"];

    let usuariosFiltrados = allUsersCache.filter(u => u.user.toLowerCase().includes(termo));

    if (usuariosFiltrados.length === 0) {
        listHtml.innerHTML = '<p class="text-center text-mutedText p-4">Nenhum usuário encontrado.</p>';
        return;
    }

    usuariosFiltrados.forEach(u => {
        const currentPerms = Array.isArray(u.setores_permitidos) ? u.setores_permitidos : ["TI"];

        let checksHtml = allSectors.map(sec => {
            const isChecked = currentPerms.includes(sec);
            const isAdminStr = u.user === 'admin' ? 'disabled' : '';
            return `
                <label class="inline-flex items-center gap-2 text-sm p-2 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" value="${sec}" class="chk-sector-${u.id} rounded text-brandOrange focus:ring-brandOrange" ${isChecked ? 'checked' : ''} ${isAdminStr}> 
                    <span class="text-mainText">${sec}</span>
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
        carregarUsuariosAdmin(); // Atualiza cache
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
        carregarUsuariosAdmin(); // Refresh da lista
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

        await addDoc(collection(db, "users"), { user, pass, setores_permitidos: ["TI"] });
        showToast("Usuário criado com sucesso!");
        document.getElementById('novoUsuarioAdmin').value = '';
        document.getElementById('novaSenhaAdmin').value = '';
        carregarUsuariosAdmin();
    } catch (e) {
        console.error(e);
        showToast("Erro ao criar usuário", "error");
    }
}

window.alterarSenhaUsuario = async function (userId, userName) {
    const novaSenha = prompt(`Digite a nova senha para o usuário '${userName}':`);
    if (novaSenha === null) return; // cancelou
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
    const defaultName = oldUserName;
    const newName = prompt(`Digite o novo nome para o usuário '${oldUserName}':\n\nIsso atualizará o nome deste usuário em todas as equipes, tarefas e protocolos do Hub.`, defaultName);
    
    if (newName === null) return; // cancelou
    if (!newName.trim() || newName.trim() === oldUserName) return; // vazio ou igual

    try {
        // Verificar se novo nome ja existe
        const qCheck = query(collection(db, "users"), where("user", "==", newName.trim()));
        const snapCheck = await getDocs(qCheck);
        if (!snapCheck.empty) return showToast("Este nome de usuário já está em uso por outra conta.", "error");

        showToast("Sincronizando atualização, por favor aguarde...", "warning");

        // 1. Atualizar base 'users'
        await updateDoc(doc(db, "users", userId), { user: newName.trim() });

        // 2. Collection de Equipes (nome da coleção + campo 'nome')
        const equipeCollections = [
            "equipe", "auditoria_equipe", "varejo_equipe", "cd_equipe", 
            "operacao_equipe", "marketing_equipe", "gente_gestao_equipe", 
            "fiscal_equipe", "diretoria_equipe", "controladoria_equipe", 
            "equipe_expansao", "financeiro_equipe"
        ];
        
        for (let col of equipeCollections) {
            const q = query(collection(db, col), where("nome", "==", oldUserName));
            const snaps = await getDocs(q);
            snaps.forEach(async (d) => {
                await updateDoc(doc(db, col, d.id), { nome: newName.trim() });
            });
        }

        // 3. Collections genéricas onde o usuário pode ser autor/responsável
        const genericCollections = [
            "projetos", "auditoria_projetos", "projetos_expansao",
            "protocolos_suporte", "atas", "logs", "notifications"
        ];

        for (let col of genericCollections) {
            // Strings diretas
            let qAutor = query(collection(db, col), where("autor", "==", oldUserName));
            let sAutor = await getDocs(qAutor);
            sAutor.forEach(async (d) => { await updateDoc(doc(db, col, d.id), { autor: newName.trim() }); });

            let qResp = query(collection(db, col), where("responsavel", "==", oldUserName));
            let sResp = await getDocs(qResp);
            sResp.forEach(async (d) => { await updateDoc(doc(db, col, d.id), { responsavel: newName.trim() }); });

            let qMembro = query(collection(db, col), where("membroResponsavel", "==", oldUserName));
            let sMembro = await getDocs(qMembro);
            sMembro.forEach(async (d) => { await updateDoc(doc(db, col, d.id), { membroResponsavel: newName.trim() }); });

            let qUser = query(collection(db, col), where("user", "==", oldUserName));
            let sUser = await getDocs(qUser);
            sUser.forEach(async (d) => { await updateDoc(doc(db, col, d.id), { user: newName.trim() }); });

            // Array contain (responsaveis)
            let qArray = query(collection(db, col), where("responsaveis", "array-contains", oldUserName));
            let sArray = await getDocs(qArray);
            sArray.forEach(async (d) => { 
                let data = d.data();
                if(data.responsaveis) {
                    let newArr = data.responsaveis.map(r => r === oldUserName ? newName.trim() : r);
                    await updateDoc(doc(db, col, d.id), { responsaveis: newArr });
                }
            });
        }

        // Atualizar localStorage se o usuário editou a si mesmo
        if (currentUser === oldUserName) {
            localStorage.setItem('loggedUser', newName.trim());
            currentUser = newName.trim();
        }

        showToast("Usuário atualizado com sucesso em todos os registros!");
        carregarUsuariosAdmin(); 

    } catch (e) {
        console.error(e);
        showToast("Erro durante a atualização em cascata", "error");
    }
}

// =================== MINHA CONTA (TODOS OS USUÁRIOS) ===================
window.abrirModalPerfil = async function () {
    const el = document.getElementById('modalPerfil');
    el.style.display = 'flex';

    document.getElementById('perfilUserName').textContent = currentUser || '...';

    // Carregar setores do usuário
    try {
        const sectors = JSON.parse(localStorage.getItem('userSectors')) || [];
        const sectorNames = {
            'Diretoria': 'Diretoria', 'TI': 'TI', 'Auditoria': 'Auditoria',
            'Controladoria': 'Controladoria', 'Expansao': 'Expansão', 'Fiscal': 'Fiscal',
            'Financeiro': 'Financeiro', 'Marketing': 'Marketing', 'Gente_Gestao': 'Gente e Gestão',
            'Operacao': 'Operação', 'Varejo': 'Varejo', 'Centro_Distribuicao': 'Centro de Distribuição'
        };
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
    document.getElementById('modalPerfil').style.display = 'none';
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

if (currentUser) initApp();
