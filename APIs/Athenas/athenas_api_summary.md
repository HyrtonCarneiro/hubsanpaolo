# Athenas Online API Documentation Summary

This document provides a summary of the Athenas Online API (v2.0) based on the Swagger definition.

## Base Information
- **Base URLs:**
  - `http://localhost/apix/v2`
  - `https://api.athenas.online/v2`
  - `https://apix.hmg.athenas.online/v2`
- **Authentication:** Most requests require a `bearerAuth` (JWT Token) in the `Authorization` header.

---

## 1. Almoxarifados

### Obtém Listagem de Almoxarifados
- **Endpoint:** `GET /estoque/almoxarifado/lista-almoxarifados`
- **Path Parameters:**
    - `term` (string, required): 

### Obtém Listagem Completa de Almoxarifados
- **Endpoint:** `GET /estoque/almoxarifado/lista-todos-almoxarifados`
- **Path Parameters:**
    - `term` (string, required): 

### Obtém Listagem de Almoxarifados do Usuário logado
- **Endpoint:** `GET /estoque/almoxarifado/lista-almoxarifados-by-codigousuario`
- **Path Parameters:**
    - `term` (string, required): 

---

## 2. Usuários

### Informações do usuário logado
- **Endpoint:** `GET /usuarios/me`

### Endpoint para inicializar o processo de recuperação de senha, onde é enviado um e-mail para o usuário
- **Endpoint:** `POST /usuarios/lembrar-senha`
- **Body:** JSON content required.

### Verifica se o token corresponde ao usuário
- **Endpoint:** `GET /usuarios/verifica-token/{token}`
- **Path Parameters:**
    - `token` (string, required): 

### Troca de senha com token de parametro
- **Endpoint:** `POST /usuarios/trocar-senha/{token}`
- **Path Parameters:**
    - `token` (string, required): 
- **Body:** JSON content required.

### Troca de senha com senha atual
- **Endpoint:** `POST /usuarios/trocar-senha`
- **Body:** JSON content required.

### Editar usuário
- **Endpoint:** `PUT /usuarios/edit/{codigo}`
- **Body:** JSON content required.

### Criar novo usuário
- **Endpoint:** `POST /usuarios/criar`
- **Body:** JSON content required.

### Busca o usuario pelo codigo
- **Endpoint:** `GET /usuarios/{codigo}`
- **Path Parameters:**
    - `codigo` (string, required): 

### Busca lista de Documentos Permitidos e Lista Total de Documentos
- **Endpoint:** `GET /usuarios/lista-documentos-doccenter/{codigo}`
- **Path Parameters:**
    - `codigo` (string, required): 

### Lista usuários ativos
- **Endpoint:** `GET /usuarios/lista`

### Lista grupos de usuários
- **Endpoint:** `GET /usuarios/grupos`

### Lista menus do sistema
- **Endpoint:** `GET /usuarios/menus`

### Informações de autorização do usuário logado
- **Endpoint:** `GET /usuarios/info-autorizacao`

### Obter permissões do usuário logado
- **Endpoint:** `GET cadastros/usuarios/getPermissao`

---

## 3. WS

### Endpoint único para autenticação de usuários e funcionários
- **Endpoint:** `POST /usuarios/auth`
- **Body:** JSON content required.

### Cadastrar Empresa, Filial e Pessoa vinculada
- **Endpoint:** `POST /ws/empresas`
- **Body:** JSON content required.

### Endpoint que retorna a última conta contábil
- **Endpoint:** `GET /contabil/ultima-conta?codigoempresa={empresa}&contaSintetica={contaSintetica}`
- **Path Parameters:**
    - `codigoEmpresa` (string, required): 
    - `contaSintetica` (string): 

### Endpoint para inserir uma conta contábil
- **Endpoint:** `POST /contabil/inserir-conta`
- **Body:** JSON content required.

### Endpoint para inserir uma lançamento contábil
- **Endpoint:** `POST /contabil/inserir-lancamento`
- **Body:** JSON content required.

### Endpoint para inserir uma lançamento contábil
- **Endpoint:** `POST /contabil/inserir-lancamento-detalhe`
- **Body:** JSON content required.

