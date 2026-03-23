/**
 * js/logic/ChamadosChartLogic.js
 * Lógica para processamento de dados do gráfico de abertura/resolução.
 */

const ChamadosChartLogic = {
    /**
     * Converte string "dd/mm/yyyy hh:mm" para Date.
     */
    parseDataStr: function(str) {
        if (!str) return null;
        const [datePart, timePart] = str.split(' ');
        const [d, m, y] = datePart.split('/');
        const [hr, min] = timePart.split(':');
        return new Date(y, m - 1, d, hr, min);
    },

    /**
     * Coleta todos os logs e separa em eventos de abertura e resolução, respeitando filtros.
     */
    getEvents: function(sysLogs, filters = {}) {
        const events = [];
        const lojas = window.lojasIniciais || [];

        Object.keys(sysLogs).forEach(lojaId => {
            const loja = lojas.find(l => String(l.id) === String(lojaId));
            if (!loja) return;

            // Aplicar Filtros Global do Dashboard (PowerBI Style)
            if (filters.unidade && loja.nome !== filters.unidade) return;
            if (filters.regiao && loja.estado !== filters.regiao) return;

            sysLogs[lojaId].forEach(log => {
                // Evento de Abertura
                events.push({ type: 'aberto', timestamp: log.timestamp });

                // Evento de Resolução
                if (log.resolvido) {
                    const ts = log.timestampResolvido || (this.parseDataStr(log.dataResolucao)?.getTime());
                    if (ts) {
                        events.push({ type: 'resolvido', timestamp: ts });
                    }
                }
            });
        });
        return events;
    },

    /**
     * Agrupa eventos por período.
     */
    groupEvents: function(events, period, start, end) {
        const result = {};
        const startTime = start ? new Date(start).getTime() : 0;
        const endTime = end ? new Date(end).setHours(23, 59, 59) : Infinity;

        events.forEach(ev => {
            if (ev.timestamp < startTime || ev.timestamp > endTime) return;

            const date = new Date(ev.timestamp);
            let key;

            if (period === 'diario') {
                key = date.toLocaleDateString('pt-BR');
            } else if (period === 'semanal') {
                // Pega o primeiro dia da semana (Domingo)
                const first = date.getDate() - date.getDay();
                const sunday = new Date(date.setDate(first));
                key = 'Semana ' + sunday.toLocaleDateString('pt-BR');
            } else if (period === 'mensal') {
                key = date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
            }

            if (!result[key]) result[key] = { aberto: 0, resolvido: 0 };
            result[key][ev.type]++;
        });

        // Ordenar chaves cronologicamente
        const sortedKeys = Object.keys(result).sort((a, b) => {
            const parseKey = (k) => {
                if (k.startsWith('Semana ')) k = k.replace('Semana ', '');
                const [d, m, y] = k.split('/');
                return new Date(y, m - 1, d || 1);
            };
            return parseKey(a) - parseKey(b);
        });

        return {
            labels: sortedKeys,
            abertos: sortedKeys.map(k => result[k].aberto),
            resolvidos: sortedKeys.map(k => result[k].resolvido)
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChamadosChartLogic;
} else {
    window.ChamadosChartLogic = ChamadosChartLogic;
}
