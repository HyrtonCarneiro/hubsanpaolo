# Instruções para o Robô de Classificação

O robô foi simplificado para funcionar sem nenhuma instalação externa. Ele processa PDFs nativos (documentos digitais onde o texto é selecionável).

## 1. Como Usar
1. Baixe o arquivo `Classificador.rar` no Hub San Paolo.
2. Extraia o conteúdo completo para uma pasta. **Atenção:** O arquivo `classificador.exe` precisa estar na mesma pasta que a pasta `_internal` para funcionar.
3. Coloque todos os PDFs que deseja classificar **na mesma pasta** do executável.
4. Dê dois cliques no `classificador.exe`.

## 2. Para Gerar o Pacote (TI / Admin)
Se precisar gerar o pacote novamente, use o modo `--onedir` do PyInstaller:

```powershell
# 1. Entre na pasta do robô
cd /d "G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\robo"

# 2. Gere o pacote (EXE + Pasta _internal)
python -m PyInstaller --onedir classificador.py
```
Ao terminar, compacte o conteúdo da pasta `dist/classificador` (o `.exe` e a pasta `_internal`) em um arquivo chamado `Classificador.rar` e coloque na pasta `robo` do site.

## 2. O que ele fará?
- O robô lerá cada PDF.
- Criará as pastas `Boleto`, `NFse` e `Nota_de_Debito` automaticamente.
- Moverá cada arquivo para sua respectiva pasta.

## 3. Requisitos
- Apenas Windows.
- **Não** precisa de Python.
- **Não** precisa de Tesseract OCR.
- Funciona apenas com PDFs digitais (não funciona com fotos/scans sem texto nativo).

---
**Nota para Desenvolvedores:** Se desejar rodar o código-fonte (`.py`), você precisará do Python 3.10+ e da biblioteca `pymupdf` (`pip install pymupdf`).