### Inserir lançamento contábil completo com lote
- **Endpoint:** `POST /contabil/completo-com-lote`
- **Body:** JSON content required.

### Apagar lote contabil
- **Endpoint:** `DELETE /contabil/apagar-lote`
- **Body:** JSON content required.

### Cancelar nota fiscal
- **Endpoint:** `POST /ws/nota-fiscal/cancelar`
- **Body:** JSON content required.

### Insere um novo lançamento bancário
- **Endpoint:** `POST /ws/bancario`
- **Body:** JSON content required.

### Insere um novo detalhe de lançamento bancário
- **Endpoint:** `POST /ws/bancario/detalhe`
- **Body:** JSON content required.

### Obtém um lançamento bancário e seus detalhes
- **Endpoint:** `GET /ws/bancario/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do lançamento bancário

### Obtém um conhecimento de transporte
- **Endpoint:** `GET /ws/conhecimento-transporte/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do conhecimento de transporte

### Altera a chave de acesso de um conhecimento de transporte
- **Endpoint:** `PUT /ws/conhecimento-transporte/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do conhecimento de transporte a ser atualizado
- **Body:** JSON content required.

### Insere um novo conhecimento de transporte
- **Endpoint:** `POST /ws/conhecimento-transporte`
- **Body:** JSON content required.

### Insere um novo detalhe de conhecimento de transporte
- **Endpoint:** `POST /ws/conhecimento-transporte-detalhe`
- **Body:** JSON content required.

### Obter lista de DCTF
- **Endpoint:** `GET /ws/dctf`
- **Query Parameters:**
    - `codigoempresa` (integer): Código da empresa
    - `codigofilial` (integer): Código da filial
    - `competencia` (string, required): Competência no formato MM/YYYY

### Insere entrada ou saída
- **Endpoint:** `POST /ws/entrada-saida`
- **Body:** JSON content required.

### Consulta uma entrada/saída pelo IDMASTER
- **Endpoint:** `GET /ws/entrada-saida/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER da entrada/saída

### Alterar entrada/saída completa (com produtos, registro fiscal e detalhes)
- **Endpoint:** `PUT /ws/entrada-saida-completo`
- **Body:** JSON content required.

### Inserir entrada/saída completa (com produtos, registro fiscal e detalhes)
- **Endpoint:** `POST /ws/entrada-saida-completo`
- **Body:** JSON content required.

### Obter dados financeiros
- **Endpoint:** `GET /ws/financeiro/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador único do registro financeiro

### Inserir novo registro financeiro
- **Endpoint:** `POST /ws/financeiro`
- **Body:** JSON content required.

### Obter movimentação de produto específica
- **Endpoint:** `GET /ws/movimentacao-produtos/{idmaster}/{id}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador único do registro de entrada/saída
    - `id` (integer, required): Identificador sequencial do item de movimentação

### Inserir movimentação de produto
- **Endpoint:** `POST /ws/movimentacao-produtos`
- **Body:** JSON content required.

### Obter detalhes de uma parcela financeira
- **Endpoint:** `GET /ws/financeiro/parcela/{idmaster}/{parcela}/{subparcela}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador do registro financeiro
    - `parcela` (integer, required): Código da parcela
    - `subparcela` (integer, required): Código da subparcela

### Editar parcela financeira
- **Endpoint:** `PUT /ws/financeiro/parcela/{idmaster}/{parcela}/{subparcela}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador mestre da parcela
    - `parcela` (integer, required): Número da parcela
    - `subparcela` (integer, required): Número da subparcela
- **Body:** JSON content required.

