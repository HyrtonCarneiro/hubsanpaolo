import fitz  # PyMuPDF: para ler o PDF
import pytesseract # Tesseract: para o OCR (ler imagens)
import re
from PIL import Image
import io
import os

# ⚠️ ATENÇÃO: Aponte para onde o Tesseract foi instalado no seu Windows!
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extrair_texto(caminho_pdf):
    """Extrai texto nativo. Se estiver vazio, usa OCR nas imagens."""
    texto_completo = ""
    try:
        documento = fitz.open(caminho_pdf)
        
        for pagina in documento:
            # 1. Tenta extrair o texto nativo primeiro
            texto_pagina = pagina.get_text()
            
            # 2. Se a página tiver menos de 50 caracteres, assume que é uma imagem escaneada
            if len(texto_pagina.strip()) < 50:
                print(f"Lendo imagem via OCR no arquivo: {caminho_pdf}")
                lista_imagens = pagina.get_images(full=True)
                for img_index, img in enumerate(lista_imagens):
                    xref = img[0]
                    base_imagem = documento.extract_image(xref)
                    bytes_imagem = base_imagem["image"]
                    
                    # Converte a imagem e passa no OCR
                    imagem_pil = Image.open(io.BytesIO(bytes_imagem))
                    texto_ocr = pytesseract.image_to_string(imagem_pil, lang='por') # lang='por' para Português
                    texto_pagina += texto_ocr
                    
            texto_completo += texto_pagina + " "
            
        return texto_completo.lower() # Converte tudo para minúsculo para facilitar a busca
    except Exception as e:
        print(f"Erro ao ler o arquivo {caminho_pdf}: {e}")
        return ""

def classificar_documento(texto):
    """Aplica o sistema de pontuação (Scoring) para descobrir o tipo da nota."""
    pontos = {
        "Boleto": 0,
        "NFS-e": 0,
        "Nota_de_Debito": 0
    }
    
    # --- REGRAS PARA BOLETO ---
    if "nosso número" in texto or "nosso numero" in texto: pontos["Boleto"] += 3
    if "código do beneficiário" in texto or "agência/código" in texto: pontos["Boleto"] += 2
    if "vencimento" in texto: pontos["Boleto"] += 1
    # Regex para linha digitável (ex: 34191.09008 63571.277308...)
    if re.search(r'\d{5}\.\d{5} \d{5}\.\d{6}', texto): pontos["Boleto"] += 5
    
    # --- REGRAS PARA NFS-E ---
    if "nfs-e" in texto or "nota fiscal de serviços" in texto: pontos["NFS-e"] += 5
    if "código de verificação" in texto: pontos["NFS-e"] += 2
    if "prefeitura municipal" in texto: pontos["NFS-e"] += 2
    if "issqn" in texto: pontos["NFS-e"] += 2

    # --- REGRAS PARA NOTA DE DÉBITO ---
    if "nota de débito" in texto or "nota de debito" in texto: pontos["Nota_de_Debito"] += 5
    if "demonstrativo de débito" in texto: pontos["Nota_de_Debito"] += 4
    if "reembolso de despesas" in texto: pontos["Nota_de_Debito"] += 3

    # Identifica quem fez mais pontos
    tipo_vencedor = max(pontos, key=pontos.get)
    pontuacao_maxima = pontos[tipo_vencedor]
    
    # Se a pontuação for muito baixa, não foi possível identificar com certeza
    if pontuacao_maxima < 3:
        return "Desconhecido"
        
    return tipo_vencedor

# --- TESTANDO O CÓDIGO ---
if __name__ == "__main__":
    caminho_teste = "sua_nota_teste.pdf" # Coloque um PDF na mesma pasta para testar
    if os.path.exists(caminho_teste):
        texto_extraido = extrair_texto(caminho_teste)
        resultado = classificar_documento(texto_extraido)
        print(f"\n✅ Resultado: O documento é um(a) {resultado}!")
        input("\nPressione Enter para sair...")
    else:
        print("Arquivo de teste não encontrado. Coloque um PDF válido no código para testar.")
        input("\nPressione Enter para sair...")
