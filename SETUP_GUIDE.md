# 📖 Hub San Paolo (Auditoria) — Guia Completo de Configuração, Passagem de Bastão e Deploy

> **Documento de Passagem de Bastão**
> Este documento contém TODAS as instruções necessárias para que uma nova pessoa configure, suba e opere o projeto Hub San Paolo do zero com suas próprias credenciais (Firebase, GitHub, Vercel).

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Pré-Requisitos](#2-pré-requisitos)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Passo 1: Criar Projeto Firebase](#4-passo-1-criar-projeto-firebase)
5. [Passo 2: Configurar Firestore Database](#5-passo-2-configurar-firestore-database)
6. [Passo 3: Atualizar Credenciais no Código](#6-passo-3-atualizar-credenciais-no-código)
7. [Passo 4: Restaurar Dados via Backup](#7-passo-4-restaurar-dados-via-backup)
8. [Passo 5: Conectar ao seu Repositório GitHub](#8-passo-5-conectar-ao-seu-repositório-github)
9. [Passo 6: Deploy na Vercel](#9-passo-6-deploy-na-vercel)
10. [Passo 7: Primeiro Login e Configuração](#10-passo-7-primeiro-login-e-configuração)
11. [Estrutura do Banco de Dados (Firestore)](#11-estrutura-do-banco-de-dados-firestore)
12. [Autenticação e Controle de Acesso](#12-autenticação-e-controle-de-acesso)
13. [Manutenção e Operação](#13-manutenção-e-operação)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Visão Geral do Projeto

O **Hub San Paolo** é um painel web interno focado na gestão completa do setor de **Auditoria**:

| Setor | Diretório | Descrição |
| :--- | :--- | :--- |
| Auditoria | `setores/Auditoria/` | Notas de auditoria, planejamento, mapeamento, tarefas Kanban, protocolos, Meta PWR e links |

### Stack Tecnológica

- **Frontend**: HTML5 + JavaScript (Vanilla) + Tailwind CSS via CDN
- **Backend/Banco**: Firebase Firestore (Cloud NoSQL)
- **Hospedagem**: Vercel (site estático) ou execução local (`file://`)
- **Bibliotecas via CDN** (sem build/bundler):
  - Firebase Compat SDK 10.8.1
  - Chart.js + chartjs-plugin-datalabels
  - SheetJS (XLSX) para exportação/importação Excel
  - Phosphor Icons
  - Toastify JS
  - Google Fonts (Inter)

> **IMPORTANTE**: Este projeto **NÃO usa bundler** (webpack, vite, etc). É um projeto 100% estático. Todos os scripts são carregados via CDN ou referência direta a arquivos `.js`. **Não é necessário rodar `npm install` para rodar o frontend**.

---

## 2. Pré-Requisitos

Para configurar o projeto com suas próprias credenciais:

1. **Conta Google** (para criar o projeto Firebase)
2. **Conta GitHub** (para hospedar o código no seu perfil)
3. **Conta Vercel** (gratuita, para deploy — pode logar com sua conta GitHub)
4. **Editor de código** (VS Code ou similar)
5. **Git** instalado no computador
6. **Node.js** (opcional — apenas para rodar a suíte de testes unitários)

---

## 3. Estrutura de Pastas

```
hubsanpaolo/
├── index.html                    ← Página principal (login e direcionamento)
├── js/
│   ├── firebase-init.js          ← ⚠️ CREDENCIAIS FIREBASE PRINCIPAIS (editar aqui)
│   ├── firebase.js               ← Template alternativo modular
│   ├── data.js                   ← Lista de lojas (lojasIniciais[]) e config
│   ├── main.js                   ← Autenticação e roteamento
│   ├── controllers/              ← Controllers compartilhados (Admin, Equipe, Protocolos, Links)
│   ├── services/                 ← CoreUI.js (toast, sidebar, theme, switchView)
│   ├── components/               ← Componentes visuais reutilizáveis (Button, SectorCard, Sidebar)
│   └── logic/                    ← Regras de negócio puras (ProtocolosLogic)
├── css/                          ← Estilos globais
├── setores/
│   └── Auditoria/
│       ├── index.html            ← Interface completa do setor de Auditoria
│       └── js/
│           ├── app.js            ← Inicialização do setor
│           ├── controllers/      ← Controladores de cada módulo de Auditoria
│           │   ├── AppController.js
│           │   ├── ExportController.js     ← Exportação/Importação e Backups
│           │   ├── DashboardController.js
│           │   ├── AuditoriaOnlineController.js
│           │   ├── PlanejamentoController.js
│           │   ├── MapeamentoController.js
│           │   ├── TarefasController.js
│           │   └── ChartCMVController.js
│           ├── logic/            ← Regras de negócio (MapeamentoLogic)
│           ├── services/         ← Serviços auxiliares
│           └── tests/            ← Testes unitários (Node.js test runner)
├── APIs/                         ← Documentação de APIs externas
└── SETUP_GUIDE.md                ← Este guia de passagem de bastão
```

---

## 4. Passo 1: Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) com sua conta Google.
2. Clique em **"Adicionar projeto"** (ou "Add project").
3. Dê um nome ao projeto (ex: `sanpaolo-auditoria`).
4. Desabilite ou habilite o Google Analytics (opcional).
5. Clique em **"Criar projeto"**.

### Registrar App Web

1. Na tela inicial do projeto no Firebase, clique no ícone **`</>`** (Web).
2. Dê um apelido (ex: `hub-sanpaolo-web`).
3. **NÃO marque** "Firebase Hosting".
4. Clique em **"Registrar app"**.
5. **COPIE as credenciais** geradas. Elas terão este formato:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy_EXEMPLO_DE_CHAVE",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456",
    measurementId: "G-XXXXXXXXXX"
};
```

---

## 5. Passo 2: Configurar Firestore Database

1. No menu lateral do Firebase, vá em **"Criação" (Build) → "Firestore Database"**.
2. Clique em **"Criar banco de dados"**.
3. Selecione a região recomendada para o Brasil: `southamerica-east1` (São Paulo).
4. Selecione **"Iniciar no modo de teste"** (Start in test mode).
5. Clique em **"Ativar"**.

### Configurar Regras de Segurança (Firestore Rules)

Após a criação, acesse a aba **"Regras"** no Firestore e cole a seguinte política:

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

Clique em **"Publicar"**.

---

## 6. Passo 3: Atualizar Credenciais no Código

Abra o arquivo **`js/firebase-init.js`** (e opcionalmente `js/firebase.js`) e substitua o bloco `firebaseConfig` pelas credenciais do seu projeto Firebase:

```javascript
// js/firebase-init.js (linhas 5 a 14)
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.firebasestorage.app",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};
```

> **Pronto!** Com este arquivo preenchido, todas as telas do Hub e de Auditoria estarão integradas ao seu banco de dados.

---

## 7. Passo 4: Restaurar Dados via Backup

Se você possui arquivos de backup `.json` ou planilhas `.xlsx`:

### Backup Geral (Recomendado)

1. Abra o projeto no navegador (diretamente via `file://index.html` ou pelo deploy).
2. Faça login com o usuário `admin` (senha: `$@np@010`).
3. Acesse o setor **Auditoria**.
4. No **Dashboard**, clique no botão **"Restaurar Backup Geral"**.
5. Selecione o arquivo `.json` de backup completo.
6. O sistema restaurará automaticamente as coleções do setor.

### Backups Individuais por Módulo

Cada aba de Auditoria possui importadores dedicados:
- **Auditoria Online / Notas**: Botão `Importar Excel/JSON` (`.xlsx` ou `.json`).
- **Planejamento**: Botão `Importar Excel/JSON` (`.xlsx` ou `.json`).
- **Mapeamento**: Botão `Importar Excel/JSON` (`.xlsx` ou `.json`).
- **Tarefas Kanban**: Botão `Importar` (`.xlsx` ou `.json`).
- **Protocolos de Chamados**: Botão `Importar Excel/JSON` (`.xlsx` ou `.json`).
- **Links Úteis**: Botão `Importar Excel/JSON` (`.xlsx` ou `.json`).

---

## 8. Passo 5: Conectar ao seu Repositório GitHub

Para transferir o código para o seu próprio GitHub, execute os seguintes comandos no terminal do projeto:

### Opção A: Apontar o Git para o seu novo repositório
```bash
# Atualizar a URL remota para o seu usuário/repositório:
git remote set-url origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Enviar o código para o seu repositório:
git branch -M main
git push -u origin main
```

### Opção B: Recriar o histórico do zero
```bash
# Remover histórico anterior
rm -rf .git

# Iniciar novo
git init
git add .
git commit -m "Initial commit - Hub San Paolo Auditoria"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

---

## 9. Passo 6: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com/) e faça login com sua conta GitHub.
2. Clique em **"Add New..." → "Project"**.
3. Importe o repositório que você conectou no Passo 5.
4. Na tela de configuração:
   - **Framework Preset**: `Other` (projeto estático sem framework)
   - **Build Command**: deixe em **branco**
   - **Output Directory**: `.` (ponto / raiz)
   - **Install Command**: deixe em **branco**
5. Clique em **"Deploy"**.
6. Em instantes o projeto estará online com URL como: `https://seu-projeto.vercel.app`.

---

## 10. Passo 7: Primeiro Login e Configuração

### Login Inicial (Admin Raiz)

Na primeira inicialização com um banco novo/vazio:
- **Usuário**: `admin`
- **Senha**: `$@np@010`

O sistema criará automaticamente o documento de administrador na coleção `users` do Firestore.

### Gerenciar Usuários pelo Painel

1. Logado como `admin`, clique no botão **"Gerenciar Usuários"** (ou use o modal administrativo).
2. Adicione novos usuários fornecendo nome e senha.
3. As permissões de acesso ao setor de Auditoria são configuradas automaticamente.

---

## 11. Estrutura do Banco de Dados (Firestore)

| Coleção | Descrição | Campos Principais |
| :--- | :--- | :--- |
| `users` | Credenciais e permissões | `user`, `pass`, `setores_permitidos[]`, `isSuperAdmin` |
| `auditoria_notas` | Notas de auditoria por loja | `loja`, `data`, `nota`, `auditor`, `timestamp` |
| `auditoria_planejamento` | Agenda de auditorias | `loja`, `dataProxima`, `auditor`, `notasInternas`, `regional` |
| `auditoria_mapeamento` | Histórico de visitas e tentativas | `nomeLoja`, `dataTentativa`, `realizada`, `justificativa`, `nTentativa`, `sla`, `auditor` |
| `auditoria_projetos` | Tarefas Kanban da equipe | `desc`, `status`, `responsaveis[]`, `checklist[]`, `comentarios[]`, `dataAtv`, `demandante` |
| `auditoria_equipe` | Membros da equipe de auditoria | `nome` |
| `protocolos_suporte` | Chamados de suporte | `sistema`, `numero`, `responsavel`, `status`, `descricao`, `comentarios[]` |
| `links_Auditoria` | Links úteis do setor | `titulo`, `url`, `descricao`, `autor` |

---

## 12. Autenticação e Controle de Acesso

- Autenticação baseada em Firestore (`users`).
- Ao logar com sucesso, armazena sessão no `localStorage`:
  - `loggedUser`: Nome do usuário ativo.
  - `userSectors`: Setores autorizados (`["Auditoria"]`).
  - `isSuperAdmin`: Flag booleana para privilégios de gestão.
- Usuários autorizados apenas para Auditoria são direcionados diretamente para `./setores/Auditoria/index.html`.

---

## 13. Manutenção e Operação

### Adicionar ou Editar Lojas
Edite `js/data.js` e modifique o array `lojasIniciais`:
```javascript
{ id: 73, estado: 'UF', nome: 'NOVA LOJA', lat: -0.000, lng: -0.000 }
```

### Executar Testes Unitários
Para rodar os testes de lógica de SLAs e exportação:
```bash
node --test "setores/Auditoria/js/tests/mapeamento.test.js" "setores/Auditoria/js/tests/export_import.test.js"
```

---

## 14. Troubleshooting

- **"Erro ao conectar com Firebase / permission-denied"**:
  - Verifique as credenciais no `js/firebase-init.js`.
  - Verifique se as Regras do Firestore estão publicadas com `allow read, write: if true;`.
- **"Página não carrega dados ou estilos"**:
  - Verifique conexão à internet (o sistema utiliza CDNs para Tailwind, Chart.js e Phosphor Icons).
- **"Deploy na Vercel falha"**:
  - Certifique-se de que nenhum Build Command foi configurado e que o Output Directory é `.`.

---

## ✅ Checklist de Passagem de Bastão

```
[ ] 1. Criar novo projeto Firebase e banco Firestore
[ ] 2. Configurar regras de segurança no Firestore
[ ] 3. Preencher credenciais em js/firebase-init.js
[ ] 4. Atualizar repositório Git com seu usuário (git remote set-url origin ...)
[ ] 5. Fazer deploy na Vercel
[ ] 6. Fazer login inicial com admin / $@np@010
[ ] 7. Restaurar backup de dados (se houver) via Dashboard → Restaurar Backup Geral
[ ] 8. Cadastrar os usuários da equipe pelo painel administrativo
```