### Excluir uma parcela financeira
- **Endpoint:** `DELETE /ws/financeiro/parcela/{idmaster}/{parcela}/{subparcela}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador do registro financeiro
    - `parcela` (integer, required): Código da parcela
    - `subparcela` (integer, required): Código da subparcela

### Liquidar uma ou mais parcelas
- **Endpoint:** `PUT /ws/financeiro/parcelas/liquidar`
- **Body:** JSON content required.

### Estornar uma ou mais parcelas
- **Endpoint:** `PUT /ws/financeiro/parcelas/estornar`
- **Body:** JSON content required.

### Obter custos de uma parcela financeira
- **Endpoint:** `GET /ws/financeiro/parcelas/custos`
- **Query Parameters:**
    - `idmaster` (string, required): Identificador do registro financeiro
    - `parcela` (integer, required): Código da parcela
    - `subparcela` (integer, required): Código da subparcela
    - `id` (integer, required): Identificador do custo

### Atualizar uma parcela de custos existente
- **Endpoint:** `PUT /ws/financeiro/parcelas/custos`
- **Body:** JSON content required.

### Inserir uma nova parcela de custos
- **Endpoint:** `POST /ws/financeiro/parcelas/custos`
- **Body:** JSON content required.

### Excluir uma parcela de custos existente
- **Endpoint:** `DELETE /ws/financeiro/parcelas/custos`
- **Body:** JSON content required.

### Inserir uma nova parcela financeira
- **Endpoint:** `POST /ws/financeiro/parcela`
- **Body:** JSON content required.

### Alterar situacao de uma ou mais parcelas
- **Endpoint:** `PUT /ws/financeiro/parcelas/situacao`
- **Body:** JSON content required.

### Obtém um pedido de venda pelo IDMASTER
- **Endpoint:** `GET /ws/pedido-venda/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do pedido de venda

### Exclui um pedido de venda
- **Endpoint:** `DELETE /ws/pedido-venda/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do pedido de venda a ser excluído

### Finaliza um pedido de venda
- **Endpoint:** `PUT /ws/pedido-venda/finalizar/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do pedido de venda a ser finalizado

### Insere um novo pedido de venda
- **Endpoint:** `POST /ws/pedido-venda`
- **Body:** JSON content required.

### Insere um novo item de pedido de venda (detalhe)
- **Endpoint:** `POST /ws/pedido-venda/detalhe`
- **Body:** JSON content required.

### Obtém os níveis de autorização de um pedido de venda
- **Endpoint:** `GET /ws/niveis-pedido-venda/{idmaster}/{valor}`
- **Path Parameters:**
    - `idmaster` (string, required): IDMASTER do pedido de venda
    - `valor` (number, required): Valor total do pedido de venda

### Consulta limite de crédito hierárquico de um cliente
- **Endpoint:** `GET /ws/limite-credito/cliente/{codigoPessoa}`
- **Path Parameters:**
    - `codigoPessoa` (integer, required): 

### Obter detalhes da Pessoa
- **Endpoint:** `GET /ws/pessoa/{id}`
- **Path Parameters:**
    - `codigo` (any, required): Identificador único da pessoa

### Editar uma Pessoa
- **Endpoint:** `PUT /ws/pessoa/{id}`
- **Path Parameters:**
    - `id` (integer, required): Código da pessoa a ser editada
- **Body:** JSON content required.

### Obter lista de Pessoa
- **Endpoint:** `GET /ws/pessoas`
- **Query Parameters:**
    - `codigo` (integer): Código único da pessoa
    - `codigoauxiliar` (integer): Código Auxiliar da pessoa
    - `cnpjcpf` (string): CNPJ ou CPF da pessoa
    - `tipo` (string): Tipo da pessoa
    - `grupo` (string): Grupo da pessoa
    - `tipoJuridico` (string): Tipo jurídico da pessoa
    - `codigoEmpresa` (integer): Código da empresa associada
    - `codigoFilial` (integer): Código da filial associada
    - `classe` (string): Classe da pessoa
    - `nome` (string): Nome da pessoa (Contendo)
    - `dtreg` (string): Data de registro igual a (formato: YYYY-MM-DD)
    - `dtregmaiorque` (string): Data de registro maior que (formato: YYYY-MM-DD)

### Cadastrar uma nova Pessoa
- **Endpoint:** `POST /ws/pessoa`
- **Body:** JSON content required.

### Endpoint para Pegar as situacoes do funcionario
- **Endpoint:** `GET /ws/situacoes`

### Cadastrar um novo Produto
- **Endpoint:** `POST /ws/produtos`
- **Body:** JSON content required.

### Obter registro fiscal
- **Endpoint:** `GET /ws/registro-fiscal/{idmaster}`
- **Path Parameters:**
    - `idmaster` (string, required): Identificador único do registro fiscal

