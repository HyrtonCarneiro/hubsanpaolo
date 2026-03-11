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
     * @returns {Object} { totalPendentes, regiaoCount, lojaCallCount }
     */
    processarMetricasLojas: function(lojas, logs) {
        let metrics = {
            totalPendentes: 0,
            regiaoCount: {},
            lojaCallCount: {}
        };

        if (!lojas || !logs) return metrics;

        lojas.forEach(loja => {
            const lgs = logs[loja.id] || [];
            lgs.forEach(l => {
                if (!l.resolvido) {
                    metrics.totalPendentes++;
                    // Região
                    if (loja.estado) {
                        metrics.regiaoCount[loja.estado] = (metrics.regiaoCount[loja.estado] || 0) + 1;
                    }
                    // Por Loja
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
     * @returns {Object} { andamento, pendentes, porMembro }
     */
    processarMetricasTarefasAtivas: function(projetos) {
        let metrics = {
            andamento: 0,
            pendentes: 0,
            porMembro: {} // { 'Hyrton': count, ... }
        };

        if (!projetos) return metrics;

        Object.keys(projetos).forEach(membro => {
            metrics.porMembro[membro] = 0;
            const lista = projetos[membro] || [];
            lista.forEach(p => {
                const st = p.status || 'Pendente';
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
