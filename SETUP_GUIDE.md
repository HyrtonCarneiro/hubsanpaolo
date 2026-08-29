# 📖 Hub San Paolo — Guia Completo de Configuração e Deploy

> **Documento de Passagem de Bastão**
> Este documento contém TODAS as instruções necessárias para que uma nova pessoa configure, suba e opere o projeto Hub San Paolo do zero.

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Pré-Requisitos](#2-pré-requisitos)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Passo 1: Criar Projeto Firebase](#4-passo-1-criar-projeto-firebase)
5. [Passo 2: Configurar Firestore Database](#5-passo-2-configurar-firestore-database)
6. [Passo 3: Atualizar Credenciais no Código](#6-passo-3-atualizar-credenciais-no-código)
7. [Passo 4: Restaurar Dados via Backup](#7-passo-4-restaurar-dados-via-backup)
8. [Passo 5: Criar Repositório GitHub](#8-passo-5-criar-repositório-github)
9. [Passo 6: Deploy na Vercel](#9-passo-6-deploy-na-vercel)
10. [Passo 7: Primeiro Login e Configuração](#10-passo-7-primeiro-login-e-configuração)
11. [Estrutura do Banco de Dados (Firestore)](#11-estrutura-do-banco-de-dados-firestore)
12. [Autenticação e Controle de Acesso](#12-autenticação-e-controle-de-acesso)
13. [Manutenção e Operação](#13-manutenção-e-operação)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Visão Geral do Projeto

O **Hub San Paolo** é um painel web interno da empresa San Paolo focado na gestão completa do setor de **Auditoria**:

| Setor | Diretório | Descrição |
| :--- | :--- | :--- |
| Auditoria | `setores/Auditoria/` | Notas de auditoria, planejamento, mapeamento, tarefas Kanban, protocolos, Meta PWR e links |

### Stack Tecnológica

- **Frontend**: HTML5 + JavaScript (Vanilla) + Tailwind CSS via CDN
- **Backend/Banco**: Firebase Firestore (Cloud NoSQL)
- **Hospedagem**: Vercel (site estático)
- **Bibliotecas via CDN** (sem build/bundler):
  - Firebase Compat SDK 10.8.1
  - Chart.js + chartjs-plugin-datalabels
  - SheetJS (XLSX) para exportação/importação Excel
  - Phosphor Icons
  - Toastify JS
  - Google Fonts (Inter)

> **IMPORTANTE**: Este projeto **NÃO usa bundler** (webpack, vite, etc). É um projeto 100% estático. Todos os `<script>` são carregados via CDN ou referência direta a arquivos `.js`. **Não precisa de `npm install` para rodar o frontend**.

---

## 2. Pré-Requisitos

Para configurar o projeto, você precisará de:

1. **Conta Google** (para criar o projeto Firebase)
2. **Conta GitHub** (para hospedar o código)
3. **Conta Vercel** (gratuita, para deploy — pode usar a mesma conta GitHub)
4. **Editor de código** (VS Code recomendado)
5. **Git** instalado no computador
6. **Node.js** (opcional — só para rodar os testes unitários)

---

## 3. Estrutura de Pastas

```
hubsanpaolo/
├── index.html                    ← Página principal (login + hub de setores)
├── js/
│   ├── firebase-init.js          ← ⚠️ CREDENCIAIS FIREBASE AQUI (editar)
│   ├── data.js                   ← Lista de lojas (lojasIniciais[])
│   ├── main.js                   ← Autenticação e roteamento
│   ├── controllers/              ← Controllers compartilhados (equipe, protocolos, links)
│   ├── services/                 ← CoreUI.js (toast, sidebar, theme)
│   ├── components/               ← Componentes visuais reutilizáveis
│   └── logic/                    ← Regras de negócio (ProtocolosLogic)
├── css/                          ← Estilos globais
├── setores/
│   └── Auditoria/
│       ├── index.html            ← Página do setor
│       └── js/
│           ├── app.js            ← Inicialização do setor
│           ├── controllers/      ← Controladores de cada módulo
│           │   ├── AppController.js
│           │   ├── ExportController.js     ← Exportação/Importação completa
│           │   ├── DashboardController.js
│           │   ├── AuditoriaOnlineController.js
│           │   ├── PlanejamentoController.js
│           │   ├── MapeamentoController.js
│           │   ├── TarefasController.js
│           │   └── ChartCMVController.js
│           ├── logic/            ← Regras de negócio
│           ├── services/         ← Serviços auxiliares
│           └── tests/            ← Testes unitários (Node.js)
├── APIs/                         ← Documentação de APIs externas (Athenas, Trilogo)
└── tailwind.config.js            ← Configuração Tailwind (somente para referência)
```

---

## 4. Passo 1: Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"** (ou "Add project")
3. Dê um nome ao projeto (ex: `hub-sanpaolo`)
4. Desabilite ou habilite o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### Registrar App Web

1. Na tela do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido (ex: `hub-sanpaolo-web`)
3. **NÃO marque** "Firebase Hosting"
4. Clique em **"Registrar app"**
5. **COPIE as credenciais** que aparecem. Elas terão este formato:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456",
    measurementId: "G-XXXXXXXXXX"
};
```

> **⚠️ Guarde essas credenciais!** Você precisará delas no Passo 3.

---

## 5. Passo 2: Configurar Firestore Database

1. No console do Firebase, clique em **"Build" → "Firestore Database"** (menu lateral esquerdo)
2. Clique em **"Criar banco de dados"** (ou "Create database")
3. Selecione a região mais próxima:
   - Para o Brasil: `southamerica-east1` (São Paulo)
4. Selecione **"Iniciar no modo de teste"** (Start in test mode)
   - Isso permite leitura/escrita por 30 dias. Depois ajustaremos as regras.
5. Clique em **"Ativar"**

### Configurar Regras de Segurança (Firestore Rules)

Após a criação, vá em **"Firestore Database" → Aba "Regras"** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **⚠️ Segurança**: As regras acima permitem acesso público ao banco. Em ambiente de produção real, você deveria implementar Firebase Authentication e restringir acesso por roles/tokens. Para uso interno (intranet), essas regras funcionam adequadamente.

Clique em **"Publicar"**.

---

## 6. Passo 3: Atualizar Credenciais no Código

Abra o arquivo **`js/firebase-init.js`** e substitua o bloco `firebaseConfig` pelas suas credenciais do Passo 1:

```javascript
// js/firebase-init.js  (linhas 5 a 13)
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.firebasestorage.app",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};
```

> **IMPORTANTE**: Este é o **ÚNICO arquivo que precisa ser alterado** para conectar o projeto a um novo banco de dados Firebase. Todo o restante do código funciona automaticamente.

---

## 7. Passo 4: Restaurar Dados via Backup

Se você recebeu **arquivos de backup** do responsável anterior:

### Backup Geral (Recomendado)

1. Abra o projeto no navegador (pode ser localmente via `file://` ou pelo deploy)
2. Faça login com o usuário `admin` (senha padrão: `$@np@010` — veja Passo 7)
3. Navegue até o setor **Auditoria**
4. No **Dashboard**, clique no botão **"Restaurar Backup Geral"**
5. Selecione o arquivo `.json` de backup completo
6. Aguarde a barra de progresso concluir — todas as 7 coleções serão restauradas

### Backups Individuais por Módulo

Cada aba do setor de Auditoria possui botões **"Importar Excel/JSON"**:

| Módulo | Botão de Importação | Formato |
| :--- | :--- | :--- |
| Notas de Auditoria | `Importar Excel/JSON` | `.xlsx` ou `.json` |
| Planejamento | `Importar Excel/JSON` | `.xlsx` ou `.json` |
| Mapeamento | `Importar Excel/JSON` | `.xlsx` ou `.json` |
| Tarefas Kanban | `Importar` | `.xlsx` ou `.json` |
| Protocolos | `Importar Excel/JSON` | `.xlsx` ou `.json` |
| Links Úteis | `Importar Excel/JSON` | `.xlsx` ou `.json` |
| Equipe | `Importar` (no modal) | `.json` |

---

## 8. Passo 5: Criar Repositório GitHub

1. Crie um **novo repositório** no GitHub (público ou privado)
2. No terminal, dentro da pasta do projeto:

```bash
# Remover o .git antigo (se existir)
rm -rf .git

# Inicializar novo repositório
git init
git add .
git commit -m "Configuração inicial do Hub San Paolo"

# Conectar ao seu repositório
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

> **Dica**: Adicione um `.gitignore` com `node_modules/`, `.venv/`, `.vscode/`. Esses diretórios NÃO são necessários para o funcionamento.

---

## 9. Passo 6: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com/) e faça login com sua conta GitHub
2. Clique em **"Add New..." → "Project"**
3. Selecione o repositório que você criou no Passo 5
4. Na configuração de deploy:
   - **Framework Preset**: `Other` (o projeto não usa framework)
   - **Build Command**: deixe **vazio** (sem build)
   - **Output Directory**: `.` (raiz do projeto)
   - **Install Command**: deixe **vazio**
5. Clique em **"Deploy"**
6. Aguarde o deploy concluir. Você receberá uma URL como: `https://seu-projeto.vercel.app`

### URLs de Acesso Após Deploy

- **Login**: `https://seu-projeto.vercel.app/`
- **Auditoria**: `https://seu-projeto.vercel.app/setores/Auditoria/`
- **TI**: `https://seu-projeto.vercel.app/setores/TI/`
- E assim por diante para cada setor.

> **Nota**: Este projeto também funciona abrindo os arquivos `.html` diretamente no navegador (protocolo `file://`). O Firebase Compat SDK foi escolhido especificamente para suportar isso.

---

## 10. Passo 7: Primeiro Login e Configuração

### Login Inicial

Na primeira vez que o sistema roda com um banco **vazio**, use as credenciais hardcoded:

- **Usuário**: `admin`
- **Senha**: `$@np@010`

O sistema **criará automaticamente** o documento do usuário admin na coleção `users` do Firestore com acesso total a todos os setores.

### Criar Novos Usuários

Após logar como admin, vá no **Firestore Console** (Firebase → Firestore) e na coleção `users`, clique em **"Adicionar documento"** com os campos:

```json
{
  "user": "nome_do_usuario",
  "pass": "senha_do_usuario",
  "setores_permitidos": ["Auditoria", "TI"],
  "isSuperAdmin": false
}
```

**Setores disponíveis para `setores_permitidos`:**
```
Auditoria
```

> **⚠️ Segurança**: As senhas são armazenadas em texto plano no Firestore. Para ambiente de produção mais seguro, implemente Firebase Authentication.

---

## 11. Estrutura do Banco de Dados (Firestore)

Todas as coleções são criadas automaticamente na primeira vez que dados são inseridos.

### Coleções Globais

| Coleção | Descrição |
| :--- | :--- |
| `users` | Credenciais e permissões de acesso |

### Coleções do Setor de Auditoria

| Coleção | Descrição | Campos Principais |
| :--- | :--- | :--- |
| `auditoria_notas` | Notas de auditoria por loja | `loja`, `data`, `nota`, `auditor`, `timestamp` |
| `auditoria_planejamento` | Agenda de auditorias | `loja`, `dataProxima`, `auditor`, `notasInternas`, `regional` |
| `auditoria_mapeamento` | Histórico de tentativas de visita | `nomeLoja`, `dataTentativa`, `realizada`, `justificativa`, `nTentativa`, `sla`, `auditor` |
| `auditoria_projetos` | Tarefas Kanban da equipe | `desc`, `status`, `responsaveis[]`, `checklist[]`, `comentarios[]`, `dataAtv`, `demandante` |
| `auditoria_equipe` | Membros da equipe | `nome` |
| `protocolos_suporte` | Chamados para sistemas | `sistema`, `numero`, `responsavel`, `status`, `descricao`, `comentarios[]` |
| `links_Auditoria` | Links úteis do setor | `titulo`, `url`, `descricao`, `autor` |

### Coleções de Outros Setores (padrão)

| Coleção | Setor |
| :--- | :--- |
| `equipe_ti` | TI |
| `equipe_operacao` | Operação |
| `equipe_gente_gestao` | Gente e Gestão |
| `links_TI`, `links_<SETOR>` | Links úteis por setor |

---

## 12. Autenticação e Controle de Acesso

O sistema usa autenticação simples baseada em Firestore:

1. Usuário digita login/senha na tela inicial
2. O sistema busca na coleção `users` por `user == input`
3. Compara a senha
4. Se válido, armazena no `localStorage`: `loggedUser`, `userSectors`, `isSuperAdmin`

### Fluxo de Navegação

```
index.html (Login)
    ↓ (autenticação OK)
index.html (Hub de Setores — se múltiplos setores)
    ↓ (clica no setor)
setores/<SETOR>/index.html (Página do Setor)
```

Se o usuário tem permissão para **apenas 1 setor**, ele é redirecionado automaticamente.

---

## 13. Manutenção e Operação

### Exportar Dados (Backup)

- **Dashboard Auditoria → "Backup Completo (JSON)"** — gera `.json` com todas as 7 coleções
- Cada aba possui **"Exportar Excel"** (planilha) e **"JSON"** (backup fiel)

### Importar Dados

- **Dashboard → "Restaurar Backup Geral"** → selecionar arquivo `.json`
- Cada aba possui **"Importar Excel/JSON"** para importação individual

### Adicionar Nova Loja

Edite `js/data.js` e adicione um novo item ao array `lojasIniciais`:

```javascript
{ id: 73, estado: 'UF', nome: 'NOME DA LOJA', lat: -0.000, lng: -0.000 }
```

### Alterar Senha Admin

No **Firestore Console**, coleção `users`, altere o campo `pass` do documento do admin.

### Rodar Testes (Opcional)

```bash
node --test "setores/Auditoria/js/tests/*.test.js"
```

---

## 14. Troubleshooting

### "Firebase não conecta" / "Erro de permissão"
- Verifique se as credenciais em `js/firebase-init.js` estão corretas
- Verifique se as **Firestore Rules** permitem leitura/escrita
- Verifique se o Firestore Database foi criado no console do Firebase

### "Página em branco" ou "scripts não carregam"
- Verifique se a internet está funcionando (depende de CDNs)
- Abra o **Console do navegador** (F12 → Console) e veja se há erros

### "Login não funciona"
- Primeira vez com banco vazio: use `admin` / `$@np@010`
- Se o admin já existir, verifique a senha no Firestore Console

### "Importação falha com erro"
- Verifique o formato: `.xlsx`, `.xls`, ou `.json`
- Para Excel: cabeçalhos na primeira linha
- Para JSON: estrutura de array de objetos ou backup com `metadata`
- Console do navegador (F12) para erros detalhados

### "Gráficos não aparecem"
- Verifique se `chart.js` carregou (F12 → Network)
- Verifique se há dados na coleção correspondente

### "Deploy na Vercel dá erro"
- **Build Command**: vazio
- **Output Directory**: `.` (ponto)
- Projeto é totalmente estático, não precisa de build

---

## ✅ Checklist de Migração Rápida

```
[ ] 1. Criar projeto Firebase e copiar credenciais
[ ] 2. Criar Firestore Database (modo teste, região São Paulo)
[ ] 3. Configurar Firestore Rules (permitir read/write)
[ ] 4. Editar js/firebase-init.js com as novas credenciais
[ ] 5. Testar localmente abrindo index.html no navegador
[ ] 6. Fazer login com admin / $@np@010
[ ] 7. Restaurar backup dos dados (se houver) via Dashboard → Restaurar Backup
[ ] 8. Criar repositório GitHub e fazer push do código
[ ] 9. Conectar na Vercel e fazer deploy
[ ] 10. Testar URL final da Vercel
[ ] 11. Criar novos usuários no Firestore conforme necessário
```

---

> **Documento gerado em**: 28/08/2026  
> **Projeto**: Hub San Paolo — Sistema Interno de Gestão  
> **Versão**: 1.1.0
