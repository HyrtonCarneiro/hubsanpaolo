// js/controllers/AppController.js — Core da aplicação (init, nav, sidebar, dark mode)
// Depends on: firebase-init.js (window globals), data.js (lojasIniciais)

let currentUser = localStorage.getItem('loggedUser') || null;
window.currentUser = currentUser;
window.importCancelled = false;

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
window.showToast = showToast;

// --- HELPERS DE NORMALIZAÇÃO E ROBUSTEZ ---

window.normalizeString = function(str) {
    if (!str) return "";
    return str.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toUpperCase()
        .trim();
};

window.properCase = function(str) {
    if (!str) return "";
    const s = str.toString().toLowerCase().trim();
    if (s.length === 0) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};

window.getLojaByFlexName = function(name) {
    if (!name) return null;
    const search = window.normalizeString(name);
    
    // Mapeamento de Sinônimos/Apelidos comuns
    const sinonimos = {
        "OUTLET FORTALEZA": "CAUCAIA/OUTLET",
        "CAUCAIA": "CAUCAIA/OUTLET",
        "OUTLET": "CAUCAIA/OUTLET",
        "ESTACAO CUIABA": "SHOPPING ESTAÇÃO CUIABA",
        "PANTANAL": "PANTANAL SHOPPING / CUIABA",
        "COHAMA": "SHOPPING DA ILHA", // No Hub Cohama é o Shopping da Ilha
        "IGUATEMI": "IGUATEMI FORTALEZA",
        "RIO POTY": "RIO POTY",
        "RIVERSIDE": "RIVERSIDE",
        "PATIO PAULISTA": "PATIO PAULISTA",
        "CIDADE SAO PAULO": "CIDADE SÃO PAULO",
        "AEROPORTO SALVADOR Q": "AEROPORTO QUIOSQUE SALVADOR",
        "AEROPORTO SALVADOR": "AEROPORTO LOJA SALVADOR",
        "BOULEVARD": "BOULEVARD",
        "PARNAMIRIM": "PARNAMIRIM",
        "PREA": "PREA"
    };

    // 1. Tentar por sinônimo exato (normalizado)
    if (sinonimos[search]) {
        const oficial = sinonimos[search];
        const loja = window.lojasIniciais.find(l => window.normalizeString(l.nome) === window.normalizeString(oficial));
        if (loja) return loja;
    }

    // 2. Tentar correspondência exata
    let found = window.lojasIniciais.find(l => window.normalizeString(l.nome) === search);
    if (found) return found;

    // 3. Tentar correspondência parcial (se o nome da planilha está contido no nome do sistema ou vice-versa)
    found = window.lojasIniciais.find(l => {
        const oficial = window.normalizeString(l.nome);
        return oficial.includes(search) || search.includes(oficial);
    });

    return found || null;
};

window.getAuditorByFlexName = function(name) {
    if (!name) return null;
    const search = window.normalizeString(name);
    
    // 1. Tentar correspondência exata ou parcial na equipe cadastrada
    if (window.audiEquipe && window.audiEquipe.length > 0) {
        const found = window.audiEquipe.find(m => {
            const normalizedMembro = window.normalizeString(m.nome);
            return normalizedMembro.includes(search) || search.includes(normalizedMembro);
        });
        if (found) return found.nome;
    }

    // Retorna null para disparar o remapeamento se o nome na planilha não for reconhecido como um membro oficial
    return null;
};

// --- CONTROLE DE MODAL DE IMPORTAÇÃO ---

window.importPendentes = { 
    rows: [], 
    unknownStores: new Set(), 
    unknownAuditors: new Set(), 
    callback: null,
    context: null // 'planejamento' ou 'mapeamento'
};

window.showImportModal = function(total) {
    window.importCancelled = false; // Reset flag
    window.importPendentes = { rows: [], unknownStores: new Set(), unknownAuditors: new Set(), callback: null, context: null };
    const modal = document.getElementById('modalImportProgresso');
    const log = document.getElementById('importLog');
    const bar = document.getElementById('importProgressBar');
    const percent = document.getElementById('importProgressPercent');
    const status = document.getElementById('importProgressStatus');
    const btnFechar = document.getElementById('btnFecharImport');
    const btnConcluir = document.getElementById('btnConcluirImport');
    const btnInterromper = document.getElementById('btnInterromperImport');

    if (modal) modal.classList.add('show');
    if (log) log.innerHTML = `<div class="text-blue-500 font-bold">Iniciando importação de ${total} registros...</div>`;
    if (bar) bar.style.width = '0%';
    if (percent) percent.innerText = '0%';
    if (status) status.innerText = 'Processando...';
    if (btnFechar) btnFechar.classList.add('hidden');
    if (btnConcluir) btnConcluir.classList.add('hidden');
    if (btnInterromper) btnInterromper.classList.remove('hidden');
};

