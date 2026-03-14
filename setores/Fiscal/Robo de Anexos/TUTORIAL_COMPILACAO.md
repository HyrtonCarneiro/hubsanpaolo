# Tutorial: Como Compilar e Publicar o Robô de Anexos

Siga os passos abaixo para transformar o código Python em um executável (.exe) e torná-lo disponível para download no site.


> [!IMPORTANT]
> O erro que você viu (`No module named 'requests'`) acontece porque a biblioteca `requests` não estava instalada no ambiente Python na hora de gerar o executável. 

## 1. Preparação do Ambiente
Abra o **Prompt de Comando (CMD)** ou **PowerShell** e instale obrigatoriamente as bibliotecas:

```bash
pip install requests configparser pyinstaller
```

## 2. Compilação do Executável
Navegue até a pasta do código fonte:
```bash
cd "G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\Robo de Anexos\codigo_fonte"
```

Execute o comando do PyInstaller para gerar o arquivo único:
```bash
pyinstaller --onefile --noconsole --add-data "config.ini;." "Robo de Anexos.py"
```
*Nota: Se quiser ver logs de erro durante os testes, remova o `--noconsole`.*

## 3. Localizando o Arquivo
Após o comando terminar, uma pasta chamada `dist` será criada. Dentro dela estará o arquivo `Robo de Anexos.exe`.

## 4. Empacotamento (O Segredo do Padrão "Internals")
Ao usar o comando `--onefile`, o PyInstaller coloca tudo dentro do `.exe`, incluindo o código. Porém, o arquivo `config.ini` **deve ficar fora** para o usuário poder editar o token.

**Como criar o RAR final:**
1. Crie uma pasta chamada `Robo de Anexos`.
2. Pegue o arquivo `Robo de Anexos.exe` da pasta `dist` e coloque nela.
3. Copie o arquivo `config.ini` para dentro dessa pasta.
4. **Sobre a pasta `_internal`:** No modo `--onefile`, você **não precisa** enviar uma pasta `_internal` externa; o executável já é autossuficiente. 
   - *Nota:* Se você preferir o modo que mostra a pasta de dependências (como o Robô Classificador faz às vezes), use `--onedir` em vez de `--onefile`. No modo `--onedir`, a pasta `_internal` (ou similar) é gerada e **deve** ser incluída no `.rar` junto com o `.exe`.

**Recomendação:** Use o modo `--onefile` (comando do passo 2) para que o usuário tenha apenas o `.exe` e o `config.ini` na pasta. É mais simples e limpo!

## 5. Publicação no Site
Compacte a pasta com o `.exe` e o `config.ini` em um arquivo chamado **`Robo de Anexos.rar`** e mova para:
`G:\Meu Drive\SANPAOLO\Dev\hubsanpaolo\setores\Fiscal\Robo de Anexos\`

## Pronto!
O link de download no site agora funcionará automaticamente, pois já apontei o botão para esse arquivo e pasta.
