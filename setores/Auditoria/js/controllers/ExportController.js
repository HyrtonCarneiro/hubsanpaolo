/**
 * ExportController.js
 * Centraliza a exportação de dados para Excel (.xlsx) normalizada para PowerBI.
 */

window.exportarParaExcel = function (dados, filename) {
    try {
        if (!window.XLSX) {
            console.error("SheetJS (XLSX) não carregado.");
            showToast("Erro: Biblioteca de exportação não disponível.", "error");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

        // Gerar arquivo e disparar download
        XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
        showToast("Relatório Excel gerado com sucesso!", "success");
    } catch (e) {
        console.error("Erro ao exportar Excel:", e);
        showToast("Erro ao gerar relatório.", "error");
    }
};

window.exportarNotasPowerBI = function () {
    const notas = window.notasCache || [];
    if (notas.length === 0) {
        showToast("Não há notas para exportar.", "warning");
        return;
    }

    const dadosNormalizados = notas.map(n => ({
        ID_REGISTRO: n.id,
        DATA_AUDITORIA: n.data, // Já está em AAAA-MM-DD
        LOJA: n.loja,
        REGIONAL: (lojasIniciais.find(l => l.nome === n.loja) || {}).estado || 'N/A',
        AUDITOR: n.auditor,
        NOTA: parseFloat(n.nota),
        TIMESTAMP_SISTEMA: n.timestamp || ''
    }));

    window.exportarParaExcel(dadosNormalizados, "auditoria_notas_powerbi");
};

window.exportarMapeamentoPowerBI = function () {
    const map = window.historicoMapeamento || [];
    if (map.length === 0) {
        showToast("Não há mapeamentos para exportar.", "warning");
        return;
    }

    const dadosNormalizados = map.map(m => ({
        ID_REGISTRO: m.id,
        DATA_TENTATIVA: m.dataTentativa,
        HORARIO: m.horario || '',
        LOJA: m.nomeLoja,
        REGIONAL: m.estado,
        REALIZADA: m.realizada,
        MOTIVO_NEGATIVA: m.justificativa || '',
        AUDITOR: m.auditor,
        N_TENTATIVA: parseInt(m.nTentativa) || 1,
        ESTA_NO_PRAZO: m.sla ? 'SIM' : 'NÃO',
        NOTAS_ADICIONAIS: m.notas || ''
    }));

    window.exportarParaExcel(dadosNormalizados, "auditoria_mapeamento_powerbi");
};

window.exportarPlanejamentoPowerBI = function () {
    const plane = window.planejamentoCache || [];
    if (plane.length === 0) {
        showToast("Não há planejamento para exportar.", "warning");
        return;
    }

    const dadosNormalizados = plane.map(p => ({
        ID_REGISTRO: p.id || p.docId,
        LOJA: p.loja,
        REGIONAL: (lojasIniciais.find(l => l.nome === p.loja) || {}).estado || 'N/A',
        DATA_PREVISTA: p.dataProxima || '',
        AUDITOR_RESPONSAVEL: p.auditor || 'A Definir'
    }));

    window.exportarParaExcel(dadosNormalizados, "auditoria_planejamento_powerbi");
};

window.exportarTarefasPowerBI = function () {
    const projects = window.audiProjetos || {};
    const flatData = [];

    Object.keys(projects).forEach(membro => {
        (projects[membro] || []).forEach(p => {
            flatData.push({
                RESPONSAVEL: membro,
                DATA_ATIVIDADE: p.dataAtv || '',
                STATUS: p.status || 'Pendente',
                DESCRICAO: p.desc || '',
                DEMANDANTE: p.demandante || '',
                REGISTRADO_POR: p.autor || '',
                ID_TASK: p.id || ''
            });
        });
    });

    if (flatData.length === 0) {
        showToast("Não há tarefas para exportar.", "warning");
        return;
    }

    window.exportarParaExcel(flatData, "auditoria_tarefas_powerbi");
};
