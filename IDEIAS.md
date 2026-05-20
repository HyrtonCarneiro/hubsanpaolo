# Ideias e Funcionalidades para o San Paolo Hub

O objetivo final é que este sistema funcione como uma verdadeira intranet, sendo o hub central utilizado diariamente por todos os setores da empresa. Abaixo estão sugestões de funcionalidades extras para favorecer esse engajamento.

## 1. Comunicação Corporativa e Transparência
*   **Mural de Avisos Global:** Feed na página inicial com comunicados oficiais (inaugurações, avisos da diretoria).
*   **Mural por Setor:** Avisos específicos dentro de cada dashboard de setor.
*   **Newsletter Interna / Blog:** Espaço para postagens sobre cultura, processos ou destaques do mês.
*   **Integração de Mensagens:** Widgets que mostram alertas de canais importantes no Slack/Teams.

## 2. Gestão de Recursos e Operações
*   **Central de Documentos (Repositório):** Acesso rápido a Logos (Brand Kit), Manuais de Conduta, PDFs de processos e formulários padrão.
*   **Agenda de Eventos e Treinamentos:** Calendário unificado com datas de auditorias, manutenções em lojas e treinamentos de RH.
*   **Reserva de Recursos:** Sistema de reserva para salas de reunião ou equipamentos da sede.

## 3. Cultura e Engajamento (Social)
*   **Aniversariantes do Mês:** Lista dinâmica dos colaboradores que fazem aniversário no dia/mês.
*   **Sistema de "Kudos" (Reconhecimento):** Ferramenta para um setor ou colaborador enviar elogios públicos a outros.
*   **Destaque do Mês:** Espaço para celebrar a loja ou equipe com melhor performance/resultado.

## 4. Produtividade e Suporte
*   **Base de Conhecimento (FAQ):** Respostas rápidas para problemas comuns (ex: Como resetar senha, como solicitar nota fiscal).
*   **Central de Links Úteis:** Botões para sistemas externos (ERP, Folha de Pagamento, BI, Portais de Shopping).
*   **Dashboards de Metas Globais:** Gráficos de progresso geral da empresa visíveis para todos.

## 5. Gente & Gestão (RH Self-Service)
*   **Canal de Ética / Sugestões:** Formulário seguro e opcionalmente anônimo para melhorias ou denúncias.
*   **Vagas Internas:** Mural de oportunidades para recrutamento interno.

## 6. Melhorias para o Setor de TI
1. **Dashboard (Visão Geral) - Elevando o nível de Gestão**
*   **Métricas de Performance (SLA):** Adicionar um indicador de "Tempo Médio de Atendimento" (TMA). Para a TI, saber quanto tempo um chamado leva para ser resolvido é uma métrica vital de eficiência.

2. **Monitoramento de Lojas - Experiência Visual e Prática**
*   **Status de Conectividade:** Integrar (se possível via API futura) um ícone de status de rede real para saber se o servidor da loja está online/offline no momento, antes mesmo de alguém abrir um chamado.
*   **Ações em Massa:** No contêiner de lojas, permitir selecionar várias lojas para "Limpar Pendências" de uma vez (ex: após uma manutenção geral programada).


4. **Atas de Reunião - Histórico e Compartilhamento**
*   **Busca em Atas:** Como as reuniões são semanais, o volume de texto crescerá rápido. Uma barra de busca por palavras-chave dentro do conteúdo das atas facilitaria muito consultas sobre decisões tomadas há meses.
*   **Exportação para PDF:** Um botão para gerar um arquivo PDF formatado da ata selecionada, facilitando o envio por e-mail para outros setores ou para impressão.

5. **Novas Abas Sugeridas (Expansão do Escopo)**
*   **Controle de Ativos (Inventário):** Uma aba simples para listar o hardware de cada loja (modelo do PDV, specs do servidor, impressoras). Isso ajuda na hora de abrir chamados de hardware.
*   **Meta PWR (Implementação):** Como está em desenvolvimento, sugiro conectar as metas diretamente ao status das tarefas concluídas no Kanban, criando uma barra de progresso automática para os resultados do trimestre (OKRs).

6. **UX Geral e Consistência**
*   **Command Palette (Busca Global):** Implementar uma busca global (acessível por Ctrl/Cmd + K) onde o usuário digita o nome de uma loja, membro da equipe ou tópico de reunião e o sistema o leva direto para lá.


## 7. Integração com a Trílogo (Gestão de Tickets)
*   **Aba de Tickets no HUB:** Criar uma aba dedicada no HUB para visualizar, preencher checklists e vistoriar tickets diretamente, sem precisar abrir a interface da Trílogo.
    *   **Filtro por Responsável ("Hyrton") e Status "Aberto":**
        *   *Como funcionaria:* Usar o endpoint público `GET /api/ticket` filtrando por período e status `Aberto`. A API pública não aceita o responsável como parâmetro de busca direta, mas retorna o `assigneeName` em cada ticket. O HUB fará a filtragem local em memória pelo nome "Hyrton".
    *   **Preenchimento de Checklists e Ação de Vistoria:**
        *   *API Pública:* Não dispõe de endpoints para marcar itens de checklist (`checklistActions`) ou realizar a Vistoria (encerramento/aprovação do chamado).
        *   *API Privada (Simulação de Tráfego Web):* O HUB pode interceptar as chamadas internas de rede (XHR/Fetch) que a plataforma web da Trílogo (`https://sanpaolo.trilogo.app`) realiza durante o uso comum do usuário logado. Dessa forma, configurando a autenticação via cookies/tokens no HUB, é possível sincronizar automaticamente os checklists e a vistoria de forma direta.
        *   *Automação via Robô:* Outra alternativa é usar automação em segundo plano (como Puppeteer ou Selenium, de forma semelhante ao [Robo de Anexos V2.py](file:///g:/Meu%20Drive/SANPAOLO/Dev/hubsanpaolo/setores/Fiscal/Robo%20TRILOGO%20-%20ATHENAS/Robo%20de%20Anexos%20V2/Robo%20de%20Anexos%20V2.py)) para abrir a interface do usuário e clicar nos botões programaticamente.

---
*Documento atualizado em 20/05/2026 com sugestões para o setor de TI e integração com Trílogo.*
