const MapeamentoLogic = require('../logic/MapeamentoLogic');

describe('MapeamentoLogic', () => {
    test('estaNoPrazo deve retornar true até o dia 20', () => {
        expect(MapeamentoLogic.estaNoPrazo('2026-03-20')).toBe(true);
        expect(MapeamentoLogic.estaNoPrazo('2026-03-21')).toBe(false);
    });

    test('circularTentativa deve incrementar corretamente no mesmo mês', () => {
        const historico = [
            { lojaId: '1', dataTentativa: '2026-03-01' },
            { lojaId: '1', dataTentativa: '2026-03-05' }
        ];
        expect(MapeamentoLogic.circularTentativa('1', '2026-03-10', historico)).toBe(3);
        // Diferente loja
        expect(MapeamentoLogic.circularTentativa('2', '2026-03-10', historico)).toBe(1);
        // Diferente mês
        expect(MapeamentoLogic.circularTentativa('1', '2026-04-10', historico)).toBe(1);
    });

    test('validarRegistro deve exigir justificativa se NÃO realizada', () => {
        const dadosOk = { lojaId: '1', dataTentativa: '2026-03-01', realizada: 'SIM' };
        expect(MapeamentoLogic.validarRegistro(dadosOk).valid).toBe(true);

        const dadosErro = { lojaId: '1', dataTentativa: '2026-03-01', realizada: 'NÃO', justificativa: '' };
        expect(MapeamentoLogic.validarRegistro(dadosErro).valid).toBe(false);

        const dadosOkFalha = { lojaId: '1', dataTentativa: '2026-03-01', realizada: 'NÃO', justificativa: 'Ocupado' };
        expect(MapeamentoLogic.validarRegistro(dadosOkFalha).valid).toBe(true);
    });
});
