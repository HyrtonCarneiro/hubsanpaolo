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

## Compilação (Opcional)
Para gerar o executável:
`pyinstaller --onefile --add-data "config.ini;." "Robo de Anexos.py"`
