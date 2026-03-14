
Documentação oficial da API pública: https://trilogo-public-api.readme.io/

1 - Endpoint para consulta por ID:
GET https://public.api.trilogo.app/api/ticket/id
(substituir id pelo identificador do ticket)
2 e 3 - Retorno de anexos/URLs dos anexos no JSON: Atualmente, o endpoint de detalhes do ticket não retorna o anexo.
4 - Autenticação: A API pública utiliza autenticação via header.
Para gerar o token, acessar: Menu &gt; Configurações &gt; Configurações de domínios &gt; Integração &gt; Criar token.
Headers da requisição:
accept: application/json
token: api_key
Acesso sem cookies:
5 - Sim. O endpoint é público e acessível via API, utilizando apenas o token no header, sem uso de cookies ou sessão.

# Trilogo Public API Documentation Summary

This document provides a summary of the Trilogo Public API (v1.0) based on available documentation files.

## Base Information
- **Base URL:** `https://public.api.trilogo.app`
- **Authentication:** All requests require a `token` header.

---

## 1. Ticket Endpoints

### Get ticket by id
- **Endpoint:** `GET /api/ticket/{id}`
- **Description:** Obtém um ticket por id do Trílogo.
- **Path Parameters:**
    - `id` (int, required): Código do ticket.
- **Headers:**
    - `token` (string, required): Chave de acesso.

### Get tickets
- **Endpoint:** `GET /api/ticket`
- **Description:** Lista tickets com filtros de período, empresa, tags e status.
- **Query Parameters:** 
    - `startDate` (yyyy-mm-dd, required): Data inicial.
    - `endDate` (yyyy-mm-dd, required): Data final.
    - `companyId` (int): Código da empresa.
    - `tags` (string): Tags separadas por vírgula.
    - `status` (string): Status (inteiros) separados por vírgula.
    - `erpId` (string): Código do ERP do bem.
    - `serviceTypeId` (int): Código do serviço.

### Get ticket changes
- **Endpoint:** `GET /api/ticket/changes`
- **Description:** Obtém alterações nos tickets em um período.
- **Query Parameters:** `startDate` (req), `endDate` (req), `companyId`, `tags`, `status`.

### Generate Public Grid Url
- **Endpoint:** `POST /api/ticket/generate-public-grid-url`
- **Description:** Gera um link público para visualização.
- **Body Parameters:** `company`, `tags`, `status`, `creationStartDate`, `creationEndDate`.

### Get tickets amount by company
- **Endpoint:** `GET /api/ticket/ticket-amount-by-company`
- **Description:** Quantidade de tickets por empresa.
- **Query Parameters:** `startDate`, `endDate`, `companies`, `tags`, `status`.

### Edit Ticket
- **Endpoint:** `PATCH /api/ticket/asset-ticket`
- **Body Parameters:** `TicketId` (int), `AssetId` (int).

### Execute Ticket
- **Endpoint:** `POST /api/ticket/execute`
- **Description:** Executa um ticket.
- **Body Parameters:**
    - `TicketId` (int, required)
    - `Comment` (string)
    - `File` (file): Arquivos anexos.

### Add Tag
- **Endpoint:** `POST /api/ticket/add-tag`
- **Body Parameters:** `TicketId`, `TagId`.

---

## 2. Asset Endpoints

### Create Assets
- **Endpoint:** `POST /api/asset`
- **Description:** Cadastra novos bens.
- **Body Parameters:** `patrimony`, `description` (req), `assetTypeId`, `model`, `brand`, `serialNumber`, `price`, `cnpj`, `companyId`, `erpId`, `departmentId`, `purchaseDate`, etc.

### Get Assets
- **Endpoint:** `GET /api/asset`
- **Description:** Lista bens.
- **Query Parameters:** `patrimony`, `companiesIds`, `assetTypeIds`, `status` (1-Ativo, 2-Aguardando, 4-Desativado), `ERPId`.

### Transfer Assets
- **Endpoint:** `PUT /api/asset/transferasset`
- **Body Parameters:** `assetId`, `patrimony`, `departmentId`, `departmentAddress`, `companyId`, `companyName`, `CNPJ`.

### Edit Assets
- **Endpoint:** `PUT /api/asset/editAsset`
- **Body Parameters:** `assetId`, `patrimony`, `description`, `brand`, `model`, `serialNumber`, `invoiceNumber`, `erpId`, `price`, `warrantyDate`, `assetTypeId`, `outdatedERP`.

### Disable Assets
- **Endpoint:** `POST /api/asset/disable`
- **Body Parameters:** `id`, `erpId`, `patrimony`.

### Get Select Assets
- **Endpoint:** `GET /api/asset/select-assets`
- **Query Parameters:** `patrimonyNumber`, `Limit`, `Offset`.

---

## 3. Configuration & Selection Endpoints

### Company
- **GET /api/company/get-select-companies**: Lista de empresas para seleção.
- **Query Params:** `term`, `offset`, `limit`.

### User Group
- **GET /api/user-group/get-select-user-groups**: Lista de grupos de usuários.
- **Query Params:** `term`, `offset`, `limit`, `companiesIds` (req).

### Access Profile
- **GET /api/access-profile/get-select-access-profiles**: Perfis de acesso.
- **Query Params:** `term`, `offset`, `limit`.

### User
- **GET /api/user/performance**: Performance de usuários.
- **Query Params:** `startDate`, `endDate`.
