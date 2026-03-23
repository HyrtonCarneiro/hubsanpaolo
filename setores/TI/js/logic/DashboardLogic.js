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
            totalResolvidos: 0,
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
                let isOpenOnDate = false;
                let isResolvedOnDate = false;

                if (filters.dataChamado) {
                    const [d, m, y] = filters.dataChamado.split('/');
                    const targetDate = new Date(y, m - 1, d, 23, 59, 59).getTime();
                    
                    let openTs = l.timestamp;
                    if (!openTs && l.dataStr) {
                        const cleanStr = l.dataStr.replace(',', '').trim();
                        const parts = cleanStr.split(' ');
                        const [od, om, oy] = parts[0].split('/');
                        openTs = new Date(oy, om - 1, od, 0, 0).getTime();
                    }

                    if (!openTs || openTs > targetDate) return; 

                    isOpenOnDate = true;

                    if (l.resolvido) {
                        let resTs = l.timestampResolvido;
                        if (!resTs && l.dataResolucao) {
                            const cleanResStr = l.dataResolucao.replace(',', '').trim();
                            const parts = cleanResStr.split(' ');
                            if (parts.length > 0) {
                                const [rd, rm, ry] = parts[0].split('/');
                                resTs = new Date(ry, rm - 1, rd, 0, 0).getTime();
                            }
                        }
                        if (resTs && resTs <= targetDate) {
                            isResolvedOnDate = true;
                        }
                    }
                } else {
                    isOpenOnDate = true;
                    if (l.resolvido) isResolvedOnDate = true;
                }

                if (!isOpenOnDate) return;

                if (loja.estado) {
                    metrics.regiaoCount[loja.estado] = (metrics.regiaoCount[loja.estado] || 0) + 1;
                }

                if (!isResolvedOnDate) {
                    metrics.totalPendentes++;
                    if (loja.nome) {
                        metrics.lojaCallCount[loja.nome] = (metrics.lojaCallCount[loja.nome] || 0) + 1;
                    }
                } else {
                    metrics.totalResolvidos++;
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
            concluidas: 0,
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
                } else {
                    metrics.concluidas++;
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
