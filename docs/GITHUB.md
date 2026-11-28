# Enviar para edneia-estudante

Repositório de destino: [edneia-estudante/vida-em-folha](https://github.com/edneia-estudante/vida-em-folha).

## O que contém este projeto

Esta pasta corresponde ao aplicativo desenvolvido nesta conversa e publicado no Sites, com frontend, API de contas e banco SQLite/D1. O `index.html` principal está na raiz.

O repositório de destino já continha outro `index.html` e uma imagem de capa quando esta organização foi preparada. Por isso, faça o envio em uma **nova branch**, revise as diferenças e só depois integre à `main`. O HTML anterior contém uma implementação diferente; a substituição muda a forma de executar e hospedar aquele repositório.

## Envio pelo site do GitHub

1. Entre na conta **edneia-estudante** e abra o repositório acima.
2. Crie uma branch chamada `codex/organizar-projeto` a partir de `main`.
3. Extraia o pacote ZIP preparado para o GitHub.
4. Na nova branch, escolha **Add file → Upload files**.
5. Envie os arquivos e as pastas de dentro do pacote, preservando a estrutura. O `index.html` deve ficar diretamente na raiz do repositório, não dentro de uma segunda pasta `vida-em-folha`.
6. Confira que também entraram os arquivos iniciados por ponto, como `.gitignore`, `.prettierrc.json`, `.editorconfig`, `.github/` e `.openai/`.
7. Salve o commit e abra um pull request para revisar a reorganização.

A imagem `capa-vida-em-folha.png` que já existe na raiz do repositório pode permanecer durante a revisão. A versão deste pacote usa `public/cover-autumn.png`.

## Alternativa com Git

Clone o repositório em uma **pasta separada** e entre nela:

```sh
git clone https://github.com/edneia-estudante/vida-em-folha.git
cd vida-em-folha
git switch -c codex/organizar-projeto
```

Copie o conteúdo do pacote para essa pasta, preservando a pasta `.git` criada pelo clone. Depois:

```sh
npm ci
npm run check
git add .
git diff --cached --stat
git commit -m "Organiza projeto com index.html na raiz e documentação"
git push -u origin codex/organizar-projeto
```

Use a autenticação normal do GitHub para uma conta com permissão de escrita no repositório. Não coloque senhas ou tokens no código.

## O que fica fora do envio

- `.data/`: contas, sessões e dados pessoais usados localmente.
- `node_modules/`: ferramentas instaladas com npm.
- `dist/`: saída gerada pelo build.
- `outputs/`, arquivos ZIP e arquivos de publicação temporários.
- Arquivos `.env`, credenciais e logs.

O `.gitignore` já exclui esses itens. Enviar código não migra os dados da aplicação hospedada.

## GitHub e publicação do aplicativo

O workflow em `.github/workflows/checks.yml` valida o código, mas não faz deploy. O `index.html` depende das rotas servidas por `server.mjs` ou pelo Worker gerado: copiar somente o HTML para o GitHub Pages não disponibiliza o app completo.

A configuração `.openai/hosting.json` identifica a publicação existente no Sites. Para criar uma hospedagem independente, configure seu próprio backend e banco, sem reutilizar o vínculo de outro projeto.

Referências: [envio de arquivos pelo GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) e [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
