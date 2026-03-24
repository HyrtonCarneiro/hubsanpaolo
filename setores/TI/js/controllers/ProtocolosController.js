// js/controllers/ProtocolosController.js — Protocolos de Suporte CRUD + rendering
// Depends on: firebase-init.js, AppController.js (showToast, currentUser)

window.sysProtocolos = [];
window.equipeTI = [];
window.equipeAudi = [];

window.initProtocolosListeners = function () {
    try {
        var qProtocolos = query(collection(db, "protocolos_suporte"), orderBy("timestamp", "desc"));
        onSnapshot(qProtocolos, function (snapshot) {
            window.sysProtocolos = [];
            snapshot.forEach(function (docSnap) { 
                window.sysProtocolos.push({ firebaseId: docSnap.id, ...docSnap.data() }); 
            });
            window.renderizarProtocolos();
        });
        
        // Iniciar listeners de equipe para o select
        window.initEquipeProtocolosListeners();
        
    } catch (e) {
        console.error("Erro ao iniciar listener protocolos", e);
    }
}

window.initEquipeProtocolosListeners = function() {
    // Equipe TI
    const qTI = query(collection(db, "equipe"), orderBy("nome"));
    onSnapshot(qTI, (snap) => {
        window.equipeTI = [];
        snap.forEach(d => window.equipeTI.push({ id: d.id, ...d.data() }));
        window.popularSelectResponsavel();
    });

    // Equipe Auditoria
    const qAudi = query(collection(db, "auditoria_equipe"), orderBy("nome"));
    onSnapshot(qAudi, (snap) => {
        window.equipeAudi = [];
        snap.forEach(d => window.equipeAudi.push({ id: d.id, ...d.data() }));
        window.popularSelectResponsavel();
    });
}

window.popularSelectResponsavel = function() {
    const select = document.getElementById('protocoloResponsavel');
    if (!select) return;

    // Guardar valor atual para não resetar durante renderização se o usuário estiver editando
    const valorAtual = select.value;

    // Combinar e remover duplicatas (baseado no nome)
    const combined = [...window.equipeTI, ...window.equipeAudi];
    const uniqueMap = new Map();
    combined.forEach(m => {
        if (m.nome) uniqueMap.set(m.nome, m);
    });

    const sortedNames = Array.from(uniqueMap.keys()).sort();

    let options = '<option value="" disabled selected>Selecione um responsável</option>';
    sortedNames.forEach(nome => {
        options += `<option value="${nome}">${nome}</option>`;
    });

    select.innerHTML = options;
    
    // Restaurar valor se ele ainda existir na lista
    if (valorAtual && sortedNames.includes(valorAtual)) {
        select.value = valorAtual;
    }
}

window.cancelarEdicaoProtocolo = function() {
    const elId = document.getElementById('protocoloId');
    const elSistema = document.getElementById('protocoloSistema');
    const elNumero = document.getElementById('protocoloNumero');
    const elDescricao = document.getElementById('protocoloDescricao');
    const elSla = document.getElementById('protocoloSla');
    const elResp = document.getElementById('protocoloResponsavel');
    const elBtnLabel = document.getElementById('labelBtnProtocolo');
    const elBtnCancel = document.getElementById('btnCancelarEdicao');
    const elFormTitle = document.getElementById('formProtocoloTitulo');

    if (elId) elId.value = '';
    if (elNumero) elNumero.value = '';
    if (elDescricao) elDescricao.value = '';
    if (elSla) elSla.value = '';
    if (elResp) elResp.value = '';
    
    if (elBtnLabel) elBtnLabel.textContent = 'Registrar Protocolo';
    if (elFormTitle) elFormTitle.textContent = 'Novo Registro de Protocolo';
    if (elBtnCancel) elBtnCancel.classList.add('hidden');
}

