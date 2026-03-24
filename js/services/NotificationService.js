// js/services/NotificationService.js
// Provides global notification bell, listeners and emitter for all sectors.
// Relies on firebase-init.js (db, collection, doc, addDoc, updateDoc, onSnapshot, query, where, serverTimestamp)

window.NotificationService = {
    notifications: [],
    unreadCount: 0,
    initialized: false,

    init() {
        if (!window.currentUser) {
            // Tenta pegar do localStorage caso o script global ainda não tenha finalizado
            window.currentUser = localStorage.getItem('loggedUser');
            if (!window.currentUser) return; // Ninguém logado ainda
        }
        if (this.initialized) return;
        this.initialized = true;

        this.injectUI();
        this.startListener();
    },

    injectUI() {
        const userContainer = document.getElementById('loggedUserName');
        if (!userContainer) {
            // Fallback: se o site demora a carregar o DOM (pode acontecer em redes lentas)
            setTimeout(() => this.injectUI(), 1000);
            return;
        }

        const parentDiv = userContainer.parentElement;
        if (!parentDiv) return;

        // Estiliza o pai para comportar o sino ao lado do nome do usuário
        parentDiv.classList.add('flex', 'justify-between', 'items-center', 'relative');
        parentDiv.classList.remove('mb-3'); // Limpar margens excessivas caso existam
        parentDiv.style.marginBottom = '0.75rem';

        // Cria container do sino
        const bellContainer = document.createElement('div');
        bellContainer.className = 'relative cursor-pointer flex items-center justify-center';
        bellContainer.id = "globalNotificationBellContainer";
        
        bellContainer.innerHTML = `
            <div id="notifBell" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative" onclick="window.NotificationService.toggleDropdown()">
                <i class="ph ph-bell text-xl text-[var(--text-main)] transition-colors"></i>
                <div id="notifBadge" class="absolute -top-1 -right-1 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm border border-white dark:border-black" style="background-color: #da5513">
                    0
                </div>
            </div>
            
            <div id="notifDropdown" class="absolute bottom-10 left-auto right-0 md:left-full md:-ml-8 w-64 md:w-72 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl hidden flex-col z-[99999] overflow-hidden transform origin-bottom-left transition-all max-h-[400px]">
                <div class="p-3 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex justify-between items-center">
                    <span class="font-bold text-sm text-[var(--text-main)] flex items-center gap-2"><i class="ph-fill ph-bell-ringing text-[#da5513]"></i> Notificações</span>
                    <button class="text-[10px] uppercase font-bold text-[var(--text-muted)] hover:text-[#da5513] transition-colors" onclick="window.NotificationService.markAllAsRead()">Lidas</button>
                </div>
                <div id="notifList" class="flex-1 overflow-y-auto max-h-[300px] flex flex-col custom-scrollbar bg-[var(--bg-color)]">
                    <div class="p-4 text-center text-[10px] text-[var(--text-muted)]">Carregando...</div>
                </div>
            </div>
        `;
        
        parentDiv.appendChild(bellContainer);

        // Click outside listener para fechar o dropdown sem confusão
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notifDropdown');
            const bell = document.getElementById('notifBell');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                if (!bellContainer.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    },

    toggleDropdown() {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    },

    startListener() {
        try {
            // Firestore Query: Notificações do usuário
            const q = window.query(
                window.collection(window.db, "notifications"), 
                window.where("user", "==", window.currentUser)
            );

            let isFirstLoad = true;

            window.onSnapshot(q, (snapshot) => {
                const newNotifs = [];

                snapshot.forEach(docSnap => {
                    newNotifs.push({ id: docSnap.id, ...docSnap.data() });
                });

                // Ordenar no client para evitar necessidade de Indexes compostos manuais no Firebase
                newNotifs.sort((a, b) => {
                    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
                    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
                    return tb - ta;
                });

                this.notifications = newNotifs;
                
                const currentUnread = this.notifications.filter(n => !n.read).length;

                // Tocar som se chegamos em uma quantidade maior de unread messages (novas pushes) e não for o load inicial
                if (!isFirstLoad && currentUnread > this.unreadCount) {
                    this.playBeep();
                }
                
                this.unreadCount = currentUnread;
                isFirstLoad = false;
                
                this.updateUI();
            }, (error) => {
                console.error("Notificações: Falha no Listener (provável erro de rede ou permissões)", error);
            });
        } catch(e) {
            console.error("Notificações: Erro ao iniciar", e);
        }
    },

    updateUI() {
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        const icon = document.querySelector('#notifBell i');
        
        if (!badge || !list || !icon) return;

        // Atualizar icone visual e contador
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            badge.classList.remove('hidden');
            icon.classList.add('ph-fill', 'text-[#da5513]');
            icon.classList.remove('ph', 'text-[var(--text-main)]');
        } else {
            badge.classList.add('hidden');
            icon.classList.add('ph', 'text-[var(--text-main)]');
            icon.classList.remove('ph-fill', 'text-[#da5513]');
        }

        list.innerHTML = '';
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="p-6 text-center text-[11px] font-medium text-[var(--text-muted)] flex flex-col items-center gap-2 opacity-60"><i class="ph ph-coffee text-2xl"></i> Nada de novo por aqui.</div>';
            return;
        }

        // Renderizar lista (max 25 recentes visíveis para performance)
        this.notifications.slice(0, 25).forEach(n => {
            const div = document.createElement('div');
            
            const isUnread = !n.read;
            const bgClass = isUnread ? 'bg-white dark:bg-[#362011] border-l-4 border-l-[#da5513]' : 'bg-transparent opacity-60 hover:opacity-100 border-l border-l-transparent';
            
            div.className = `p-3.5 border-b border-[var(--border)] relative transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 ${bgClass}`;
            
            // Format tempo amigavel (se for no mesmo dia, exibe hora, senão data e hora)
            let timeStr = 'Agora';
            if (n.createdAt?.toDate) {
                const date = n.createdAt.toDate();
                const hoje = new Date();
                if (date.getDate() === hoje.getDate() && date.getMonth() === hoje.getMonth() && date.getFullYear() === hoje.getFullYear()) {
                    timeStr = 'Hoje, ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                } else {
                    timeStr = date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                }
            }
            
            let cursor = 'cursor-pointer';
            let onclick = `window.NotificationService.clickNotification('${n.id}', '${n.link || ''}')`;

            div.innerHTML = `
                <div class="flex flex-col gap-1 w-full ${cursor}" onclick="${onclick}">
                    <div class="text-[12px] leading-snug text-[var(--text-main)] ${isUnread ? 'font-bold' : 'font-medium'}">${n.message}</div>
                    <div class="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] mt-1">${timeStr}</div>
                </div>
            `;
            list.appendChild(div);
        });
    },

    async markAsRead(id) {
        try {
            await window.updateDoc(window.doc(window.db, "notifications", id), { read: true });
        } catch(e) { console.error("Erro marcar como lida:", e); }
    },

    async markAllAsRead() {
        const unreadNotifs = this.notifications.filter(n => !n.read);
        if (unreadNotifs.length === 0) return;
        
        try {
            // Em vez de usar batch, usamos iteração (geralmente quantidade pequena)
            unreadNotifs.forEach(n => {
                window.updateDoc(window.doc(window.db, "notifications", n.id), { read: true });
            });
        } catch(e) { console.error("Erro marcar todas lidas:", e); }
    },

    clickNotification(id, link) {
        this.markAsRead(id);
        if (link && link !== 'undefined' && link !== '') {
            // Fecha UI primeiro
            this.toggleDropdown();
            // Lógica simples para forçar o scroll se o link for uma âncora nativa na mesma pag
            if (link.startsWith('#')) {
                const el = document.querySelector(link);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Link is expected to be relative to the hubsanpaolo root directory
                // We calculate how many levels deep we are to properly resolve the path
                const pathStr = window.location.pathname.replace(/\\/g, '/');
                const isRoot = pathStr.endsWith('hubsanpaolo/index.html') || pathStr.endsWith('hubsanpaolo/');
                const prefix = isRoot ? '' : '../../';
                window.location.href = prefix + link;
            }
        }
    },

    playBeep() {
        try {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return;
            const audioCtx = new AudioCtor();
            
            // Resume contextual se estiver bloqueado pelo browser
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Frequência suave de "Blip"
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioCtx.currentTime); 
            oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 0.05); // Volume em 100%
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); // diminui mais devagar
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch(e) { console.warn('Notificações: AudioContext restrito ou não suportado', e); }
    }
};

/**
 * Emite uma notificação para um usuário específico.
 * @param {string} user - O nome do usuário (ex: 'admin', 'joao.silva')
 * @param {string} message - A mensagem exibir
 * @param {string} link - (Opcional) ID ou path para redirecionamento ao clicar (+scroll smooth)
 */
window.emitNotification = async function(user, message, link = "") {
    if (!user || !message) return;
    try {
        await window.addDoc(window.collection(window.db, "notifications"), {
            user: user,
            message: message,
            link: link,
            read: false,
            createdAt: window.serverTimestamp()
        });
    } catch(e) {
        console.error("Notificações: Erro ao emitir evento de notificação", e);
    }
};

// Start logic when loaded (Delayed slightly to ensure DOM & currentUser is ready)
window.addEventListener("load", () => {
    setTimeout(() => {
        if (window.NotificationService && !window.NotificationService.initialized) {
            window.NotificationService.init();
        }
    }, 1500); // Aguarda login e sidebars renderizarem caso venham via script
});
