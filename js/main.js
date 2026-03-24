// js/main.js
// Hub Central de Controle - San Paolo
// Gerencia Autenticação, Escolha de Setores e Inicialização do App

// Configuração Global de Setores
window.appConfig = {
    sectors: [
        { id: "Diretoria", title: "Painel Diretoria", icon: "ph-fill ph-crown", color: true },
        { id: "Auditoria", title: "Auditoria", icon: "ph-fill ph-magnifying-glass", color: false },
        { id: "Centro_Distribuicao", title: "Centro de Distribuição", icon: "ph-fill ph-package", color: false },
        { id: "Controladoria", title: "Controladoria", icon: "ph-fill ph-chart-line-up", color: false },
        { id: "Expansao", title: "Expansão", icon: "ph-fill ph-map-pin-line", color: false },
        { id: "Financeiro", title: "Financeiro", icon: "ph-fill ph-bank", color: false },
        { id: "Fiscal", title: "Fiscal", icon: "ph-fill ph-receipt", color: false },
        { id: "Gente_Gestao", title: "Gente e Gestão", icon: "ph-fill ph-users-three", color: false, equipeCol: "equipe_gente_gestao" },
        { id: "Marketing", title: "Marketing", icon: "ph-fill ph-megaphone", color: false },
        { id: "Operacao", title: "Operação", icon: "ph-fill ph-gear", color: false, equipeCol: "equipe_operacao" },
        { id: "TI", title: "Tecnologia (TI)", icon: "ph-fill ph-hard-drives", color: false, equipeCol: "equipe_ti" },
        { id: "Varejo", title: "Varejo", icon: "ph-fill ph-storefront", color: false }
    ]
};

window.currentUser = localStorage.getItem('loggedUser') || null;

function showToast(msg, type = 'success') {
    if (typeof Toastify === 'undefined') return console.log("Toast:", msg);
    Toastify({
        text: msg, duration: 3000, gravity: "bottom", position: "right",
        style: { background: type === 'success' ? "var(--success)" : (type === 'warning' ? "#f59e0b" : "var(--danger)"), borderRadius: "6px", fontFamily: "Inter" }
    }).showToast();
}

// =================== AUTENTICAÇÃO ===================
window.handleAuth = async function () {
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();

    if (!user || !pass) return showToast("Preencha todos os campos", "error");

    try {
        const q = query(collection(db, "users"), where("user", "==", user));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Check for Hardcoded Admin (Initial Setup)
            if (user === 'admin' && pass === '$@np@010') {
                const allSectors = window.appConfig.sectors.map(s => s.id);
                await addDoc(collection(db, "users"), { user: 'admin', pass: '$@np@010', setores_permitidos: allSectors, isSuperAdmin: true });
                loginSuccess(user, allSectors, true);
            } else {
                showToast("Credenciais inválidas", "error");
            }
            return;
        }

        const docRef = querySnapshot.docs[0];
        const userData = docRef.data();

        if (userData.pass === pass) {
            let sectors = userData.setores_permitidos || ["TI"];
            if (user === 'admin') {
                sectors = window.appConfig.sectors.map(s => s.id);
            }
            loginSuccess(user, sectors, (user === 'admin' || userData.isSuperAdmin));
        } else {
            showToast("Credenciais inválidas", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Erro na autenticação", "error");
    }
}

function loginSuccess(user, sectors, isSuperAdmin) {
    localStorage.setItem('loggedUser', user);
    localStorage.setItem('userSectors', JSON.stringify(sectors));
    localStorage.setItem('isSuperAdmin', isSuperAdmin ? 'true' : 'false');
    window.currentUser = user;
    window.initApp();
}

window.logout = function () {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userSectors');
    localStorage.removeItem('isSuperAdmin');
    location.reload();
}

// =================== HUB DE SETORES ===================
window.initApp = function () {
    const loginContainer = document.getElementById('login-container');
    const hubContainer = document.getElementById('hub-container');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (hubContainer) hubContainer.style.display = 'block';

    let sectors = [];
    try {
        sectors = JSON.parse(localStorage.getItem('userSectors')) || ["TI"];
    } catch (e) {
        sectors = ["TI"];
    }

    const urlParams = new URLSearchParams(window.location.search);
    const forceHub = urlParams.get('hub') === '1';

    if (sectors.length === 1 && !forceHub) {
        window.goToSector(sectors[0]);
        return;
    }

    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    const hubGrid = document.getElementById('hub-grid');
    
    if (hubGrid) {
        let gridHTML = '';
        window.appConfig.sectors.forEach(sec => {
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
    if (adminBtn) adminBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
}

window.goToSector = function (sector) {
    window.location.href = `./setores/${sector}/index.html`;
}

// Auto-init if user is logged
if (window.currentUser) {
    window.onload = () => {
        window.initApp();
    };
}
