// js/components/organisms/DynamicSidebar.js
// Generates the appSidebar HTML dynamically avoiding hardcoded repetitions

window.renderDynamicSidebar = function (containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Sidebar container not found:', containerId);
        return;
    }

    const { sectorTitle, userName, navItems } = config;

    let navHtml = '';
    navItems.forEach(item => {
        navHtml += `
            <a href="#" id="nav-${item.id}" onclick="window.switchView('${item.id}')" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${item.active ? 'active-nav' : ''}">
                <i class="${item.icon} text-lg w-5 text-center"></i>
                <span class="sidebar-text truncate">${item.label}</span>
            </a>
        `;
    });

    const sidebarHTML = `
        <button class="menu-btn fixed top-4 left-4 z-50 p-2 bg-[var(--bg-color)] border border-[var(--border)] rounded-lg text-[var(--text-main)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer block md:hidden shadow-sm" onclick="window.CoreUI.toggleSidebar()">
            <i class="ph ph-list text-xl"></i>
        </button>

        <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden transition-opacity" onclick="window.CoreUI.toggleSidebar()"></div>

        <div class="relative flex-shrink-0 transition-all duration-300 z-40" id="sidebar-wrapper">
            <aside id="appSidebar" class="fixed md:relative top-0 left-0 h-screen w-64 bg-[var(--bg-color)] border-r border-[var(--border)] flex flex-col transition-all duration-300 shadow-sm -translate-x-full md:translate-x-0">
                <!-- Header -->
                <div class="p-6 border-b border-[var(--border)] h-[88px] flex flex-col justify-center">
                <div class="flex items-center gap-3 sidebar-title-container">
                    <div class="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                        <i class="ph-bold ph-shield-check"></i>
                    </div>
                    <div class="flex flex-col sidebar-text min-w-0">
                        <span class="text-xs font-bold tracking-wider text-[var(--text-muted)]">SAN PAOLO</span>
                        <span class="font-bold text-[var(--text-main)] truncate text-sm" title="${sectorTitle}">${sectorTitle}</span>
                    </div>
                </div>
            </div>

            <!-- Navegação -->
            <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div class="space-y-1">
                    <div class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-3 mt-4 first:mt-0 sidebar-text">Navegação</div>
                    ${navHtml}
                </div>
            </nav>

            <!-- Footer (Profile & Actions) -->
            <div class="p-4 border-t border-[var(--border)] bg-gray-50/50 dark:bg-gray-800/20">
                <div class="flex flex-col gap-2 sidebar-text">
                    <div class="flex items-center gap-2 px-3 py-2">
                        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <i class="ph-fill ph-user text-gray-500 dark:text-gray-400"></i>
                        </div>
                        <div class="flex flex-col min-w-0">
                            <span class="text-xs text-[var(--text-muted)]">Logado como:</span>
                            <span class="text-sm font-bold text-[var(--text-main)] truncate" id="loggedUserName">${userName || 'Usuário'}</span>
                        </div>
                        <button onclick="window.abrirModalPerfil()" class="ml-auto text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="Minha Conta">
                            <i class="ph ph-gear text-lg"></i>
                        </button>
                    </div>

                    <button onclick="window.CoreUI.goToHub()" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full border border-transparent hover:border-[var(--primary)]/30">
                        <i class="ph ph-squares-four text-lg w-5 text-center text-[var(--primary)]"></i>
                        <span class="truncate font-bold">Escolha de Setores</span>
                    </button>

                    <button onclick="window.CoreUI.toggleDarkMode()" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full">
                        <i class="ph ph-moon text-lg w-5 text-center dark-icon"></i>
                        <span class="truncate">Tema Escuro</span>
                    </button>
                    <button onclick="window.logout()" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors w-full">
                        <i class="ph ph-sign-out text-lg w-5 text-center"></i>
                        <span class="truncate">Sair</span>
                    </button>
                </div>
            </div>
            </aside>
            
            <!-- Desktop Toggle Button (outside aside to stay visible) -->
            <button onclick="window.CoreUI.toggleSidebar()" class="absolute -right-9 top-24 w-9 h-9 bg-[var(--bg-color)] border border-[var(--border)] border-l-0 text-[var(--text-main)] rounded-r-xl hidden md:flex items-center justify-center transition-all shadow-md text-lg hover:text-[var(--primary)] z-50">
                <i class="ph ph-caret-left sidebar-icon-toggle" id="sidebarToggleIcon"></i>
            </button>
        </div>

        <!-- MODAL PERFIL (Global) -->
        <div id="modalPerfil" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div class="bg-[var(--surface)] w-[400px] max-w-full rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]">
                <div class="p-6 border-b border-[var(--border)] bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-[var(--text-main)] m-0 flex items-center gap-2">
                        <i class="ph ph-user-circle text-[var(--primary)]"></i> Meu Perfil
                    </h3>
                    <button onclick="window.fecharModalPerfil()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <i class="ph ph-x text-lg"></i>
                    </button>
                </div>
                <div class="p-6">
                    <div class="mb-6 flex flex-col items-center">
                        <div class="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-3xl text-[var(--primary)] mb-3 shadow-inner">
                            <i class="ph-fill ph-user-circle"></i>
                        </div>
                        <h4 id="perfilUserName" class="text-lg font-bold text-[var(--text-main)] m-0">Usuário</h4>
                        <p id="perfilUserSetores" class="text-xs text-[var(--text-muted)] mt-1 font-medium italic"></p>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2 mb-4">Alterar Senha de Acesso</div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[0.65rem] font-black text-[var(--text-muted)] uppercase ml-1 opacity-60">Senha Atual</label>
                            <input type="password" id="perfilSenhaAtual" class="w-full px-4 py-2.5 bg-[var(--bg-color)]/50 border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-all font-bold text-sm">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[0.65rem] font-black text-[var(--text-muted)] uppercase ml-1 opacity-60">Nova Senha</label>
                            <input type="password" id="perfilNovaSenha" class="w-full px-4 py-2.5 bg-[var(--bg-color)]/50 border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-all font-bold text-sm">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[0.65rem] font-black text-[var(--text-muted)] uppercase ml-1 opacity-60">Confirmar Nova Senha</label>
                            <input type="password" id="perfilConfirmarSenha" class="w-full px-4 py-2.5 bg-[var(--bg-color)]/50 border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-all font-bold text-sm">
                        </div>
                        <button onclick="window.salvarNovaSenha()" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:brightness-110 active:scale-95 transition-all mt-4">
                            Atualizar Minha Conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = sidebarHTML;
}
