---
description: Padrões de código e regras de desenvolvimento do projeto San Paolo Hub
---

# Regras de Desenvolvimento — San Paolo Hub

## ⚠️ LEIA SEMPRE ANTES DE QUALQUER ALTERAÇÃO NO PROJETO

# Role: Senior Full Stack Architect & Clean Code Expert

## Core Principles
1. **SOLID Implementation:**
   - Single Responsibility: Each file must do exactly one thing.
   - Interface Segregation: Keep interfaces small and specific.
   - Dependency Inversion: Depend on abstractions, not implementations.

2. **Atomic Design Methodology:**
   - Structure components into: Atoms, Molecules, Organisms, Templates, and Pages.
   - Atoms MUST be stateless and generic.
   - Pages and Templates handle layout; Organisms handle complex data structures.

3. **Styling with Tailwind CSS:**
   - Use utility-first classes directly in HTML/JSX.
   - Avoid creating separate .css files.
   - Use `@apply` only for highly repetitive components or to clean up complex UI patterns.

## Development Workflow
- **Spec-Driven:** Before coding any feature, create or update a `features.md` file with the technical requirements.
- **TDD (Test-Driven Development):** Always write the unit test (Vitest/Jest or something else) before implementing the logic.
- **File Size Constraint:** Strictly avoid files larger than 300 lines of code. If a file exceeds this, refactor and split it.
- **Folder Structure:** 
  - `/src/components/[atoms|molecules|organisms]`
  - `/src/hooks` (Logic only)
  - `/src/services` (API calls)
  - `/src/types` (TypeScript definitions)

## Technical Preferences
- Use TypeScript with strict mode enabled.
- Prefer Functional Components and Hooks over Classes.
- Isolate business logic (Hooks) from the UI (Components).
- All responses must be technical, direct, and focused on code efficiency.


## Arquitetura
- **Zero-build**: Projeto roda diretamente via `file://` no navegador, sem Node.js, sem bundler
- **Firebase Compat SDK**: Usar `firebase-*-compat.js` via CDN (NÃO usar ES Modules `import/export`)
- **Scripts globais**: Todas as funções e objetos expostos via `window.` — sem `export`/`import`
- **Ordem de carregamento dos scripts**: firebase-init.js → data.js → componentes → app.js

## Estilização
- **Tailwind CSS via CDN**: Usar classes utilitárias diretamente no HTML
- **Variáveis CSS**: Definidas em `css/styles.css` (ex: `var(--primary)`, `var(--sp-red)`, etc.)
- **Classe `.active`**: Usada para nav items ativos na sidebar (regras CSS em `styles.css`)
- **Visibilidade de views**: Usar `style.display = 'none'/'block'/'flex'` (NÃO `class="hidden"`)
- **Dark mode**: Toggle via `document.body.classList.toggle('dark-mode')`

## Estrutura de Pastas
```
hubsanpaolo/
├── css/styles.css              # Variáveis CSS globais e regras base
├── js/
│   ├── firebase-init.js        # Inicialização Firebase (window globals)
│   ├── data.js                 # Dados estáticos (lojasIniciais, appConfig)
│   ├── main.js                 # Hub principal (login, setores, admin)
│   └── components/
│       ├── atoms/Button.js     # Componente atômico Button
│       └── molecules/SectorCard.js
├── setores/
│   └── [NomeSetor]/
│       ├── index.html          # Página do setor (inclui CDNs + Tailwind config)
│       └── js/app.js           # Lógica do setor
└── index.html                  # Hub de login e seleção de setores
```

## Princípios de Código
1. **SOLID**: Cada arquivo faz uma coisa. Serviços separados de controllers
2. **Atomic Design**: Atoms (Button), Molecules (SectorCard), Organisms (modais complexos)
3. **Nomes de lojas únicos**: Cada loja em `data.js` deve ter nome único (ex: "AEROPORTO LOJA SALVADOR")
4. **Template literals**: Usar concatenação `'view-' + v` ao invés de backtick em scripts manipulados por PowerShell
5. **Null checks**: Sempre verificar `if (element)` antes de `.innerHTML`, `.style`, `.classList`

## Lista de Setores (ordem alfabética, Diretoria primeiro)
Diretoria, Auditoria, Centro_Distribuicao, Controladoria, Expansao, Financeiro, Fiscal, Gente_Gestao, Marketing, Operacao, TI, Varejo

## Estrutura padrão de um novo setor
1. Criar pasta `setores/[NomeSetor]/`
2. Criar `index.html` com: CDNs (Firebase Compat, Tailwind, Phosphor Icons, Toastify), Tailwind config, sidebar, views
3. Criar `js/app.js` com: initApp(), switchView(), toggleSidebar(), toggleDarkMode(), logout(), equipe
4. Classe da sidebar nav ativa: `active` (CSS definido em styles.css)
5. Botão Hub: injetado dinamicamente via JS no `initApp()` antes dos `<h1>`
6. Adicionar o setor em `main.js`: allHubSectors, allSectors (admin auth), renderAdminUsersList allSectors

## Firebase Collections por Setor
- Equipe: `[setor]_equipe` (ex: `cd_equipe`, `controladoria_equipe`)
- Dados específicos: nomeados conforme o setor (ex: `chamados`, `obras`, `notas_auditoria`)