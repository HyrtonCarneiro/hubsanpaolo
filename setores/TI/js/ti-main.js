// js/ti-main.js — Entry point do setor TI
// Ordem de carregamento: firebase-init.js → data.js → controllers → ti-main.js
// Controllers: AppController, LojasChamadosController, DashboardController,
//              ProjetosEquipeController, AtasController

if (currentUser) initApp();
