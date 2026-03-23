// js/controllers/LinksController.js
// Shared controller for "Links Úteis" feature across all sectors.

window.allLinksCache = [];

window.initLinksListeners = function (sectorId) {
    if (!sectorId) {
        console.error("sectorId is required for initLinksListeners");
        return;
    }
    window.currentSectorId = sectorId; // Cache for other functions
    try {
        const qLinks = query(collection(db, "links_" + sectorId), orderBy("timestamp", "desc"));
        onSnapshot(qLinks, (snapshot) => {
            window.allLinksCache = [];
            snapshot.forEach((docSnap) => {
                window.allLinksCache.push({ firebaseId: docSnap.id, ...docSnap.data() });
            });
            window.renderizarLinks(); // Render using internal cache
        });
    } catch (e) {
        console.error("Erro ao iniciar listener links para " + sectorId, e);
    }
};

window.salvarLink = async function (sectorId) {
    const sId = sectorId || window.currentSectorId;
    const titulo = document.getElementById('linkTitulo').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const descricao = document.getElementById('linkDescricao').value.trim();

    if (!titulo || !url) {
        return showToast("Preencha ao menos o título e o link", "error");
    }

    // Basic URL validation
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }

    const dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    try {
        await addDoc(collection(db, "links_" + sId), {
            titulo,
            url: finalUrl,
            descricao,
            autor: currentUser,
            dataStr: dStr,
            timestamp: Date.now()
        });
        showToast("Link útil adicionado com sucesso!");
        // Clear form
        document.getElementById('linkTitulo').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkDescricao').value = '';
    } catch (e) {
        console.error(e);
        showToast("Erro ao salvar link", "error");
    }
};

window.deletarLink = async function (sectorId, linkId) {
    const sId = sectorId || window.currentSectorId;
    if (!confirm("Deseja realmente excluir este link?")) return;
    try {
        await deleteDoc(doc(db, "links_" + sId, linkId));
        showToast("Link excluído.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir link", "error");
    }
};

window.renderizarLinks = function (filteredLinks) {
    const container = document.getElementById('listaLinksContainer');
    if (!container) return;

    const linksToRender = filteredLinks || window.allLinksCache;

    // Alphabetical Sorting (A-Z)
    const sortedLinks = [...linksToRender].sort((a, b) => 
        a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
    );

    container.innerHTML = '';

    if (sortedLinks.length === 0) {
        const isSearching = document.getElementById('buscaLinks')?.value.trim() !== '';
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] animate-fadeIn">
                <div class="w-20 h-20 bg-[var(--bg-color)] rounded-full flex items-center justify-center mb-4">
                    <i class="ph ph-${isSearching ? 'magnifying-glass' : 'link-break'} text-5xl text-[var(--border)]"></i>
                </div>
                <h2 class="text-xl font-bold text-[var(--text-main)] m-0">${isSearching ? 'Nenhum link encontrado' : 'Nenhum link útil cadastrado'}</h2>
                <p class="text-sm opacity-60 mt-2">${isSearching ? 'Tente ajustar os termos da sua busca.' : 'Os links importantes para o setor aparecerão aqui.'}</p>
            </div>`;
        return;
    }

    sortedLinks.forEach((link) => {
        let domain = 'link';
        try {
            domain = new URL(link.url).hostname.replace('www.', '');
        } catch (e) {}

        const iconClass = window.getLinkIcon(link.url);
        
        const card = document.createElement('div');
        card.className = 'bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300 group hover:-translate-y-1 animate-fadeIn flex flex-col h-full';
        
        card.innerHTML = `
            <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                    <i class="${iconClass}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h4 class="text-base font-bold text-[var(--text-main)] truncate pr-2" title="${link.titulo}">${link.titulo}</h4>
                        <button onclick="window.deletarLink(null, '${link.firebaseId}')" class="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1" title="Excluir">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                    <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">${domain}</span>
                </div>
            </div>
            <p class="text-xs text-[var(--text-muted)] mb-5 line-clamp-3 leading-relaxed opacity-80 flex-1">${link.descricao || 'Sem descrição.'}</p>
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]/50">
                <span class="text-[10px] font-bold text-[var(--text-muted)] opacity-60">${link.dataStr || ''}</span>
                <a href="${link.url}" target="_blank" class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--primary)] hover:text-white transition-all">
                    Acessar <i class="ph ph-arrow-square-out"></i>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
};

window.filtrarLinks = function () {
    const term = (document.getElementById('buscaLinks')?.value || '').toLowerCase();
    if (!term) {
        window.renderizarLinks();
        return;
    }

    const filtered = window.allLinksCache.filter(l => 
        (l.titulo || '').toLowerCase().includes(term) || 
        (l.descricao || '').toLowerCase().includes(term)
    );
    window.renderizarLinks(filtered);
};

window.getLinkIcon = function (url) {
    const u = url.toLowerCase();
    if (u.includes('drive.google.com')) return 'ph-fill ph-google-drive-logo';
    if (u.includes('sheets.google.com')) return 'ph-fill ph-file-xls';
    if (u.includes('docs.google.com')) return 'ph-fill ph-file-doc';
    if (u.includes('meet.google.com')) return 'ph-fill ph-video-camera';
    if (u.includes('github.com')) return 'ph-fill ph-github-logo';
    if (u.includes('facebook.com') || u.includes('meta.com')) return 'ph-fill ph-facebook-logo';
    if (u.includes('instagram.com')) return 'ph-fill ph-instagram-logo';
    if (u.includes('trello.com')) return 'ph-fill ph-trello-logo';
    if (u.includes('whatsapp.com') || u.includes('wa.me')) return 'ph-fill ph-whatsapp-logo';
    if (u.includes('youtube.com')) return 'ph-fill ph-youtube-logo';
    return 'ph-fill ph-link';
};
