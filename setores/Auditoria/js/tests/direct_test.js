const MapeamentoLogic = require('../logic/MapeamentoLogic');

const tests = {
    testSLA() {
        const ok = MapeamentoLogic.estaNoPrazo('2026-03-20');
        const fail = MapeamentoLogic.estaNoPrazo('2026-03-21');
        console.log(`testSLA: ${ok === true && fail === false ? 'PASSED' : 'FAILED'}`);
    },
    testSequence() {
        const historico = [{ lojaId: '1', dataTentativa: '2026-03-01' }];
        const res = MapeamentoLogic.circularTentativa('1', '2026-03-10', historico);
        console.log(`testSequence: ${res === 2 ? 'PASSED' : 'FAILED'}`);
    },
    testValidation() {
        const res = MapeamentoLogic.validarRegistro({ lojaId: '1', dataTentativa: '2026-03-01', realizada: 'NÃO', justificativa: '' });
        console.log(`testValidation: ${res.valid === false ? 'PASSED' : 'FAILED'}`);
    }
};

console.log('--- RUNNING AUDITORIA LOGIC TESTS ---');
Object.values(tests).forEach(t => t());
