import os
import sys
import time
import configparser
import traceback

try:
    import requests
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
except ImportError as e:
    print(f"\nERRO DE BIBLIOTECA: {str(e)}")
    print("Certifique-se de instalar as dependencias:")
    print("pip install requests selenium")
    input("\nPressione ENTER para fechar...")
    sys.exit(1)

def log_message(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}")

def download_file(url, folder):
    try:
        # Extrai o nome do arquivo da URL e remove os parametros de autenticacao do S3
        local_filename = url.split('/')[-1].split('?')[0]
        path = os.path.join(folder, local_filename)
        
        # Como os links do S3 no HTML ja vem pre-assinados (com token na URL), requests consegue baixar direto
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return local_filename
    except Exception as e:
        return f"Erro: {str(e)}"

def run_robo():
    print("=" * 50)
    print("      SAN PAOLO FISCAL - ROBÔ DE ANEXOS WEB")
    print("=" * 50)

    config = configparser.ConfigParser()
    config_path = 'config.ini'
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), 'config.ini')

    if not os.path.exists(config_path):
        log_message(f"AVISO: Arquivo {config_path} nao encontrado. Usando configuracoes padrao.")
    else:
        config.read(config_path)
    
    # URL base de acesso web do sistema. Ajuste se o dominio for diferente do padrao
    web_base_url = "https://app.trilogo.com.br" 

    ticket_id = input("\nDigite o numero do Ticket Trílogo: ").strip()
    if not ticket_id:
        log_message("Nenhum Ticket ID informado. Encerrando.")
        return

    # Tenta obter o caminho de download do config, senao usa a pasta atual
    try:
        dest_folder = config.get('SETTINGS', 'download_path', fallback='.').strip()
        # Trava de seguranca: se o valor no config.ini estiver em branco, forca o uso da pasta atual
        if not dest_folder: 
            dest_folder = '.'
    except (KeyError, configparser.NoSectionError):
        dest_folder = '.'
        log_message(f"AVISO: Secao [SETTINGS] ou chave 'download_path' nao encontrada no config.ini. Usando pasta atual: {os.path.abspath(dest_folder)}")

    if not os.path.exists(dest_folder):
        log_message(f"Criando pasta de destino: {dest_folder}")
        os.makedirs(dest_folder)

    log_message("Iniciando navegador automatizado...")
    
    driver = None
    try:
        options = Options()
        # Adiciona algumas opcoes para estabilidade
        options.add_argument('--log-level=3')
        options.add_argument('--silent')
        
        driver = webdriver.Chrome(options=options)

        # Monta a URL direta do ticket na interface web
        ticket_url = f"{web_base_url}/ticket/{ticket_id}" 
        log_message(f"Acessando: {ticket_url}")
        driver.get(ticket_url)

        print("\n" + "-" * 50)
        print("ACAO NECESSARIA NO NAVEGADOR:")
        print("1. Faca o login na sua conta, se solicitado.")
        print("2. Aguarde a pagina do ticket carregar com os anexos visiveis.")
        print("-" * 50)
        input("Pressione ENTER aqui no terminal quando a pagina estiver pronta...")

        log_message("Buscando links de anexos no HTML da pagina...")

        urls_encontradas = []
        
        # Busca todas as tags de link na pagina
        links = driver.find_elements(By.TAG_NAME, "a")
        
        for link in links:
            href = link.get_attribute("href")
            if href:
                href_lower = href.lower()
                # Filtra apenas os links que apontam para servidores de armazenamento de arquivos
                if "amazonaws.com" in href_lower or "storage.googleapis" in href_lower or "attachment" in href_lower:
                    urls_encontradas.append(href)

        urls_encontradas = list(set(urls_encontradas))

        if not urls_encontradas:
            log_message("Nenhum link de anexo compativel foi encontrado no HTML.")
        else:
            print(f"\nEncontrados {len(urls_encontradas)} anexos. Iniciando download...\n")
            for i, url in enumerate(urls_encontradas, 1):
                print(f"[{i}/{len(urls_encontradas)}] Baixando arquivo...")
                result = download_file(url, dest_folder)
                if result.startswith("Erro"):
                    print(f"   L {result}")
                else:
                    print(f"   L Salvo em: {os.path.join(dest_folder, result)}")

    finally:
        if driver:
            log_message("Fechando navegador...")
            driver.quit()

def main():
    try:
        run_robo()
        print("\nProcessamento finalizado com sucesso.")
    except Exception as e:
        print("\n" + "!" * 50)
        print("      ERRO CRITICO DURANTE A EXECUCAO")
        print("!" * 50)
        print(f"\nTipo do Erro: {type(e).__name__}")
        print(f"Mensagem: {str(e)}")
        print("\nDetalhes tecnicos (Traceback):")
        traceback.print_exc()
        print("\n" + "!" * 50)
    finally:
        input("\nPressione ENTER para fechar esta janela...")

if __name__ == "__main__":
    main()
