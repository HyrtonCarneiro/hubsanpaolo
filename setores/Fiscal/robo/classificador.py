import fitz  # PyMuPDF
import re
import os
import shutil

def extrair_texto(caminho_pdf):
    """Extrai texto nativo de todas as páginas do PDF."""
    texto_completo = ""
    try:
        documento = fitz.open(caminho_pdf)
        for pagina in documento:
            texto_completo += pagina.get_text() + " "
        documento.close()
        return texto_completo.lower()
    except Exception as e:
        print(f"❌ Erro ao ler {caminho_pdf}: {e}")
        return ""

def classificar_documento(texto):
    """Retorna a categoria baseada em pontuação de palavras-chave."""
    pontos = {"Boleto": 0, "NFse": 0, "Nota_de_Debito": 0}
    
    # Regras para Boleto
    if "nosso número" in texto or "nosso numero" in texto: pontos["Boleto"] += 3
    if re.search(r'\d{5}\.\d{5} \d{5}\.\d{6}', texto): pontos["Boleto"] += 5
    
    # Regras para NFse
    if "nfs-e" in texto or "nota fiscal de serviços" in texto: pontos["NFse"] += 5
    if "issqn" in texto: pontos["NFse"] += 2

    # Regras para Nota de Débito
    if "nota de débito" in texto or "nota de debito" in texto: pontos["Nota_de_Debito"] += 5
    if "reembolso de despesas" in texto: pontos["Nota_de_Debito"] += 3

    # Define o vencedor (mínimo de 3 pontos para classificar)
    tipo_vencedor = max(pontos, key=pontos.get)
    return tipo_vencedor if pontos[tipo_vencedor] >= 3 else "Nao_Classificado"

def processar_pasta():
    """Lê todos os PDFs da pasta atual e os organiza em subpastas."""
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
        
        # Mover arquivo para a pasta correspondente
        try:
            shutil.move(arquivo, os.path.join(categoria, arquivo))
            print(f"✅ Classificado como [{categoria}] e movido.\n")
        except Exception as e:
            print(f"❌ Erro ao mover arquivo: {e}\n")

if __name__ == "__main__":
    print("--- San Paolo Fiscal: Robô de Classificação ---")
    try:
        processar_pasta()
    except Exception as e:
        print(f"💥 Erro crítico no robô: {e}")
    
    print("🏁 Processamento finalizado.")
    input("Pressione Enter para fechar...")
