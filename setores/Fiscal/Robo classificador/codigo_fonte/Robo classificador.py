try:
    import fitz  # PyMuPDF
    import re
    import os
    import shutil
    import sys
    import time
except ImportError as e:
    print(f"\n❌ ERRO DE BIBLIOTECA: {str(e)}")
    print("\nCertifique-se de que rodou: pip install pymupdf")
    input("\nPressione ENTER para fechar...")
    sys.exit(1)

def log_erro(mensagem):
    """Salva erros em um arquivo para diagnóstico."""
    with open("log_erros.txt", "a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {mensagem}\n")

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
        msg = f"Erro ao ler {caminho_pdf}: {str(e)}"
        print(f"❌ {msg}")
        log_erro(msg)
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

    tipo_vencedor = max(pontos, key=pontos.get)
    return tipo_vencedor if pontos[tipo_vencedor] >= 3 else "Nao_Classificado"

def processar_pasta():
    """Lê todos os PDFs da pasta atual e os organiza em subpastas com progresso."""
    arquivos = [f for f in os.listdir('.') if f.lower().endswith('.pdf')]
    total = len(arquivos)
    
    if total == 0:
        print("\n📭 Nenhum arquivo PDF encontrado nesta pasta.")
        print("Dica: Coloque os PDFs no mesmo lugar que este programa.")
        return

    print(f"\n🚀 Iniciando processamento de {total} arquivos...\n")
    print("-" * 50)

    for i, arquivo in enumerate(arquivos, 1):
        porcentagem = (i / total) * 100
        print(f"[{i}/{total}] ({porcentagem:.0f}%) Analisando: {arquivo}")
        
        texto = extrair_texto(arquivo)
        categoria = classificar_documento(texto)
        
        if not os.path.exists(categoria):
            try:
                os.makedirs(categoria)
            except Exception as e:
                log_erro(f"Erro ao criar pasta {categoria}: {str(e)}")

        try:
            shutil.move(arquivo, os.path.join(categoria, arquivo))
            print(f"   └─ ✅ Classificado como [{categoria}] e movido.\n")
        except Exception as e:
            msg = f"Erro ao mover {arquivo}: {str(e)}"
            print(f"   └─ ❌ {msg}\n")
            log_erro(msg)

if __name__ == "__main__":
    print("=" * 50)
    print("       SAN PAOLO FISCAL - ROBÔ DE CLASSIFICAÇÃO")
    print("=" * 50)
    
    try:
        processar_pasta()
    except Exception as e:
        msg = f"ERRO CRÍTICO: {str(e)}"
        print(f"\n💥 {msg}")
        log_erro(msg)
    
    print("-" * 50)
    print("🏁 Processamento finalizado.")
    input("\nPressione ENTER para fechar esta janela...")
