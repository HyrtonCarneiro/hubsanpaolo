// js/controllers/ProtocolosController.js — Protocolos de Suporte CRUD + rendering
// Shared between TI and Auditoria sectors
// Depends on: firebase-init.js, AppController.js (showToast, currentUser), ProtocolosLogic.js

window.sysProtocolos = [];
window.tecnicosCache = [];

window.initProtocolosListeners = function () {
    // Iniciar listener centralizado
    if (window.ProtocolosLogic) {
        window.ProtocolosLogic.initListener((protocolos) => {
            window.sysProtocolos = protocolos;
            window.popularFiltrosProtocolos();
            window.renderizarProtocolos();
        });
    }

    // Carregar técnicos para os selects
    window.carregarTecnicos();
};

window.carregarTecnicos = async function () {
    try {
        const tecnicos = [];
        
        // Buscar equipe TI
        const qTI = query(collection(db, "equipe"), orderBy("nome"));
        const snapTI = await getDocs(qTI);
        snapTI.forEach(doc => tecnicos.push({ nome: doc.data().nome, setor: 'TI' }));

        // Buscar equipe Auditoria
        const qAudi = query(collection(db, "auditoria_equipe"), orderBy("nome"));
        const snapAudi = await getDocs(qAudi);
        snapAudi.forEach(doc => tecnicos.push({ nome: doc.data().nome, setor: 'Auditoria' }));

        // Ordenar e salvar em cache
        window.tecnicosCache = tecnicos.sort((a, b) => a.nome.localeCompare(b.nome));

        // Popular selects
        window.popularSelectTecnicos();
    } catch (e) {
        console.error("Erro ao carregar técnicos:", e);
    }
};

window.popularSelectTecnicos = function () {
    const selects = ['protocoloResponsavel', 'editProtocoloResponsavel'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        let html = '<option value="">Selecione o Responsável...</option>';
        window.tecnicosCache.forEach(t => {
            html += `<option value="${t.nome}">${t.nome} (${t.setor})</option>`;
        });
        select.innerHTML = html;
    });
};

window.salvarProtocolo = async function () {
    const btn = event?.target?.closest('button') || document.querySelector('button[onclick="window.salvarProtocolo()"]');
    const sistema = document.getElementById('protocoloSistema').value;
    const numero = document.getElementById('protocoloNumero').value.trim();
    const responsavel = document.getElementById('protocoloResponsavel').value;
    const sla = document.getElementById('protocoloSLA').value;
    const descricao = document.getElementById('protocoloDescricao').value.trim();

    if (!numero || !descricao || !responsavel) {
        return showToast("Preencha o número, responsável e a descrição", "error");
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-circle-notch animate-spin text-lg"></i> REGISTRANDO...';
    }

    const dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await window.ProtocolosLogic.salvar({
            sistema,
            numero,
            responsavel,
            sla_prazo: sla || null,
            descricao,
            dataStr: dStr
        });
        
        // Limpar campos
        document.getElementById('protocoloNumero').value = '';
        const resSelect = document.getElementById('protocoloResponsavel');
        if (resSelect) resSelect.value = '';
        const slaInput = document.getElementById('protocoloSLA');
        if (slaInput) slaInput.value = '';
        document.getElementById('protocoloDescricao').value = '';
        
        showToast("Protocolo registrado com sucesso!");
        
        if (typeof window.registrarAtividade === 'function') {
            window.registrarAtividade('chamado', `Novo protocolo ${sistema} (${numero}) atribuído a ${responsavel}`);
        }
    } catch (e) {
        showToast("Erro ao registrar protocolo: " + (e.message || e), "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-floppy-disk text-xl"></i> Registrar Protocolo';
        }
    }
};

window.deletarProtocolo = async function (id) {
    try {
        await window.ProtocolosLogic.excluir(id);
        showToast("Protocolo removido.");
    } catch (e) {
        showToast("Erro ao excluir protocolo: " + (e.message || e), "error");
    }
};

window.toggleStatusProtocolo = async function (id, currentStatus) {
    try {
        await window.ProtocolosLogic.toggleStatus(id, currentStatus);
        showToast(currentStatus === 'Resolvido' ? "Protocolo reaberto" : "Protocolo marcado como resolvido");
    } catch (e) {
        showToast("Erro ao alterar status: " + (e.message || e), "error");
    }
};

