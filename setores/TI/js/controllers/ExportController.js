/**
 * ExportController.js (TI)
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

window.exportarLojasExcel = function () {
    const logsMap = window.sysLogs || {};
    const flatData = [];

    // Precisamos iterar sobre as lojas iniciais para pegar os nomes, já que sysLogs usa ids como chaves
    window.lojasIniciais.forEach(loja => {
        const logs = logsMap[loja.id] || [];
        logs.forEach(log => {
            flatData.push({
                DATA_OCORRENCIA: log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : 'N/A',
                LOJA: loja.nome,
                REGIONAL: loja.estado,
                STATUS: log.resolvido ? 'RESOLVIDO' : 'PENDENTE',
                TAG: log.tag || 'N/A',
                SETOR: log.setor || 'Geral',
                COMENTARIO: log.texto || '',
                AUDITOR: log.usuario || 'Sistema',
                ID_LOG: log.firebaseId || ''
            });
        });
    });

    if (flatData.length === 0) {
        showToast("Não há chamados para exportar.", "warning");
        return;
    }

    window.exportarParaExcel(flatData, "ti_monitoramento_lojas");
};

window.exportarProjetosExcel = function () {
    const projects = window.sysProjetos || {};
    const flatData = [];

    Object.keys(projects).forEach(membro => {
        (projects[membro] || []).forEach(p => {
            flatData.push({
                RESPONSAVEL: membro,
                DATA_ENTREGA: p.dataEntrega || 'Pendente',
                STATUS: p.status || 'Pendente',
                DESCRICAO: p.desc || '',
                DEMANDANTE: p.demandante || '',
                REGISTRADO_POR: p.autor || '',
                TIMESTAMP: p.timestamp ? new Date(p.timestamp).toISOString().split('T')[0] : '',
                ID_TASK: p.firebaseId || ''
            });
        });
    });

    if (flatData.length === 0) {
        showToast("Não há tarefas para exportar.", "warning");
        return;
    }

    window.exportarParaExcel(flatData, "ti_tarefas_equipe");
};
