const { describe, it: test } = require('node:test');
const assert = require('node:assert');
const MapeamentoLogic = require('../logic/MapeamentoLogic');

describe('MapeamentoLogic', () => {
    test('estaNoPrazo deve retornar true até o dia 20', () => {
        assert.strictEqual(MapeamentoLogic.estaNoPrazo('2026-03-20'), true);
        assert.strictEqual(MapeamentoLogic.estaNoPrazo('2026-03-21'), false);
    });

    test('circularTentativa deve incrementar corretamente no mesmo mês', () => {
        const historico = [
            { lojaId: '1', dataTentativa: '2026-03-01' },
            { lojaId: '1', dataTentativa: '2026-03-05' }
        ];
        assert.strictEqual(MapeamentoLogic.circularTentativa('1', '2026-03-10', historico), 3);
        // Diferente loja
        assert.strictEqual(MapeamentoLogic.circularTentativa('2', '2026-03-10', historico), 1);
        // Diferente mês
        assert.strictEqual(MapeamentoLogic.circularTentativa('1', '2026-04-10', historico), 1);
    });

    test('validarRegistro deve exigir justificativa se NÃO realizada', () => {
        const dadosOk = { lojaId: '1', dataTentativa: '2026-03-01', auditor: 'Auditor 1', realizada: 'SIM' };
        assert.strictEqual(MapeamentoLogic.validarRegistro(dadosOk).valid, true);

        const dadosErro = { lojaId: '1', dataTentativa: '2026-03-01', auditor: 'Auditor 1', realizada: 'NÃO', justificativa: '' };
        assert.strictEqual(MapeamentoLogic.validarRegistro(dadosErro).valid, false);

        const dadosOkFalha = { lojaId: '1', dataTentativa: '2026-03-01', auditor: 'Auditor 1', realizada: 'NÃO', justificativa: 'Ocupado' };
        assert.strictEqual(MapeamentoLogic.validarRegistro(dadosOkFalha).valid, true);
    });
});
