# 🤖 Tutorial Completo: Como Publicar e Rodar o Robô de Anexos

Este guia explica como transformar o código fonte em um executável e disponibilizá-lo para os usuários no site da San Paolo.

---

## 🛠️ PARTE 1: Gerando o Executável (.exe)

O robô é escrito em Python, mas para o usuário final, precisamos de um arquivo `.exe`.

1. **Abra o CMD (Terminal)** no Windows.
2. **Instale as ferramentas necessárias** (só precisa fazer uma vez):
   ```cmd
   pip install requests configparser pyinstaller
   ```
3. **Navegue até a pasta do código**:
   ```cmd
   cd "G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\Robo de Anexos\codigo_fonte"
   ```
4. **Gere o executável**:
   ```cmd
   python -m PyInstaller --onefile --add-data "config.ini;." "Robo de Anexos.py"
   ```
   > **O que isso faz?** Cria um único arquivo `.exe` na pasta `dist`, incluindo a lógica de busca recursiva que corrigimos.

---

## 📦 PARTE 2: Preparando o Pacote (.rar)

Para o site funcionar, o usuário precisa baixar um arquivo compactado contendo o executável e o arquivo de configuração.

1. Vá até a pasta `dist` que foi criada.
2. Copie o arquivo `Robo de Anexos.exe`.
3. Crie uma nova pasta temporária chamada `Robo de Anexos_Download`.
4. Cole o `.exe` dentro dela.
5. Copie o arquivo `config.ini` (que está na pasta `codigo_fonte`) para dentro desta mesma pasta `Robo de Anexos_Download`.
6. **Compacte a pasta** `Robo de Anexos_Download` usando o WinRAR ou 7-Zip.
7. O nome do arquivo final **DEVE SER**: `Robo de Anexos.rar`.

---

## 🚀 PARTE 3: Subindo para o Site

Agora que você tem o `Robo de Anexos.rar`, basta colocá-lo no lugar certo:

1. Mova o arquivo `Robo de Anexos.rar` para:
   `G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\Robo de Anexos\`
2. **Substitua o arquivo existente**, se houver.

> ✅ O site já está configurado para procurar o arquivo exatamente neste caminho. Assim que você colar o arquivo lá, o botão de download na aba "Robo de Anexos" começará a baixar a nova versão.

---

## 📖 PARTE 4: Como o Usuário deve usar

Quando o usuário baixar e extrair o robô:

1. Ele deve abrir o arquivo `config.ini` com o Bloco de Notas.
2. Colar o **Token da Trílogo** na linha `token = ...`.
3. Salvar o arquivo.
4. Dar um clique duplo no `Robo de Anexos.exe`.
5. Digitar o número do ticket (ex: `820829`) e apertar ENTER.

---

### ⚠️ Dica para o Erro do Ticket 820829
Como descobrimos que a Trílogo não envia esses 21 anexos via API, o robô agora gera um arquivo chamado **`debug_full_response.json`** se não encontrar nada. Se o usuário reclamar de anexos sumidos, peça para ele te enviar esse arquivo para verificarmos se a Trílogo mudou o nome dos campos!