window.prepararEdicaoProtocolo = function(id) {
    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p) return;

    const elId = document.getElementById('protocoloId');
    const elSistema = document.getElementById('protocoloSistema');
    const elNumero = document.getElementById('protocoloNumero');
    const elDescricao = document.getElementById('protocoloDescricao');
    const elSla = document.getElementById('protocoloSla');
    const elResp = document.getElementById('protocoloResponsavel');
    const elBtnLabel = document.getElementById('labelBtnProtocolo');
    const elBtnCancel = document.getElementById('btnCancelarEdicao');
    const elFormTitle = document.getElementById('formProtocoloTitulo');

    if (elId) elId.value = id;
    if (elSistema) elSistema.value = p.sistema;
    if (elNumero) elNumero.value = p.numero || '';
    if (elDescricao) elDescricao.value = p.descricao || '';
    if (elSla) elSla.value = p.sla || '';
    
    if (elResp) {
        // Se o responsável não estiver na lista (ex: saiu da equipe), adicionamos temporariamente apenas para esta edição
        const exists = Array.from(elResp.options).some(opt => opt.value === p.responsavel);
        if (!exists && p.responsavel) {
            const opt = document.createElement('option');
            opt.value = p.responsavel;
            opt.textContent = p.responsavel + ' (Inativo)';
            elResp.appendChild(opt);
        }
        elResp.value = p.responsavel || '';
    }

    if (elBtnLabel) elBtnLabel.textContent = 'Salvar Alterações';
    if (elFormTitle) elFormTitle.textContent = 'Editando Protocolo';
    if (elBtnCancel) elBtnCancel.classList.remove('hidden');

    // Scroll suave para o formulário
    const form = document.getElementById('formProtocoloTitulo');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.toggleStatusResolvido = async function(id) {
    const p = window.sysProtocolos.find(x => x.firebaseId === id);
    if (!p) return;
    const novoStatus = p.status === 'resolvido' ? 'pendente' : 'resolvido';
    
    try {
        await updateDoc(doc(db, "protocolos_suporte", id), {
            status: novoStatus
        });
        showToast(`Status alterado para ${novoStatus}.`);

        if (novoStatus === 'resolvido' && p.autor && p.autor !== currentUser) {
            if (typeof window.emitNotification === 'function') {
                window.emitNotification(p.autor, `O protocolo ${p.numero || '#'} foi resolvido por ${currentUser}.`, '#listaProtocolosContainer');
            }
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao atualizar status.", "error");
    }
}

window.salvarProtocolo = async function () {
    const elId = document.getElementById('protocoloId');
    const elSistema = document.getElementById('protocoloSistema');
    const elNumero = document.getElementById('protocoloNumero');
    const elDescricao = document.getElementById('protocoloDescricao');
    const elSla = document.getElementById('protocoloSla');
    const elResp = document.getElementById('protocoloResponsavel');

    if (!elSistema || !elNumero || !elDescricao) {
        showToast("Erro interno: Campos fundamentais não encontrados.", "error");
        return;
    }

    const id = elId ? elId.value : '';
    const sistema = elSistema.value;
    const numero = elNumero.value.trim();
    const descricao = elDescricao.value.trim();
    const sla = elSla ? elSla.value : null;
    const responsavel = elResp ? elResp.value : '';

    if (!numero || !descricao) {
        showToast("Número e Descrição são obrigatórios.", "warning");
        return;
    }

    const dStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        if (id) {
            // Edição
            await updateDoc(doc(db, "protocolos_suporte", id), {
                sistema, numero, descricao, sla, responsavel
            });
            showToast("Protocolo atualizado!");
            window.cancelarEdicaoProtocolo();
        } else {
            // Novo
            const docRef = await addDoc(collection(db, "protocolos_suporte"), {
                sistema, numero, descricao, sla, responsavel,
                autor: currentUser || "Usuário Hub",
                dataStr: dStr,
                timestamp: Date.now(),
                status: 'pendente'
            });
            showToast("Protocolo registrado.");
            window.cancelarEdicaoProtocolo();
        }

        // Notificar responsável se houver e for diferente do atual
        if (responsavel && responsavel !== currentUser) {
            if (typeof window.emitNotification === 'function') {
                window.emitNotification(responsavel, `Você foi designado para o protocolo ${sistema}: ${numero}`, '#listaProtocolosContainer');
            }
        }

    } catch (e) {
        console.error(e);
        showToast("Erro ao processar protocolo.", "error");
    }
}