window.abrirModalEditarProtocolo = function (id) {
    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p) return;

    const idInput = document.getElementById('editProtocoloId');
    if (idInput) idInput.value = p.firebaseId;
    
    const sisSelect = document.getElementById('editProtocoloSistema');
    if (sisSelect) sisSelect.value = p.sistema || 'Athenas';
    
    const numInput = document.getElementById('editProtocoloNumero');
    if (numInput) numInput.value = p.numero || '';
    
    const resSelect = document.getElementById('editProtocoloResponsavel');
    if (resSelect) resSelect.value = p.responsavel || '';
    
    const slaInput = document.getElementById('editProtocoloSLA');
    if (slaInput) slaInput.value = p.sla_prazo || '';
    
    const descInput = document.getElementById('editProtocoloDescricao');
    if (descInput) descInput.value = p.descricao || '';

    const modal = document.getElementById('modalEditarProtocolo');
    if (modal) modal.classList.add('show');
};

window.fecharModalEditarProtocolo = function () {
    const modal = document.getElementById('modalEditarProtocolo');
    if (modal) modal.classList.remove('show');
};

window.confirmarEdicaoProtocolo = async function () {
    const id = document.getElementById('editProtocoloId').value;
    const dados = {
        sistema: document.getElementById('editProtocoloSistema').value,
        numero: document.getElementById('editProtocoloNumero').value.trim(),
        responsavel: document.getElementById('editProtocoloResponsavel').value,
        sla_prazo: document.getElementById('editProtocoloSLA').value,
        descricao: document.getElementById('editProtocoloDescricao').value.trim()
    };

    if (!dados.numero || !dados.descricao || !dados.responsavel) {
        return showToast("Preencha os campos obrigatórios", "error");
    }

    try {
        await window.ProtocolosLogic.atualizar(id, dados);
        window.fecharModalEditarProtocolo();
        showToast("Protocolo atualizado com sucesso!");
    } catch (e) {
        showToast("Erro ao atualizar protocolo: " + (e.message || e), "error");
    }
};

