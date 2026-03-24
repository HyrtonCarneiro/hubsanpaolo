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

    container.innerHTML = '';

    if (window.sysProtocolos.length === 0) {
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

    window.sysProtocolos.forEach(function (p) {
        const isResolvido = p.status === 'Resolvido';
        const isAtrasado = p.sla_prazo && p.sla_prazo < hoje && !isResolvido;
        
        let systemColor = "#6366f1"; // Default Indigo
        let iconClass = "ph-fill ph-ticket";
        
        if (p.sistema === 'Athenas') { iconClass = "ph-fill ph-cpu"; systemColor = "#0284c7"; }
        if (p.sistema === 'Degust') { iconClass = "ph-fill ph-fork-knife"; systemColor = "#f59e0b"; }
        if (p.sistema === "Delivery's") { iconClass = "ph-fill ph-moped"; systemColor = "#ef4444"; }

        const div = document.createElement('div');
        
        // Determinar borda de destaque
        let accentClass = "border-l-4 border-l-transparent";
        if (isResolvido) accentClass = "border-l-4 border-l-gray-400 opacity-80";
        else if (isAtrasado) accentClass = "border-l-4 border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]";
        else accentClass = "border-l-4 border-l-emerald-500";

        div.className = `bg-[var(--surface)] rounded-2xl border border-[var(--border)] ${accentClass} overflow-hidden hover:shadow-lg transition-all duration-300 animate-fadeIn flex flex-col`;

        const slaDisplay = p.sla_prazo 
            ? `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-bold ${isAtrasado ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}">
                <i class="ph-bold ph-calendar"></i> SLA: ${p.sla_prazo.split('-').reverse().join('/')}
               </div>`
            : '';

        const statusBtn = isResolvido 
            ? `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Resolvido')" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition-all">
                <i class="ph-bold ph-arrow-u-up-left"></i> Reabrir
               </button>`
            : `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Pendente')" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:brightness-110 shadow-sm shadow-emerald-500/20 transition-all">
                <i class="ph-bold ph-check"></i> Marcar Resolvido
               </button>`;

        div.innerHTML = `
            <div class="px-6 py-5">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner" style="background-color: ${systemColor}15; color: ${systemColor}">
                            <i class="${iconClass}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <h4 class="text-xl font-black text-[var(--text-main)] m-0 leading-none">#${p.numero || '---'}</h4>
                                <span class="px-2.5 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest" style="background-color: ${systemColor}20; color: ${systemColor}">${p.sistema}</span>
                                ${isResolvido ? '<span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[0.6rem] font-black uppercase tracking-widest border border-gray-200">RESOLVIDO</span>' : (isAtrasado ? '<span class="px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-[0.6rem] font-black uppercase tracking-widest border border-red-200">ATRASADO</span>' : '<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[0.6rem] font-black uppercase tracking-widest border border-emerald-200">NO PRAZO</span>')}
                            </div>
                            <div class="mt-2 flex items-center gap-3">
                                ${slaDisplay}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${statusBtn}
                        <div class="h-8 w-[1px] bg-[var(--border)] mx-1"></div>
                        <button onclick="window.abrirModalEditarProtocolo('${p.firebaseId}')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100" title="Editar"><i class="ph-bold ph-pencil-simple"></i></button>
                        <button onclick="window.deletarProtocolo('${p.firebaseId}')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100" title="Excluir"><i class="ph-bold ph-trash"></i></button>
                    </div>
                </div>

                <div class="bg-[var(--bg-color)]/40 p-5 rounded-2xl border border-[var(--border)] relative group">
                    <p class="text-[0.65rem] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 opacity-60">Descrição do Chamado</p>
                    <div class="text-[0.95rem] leading-relaxed text-[var(--text-main)] whitespace-pre-line ${isResolvido ? 'line-through opacity-60' : ''}">
                        ${p.descricao}
                    </div>
                </div>
            </div>

            <div class="mt-auto px-6 py-4 bg-black/5 dark:bg-white/5 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        ${p.responsavel ? p.responsavel.charAt(0) : '?'}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Responsável</span>
                        <span class="text-xs font-black text-[var(--text-main)]">${p.responsavel || 'Não definido'}</span>
                    </div>
                </div>
                <div class="flex flex-col">
                    <span class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Registrado por</span>
                    <span class="text-xs font-bold text-[var(--text-main)]">${p.autor || '---'}</span>
                </div>
                <div class="flex flex-col md:items-end">
                    <span class="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Data do Registro</span>
                    <span class="text-xs font-bold text-[var(--text-main)] opacity-80">${p.dataStr || '---'}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
};
