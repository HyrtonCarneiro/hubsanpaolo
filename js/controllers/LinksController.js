// js/controllers/LinksController.js
// Shared controller for "Links Úteis" feature across all sectors.

window.allLinksCache = [];
window.editingLinkId = null;

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
        if (window.editingLinkId) {
            // Update mode
            await updateDoc(doc(db, "links_" + sId, window.editingLinkId), {
                titulo,
                url: finalUrl,
                descricao,
                dataModificacao: dStr,
                timestampModificacao: Date.now()
            });
            showToast("Link útil atualizado com sucesso!");
        } else {
            // Create mode
            await addDoc(collection(db, "links_" + sId), {
                titulo,
                url: finalUrl,
                descricao,
                autor: currentUser,
                dataStr: dStr,
                timestamp: Date.now()
            });
            showToast("Link útil adicionado com sucesso!");
        }
        
        window.cancelarEdicao(); // Clear form and state
    } catch (e) {
        console.error(e);
        showToast("Erro ao salvar link", "error");
    }
};

window.editarLink = function (linkId) {
    const link = window.allLinksCache.find(l => l.firebaseId === linkId);
    if (!link) return;

    window.editingLinkId = linkId;
    
    // Fill form
    document.getElementById('linkTitulo').value = link.titulo;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkDescricao').value = link.descricao || '';

    // UI Updates
    const btnSalvar = document.getElementById('btnSalvarLink');
    if (btnSalvar) {
        btnSalvar.innerHTML = '<i class="ph ph-check-circle text-xl"></i> Salvar Alterações';
        btnSalvar.classList.replace('bg-spLaranja', 'bg-spPistache'); // If using brand colors
        btnSalvar.classList.replace('bg-[var(--primary)]', 'bg-green-600'); 
    }

    const btnCancelar = document.getElementById('btnCancelarEdicao');
    if (btnCancelar) {
        btnCancelar.style.display = 'flex';
    }

    // Scroll to form
    const formTitle = document.querySelector('h3 i.ph-plus-circle')?.parentElement;
    if (formTitle) formTitle.scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicao = function () {
    window.editingLinkId = null;
    
    // Clear fields
    document.getElementById('linkTitulo').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkDescricao').value = '';

    // Reset UI
    const btnSalvar = document.getElementById('btnSalvarLink');
    if (btnSalvar) {
        btnSalvar.innerHTML = '<i class="ph ph-floppy-disk text-xl"></i> Adicionar Link';
        btnSalvar.classList.remove('bg-spPistache', 'bg-green-600');
        // Original colors are handled by classes in HTML, we just remove the "edit" overrides
    }

    const btnCancelar = document.getElementById('btnCancelarEdicao');
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
};

window.deletarLink = async function (sectorId, linkId) {
    const sId = sectorId || window.currentSectorId;
    if (!confirm("Deseja realmente excluir este link?")) return;
    try {
        await deleteDoc(doc(db, "links_" + sId, linkId));
        showToast("Link excluído.");
        if (window.editingLinkId === linkId) window.cancelarEdicao();
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
            <div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] animate-fadeIn">
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
        
        const row = document.createElement('div');
        row.className = 'bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300 animate-fadeIn group';
        
        row.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--border)] pb-4">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner shrink-0 transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-bold text-[var(--text-main)] m-0 tracking-tight leading-tight">${link.titulo}</h4>
                        <div class="flex items-center gap-3 mt-1.5">
                            <span class="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-wider bg-[var(--bg-color)] text-[var(--text-muted)] border border-[var(--border)]">${domain}</span>
                            <p class="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 opacity-60 m-0">
                                <i class="ph ph-calendar"></i> ${link.dataStr || 'Recente'}
                                <span class="mx-1">•</span> <i class="ph ph-user"></i> ${link.autor || 'Sistema'}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.editarLink('${link.firebaseId}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Editar Link">
                        <i class="ph ph-pencil-simple text-lg"></i>
                    </button>
                    <button onclick="window.deletarLink(null, '${link.firebaseId}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Excluir Link">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                    <a href="${link.url}" target="_blank" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm transition-all ml-2">
                        Acessar <i class="ph ph-arrow-square-out text-base"></i>
                    </a>
                </div>
            </div>
            <div class="text-sm leading-relaxed text-[var(--text-main)] bg-[var(--bg-color)]/30 p-5 rounded-xl border border-[var(--border)]/50 whitespace-pre-line opacity-90">
                ${link.descricao || 'Sem descrição detalhada.'}
            </div>
        `;
        container.appendChild(row);
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
    if (u.includes('notion.so')) return 'ph-fill ph-notion-logo';
    if (u.includes('figma.com')) return 'ph-fill ph-figma-logo';
    return 'ph-fill ph-link';
};