window.deletarProtocolo = async function (id) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
        await deleteDoc(doc(db, "protocolos_suporte", id));
        showToast("Removido.");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir.", "error");
    }
}

window.renderizarProtocolos = function () {
    var container = document.getElementById('listaProtocolosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (window.sysProtocolos.length === 0) {
        container.innerHTML = '<div class="p-10 text-center opacity-50 font-bold border-2 border-dashed border-[var(--border)] rounded-2xl">Nenhum protocolo encontrado</div>';
        return;
    }

    window.sysProtocolos.forEach(function (p) {
        const isResolved = p.status === 'resolvido';
        const div = document.createElement('div');
        div.className = `bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300 animate-fadeIn ${isResolved ? 'opacity-60 grayscale-[0.5]' : ''}`;
        
        let systemColor = "var(--primary)";
        let iconClass = "ph-fill ph-ticket";
        if (p.sistema === 'Athenas') { iconClass = "ph-fill ph-cpu"; systemColor = "#265d7c"; }
        if (p.sistema === 'Degust') { iconClass = "ph-fill ph-fork-knife"; systemColor = "#da5513"; }
        if (p.sistema === 'Delivery\'s') { iconClass = "ph-fill ph-moped"; systemColor = "#da0d17"; }

        var slaBadge = '';
        if (p.sla && !isResolved) {
            var hoy = new Date(); hoy.setHours(0,0,0,0);
            var fechaSla = new Date(p.sla + 'T00:00:00');
            var isOverdue = hoy > fechaSla;
            var color = isOverdue ? '#ef4444' : '#22c55e';
            slaBadge = `<span class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-black" style="background-color: ${color}20; color: ${color}"><i class="ph ${isOverdue ? 'ph-warning-circle' : 'ph-clock-countdown'}"></i> SLA: ${p.sla.split('-').reverse().join('/')}</span>`;
        }

        const statusBadge = isResolved 
            ? '<span class="px-2 py-1 rounded-md bg-green-500 text-white text-[10px] font-black uppercase tracking-wider">Resolvido</span>'
            : '<span class="px-2 py-1 rounded-md bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">Pendente</span>';

        div.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--border)] pb-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background-color: ${systemColor}20; color: ${systemColor}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="text-lg font-bold text-[var(--text-main)] m-0 ${isResolved ? 'line-through opacity-50' : ''}">${p.numero || '---'}</h4>
                            ${statusBadge}
                        </div>
                        <div class="flex flex-wrap items-center gap-3 mt-1">
                            <span class="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase text-white" style="background-color: ${systemColor}">${p.sistema}</span>
                            <p class="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-3 m-0">
                                <span class="flex items-center gap-1"><i class="ph ph-calendar"></i> ${p.dataStr}</span>
                                ${slaBadge}
                                <span class="flex items-center gap-1 text-[var(--primary)] text-[0.7rem]"><i class="ph ph-user-focus"></i> Responsável: ${p.responsavel || 'Não definido'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm" onclick="window.toggleStatusResolvido('${p.firebaseId}')" title="${isResolved ? 'Marcar como Pendente' : 'Marcar como Resolvido'}">
                        <i class="ph ${isResolved ? 'ph-arrow-counter-clockwise' : 'ph-check'} text-lg font-bold"></i>
                    </button>
                    <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm" onclick="window.prepararEdicaoProtocolo('${p.firebaseId}')" title="Editar">
                        <i class="ph ph-pencil text-lg font-bold"></i>
                    </button>
                    <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" onclick="window.deletarProtocolo('${p.firebaseId}')" title="Excluir">
                        <i class="ph ph-trash text-lg font-bold"></i>
                    </button>
                </div>
            </div>
            <div class="text-sm leading-relaxed text-[var(--text-main)] bg-[var(--bg-color)]/30 p-5 rounded-xl border border-[var(--border)]/50 whitespace-pre-line ${isResolved ? 'opacity-50' : ''}">
                ${p.descricao}
            </div>
        `;
        container.appendChild(div);
    });
}
