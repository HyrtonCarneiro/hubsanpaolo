# Robo de Anexos - San Paolo Fiscal

Este robô automatiza o download de anexos de tickets da plataforma Trílogo.

## Como usar

1.  Certifique-se de que o arquivo `config.ini` contenha seu token da API Trílogo.
2.  Execute o arquivo `Robo de Anexos.exe` (ou o script `.py`).
3.  Insira o número do Ticket quando solicitado.
4.  Os arquivos serão baixados na mesma pasta onde o robô está localizado.

## Desenvolvimento

Para rodar a partir do código fonte:
1. Instale as dependências: `pip install -r requirements.txt`
2. Execute: `python "Robo de Anexos.py"`

## Dicas de Suporte
- Se o robô não encontrar anexos em um ticket que você sabe que tem (ex: 820829), ele gerará um arquivo chamado `debug_full_response.json`. 
- Esse arquivo serve para o desenvolvedor verificar se a Trílogo mudou o nome dos campos de anexos.

## Publicação
Para instruções detalhadas de como compilar e subir para o site, veja o arquivo:
[INSTRUCOES_PUBLICACAO.md](INSTRUCOES_PUBLICACAO.md)
