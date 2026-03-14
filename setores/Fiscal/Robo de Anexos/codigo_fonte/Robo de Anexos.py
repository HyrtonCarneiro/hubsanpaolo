try:
    import requests
    import os
    import sys
    import configparser
    import time
except ImportError as e:
    print(f"\n❌ ERRO DE BIBLIOTECA: {str(e)}")
    print("\nCertifique-se de que instalou os requisitos antes de compilar:")
    print("👉 pip install requests configparser")
    input("\nPressione ENTER para fechar...")
    sys.exit(1)

def log_message(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}")

def download_file(url, folder):
    try:
        local_filename = url.split('/')[-1]
        # Limpar query params se existirem
        local_filename = local_filename.split('?')[0]
        
        path = os.path.join(folder, local_filename)
        
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return local_filename
    except Exception as e:
        return f"Erro: {str(e)}"

def main():
    print("=" * 50)
    print("       SAN PAOLO FISCAL - ROBÔ DE ANEXOS")
    print("=" * 50)

    # Carregar configurações
    config = configparser.ConfigParser()
    config_path = 'config.ini'
    
    if not os.path.exists(config_path):
        # Tentar buscar na pasta _internal ou local do script
        config_path = os.path.join(os.path.dirname(__file__), 'config.ini')

    if not os.path.exists(config_path):
        print(f"❌ ERRO: Arquivo {config_path} não encontrado.")
        input("\nPressione ENTER para fechar...")
        return

    config.read(config_path)
    
    try:
        token = config['API']['token']
        base_url = config['API']['base_url']
    except KeyError:
        print("❌ ERRO: Configurações de API inválidas no config.ini.")
        input("\nPressione ENTER para fechar...")
        return

    if token == "YOUR_TOKEN_HERE" or not token:
        print("⚠️ AVISO: O token no config.ini ainda não foi configurado.")
        token = input("Por favor, insira o token manualmente (ou ENTER para sair): ").strip()
        if not token:
            return

    ticket_id = input("\n👉 Digite o número do Ticket Trílogo: ").strip()
    if not ticket_id:
        print("Saindo...")
        return

    log_message(f"Buscando informações do ticket {ticket_id}...")
    
    headers = {
        'token': token,
        'Accept': 'application/json'
    }
    
    endpoint = f"{base_url}/api/ticket/{ticket_id}"
    
    try:
        response = requests.get(endpoint, headers=headers)
        
        if response.status_code == 401:
            print("❌ ERRO: Token inválido ou expirado.")
            input("\nPressione ENTER para fechar...")
            return
            
        response.raise_for_status()
        data = response.json()
        
        # Extrair anexos recursivamente de todo o JSON
        urls = []
        
        def find_urls(obj):
            if isinstance(obj, str):
                if obj.startswith('http') and any(ext in obj.lower() for ext in ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx', '.txt', '.zip']):
                    urls.append(obj)
                # Adicionar caso seja uma URL curta do Trílogo ou algo similar sem ext óbvia
                elif obj.startswith('http') and 'trilogo' in obj.lower() and ('/attachment/' in obj.lower() or '/file/' in obj.lower()):
                    urls.append(obj)
            elif isinstance(obj, dict):
                for value in obj.values():
                    find_urls(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_urls(item)

        find_urls(data)

        # Remover duplicados
        urls = list(set(urls))

        if not urls:
            log_message(f"Nenhum anexo encontrado para o ticket {ticket_id}.")
            print("\nDica: Se houver anexos e o robô não os encontrou, verifique se estão visíveis na API Pública.")
        else:
            print(f"\n📂 Encontrados {len(urls)} anexos. Iniciando download...\n")
            
            # Pasta de destino
            dest_folder = config['SETTINGS'].get('download_path', '')
            if not dest_folder:
                dest_folder = '.'
            
            if not os.path.exists(dest_folder):
                os.makedirs(dest_folder)

            for i, url in enumerate(urls, 1):
                print(f"[{i}/{len(urls)}] Baixando: {url.split('/')[-1]}")
                result = download_file(url, dest_folder)
                if result.startswith("Erro"):
                    print(f"   └─ ❌ {result}")
                else:
                    print(f"   └─ ✅ Salvo como: {result}")

        print("\n" + "-" * 50)
        print("🏁 Processamento finalizado.")

    except requests.exceptions.HTTPError as he:
        print(f"❌ ERRO na API: {he}")
    except Exception as e:
        print(f"💥 ERRO INESPERADO: {str(e)}")

    input("\nPressione ENTER para fechar...")

if __name__ == "__main__":
    main()
