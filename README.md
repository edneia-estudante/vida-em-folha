# Vida em Folha

Aplicativo pessoal em português para organizar agenda, metas, orçamento, saúde e bem-estar, com identidade visual em tons outonais.

[Abrir o aplicativo](https://vida-em-folha-pessoal.gomesedneiaangelica.chatgpt.site)

## Executar no computador

Requer **Node.js 24 ou superior** e npm. Na pasta do projeto:

```sh
npm ci
npm run dev
```

Abra **http://localhost:4173**. O primeiro acesso mostra o cadastro. A opção **Conhecer o aplicativo primeiro** abre uma demonstração em memória; contas reais começam vazias.

O arquivo de entrada é **`index.html`, na raiz**. Ele é servido pelo servidor Node, que também fornece os arquivos de `public/` e a API. Use o endereço acima em vez de abrir o HTML com dois cliques: cadastro, login e sincronização precisam do servidor.

Não há dependências externas para executar o aplicativo. O Prettier é uma ferramenta de desenvolvimento usada apenas para padronizar o código.

## Estrutura

```text
vida-em-folha/
├── index.html                 # Entrada da interface
├── public/
│   ├── app.js                 # Telas, formulários e navegação
│   ├── domain.js              # Datas, recorrência, metas e orçamento
│   ├── style.css              # Identidade visual e layout responsivo
│   ├── cover-autumn.png       # Capa da tela inicial
│   ├── icon.svg               # Ícone do aplicativo
│   ├── scene.svg              # Ilustração do cadastro
│   ├── manifest.webmanifest   # Instalação como aplicativo web
│   └── sw.js                  # Cache da interface
├── worker/api.js              # Autenticação e persistência
├── server.mjs                 # Servidor local com SQLite
├── drizzle/                   # Migração inicial do banco
├── scripts/build.mjs          # Gera o Worker para produção
├── tests/                     # Testes de API e regras de negócio
├── docs/                     # Arquitetura e envio ao GitHub
├── .github/workflows/         # Verificações automáticas
├── .openai/hosting.json       # Vínculo da publicação existente no Sites
├── .editorconfig             # Padrão de edição
├── .prettierrc.json           # Padrão de formatação
├── .gitignore                # Arquivos locais que não entram no Git
├── package.json              # Comandos e requisitos
└── package-lock.json         # Versões das ferramentas
```

## Comandos

| Comando                | Função                                              |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Inicia o servidor local                             |
| `npm start`            | Mesmo servidor local                                |
| `npm test`             | Executa testes de autenticação e regras de negócio  |
| `npm run build`        | Gera `dist/server/index.js` para Cloudflare Workers |
| `npm run format`       | Formata o código                                    |
| `npm run format:check` | Confere a formatação sem alterar arquivos           |
| `npm run check`        | Confere formatação, executa testes e gera o build   |

O workflow do GitHub executa as verificações em pushes e pull requests. Ele não publica o aplicativo.

## Recursos

- Início com capa, saudação, pendências, humor e atalhos.
- Hoje e Agenda com pesquisa, edição, exclusão, conclusão e adiamento de atividades.
- Repetição diária, semanal ou mensal, com data final opcional e inclusiva.
- Metas com categorias editáveis, etapas em ordem cronológica e acompanhamento do progresso. Etapas adiadas usam a nova data; metas de economia geram pagamentos.
- Orçamento com saldo anterior automático ou informado, saldos atual e previsto, receitas, pagamentos e reserva financeira. Categorias personalizadas aparecem em “Para onde vai”, inclusive sem gastos.
- Saúde e bem-estar reunidos: consultas, remédios, anotações e diário de humor, sono, energia, atividade física e observações.
- Foto de perfil, interface responsiva e botão de instalação na tela de cadastro.

## Dados e hospedagem

Localmente, os dados ficam em **`.data/vida.sqlite`**, que não é enviado ao GitHub. Na publicação existente, ficam no banco **Cloudflare D1**, vinculados à conta de cada usuário.

Guardar o código no GitHub não transfere os cadastros ou o banco de produção. O **GitHub Pages serve arquivos estáticos** e não executa este servidor nem a API de contas. Para manter o aplicativo completo, use a publicação existente ou configure uma hospedagem com backend e banco. Veja a [documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Consulte [como enviar ao GitHub](docs/GITHUB.md) e [a arquitetura e os limites](docs/ARQUITETURA.md).
