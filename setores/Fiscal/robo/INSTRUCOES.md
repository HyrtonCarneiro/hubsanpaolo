# Instruções para Gerar o Executável (.exe)

Para que o Robô de Classificação funcione em qualquer computador sem precisar do Python instalado, siga estes passos:

## 1. Instalação do Ambiente (Apenas uma vez)
Se você ainda não tem o Python, baixe em [python.org](https://www.python.org/downloads/) (versão 3.10 ou superior).
**IMPORTANTE:** Durante a instalação, marque a caixa **"Add Python to PATH"**.

## 2. Instalar o Tesseract OCR (Obrigatório)
O robô precisa do Tesseract para ler imagens.
- Baixe o instalador para Windows aqui: [Tesseract OCR 64-bit](https://github.com/UB-Mannheim/tesseract/wiki)
- Instale no caminho padrão: `C:\Program Files\Tesseract-OCR`

## 3. Instalar Dependências do Script
Abra o **Prompt de Comando (CMD)** ou PowerShell e execute:
```bash
pip install pymupdf pytesseract pillow pyinstaller
```

## 4. Gerar o Arquivo .exe
Navegue até a pasta onde está o arquivo `classificador.py` e rode:
```bash
pyinstaller --onefile classificador.py
```

## 5. Localizar o Executável
- Após o comando terminar, uma pasta chamada `dist` será criada.
- Dentro dela estará o arquivo `classificador.exe`.
- Você pode copiar este arquivo para qualquer máquina Windows.

## 6. Versão Portátil (Sem Instalação no Windows)
Se você quer que o robô funcione sem precisar instalar o Tesseract em cada computador:
1. Siga os passos acima para gerar o `classificador.exe`.
2. No computador onde o robô vai rodar, crie uma pasta (ex: `MeuRobo`).
3. Coloque o `classificador.exe` dentro dessa pasta.
4. Crie uma subpasta chamada `tesseract` dentro de `MeuRobo`.
5. Copie todos os arquivos da pasta original do Tesseract (`C:\Program Files\Tesseract-OCR`) para dentro dessa nova pasta `MeuRobo\tesseract`.

O robô está programado para procurar os arquivos de visão primeiro nessa pasta local antes de procurar no sistema!
