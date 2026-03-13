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

---
**Nota:** Ao rodar o `.exe`, certifique-se de que o Tesseract esteja instalado naquela máquina no caminho mencionado no passo 2.
