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
        const cleanStr = str.replace(',', '').trim();
        const parts = cleanStr.split(' ');
        if (parts.length === 0) return null;
        
        const [d, m, y] = parts[0].split('/');
        if (!y) return null;

        let hr = 0, min = 0;
        if (parts[1]) {
            const timeParts = parts[1].split(':');
            hr = parseInt(timeParts[0]) || 0;
            min = parseInt(timeParts[1]) || 0;
        }
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
     * Agrupa eventos por período garantindo eixo contínuo.
     */
    groupEvents: function(events, period, start, end) {
        const result = {};
        let startTime = 0, endTime = Infinity;

        // Pré-preencher todas as datas do período para não pular dias/semanas vazias
        if (start && end) {
            const [sy, sm, sd] = start.split('-');
            const startDate = new Date(sy, sm - 1, sd, 0, 0, 0);
            startTime = startDate.getTime();

            const [ey, em, ed] = end.split('-');
            const endDate = new Date(ey, em - 1, ed, 23, 59, 59);
            endTime = endDate.getTime();

            let current = new Date(startDate.getTime());
            while (current <= endDate) {
                let key;
                if (period === 'diario') {
                    key = current.toLocaleDateString('pt-BR');
                    current.setDate(current.getDate() + 1);
                } else if (period === 'semanal') {
                    const first = current.getDate() - current.getDay();
                    const sunday = new Date(new Date(current).setDate(first));
                    key = 'Semana ' + sunday.toLocaleDateString('pt-BR');
                    current.setDate(current.getDate() + 7);
                    current.setDate(current.getDate() - current.getDay());
                } else if (period === 'mensal') {
                    key = current.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
                    current.setMonth(current.getMonth() + 1);
                    current.setDate(1);
                }
                if (!result[key]) result[key] = { aberto: 0, resolvido: 0 };
            }
        }

        events.forEach(ev => {
            if (ev.timestamp < startTime || ev.timestamp > endTime) return;

            const date = new Date(ev.timestamp);
            let key;

            if (period === 'diario') {
                key = date.toLocaleDateString('pt-BR');
            } else if (period === 'semanal') {
                const first = date.getDate() - date.getDay();
                const sunday = new Date(new Date(date).setDate(first));
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
