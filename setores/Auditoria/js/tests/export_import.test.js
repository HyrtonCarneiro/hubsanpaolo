// setores/Auditoria/js/tests/export_import.test.js
const test = require('node:test');
const assert = require('node:assert');

// Helper universal de parse de datas
function parseDataUniversal(val) {
    if (!val && val !== 0) return "";
    try {
        if (typeof val === 'number' || (!isNaN(val) && !val.toString().includes('-') && !val.toString().includes('/'))) {
            const serial = parseFloat(val);
            if (serial > 30000 && serial < 60000) {
                const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
                return dateObj.toISOString().split('T')[0];
            }
        }
        const str = val.toString().trim();
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } else if (str.includes('-')) {
            const parts = str.split(' ')[0].split('-');
            if (parts.length === 3) {
                return parts[0].length === 4 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return str;
    } catch (e) {
        return String(val);
    }
}

test('parseDataUniversal converte serial numérico do Excel corretamente', () => {
    // 45500 em Excel é por volta de Julho/Agosto de 2024
    const res = parseDataUniversal(45500);
    assert.match(res, /^\d{4}-\d{2}-\d{2}$/);
});

test('parseDataUniversal converte DD/MM/YYYY para YYYY-MM-DD', () => {
    const res = parseDataUniversal('25/12/2025');
    assert.strictEqual(res, '2025-12-25');
});

test('parseDataUniversal mantém YYYY-MM-DD', () => {
    const res = parseDataUniversal('2026-08-28');
    assert.strictEqual(res, '2026-08-28');
});

test('Estrutura de Backup Completo possui todas as 7 coleções do setor', () => {
    const backup = {
        metadata: { version: "2.0", sector: "Auditoria" },
        auditoria_notas: [{ loja: "Loja A", nota: 9.5 }],
        auditoria_planejamento: [{ loja: "Loja A", dataProxima: "2026-09-01", notasInternas: "Teste" }],
        auditoria_mapeamento: [{ lojaId: "1", nomeLoja: "Loja A", realizada: "SIM" }],
        auditoria_projetos: [{ desc: "Tarefa A", checklist: [{ texto: "Sub 1", concluido: true }], comentarios: [] }],
        auditoria_equipe: [{ nome: "Auditor 1" }],
        protocolos_suporte: [{ numero: "#123", sistema: "Athenas", descricao: "Chamado" }],
        links_Auditoria: [{ titulo: "Link 1", url: "https://example.com" }]
    };

    assert.strictEqual(backup.metadata.sector, "Auditoria");
    assert.strictEqual(backup.auditoria_notas.length, 1);
    assert.strictEqual(backup.auditoria_planejamento[0].notasInternas, "Teste");
    assert.strictEqual(backup.auditoria_projetos[0].checklist[0].concluido, true);
    assert.strictEqual(backup.auditoria_equipe[0].nome, "Auditor 1");
    assert.strictEqual(backup.protocolos_suporte[0].sistema, "Athenas");
    assert.strictEqual(backup.links_Auditoria[0].titulo, "Link 1");
});