window.updateImportProgress = function(index, total, msg, type = 'info') {
    const log = document.getElementById('importLog');
    const bar = document.getElementById('importProgressBar');
    const percent = document.getElementById('importProgressPercent');
    const status = document.getElementById('importProgressStatus');

    const pct = Math.round((index / total) * 100);
    if (bar) bar.style.width = pct + '%';
    if (percent) percent.innerText = pct + '%';
    if (status) status.innerText = index === total ? 'Concluído' : 'Processando...';

    if (log && msg) {
        let color = 'text-[var(--text-muted)]';
        if (type === 'success') color = 'text-green-500 font-medium';
        if (type === 'warning') color = 'text-yellow-500';
        if (type === 'error') color = 'text-red-500 font-bold';
        
        const item = document.createElement('div');
        item.className = `py-1 border-b border-black/5 dark:border-white/5 text-[11px] ${color}`;
        item.innerHTML = msg;
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
    }
};

window.interromperImportacao = function() {
    window.importCancelled = true;
    window.updateImportProgress(0, 100, "INTERROMPENDO... O processo irá parar no próximo lote.", "error");
};

window.adicionarPendente = function(tipo, nome, row, extraData = {}) {
    window.importPendentes.rows.push({ tipo, nome, row, ...extraData });
    if (tipo === 'loja') window.importPendentes.unknownStores.add(nome);
    if (tipo === 'auditor') window.importPendentes.unknownAuditors.add(nome);
};

