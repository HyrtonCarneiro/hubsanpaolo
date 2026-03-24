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
    const sistema = document.getElementById('protocoloSistema').value;
    const numero = document.getElementById('protocoloNumero').value.trim();
    const responsavel = document.getElementById('protocoloResponsavel').value;
    const sla = document.getElementById('protocoloSLA').value;
    const descricao = document.getElementById('protocoloDescricao').value.trim();

    if (!numero || !descricao || !responsavel) {
        return showToast("Preencha o número, responsável e a descrição", "error");
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
        container.innerHTML = '<div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] animate-fadeIn"><i class="ph ph-ticket text-5xl mb-4 text-[var(--border)]"></i><h2 class="text-xl font-bold text-[var(--text-main)] m-0">Nenhum protocolo registrado</h2></div>';
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    window.sysProtocolos.forEach(function (p) {
        const div = document.createElement('div');
        const isResolvido = p.status === 'Resolvido';
        const isAtrasado = p.sla_prazo && p.sla_prazo < hoje && !isResolvido;

        div.className = `bg-[var(--surface)] p-6 rounded-2xl border ${isAtrasado ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-[var(--border)]'} shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn ${isResolvido ? 'opacity-75 grayscale-[0.5]' : ''}`;
        
        let iconClass = "ph-fill ph-ticket";
        let systemColor = "var(--primary)";
        if (p.sistema === 'Athenas') { iconClass = "ph-fill ph-cpu"; systemColor = "#265d7c"; }
        if (p.sistema === 'Degust') { iconClass = "ph-fill ph-fork-knife"; systemColor = "#da5513"; }
        if (p.sistema === "Delivery's") { iconClass = "ph-fill ph-moped"; systemColor = "#da0d17"; }

        const slaBadge = p.sla_prazo 
            ? `<span class="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-wider ${isAtrasado ? 'bg-red-500 text-white animate-pulse' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}"><i class="ph ph-clock"></i> SLA: ${p.sla_prazo.split('-').reverse().join('/')}</span>`
            : '';

        const statusBtn = isResolvido 
            ? `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Resolvido')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all"><i class="ph ph-check-circle"></i> Resolvido (Desfazer)</button>`
            : `<button onclick="window.toggleStatusProtocolo('${p.firebaseId}', 'Pendente')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"><i class="ph ph-circle"></i> Marcar Resolvido</button>`;

        div.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--border)] pb-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background-color: ${systemColor}20; color: ${systemColor}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="text-lg font-bold text-[var(--text-main)] m-0 tracking-tight">#${p.numero || '---'}</h4>
                            ${isResolvido ? '<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-black uppercase tracking-widest border border-emerald-500/20">Finalizado</span>' : ''}
                        </div>
                        <div class="flex flex-wrap items-center gap-3 mt-1">
                            <span class="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-wider" style="background-color: ${systemColor}; color: white">${p.sistema}</span>
                            ${slaBadge}
                            <p class="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 opacity-60 m-0">
                                <i class="ph ph-user-focus"></i> Responsável: <span class="text-[var(--text-main)]">${p.responsavel || 'Não atribuído'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${statusBtn}
                    <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all shadow-sm" onclick="window.abrirModalEditarProtocolo('${p.firebaseId}')" title="Editar"><i class="ph ph-note-pencil text-lg"></i></button>
                    <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" onclick="window.deletarProtocolo('${p.firebaseId}')" title="Excluir"><i class="ph ph-trash text-lg"></i></button>
                </div>
            </div>
            <div class="text-sm leading-relaxed text-[var(--text-main)] bg-[var(--bg-color)]/30 p-5 rounded-xl border border-[var(--border)]/50 whitespace-pre-line ${isResolvido ? 'line-through opacity-50' : ''}">
                ${p.descricao}
            </div>
            <div class="mt-3 flex items-center justify-between text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                <span>Criado por: ${p.autor}</span>
                <span>Registro: ${p.dataStr}</span>
            </div>
        `;
        container.appendChild(div);
    });
};
