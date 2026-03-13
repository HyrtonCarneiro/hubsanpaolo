# Instruções para o Robô de Classificação

O robô foi simplificado para funcionar sem nenhuma instalação externa. Ele processa PDFs nativos (documentos digitais onde o texto é selecionável).

## 1. Como Usar
1. Baixe o arquivo `classificador.exe` no Hub San Paolo.
2. Coloque todos os PDFs que deseja classificar **na mesma pasta** do arquivo baixado.
3. Dê dois cliques no `classificador.exe`.

## 2. Para Gerar o EXE (TI / Admin)
Se o arquivo `.exe` ainda não estiver disponível para download, execute estes comandos no terminal do Windows (na pasta do robô):

```powershell
# Vá para a pasta correta (forçando mudança de disco se necessário)
cd /d "G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\robo"

# 1. Instalar as ferramentas (Tente um destes 3 comandos se o primeiro falhar)
pip install pymupdf pyinstaller
python -m pip install pymupdf pyinstaller
py -m pip install pymupdf pyinstaller

# 2. Gerar o executável (Tente 'pyinstaller' ou 'python -m PyInstaller')
pyinstaller --onefile classificador.py
python -m PyInstaller --onefile classificador.py
```
O arquivo será criado dentro de uma nova pasta chamada `dist`. Mova o `classificador.exe` para a pasta principal do robô.

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
