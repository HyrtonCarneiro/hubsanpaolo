/**
 * js/logic/DashboardLogic.js
 * Lógica pura para processamento de métricas do Dashboard TI.
 * Feito para funcionar no Browser (window.DashboardLogic) e no Node.js (module.exports).
 */

const DashboardLogic = {
    /**
     * Calcula métricas de chamados das lojas.
     * @param {Array} lojas - Lista de lojas iniciais.
     * @param {Object} logs - Objeto com logs/chamados do Firebase.
     * @param {Object} filters - Filtros ativos { unidade, regiao }
     * @returns {Object} { totalPendentes, regiaoCount, lojaCallCount }
     */
    processarMetricasLojas: function(lojas, logs, filters = {}) {
        let metrics = {
            totalPendentes: 0,
            regiaoCount: {},
            lojaCallCount: {}
        };

        if (!lojas || !logs) return metrics;

        lojas.forEach(loja => {
            // Aplicar Filtros de Loja/Região
            if (filters.unidade && loja.nome !== filters.unidade) return;
            if (filters.regiao && loja.estado !== filters.regiao) return;

            const lgs = logs[loja.id] || [];
            lgs.forEach(l => {
                // Filtro de Data Global (vindo do clique na tendência)
                if (filters.dataChamado) {
                    let match = false;
                    
                    // Verifica data de abertura
                    if (l.timestamp) {
                        const openStr = new Date(l.timestamp).toLocaleDateString('pt-BR');
                        if (openStr === filters.dataChamado) match = true;
                    } else if (l.dataStr) {
                        const cleanStr = l.dataStr.replace(',', '').trim().split(' ')[0];
                        if (cleanStr === filters.dataChamado) match = true;
                    }
                    
                    // Verifica data de resolução
                    if (l.resolvido && !match) {
                        if (l.timestampResolvido) {
                            const resStr = new Date(l.timestampResolvido).toLocaleDateString('pt-BR');
                            if (resStr === filters.dataChamado) match = true;
                        } else if (l.dataResolucao) {
                            const cleanResStr = l.dataResolucao.replace(',', '').trim().split(' ')[0];
                            if (cleanResStr === filters.dataChamado) match = true;
                        }
                    }

                    if (!match) return;
                }

                // Contagem por estado (Todos os chamados, inclusive resolvidos)
                if (loja.estado) {
                    metrics.regiaoCount[loja.estado] = (metrics.regiaoCount[loja.estado] || 0) + 1;
                }

                if (!l.resolvido) {
                    metrics.totalPendentes++;
                    // Por Loja (Apenas pendências conforme KPI anterior)
                    if (loja.nome) {
                        metrics.lojaCallCount[loja.nome] = (metrics.lojaCallCount[loja.nome] || 0) + 1;
                    }
                }
            });
        });

        return metrics;
    },

    /**
     * Calcula métricas de tarefas da equipe, excluindo as concluídas.
     * @param {Object} projetos - Objeto window.sysProjetos (agrupado por membro).
     * @param {Object} filters - Filtros ativos { tarefaStatus, membro }
     * @returns {Object} { andamento, pendentes, porMembro }
     */
    processarMetricasTarefasAtivas: function(projetos, filters = {}) {
        let metrics = {
            andamento: 0,
            pendentes: 0,
            porMembro: {} // { 'Hyrton': count, ... }
        };

        if (!projetos) return metrics;

        Object.keys(projetos).forEach(membro => {
            // Filtro por Membro
            if (filters.membro && membro !== filters.membro) return;

            metrics.porMembro[membro] = 0;
            const lista = projetos[membro] || [];
            lista.forEach(p => {
                const st = p.status || 'Pendente';
                
                // Filtro por Status da Tarefa
                if (filters.tarefaStatus && st !== filters.tarefaStatus) return;

                if (st !== 'Concluído') {
                    metrics.porMembro[membro]++;
                    if (st === 'Em Andamento') metrics.andamento++;
                    else metrics.pendentes++;
                }
            });
        });

        return metrics;
    }
};

// Suporte para Node.js e Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardLogic;
} else {
    window.DashboardLogic = DashboardLogic;
}
