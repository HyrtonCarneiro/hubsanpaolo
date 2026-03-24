// js/main.js
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where → from firebase-init.js (window globals)
// Button → from js/components/atoms/Button.js (window global)
// SectorCard → from js/components/molecules/SectorCard.js (window global)

let currentUser = localStorage.getItem('loggedUser') || null;
let allUsersCache = [];

// Configuração Centralizada de Setores e suas Coleções de Equipe
window.appConfig = {
    sectors: [
        { id: "Diretoria", title: "Painel Diretoria", icon: "ph-fill ph-crown", color: true, equipeCol: "diretoria_equipe" },
        { id: "Auditoria", title: "Auditoria", icon: "ph-fill ph-magnifying-glass", color: false, equipeCol: "auditoria_equipe" },
        { id: "Centro_Distribuicao", title: "Centro de Distribuição", icon: "ph-fill ph-package", color: false, equipeCol: "cd_equipe" },
        { id: "Controladoria", title: "Controladoria", icon: "ph-fill ph-chart-line-up", color: false, equipeCol: "controladoria_equipe" },
        { id: "Expansao", title: "Expansão", icon: "ph-fill ph-map-pin-line", color: false, equipeCol: "equipe_expansao" },
        { id: "Financeiro", title: "Financeiro", icon: "ph-fill ph-bank", color: false, equipeCol: "financeiro_equipe" },
        { id: "Fiscal", title: "Fiscal", icon: "ph-fill ph-receipt", color: false, equipeCol: "fiscal_equipe" },
        { id: "Gente_Gestao", title: "Gente e Gestão", icon: "ph-fill ph-users-three", color: false, equipeCol: "gente_gestao_equipe" },
        { id: "Marketing", title: "Marketing", icon: "ph-fill ph-megaphone", color: false, equipeCol: "marketing_equipe" },
        { id: "Operacao", title: "Operação", icon: "ph-fill ph-gear", color: false, equipeCol: "operacao_equipe" },
        { id: "TI", title: "Tecnologia (TI)", icon: "ph-fill ph-hard-drives", color: false, equipeCol: "equipe" },
        { id: "Varejo", title: "Varejo", icon: "ph-fill ph-storefront", color: false, equipeCol: "varejo_equipe" }
    ]
};

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
                const allSectors = window.appConfig.sectors.map(s => s.id);
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
                sectors = window.appConfig.sectors.map(s => s.id);
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

    if (sectors.length === 1 && sectors[0] !== 'Admin' && sectors[0] !== 'admin' && !forceHub) {
        window.location.href = `./setores/${sectors[0]}/index.html`;
        return;
    }

    document.getElementById('hub-container').style.display = 'block';

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
    if (adminBtn) {
        if (isSuperAdmin) adminBtn.style.display = 'inline-flex';
        else adminBtn.style.display = 'none';
    }
}

window.goToSector = function (sector) {
    window.location.href = `./setores/${sector}/index.html`;
}

if (currentUser) initApp();