### Inserir registro fiscal
- **Endpoint:** `POST /ws/registro-fiscal`
- **Body:** JSON content required.

### Inserir detalhe do registro fiscal
- **Endpoint:** `POST /ws/registro-fiscal-detalhe`
- **Body:** JSON content required.

---

## 4. Certificados

### Listar certificados
- **Endpoint:** `GET /cadastros/certificados`
- **Query Parameters:**
    - `cnpj` (string): Filtrar certificados por CNPJ (Opcional)

### Criar certificado
- **Endpoint:** `POST /cadastros/certificados`
- **Body:** JSON content required.

### Buscar certificado por codigo
- **Endpoint:** `GET /cadastros/certificados/{codigo}`
- **Path Parameters:**
    - `codigo` (integer, required): Certificado codigo

### Atualizar certificado
- **Endpoint:** `POST /cadastros/certificados/{codigo}`
- **Path Parameters:**
    - `codigo` (integer, required): Certificado codigo
- **Body:** JSON content required.

### Deletar certificado por codigo
- **Endpoint:** `DELETE /cadastros/certificados/{codigo}`
- **Path Parameters:**
    - `codigo` (integer, required): Certificado codigo

---

## 5. DocumentCenter

### Lista arquivos do Document Center
- **Endpoint:** `GET /DocumentCenter/files`
- **Query Parameters:**
    - `dataenvioinicio` (string): Data inicial de envio (formato: YYYY-MM-DD)
    - `dataenviofim` (string): Data final de envio (formato: YYYY-MM-DD)
    - `cnpj` (string): CNPJ da filial
    - `codigoarquivo` (integer): Código do arquivo
    - `codigodocumento` (integer): Código do documento
    - `protocolo` (string): Protocolo do documento

### Obtém informações de um arquivo específico
- **Endpoint:** `GET /DocumentCenter/files/{codigoArquivo}`
- **Path Parameters:**
    - `codigoArquivo` (integer, required): Código do arquivo

### Sem descrição
- **Endpoint:** `POST /DocumentCenter/add`
- **Body:** JSON content required.

---

## 6. Download de Arquivos Fiscais

### Lista de agendamentos de download de arquivos fiscais
- **Endpoint:** `GET /fiscal/download-arquivos-fiscais`

### Adiciona agendamentos de download de arquivos fiscais
- **Endpoint:** `POST /fiscal/download-arquivos-fiscais`
- **Body:** JSON content required.

### Atualiza agendamento de download de arquivos fiscais
- **Endpoint:** `PUT /fiscal/download-arquivos-fiscais/{codigo}`
- **Path Parameters:**
    - `codigo` (string, required): Código do agendamento
- **Body:** JSON content required.

### Apagar agendamento de download de arquivos fiscais
- **Endpoint:** `DELETE /fiscal/download-arquivos-fiscais/{codigo}`
- **Path Parameters:**
    - `codigo` (string, required): Código do agendamento

---

## 7. Empresas

### Lista todas as empresas e filiais
- **Endpoint:** `GET /ws/empresas-filiais/get-all`
- **Query Parameters:**
    - `order` (integer): Critério de ordenação: 0 = pelo Nome, 1 = pelo Código Empresa/Filial (padrão)

---

## 8. Fiscal

### Adiciona um novo registro xmls NFCe, CFe, CTeOS, CTe, MDFe, NFSe (Padrão nacional), NFCom e BPe
- **Endpoint:** `POST /fiscal/dfe/add`
- **Body:** JSON content required.

### Lista documentos fiscais eletrônicos
- **Endpoint:** `GET /fiscal/dfe`
- **Query Parameters:**
    - `page` (integer): Número da página (padrão: 1)
    - `limit` (integer): Quantidade de registros por página (padrão: 50)
    - `codigoEmpresa` (integer): Código da empresa para filtrar (respeita permissões do usuário)
    - `tipoDocumento` (string): Tipo de documento fiscal (3 caracteres, case-insensitive)
    - `dataInicio` (string): Data inicial de registro (formato: YYYY-MM-DD). Padrão: hoje - 30 dias
    - `dataFim` (string): Data final de registro (formato: YYYY-MM-DD). Padrão: hoje

