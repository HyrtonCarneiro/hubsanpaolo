# Instruções para o Robô de Classificação

O robô foi simplificado para funcionar sem nenhuma instalação externa. Ele processa PDFs nativos (documentos digitais onde o texto é selecionável).

## 1. Como Usar
1. Baixe o arquivo `RoboClassificador.zip` no Hub San Paolo.
2. Extraia o conteúdo para uma pasta no seu computador.
3. Coloque todos os PDFs que deseja classificar **na mesma pasta** do arquivo `classificador.exe`.
4. Dê dois cliques no `classificador.exe`.

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
