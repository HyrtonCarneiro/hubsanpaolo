// js/main.js
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where → from firebase-init.js (window globals)
// Button → from js/components/atoms/Button.js (window global)
// SectorCard → from js/components/molecules/SectorCard.js (window global)

let currentUser = sessionStorage.getItem('loggedUser') || null;
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
                await addDoc(collection(db, "users"), { user: 'admin', pass: '$@np@010', setores_permitidos: allSectors });
                sessionStorage.setItem('loggedUser', user);
                sessionStorage.setItem('userSectors', JSON.stringify(allSectors));
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
            sessionStorage.setItem('userSectors', JSON.stringify(sectors));
            sessionStorage.setItem('loggedUser', user);
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
    sessionStorage.removeItem('loggedUser');
    sessionStorage.removeItem('userSectors');
    location.reload();
}

function initApp() {
    document.getElementById('login-container').style.display = 'none';

    let sectors = [];
    try {
        sectors = JSON.parse(sessionStorage.getItem('userSectors')) || ["TI"];
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

    const hubGrid = document.getElementById('hub-grid');
    if (hubGrid) {
        let gridHTML = '';
        allHubSectors.forEach(sec => {
            const isActive = sectors.includes(sec.id) || currentUser === 'admin';
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
        if (currentUser === 'admin') adminBtn.style.display = 'inline-flex';
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
    const allSectors = ["Diretoria", "TI", "Auditoria", "Controladoria", "Expansao", "Fiscal", "Financeiro", "Marketing", "Gente_Gestao", "Operacao", "Varejo"];

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

        const adminBadge = u.user === 'admin' ? '<span class="bg-brandOrange text-white text-xs px-2 py-1 rounded">Super Admin</span>' : '';
        const btnAlterarSenha = Button({ text: "Senha", icon: "<i class='ph ph-key mr-1'></i>", variant: "outline", onClick: `window.alterarSenhaUsuario('${u.id}', '${u.user}')` });
        const btnDelete = u.user !== 'admin' ? Button({ text: "Excluir", icon: "<i class='ph ph-trash mr-1'></i>", variant: "outline", onClick: `window.deletarUsuario('${u.id}', '${u.user}')` }) : '';
        const btnSave = u.user !== 'admin' ? Button({ text: "Salvar Permissões", icon: "<i class='ph ph-floppy-disk mr-1'></i>", variant: "primary", onClick: `window.salvarPermissoesUsuario('${u.id}')` }) : '<p class="text-xs text-mutedText">Permissões de Super Admin não podem ser alteradas.</p>';

        d.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2 text-lg font-bold text-mainText">
                    <i class="ph ph-user"></i> ${u.user}
                    ${adminBadge}
                </div>
                <div class="flex gap-2 relative z-10">
                    ${btnAlterarSenha}
                    ${btnDelete}
                </div>
            </div>
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

    try {
        await updateDoc(doc(db, "users", userId), {
            setores_permitidos: novasPermissoes
        });
        showToast("Permissões atualizadas com sucesso!");
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

if (currentUser) initApp();
