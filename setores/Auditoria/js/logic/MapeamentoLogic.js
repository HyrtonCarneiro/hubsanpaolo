/**
 * MapeamentoLogic.js
 * Regras de negócio para o mapeamento de tentativas de auditoria.
 */

if (typeof window === 'undefined') {
    global.window = {};
}

window.MapeamentoLogic = {
    /**
     * Define se uma auditoria está no prazo (SLA).
     * RF05 - Lógica: Até o dia 20 do mês vigente.
     */
    estaNoPrazo(dataTentativa) {
        if (!dataTentativa) return false;
        const data = new Date(dataTentativa);
        const dia = data.getDate() + 1; // Ajuste de fuso zero-based ou input date
        return dia <= 20;
    },

    /**
     * Calcula o número da tentativa para uma loja no mês.
     * RF03 - Incrementa automaticamente para a mesma loja/mês.
     */
    circularTentativa(lojaId, dataTentativa, historico) {
        if (!dataTentativa) return 1;
        const dataReferenciaISO = new Date(dataTentativa).toISOString().substring(0, 7); // "YYYY-MM"

        const tentativasNoMes = historico.filter(h => {
            const hISO = new Date(h.dataTentativa).toISOString().substring(0, 7);
            return h.lojaId === lojaId && hISO === dataReferenciaISO;
        });

        return tentativasNoMes.length + 1;
    },

    /**
     * Valida se os dados são suficientes para salvar.
     * RF04 - Justificativa obrigatória se não realizada.
     */
    validarRegistro(dados) {
        if (!dados.lojaId) return { valid: false, msg: "Selecione uma loja." };
        if (!dados.dataTentativa) return { valid: false, msg: "Selecione a data." };
        if (!dados.auditor) return { valid: false, msg: "Selecione o auditor responsável." };
        
        if (dados.realizada === "NÃO" && !dados.justificativa) {
            return { valid: false, msg: "Justificativa é obrigatória para auditorias não realizadas." };
        }

        return { valid: true };
    }
};

// Exportar para Node.js (testes)
if (typeof module !== 'undefined') {
    module.exports = window.MapeamentoLogic;
}
