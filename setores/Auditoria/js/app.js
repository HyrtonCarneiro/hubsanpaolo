// js/app.js — Entry point do setor Auditoria
// Ordem de carregamento: firebase-init.js → data.js → controllers → app.js
// Controllers: AppController, AuditoriaOnlineController, DashboardController,
//              PlanejamentoController, TarefasController, ChartCMVController

let currentUser = localStorage.getItem('loggedUser') || null;
if (currentUser) initApp();
