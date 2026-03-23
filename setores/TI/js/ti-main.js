// js/ti-main.js — Entry point do setor TI
// Ordem de carregamento: firebase-init.js → data.js → controllers → ti-main.js
// Controllers: AppController, LojasChamadosController, DashboardController,
//              ProjetosEquipeController, AtasController

let currentUser = localStorage.getItem('loggedUser') || null;
if (currentUser) initApp();
