// js/app.js - Fiscal
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy -> from firebase-init.js (window globals)

let currentUser = localStorage.getItem('loggedUser') || null;
let equipeCache = [];

function showToast(msg, type = 'success') {
    try {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: msg, duration: 3000, gravity: "top", position: "right",
                style: { background: type === 'success' ? "var(--sp-pistache)" : (type === 'warning' ? "var(--sp-laranja)" : "var(--sp-red)"), borderRadius: "8px", fontFamily: "Inter" }
            }).showToast();
        } else { alert(msg); }
    } catch (e) { console.error(e); }
}


window.logout = function () {
    window.location.href = '../../index.html';
}

function initApp() {
    if (!currentUser) {
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('loggedUserName').innerText = currentUser;

    // Replaced explicit DOM updates with CoreUI
    if (window.CoreUI) {
        window.CoreUI.initDarkMode();
        
        window.activeViewsConfig = ['dashboard', 'tarefas', 'metapwr', 'robo', 'robo-anexos', 'links'];
        const sidebarConfig = {
            sectorTitle: 'Fiscal',
            userName: currentUser,
            navItems: [
                { id: 'dashboard', label: 'Dashboard', icon: 'ph ph-chart-pie-slice', active: true },
                { id: 'tarefas', label: 'Tarefas da Equipe', icon: 'ph ph-kanban', active: false },
                { id: 'metapwr', label: 'Meta PWR', icon: 'ph ph-target', active: false },
                { id: 'robo', label: 'Robô de Classificação', icon: 'ph ph-robot', active: false },
                { id: 'robo-anexos', label: 'Robô de Anexos', icon: 'ph ph-paperclip', active: false },
                { id: 'links', label: 'Links Úteis', icon: 'ph ph-link', active: false }
            ]
        };
        
        if (window.renderDynamicSidebar) {
            window.renderDynamicSidebar('sidebar-container', sidebarConfig);
        }
    }

    // Iniciar listener de equipe
    iniciarListenerEquipe();
    if (typeof window.initLinksListeners === 'function') window.initLinksListeners('Fiscal');

    window.switchView('dashboard');
}

function iniciarListenerEquipe() {
    try {
        const qEquipe = query(collection(db, "fiscal_equipe"), orderBy("nome"));
        onSnapshot(qEquipe, (snapshot) => {
            equipeCache = [];
            snapshot.forEach(docSnap => equipeCache.push({ firebaseId: docSnap.id, ...docSnap.data() }));
            renderizarListaEquipeGerenciar();
        }, (err) => console.error("Erro Equipe:", err));
    } catch(e) {
        console.error("Erro ao iniciar listener equipe", e);
    }
}

// Global exposure for CoreUI compatibility if needed
window.switchView = function (viewId) {
    if (window.CoreUI && window.activeViewsConfig) {
        window.CoreUI.switchView(viewId, window.activeViewsConfig);
    }
}

// Legacy toggleSidebar removed. Relying on CoreUI.
// Equipe management functions extracted to EquipeController.js

if (currentUser) initApp();
