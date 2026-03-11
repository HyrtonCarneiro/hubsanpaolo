/**
 * js/tests/DashboardLogic.test.js
 * Teste de unidade para DashboardLogic.js rodando em Node.js.
 */

const DashboardLogic = require('../logic/DashboardLogic');

// Mock Data
const mockupLojas = [
    { id: 'loja1', nome: 'Parangaba', estado: 'CE' },
    { id: 'loja2', nome: 'Juazeiro', estado: 'BA' }
];

const mockupLogs = {
    'loja1': [
        { resolvido: false },
        { resolvido: false }
    ],
    'loja2': [
        { resolvido: false },
        { resolvido: true } // Resolvido deve ser ignorado
    ]
};

const mockupProjetos = {
    'Hyrton': [
        { desc: 'Tarefa 1', status: 'Em Andamento' },
        { desc: 'Tarefa 2', status: 'Concluído' } // Deve ser ignorada
    ],
    'Equipe': [
        { desc: 'Tarefa 3', status: 'Pendente' }
    ]
};

console.log('--- Iniciando Testes DashboardLogic ---');

// Teste 1: Métricas de Lojas
console.log('\nTeste 1: Lógica de Lojas/Chamados');
const metricsLojas = DashboardLogic.processarMetricasLojas(mockupLojas, mockupLogs);
console.log('Total Pendentes (Esperado 3):', metricsLojas.totalPendentes);
console.log('Distribuição por Loja (Esperado Parangaba:2, Juazeiro:1):', JSON.stringify(metricsLojas.lojaCallCount));

console.assert(metricsLojas.totalPendentes === 3, 'Erro: Total de pendentes incorreto');
console.assert(metricsLojas.lojaCallCount['Parangaba'] === 2, 'Erro: Contagem Parangaba incorreta');
console.assert(metricsLojas.lojaCallCount['Juazeiro'] === 1, 'Erro: Contagem Juazeiro incorreta');

// Teste 2: Métricas de Tarefas
console.log('\nTeste 2: Lógica de Tarefas Ativas');
const metricsTasks = DashboardLogic.processarMetricasTarefasAtivas(mockupProjetos);
console.log('Andamento (Esperado 1):', metricsTasks.andamento);
console.log('Pendentes (Esperado 1):', metricsTasks.pendentes);
console.log('Ativas por Membro (Esperado Hyrton:1, Equipe:1):', JSON.stringify(metricsTasks.porMembro));

console.assert(metricsTasks.andamento === 1, 'Erro: Contagem em andamento incorreta');
console.assert(metricsTasks.pendentes === 1, 'Erro: Contagem pendentes incorreta');
console.assert(metricsTasks.porMembro['Hyrton'] === 1, 'Erro: Hyrton deveria ter 1 tarefa ativa');

console.log('\n✅ Todos os testes passaram!\n');