### Adiciona entrada/saída de produtos
- **Endpoint:** `POST /v2/fiscal/registro/add-entrada-saida-produtos`
- **Body:** JSON content required.

### Atualiza nota fiscal telecom não transmitida
- **Endpoint:** `PUT /v2/fiscal/registro/atualizar-nota-telecom`
- **Body:** JSON content required.

---

## 9. Folha

### Endpoint para listar folhas pelo cpf
- **Endpoint:** `GET /folha/all-by-cpf?cpf={cpf}`
- **Path Parameters:**
    - `cpf` (string, required): 

### Endpoint para listar folhas
- **Endpoint:** `POST /folha/list`
- **Body:** JSON content required.

### Retorna o contracheque
- **Endpoint:** `GET /folha/contracheque/{idmaster}/{cpf}/{mes}/{ano}`
- **Path Parameters:**
    - `idmaster` (string, required): ID master da empresa
    - `cpf` (string, required): CPF do funcionário (somente números)
    - `mes` (string, required): Mês de referência (01-12)
    - `ano` (integer, required): Ano de referência

### Retorna a listagem com o(s) link(s) do informe de rendimento
- **Endpoint:** `GET /folha/informe-rendimento/list/{cpf}`
- **Path Parameters:**
    - `cpf` (string, required): 
- **Query Parameters:**
    - `ano` (integer): 
    - `codigoempresa` (integer): 
    - `codigofilial` (integer): 

### Retorna o recibo de férias
- **Endpoint:** `GET /folha/recibo-ferias?idmaster={idmaster}&cpf={cpf}`
- **Path Parameters:**
    - `idmaster` (string, required): 
    - `cpf` (string, required): 

### Retorna uma lista de recibos de férias
- **Endpoint:** `GET /folha/list-recibo-ferias`
- **Path Parameters:**
    - `cpf` (string, required): 

### Endpoint para salvar a assinatura do contracheque e recibo de férias
- **Endpoint:** `POST /folha/assinatura`
- **Body:** JSON content required.

### Endpoint para listar todas as assinaturas
- **Endpoint:** `GET /folha/list-assinatura?cpf={cpf}&datainicio={dd/mm/yyyy}&datafim={dd/mm/yyyy}`
- **Path Parameters:**
    - `cpf` (string): 
    - `datainicio` (string): 
    - `datafim` (string): 

### Endpoint para contracheques em base64 pelo cpf
- **Endpoint:** `GET /folha/contracheques-lote`
- **Path Parameters:**
    - `cpf` (string): 

### Retorna as informações de férias do funcionário
- **Endpoint:** `GET /solicitacao-ferias/get?codigo={codigo}&cpf={cpf}`
- **Path Parameters:**
    - `codigo` (string, required): 
    - `matricula` (string): 
    - `cpf` (string, required): 

---

## 10. Pessoas

### Busca a pessoa pelo codigo
- **Endpoint:** `GET /pessoas/{codigo}`
- **Path Parameters:**
    - `codigo` (string, required): 

### Busca a pessoa pelo CNPJ/CPF
- **Endpoint:** `GET /pessoas/{cnpjcpf}/cnpjcpf`
- **Path Parameters:**
    - `cnpjcpf` (string, required): 

### Cadastrar admissão de colaborador
- **Endpoint:** `POST /pessoas/admissao`
- **Body:** JSON content required.

### Cria um dependente para um funcionário
- **Endpoint:** `POST /pessoas/dependentes/create-dependentes/{codigoFuncionario}`
- **Path Parameters:**
    - `codigoFuncionario` (integer, required): Código do funcionário ao qual o dependente será vinculado
- **Body:** JSON content required.

---

## 11. Ponto digital

### Adicionar o ponto eletrônico
- **Endpoint:** `POST /ponto/add`
- **Body:** JSON content required.

### Sem descrição
- **Endpoint:** `POST /ponto/select-folha-ponto`
- **Body:** JSON content required.

### Endpoint para inserir Banco de Horas
- **Endpoint:** `POST /ponto/bancoHoras`
- **Body:** JSON content required.

### Adicionar o ponto eletrônico sequenciado com leituras no app da face do funcionário
- **Endpoint:** `POST /ponto/addsequence`
- **Body:** JSON content required.

---
