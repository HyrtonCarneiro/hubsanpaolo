---
description: Padrões de código e regras de desenvolvimento do projeto San Paolo Hub
---

// turbo-all

# Regras de Desenvolvimento — San Paolo Hub

## ⚠️ LEIA SEMPRE ANTES DE QUALQUER ALTERAÇÃO NO PROJETO

### Passo 0 — Obrigatório antes de qualquer alteração
1. Leia o arquivo `RULES.md` na raiz do projeto
2. Leia este workflow completo (`coding-standards.md`)
3. Verifique a estrutura `js/controllers/` do setor se a alteração envolver um setor específico
4. Se alguma regra não fizer sentido para a situação, **consulte o usuário antes de desviar**

### Passo 5 — Verificação Ágil (Prioritário)
Antes de qualquer verificação manual no navegador:
1.  **Isolar Lógica**: Certifique-se que a lógica de negócio está em `js/logic/`.
2.  **Executar Testes de Unidade**: Rode `node js/tests/[arquivo].test.js`.
3.  **Garantir Verde**: Não avance se os testes de unidade falharem.

Após os testes de unidade, verifique internamente no navegador:
- [ ] Console JS sem erros
- [ ] Renderização UI correta
- [ ] Integração com Firebase OK
- [ ] Dark mode continua funcionando

### Passo 6 — Finalização
1. Informe o usuário sobre as alterações concluídas.
2. **NÃO** dê commit ou push. Aguarde a instrução explícita do usuário.

## Arquitetura
- **Zero-build**: Projeto roda diretamente via `file://` no navegador, sem Node.js, sem bundler
- **Firebase Compat SDK**: Usar `firebase-*-compat.js` via CDN (NÃO usar ES Modules `import/export`)
- **Scripts globais**: Todas as funções e objetos expostos via `window.` — sem `export`/`import`
- **Ordem de carregamento dos scripts**: firebase-init.js → data.js → controllers → app.js

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
│       └── js/
│           ├── app.js          # Entry point do setor
│           ├── logic/          # Lógica pura (testável em Node.js)
│           ├── tests/          # Scripts de teste de unidade
│           └── controllers/    # Controllers SOLID do setor
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