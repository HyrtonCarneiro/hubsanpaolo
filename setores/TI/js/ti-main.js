// js/ti-main.js — Entry point do setor TI
// Ordem de carregamento: firebase-init.js → data.js → controllers → ti-main.js
// Controllers: AppController, LojasChamadosController, DashboardController,
//              ProjetosEquipeController, AtasController

if (window.currentUser) initApp();
else {
    window.currentUser = localStorage.getItem('loggedUser') || null;
    if (window.currentUser) initApp();
}