window.abrirModalRemapear = function(callback, context) {
    window.importPendentes.callback = callback;
    window.importPendentes.context = context;

    const modal = document.getElementById('modalImportRemapear');
    const container = document.getElementById('remappingContainer');
    const stats = document.getElementById('remappingStats');

    if (!modal || !container) return;

    container.innerHTML = '';
    
    // Agrupar lojas desconhecidas
    if (window.importPendentes.unknownStores.size > 0) {
        let html = `<div><h4 class="text-sm font-bold text-[var(--sp-red)] uppercase mb-3 flex items-center gap-2"><i class="ph ph-buildings"></i> Lojas não encontradas</h4><div class="space-y-3">`;
        [...window.importPendentes.unknownStores].sort().forEach(nome => {
            html += `
                <div class="flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-[var(--border)]">
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-0.5">Nome na Planilha</div>
                        <div class="font-bold truncate text-[var(--text-main)]">${nome}</div>
                    </div>
                    <i class="ph ph-arrow-right text-[var(--text-muted)]"></i>
                    <div class="flex-1">
                        <div class="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-0.5">Vincular no Hub</div>
                        <select data-unknown-store="${nome}" class="w-full text-sm p-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] outline-none focus:border-[var(--primary)]">
                            <option value="">Ignorar este nome</option>
                            ${window.lojasIniciais.map(l => `<option value="${l.id}">${l.nome} (${l.estado})</option>`).join('')}
                        </select>
                    </div>
                </div>`;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    }

    // Agrupar auditores desconhecidos
    if (window.importPendentes.unknownAuditors.size > 0) {
        let html = `<div class="mt-4"><h4 class="text-sm font-bold text-[var(--sp-red)] uppercase mb-3 flex items-center gap-2"><i class="ph ph-users"></i> Auditores não encontrados</h4><div class="space-y-3">`;
        [...window.importPendentes.unknownAuditors].sort().forEach(nome => {
            html += `
                <div class="flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-[var(--border)]">
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-0.5">Nome na Planilha</div>
                        <div class="font-bold truncate text-[var(--text-main)]">${nome}</div>
                    </div>
                    <i class="ph ph-arrow-right text-[var(--text-muted)]"></i>
                    <div class="flex-1">
                        <div class="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-0.5">Vincular no Hub</div>
                        <select data-unknown-auditor="${nome}" class="w-full text-sm p-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] outline-none focus:border-[var(--primary)]">
                            <option value="">Usar nome da planilha</option>
                            ${(window.audiEquipe || []).map(m => `<option value="${m.nome}">${m.nome}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    }

    if (stats) stats.innerText = `${window.importPendentes.rows.length} registros aguardando`;
    modal.classList.add('show');
};

window.processarMapeamentoManual = async function() {
    const modal = document.getElementById('modalImportRemapear');
    const btn = document.getElementById('btnProcessarRemapeamento');
    if (!modal || !btn) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i> Processando...`;

    // Coletar mapeamentos dos selects
    const mapLojas = {};
    modal.querySelectorAll('[data-unknown-store]').forEach(select => {
        if (select.value) {
            const loja = window.lojasIniciais.find(l => l.id.toString() === select.value.toString());
            if (loja) mapLojas[select.getAttribute('data-unknown-store')] = loja;
        }
    });

    const mapAuditores = {};
    modal.querySelectorAll('[data-unknown-auditor]').forEach(select => {
        if (select.value) mapAuditores[select.getAttribute('data-unknown-auditor')] = select.value;
    });

    // Re-processar as linhas pendentes
    const rowsParaProcessar = window.importPendentes.rows.map(pendente => {
        // Se a falha foi de loja e agora temos um mapeamento
        if (pendente.tipo === 'loja' && mapLojas[pendente.nome]) {
            return { ...pendente, lojaMapeada: mapLojas[pendente.nome] };
        }
        // Se a falha foi de auditor e agora temos um mapeamento
        if (pendente.tipo === 'auditor' && mapAuditores[pendente.nome]) {
            return { ...pendente, auditorMapeado: mapAuditores[pendente.nome] };
        }
        // Se for uma linha com loja reconhecida mas auditor mapeado
        if (pendente.unknownAuditorName && mapAuditores[pendente.unknownAuditorName]) {
            return { ...pendente, auditorMapeado: mapAuditores[pendente.unknownAuditorName] };
        }
        
        return pendente;
    });

    // Filtrar apenas o que foi resolvido (ou o que o usuário quer ignorar falha e seguir com o que tem)
    // Se a loja continua nula, não tem como salvar.
    const resolvidos = rowsParaProcessar.filter(r => r.lojaMapeada || r.lojaOriginal);

    if (window.importPendentes.callback) {
        await window.importPendentes.callback(resolvidos, mapLojas, mapAuditores);
    }

    btn.disabled = false;
    btn.innerHTML = `Salvar e Concluir`;
    window.fecharModalRemapear();
    window.fecharModalImportProgresso();
    showToast(`${resolvidos.length} registros adicionais processados.`);
};

window.fecharModalRemapear = function() {
    const modal = document.getElementById('modalImportRemapear');
    if (modal) modal.classList.remove('show');
};

window.fecharModalImportProgresso = function() {
    const modal = document.getElementById('modalImportProgresso');
    if (modal) modal.classList.remove('show');
};

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    if (typeof window.renderizarGrafico === 'function') window.renderizarGrafico();
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

    // Popular Lojas no Select de Auditoria Online — Agrupado por Regional
    const selectLoja = document.getElementById('audiSelectLoja');
    if (selectLoja) {
        selectLoja.innerHTML = '<option value="">Selecione a Loja...</option>';
        const porEstado = {};
        lojasIniciais.forEach(loja => {
            if (!porEstado[loja.estado]) porEstado[loja.estado] = [];
            porEstado[loja.estado].push(loja.nome);
        });
        const estadosOrdenados = Object.keys(porEstado).sort();
        estadosOrdenados.forEach(estado => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Regional ' + estado;
            porEstado[estado].sort().forEach(nome => {
                const opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                optgroup.appendChild(opt);
            });
            selectLoja.appendChild(optgroup);
        });
    }



    // Iniciar Listeners do Firebase (cada controller exporta sua função de init)
    if (typeof window.initAuditoriaOnlineListeners === 'function') window.initAuditoriaOnlineListeners();
    if (typeof window.initPlanejamentoListeners === 'function') window.initPlanejamentoListeners();
    if (typeof window.initTarefasListeners === 'function') window.initTarefasListeners();
    if (typeof window.initMapeamentoListeners === 'function') window.initMapeamentoListeners();
    if (typeof window.initLinksListeners === 'function') window.initLinksListeners('Auditoria');

    // Data padrão hoje
    if (document.getElementById('audiDataInput')) {
        document.getElementById('audiDataInput').valueAsDate = new Date();
    }

    window.switchView('dashboard');
}
window.initApp = initApp;

window.switchView = function (view) {
    const views = ['dashboard', 'auditoriaOnline', 'planejamento', 'mapeamento', 'tarefas', 'metapwr', 'links'];

    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        const nav = document.getElementById('nav-' + v);
        if (el) el.style.display = 'none';
        if (nav) nav.classList.remove('active');
    });
    const currView = document.getElementById('view-' + view);
    const currNav = document.getElementById('nav-' + view);
    if (currView) currView.style.display = 'block';
    if (currNav) currNav.classList.add('active');

    if (window.innerWidth <= 768) {
        window.toggleSidebar();
    }

    if (view === 'metapwr' && typeof window.renderizarGrafico === 'function') {
        window.renderizarGrafico();
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
    document.body.classList.toggle('sidebar-collapsed');
}
