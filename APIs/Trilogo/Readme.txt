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