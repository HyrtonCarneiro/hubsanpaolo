// js/app.js - Controladoria
// db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy -> from firebase-init.js (window globals)

let currentUser = sessionStorage.getItem('loggedUser') || null;
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

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} else if (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
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

    // Injetar botão do Hub dinamicamente
    document.querySelectorAll('.flex.items-center.gap-3').forEach(container => {
        if (!container.closest('.mb-8')) return; // Apenas no header
        if (container.querySelector('.btn-hub')) return;
        const btn = document.createElement('button');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors btn-hub';
        btn.title = 'Escolha de Setores';
        btn.innerHTML = '<i class="ph ph-squares-four text-xl"></i>';
        btn.onclick = () => window.location.href = '../../index.html?hub=1';
        container.insertBefore(btn, container.querySelector('h1'));
    });

    // Iniciar listener de equipe
    iniciarListenerEquipe();

    window.switchView('dashboard');
}

function iniciarListenerEquipe() {
    try {
        const qEquipe = query(collection(db, "controladoria_equipe"), orderBy("nome"));
        onSnapshot(qEquipe, (snapshot) => {
            equipeCache = [];
            snapshot.forEach(docSnap => equipeCache.push({ firebaseId: docSnap.id, ...docSnap.data() }));
            renderizarListaEquipeGerenciar();
        }, (err) => console.error("Erro Equipe:", err));
    } catch(e) {
        console.error("Erro ao iniciar listener equipe", e);
    }
}

window.switchView = function (view) {
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-tarefas').style.display = 'none';
    document.getElementById('view-metapwr').style.display = 'none';

    document.getElementById('nav-dashboard').classList.remove('active-nav');
    document.getElementById('nav-tarefas').classList.remove('active-nav');
    document.getElementById('nav-metapwr').classList.remove('active-nav');

    document.getElementById(`view-${view}`).style.display = 'block';
    document.getElementById(`nav-${view}`).classList.add('active-nav');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }
}

// ====== EQUIPE ======
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
        await addDoc(collection(db, "controladoria_equipe"), { nome });
        document.getElementById('novoMembroNome').value = '';
        showToast("Membro adicionado!");
    } catch(e) {
        console.error(e);
        showToast("Erro ao adicionar", "error");
    }
}

window.removerMembro = async function(idMembro, nomeMembro) {
    if (!confirm(`Excluir ${nomeMembro} da equipe?`)) return;
    try {
        await deleteDoc(doc(db, "controladoria_equipe", idMembro));
        showToast("Membro removido.");
    } catch(e) {
        console.error(e);
        showToast("Erro ao remover", "error");
    }
}

function renderizarListaEquipeGerenciar() {
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

if (currentUser) initApp();