window.renderizarProtocolos = function () {
    const container = document.getElementById('listaProtocolosContainer');
    if (!container) return;

    // Pega valores dos filtros
    const filBusca = (document.getElementById('protocoloFilterBusca')?.value || "").toLowerCase().trim();
    const filSistema = document.getElementById('protocoloFilterSistema')?.value || "todos";
    const filStatus = document.getElementById('protocoloFilterStatus')?.value || "todos";
    const filResp = document.getElementById('protocoloFilterResponsavel')?.value || "todos";

    container.innerHTML = '';

    // Aplicar Filtros
    let protocolosFiltrados = window.sysProtocolos.filter(p => {
        // Filtro de Sistema
        if (filSistema !== "todos" && p.sistema !== filSistema) return false;
        
        // Filtro de Status
        if (filStatus !== "todos" && p.status !== filStatus) return false;
        
        // Filtro de Responsável
        if (filResp !== "todos" && p.responsavel !== filResp) return false;
        
        // Filtro de Busca (Número ou Descrição)
        if (filBusca) {
            const num = (p.numero || "").toLowerCase();
            const desc = (p.descricao || "").toLowerCase();
            if (!num.includes(filBusca) && !desc.includes(filBusca)) return false;
        }

        return true;
    });

    if (protocolosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-16 text-center bg-[var(--surface)] rounded-2xl border-2 border-dashed border-[var(--border)] animate-fadeIn">
                <div class="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-6">
                    <i class="ph ph-ticket text-5xl text-[var(--border)]"></i>
                </div>
                <h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum protocolo registrado</h2>
                <p class="text-[var(--text-muted)] mt-2">Os chamados de suporte aparecerão aqui.</p>
            </div>`;
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    protocolosFiltrados.forEach(function (p) {
        const isResolvido = p.status === 'Resolvido';
        const isAtrasado = p.sla_prazo && p.sla_prazo < hoje && !isResolvido;
        
        let systemColor = "#6366f1"; // Default Indigo
        let iconClass = "ph-fill ph-ticket";
        
        if (p.sistema === 'Athenas') { iconClass = "ph-fill ph-cpu"; systemColor = "#0284c7"; }
        if (p.sistema === 'Degust') { iconClass = "ph-fill ph-fork-knife"; systemColor = "#f59e0b"; }
        if (p.sistema === "Delivery's") { iconClass = "ph-fill ph-moped"; systemColor = "#ef4444"; }

        const div = document.createElement('div');
        
        // Determinar borda de destaque: Pendente = Vermelho, Resolvido = Verde
        const accentClass = isResolvido ? "border-l-4 border-l-emerald-500 opacity-80" : "border-l-4 border-l-red-500";

        div.className = `bg-[var(--surface)] rounded-xl border border-[var(--border)] ${accentClass} overflow-hidden hover:shadow-md transition-all duration-300 animate-fadeIn flex flex-col mb-3`;

        const slaDisplay = p.sla_prazo 
            ? `<div class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[0.65rem] font-bold ${isResolvido ? 'bg-gray-100 text-gray-500 border border-gray-200' : (isAtrasado ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')}">
                <i class="ph-bold ph-calendar"></i> SLA: ${p.sla_prazo.split('-').reverse().join('/')}
               </div>`
            : '';

        const statusBtn = isResolvido 
            ? `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Resolvido')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[0.7rem] font-bold hover:bg-gray-200 transition-all">
                <i class="ph-bold ph-arrow-u-up-left"></i> Reabrir
               </button>`
            : `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Pendente')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[0.7rem] font-bold hover:brightness-110 shadow-sm shadow-emerald-500/10 transition-all">
                <i class="ph-bold ph-check"></i> Marcar Resolvido
               </button>`;

        div.innerHTML = `
            <div class="px-4 py-3">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner mt-0.5" style="background-color: ${systemColor}15; color: ${systemColor}">
                            <i class="${iconClass}"></i>
                        </div>
                        <div>
                            <div class="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 class="text-base font-black text-[var(--text-main)] m-0 leading-none">Protocolo: ${p.numero || '---'}</h4>
                                <span class="px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest" style="background-color: ${systemColor}20; color: ${systemColor}">${p.sistema}</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                ${slaDisplay}
                                <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[0.65rem] font-bold text-[var(--text-main)]">
                                    <i class="ph-fill ph-user-focus text-[var(--primary)] text-[0.8rem]"></i>
                                    <span class="text-[var(--text-muted)] uppercase text-[0.55rem]">Resp:</span> ${p.responsavel || '---'}
                                </div>
                                <div class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tight flex items-center gap-1 opacity-60">
                                    <i class="ph ph-calendar-blank"></i> ${p.dataStr || '---'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 self-start">
                        ${statusBtn}
                        <div class="h-6 w-[1px] bg-[var(--border)] mx-0.5"></div>
                        <button onclick="window.abrirModalEditarProtocolo('${p.firebaseId}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100" title="Editar"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                        <button onclick="window.deletarProtocolo('${p.firebaseId}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100" title="Excluir"><i class="ph-bold ph-trash text-sm"></i></button>
                    </div>
                </div>

                <div class="bg-[var(--bg-color)]/30 p-3 rounded-xl border border-[var(--border)]/50 relative group">
                    <div class="text-[0.85rem] leading-relaxed text-[var(--text-main)] whitespace-pre-line ${isResolvido ? 'line-through opacity-50' : ''}">
                        ${window.CoreUI && window.CoreUI.linkify ? window.CoreUI.linkify(p.descricao) : p.descricao}
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t border-[var(--border)]/30 flex justify-end">
                    <button onclick="window.abrirModalCommentsProtocolo('${p.firebaseId}')" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] text-[0.7rem] font-bold text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                        <i class="ph ph-chat-centered-text text-sm"></i>
                        ${(p.comentarios || []).length > 0 ? `<span>${p.comentarios.length}</span> Comentários` : 'Comentar'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
};

window.popularFiltrosProtocolos = function () {
    const select = document.getElementById('protocoloFilterResponsavel');
    if (!select) return;

    const valorAtual = select.value;
    const responsaveis = new Set();

    // 1. Pegar dos caches de equipe (dependendo do setor)
    if (window.membrosEquipe && window.membrosEquipe.length > 0) {
        window.membrosEquipe.forEach(m => responsaveis.add(m.nome));
    }
    if (window.audiEquipe && window.audiEquipe.length > 0) {
        window.audiEquipe.forEach(m => responsaveis.add(m.nome));
    }
    
    // 2. Pegar responsáveis que já possuem protocolos (mesmo que não estejam no cache da equipe atual)
    if (window.sysProtocolos && window.sysProtocolos.length > 0) {
        window.sysProtocolos.forEach(p => {
            if (p.responsavel) responsaveis.add(p.responsavel);
        });
    }

    let html = '<option value="todos">Todos Responsáveis</option>';
    [...responsaveis].sort().forEach(nome => {
        html += `<option value="${nome}">${nome}</option>`;
    });

    select.innerHTML = html;
    if (valorAtual && html.includes(`value="${valorAtual}"`)) {
        select.value = valorAtual;
    }
};

window.limparFiltrosProtocolos = function () {
    if (document.getElementById('protocoloFilterBusca')) document.getElementById('protocoloFilterBusca').value = '';
    
    // No Auditoria o sistema padrão é Athenas, no TI é Todos
    const isAuditoria = window.location.pathname.includes('Auditoria');
    if (document.getElementById('protocoloFilterSistema')) {
        document.getElementById('protocoloFilterSistema').value = isAuditoria ? 'Athenas' : 'todos';
    }
    
    if (document.getElementById('protocoloFilterStatus')) document.getElementById('protocoloFilterStatus').value = 'todos';
    if (document.getElementById('protocoloFilterResponsavel')) document.getElementById('protocoloFilterResponsavel').value = 'todos';
    
    window.renderizarProtocolos();
};

// ====== COMENTÁRIOS DO PROTOCOLO ======
window.abrirModalCommentsProtocolo = function (id) {
    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p) return;

    const idInput = document.getElementById('commentProtocoloId');
    if (idInput) idInput.value = p.firebaseId;
    
    const infoP = document.getElementById('commentProtocoloInfo');
    if (infoP) infoP.innerText = `Protocolo: ${p.numero || '---'} | Sistema: ${p.sistema}`;
    
    const descP = document.getElementById('commentProtocoloDesc');
    if (descP) descP.innerHTML = window.CoreUI && window.CoreUI.linkify ? window.CoreUI.linkify(p.descricao || '') : (p.descricao || '');

    window.renderizarComentariosProtocolo(p);

    const modal = document.getElementById('modalCommentsProtocolo');
    if (modal) modal.classList.add('show');
};

window.fecharModalCommentsProtocolo = function () {
    const modal = document.getElementById('modalCommentsProtocolo');
    if (modal) modal.classList.remove('show');
};

window.renderizarComentariosProtocolo = function (p) {
    const container = document.getElementById('listaComentariosProtocolo');
    if (!container) return;
    container.innerHTML = '';

    const comentarios = p.comentarios || [];
    if (comentarios.length === 0) {
        container.innerHTML = '<p class="text-[var(--text-muted)] text-center py-4 text-sm italic">Nenhum comentário ainda.</p>';
        return;
    }

    comentarios.forEach((c, index) => {
        const isAutor = c.autor === window.currentUser;
        const div = document.createElement('div');
        div.className = 'bg-[var(--bg-color)]/50 p-3 rounded-xl border border-[var(--border)] relative group animate-fadeIn';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-[0.65rem] font-black text-[var(--primary)] uppercase tracking-widest">${c.autor}</span>
                <span class="text-[0.6rem] text-[var(--text-muted)] font-bold">${c.data}</span>
            </div>
            <p class="text-sm text-[var(--text-main)] m-0 leading-relaxed">${window.CoreUI && window.CoreUI.linkify ? window.CoreUI.linkify(c.texto) : c.texto}</p>
            ${isAutor ? `
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.editarComentarioProtocolo('${p.firebaseId}', ${index})" class="w-6 h-6 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><i class="ph ph-pencil-simple text-xs"></i></button>
                <button onclick="window.deletarComentarioProtocolo('${p.firebaseId}', ${index})" class="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"><i class="ph ph-trash text-xs"></i></button>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
};

window.salvarComentarioProtocolo = async function () {
    const id = document.getElementById('commentProtocoloId').value;
    const input = document.getElementById('novoComentarioProtocolo');
    const texto = input.value.trim();

    if (!texto) return;

    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p) return;

    const novosComentarios = p.comentarios || [];
    novosComentarios.push({
        autor: window.currentUser || 'Sistema',
        texto: texto,
        data: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    });

    try {
        await window.ProtocolosLogic.atualizar(id, { comentarios: novosComentarios });
        input.value = '';
        showToast("Comentário adicionado");
    } catch (e) {
        showToast("Erro ao comentar: " + e.message, "error");
    }
};

window.editarComentarioProtocolo = async function (id, index) {
    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p || !p.comentarios || !p.comentarios[index]) return;

    const novoTexto = prompt("Editar comentário:", p.comentarios[index].texto);
    if (novoTexto === null || novoTexto.trim() === "" || novoTexto === p.comentarios[index].texto) return;

    p.comentarios[index].texto = novoTexto.trim();
    p.comentarios[index].data = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' (editado)';

    try {
        await window.ProtocolosLogic.atualizar(id, { comentarios: p.comentarios });
        showToast("Comentário atualizado");
    } catch (e) {
        showToast("Erro ao editar: " + e.message, "error");
    }
};

window.deletarComentarioProtocolo = async function (id, index) {
    if (!confirm("Deseja apagar este comentário?")) return;

    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p || !p.comentarios) return;

    p.comentarios.splice(index, 1);

    try {
        await window.ProtocolosLogic.atualizar(id, { comentarios: p.comentarios });
        showToast("Comentário removido");
    } catch (e) {
        showToast("Erro ao remover: " + e.message, "error");
    }
};
