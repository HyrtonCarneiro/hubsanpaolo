import fitz  # PyMuPDF
import pytesseract
import re
from PIL import Image
import io
import os
import shutil

# --- CONFIGURAÇÃO DE PORTABILIDADE DO TESSERACT ---
# 1. Tenta encontrar na pasta local 'tesseract/' (Versão Portátil)
# 2. Se não encontrar, tenta o caminho padrão do Windows
caminho_local_tesseract = os.path.join(os.getcwd(), 'tesseract', 'tesseract.exe')
caminho_padrao_windows = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

if os.path.exists(caminho_local_tesseract):
    pytesseract.pytesseract.tesseract_cmd = caminho_local_tesseract
    print(f"🤖 Usando Tesseract Portátil: {caminho_local_tesseract}")
else:
    pytesseract.pytesseract.tesseract_cmd = caminho_padrao_windows
    print(f"🤖 Usando Tesseract do Sistema: {caminho_padrao_windows}")

def extrair_texto(caminho_pdf):
    """Extrai texto nativo ou usa OCR se necessário."""
    texto_completo = ""
    try:
        documento = fitz.open(caminho_pdf)
        for pagina in documento:
            texto_pagina = pagina.get_text()
            if len(texto_pagina.strip()) < 50:
                lista_imagens = pagina.get_images(full=True)
                for img in lista_imagens:
                    xref = img[0]
                    base_imagem = documento.extract_image(xref)
                    imagem_pil = Image.open(io.BytesIO(base_imagem["image"]))
                    texto_pagina += pytesseract.image_to_string(imagem_pil, lang='por')
            texto_completo += texto_pagina + " "
        documento.close()
        return texto_completo.lower()
    except Exception as e:
        print(f"❌ Erro ao ler {caminho_pdf}: {e}")
        return ""

def classificar_documento(texto):
    """Retorna a categoria baseada em pontuação."""
    pontos = {"Boleto": 0, "NFse": 0, "Nota_de_Debito": 0}
    
    if "nosso número" in texto or "nosso numero" in texto: pontos["Boleto"] += 3
    if re.search(r'\d{5}\.\d{5} \d{5}\.\d{6}', texto): pontos["Boleto"] += 5
    
    if "nfs-e" in texto or "nota fiscal de serviços" in texto: pontos["NFse"] += 5
    if "issqn" in texto: pontos["NFse"] += 2

    if "nota de débito" in texto or "nota de debito" in texto: pontos["Nota_de_Debito"] += 5
    if "reembolso de despesas" in texto: pontos["Nota_de_Debito"] += 3

    tipo_vencedor = max(pontos, key=pontos.get)
    return tipo_vencedor if pontos[tipo_vencedor] >= 3 else "Nao_Classificado"

def processar_pasta():
    """Lê todos os PDFs e organiza em pastas."""
    arquivos = [f for f in os.listdir('.') if f.lower().endswith('.pdf')]
    if not arquivos:
        print("📭 Nenhum arquivo PDF encontrado na pasta.")
        return

    print(f"🚀 Iniciando processamento de {len(arquivos)} arquivos...\n")

    for arquivo in arquivos:
        print(f"🔍 Analisando: {arquivo}")
        texto = extrair_texto(arquivo)
        categoria = classificar_documento(texto)
        
        # Criar pasta da categoria se não existir
        if not os.path.exists(categoria):
            os.makedirs(categoria)
        
        # Mover arquivo
        try:
            shutil.move(arquivo, os.path.join(categoria, arquivo))
            print(f"✅ Classificado como [{categoria}] e movido.\n")
        except Exception as e:
            print(f"❌ Erro ao mover arquivo: {e}\n")

if __name__ == "__main__":
    try:
        processar_pasta()
    except Exception as e:
        print(f"💥 Erro crítico no robô: {e}")
    
    print("🏁 Processamento finalizado.")
    input("Pressione Enter para fechar...")
