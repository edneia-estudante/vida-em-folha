# Arquitetura

## Interface

O servidor entrega o `index.html` da raiz na rota `/`. Os arquivos de `public/` são expostos diretamente por URL, por exemplo `/app.js` e `/style.css`.

`public/app.js` concentra renderização, navegação por hash, formulários, sincronização e instalação. `public/domain.js` contém funções compartilhadas de datas, repetições, metas e orçamento. Não há framework de interface.

O código usa valores monetários em centavos inteiros e datas de calendário em `AAAA-MM-DD`. A data final de uma repetição é inclusiva. Etapas de metas usam a data adiada, quando existe, para ordenar a lista.

## API e banco

`worker/api.js` atende `/api/register`, `/api/login`, `/api/logout` e `/api/state`.

O estado pessoal é armazenado em JSON por usuário, com uma versão para detectar conflitos entre dispositivos. O cliente verifica atualizações periodicamente e quando recupera o foco. Senhas usam PBKDF2-SHA256 com salt aleatório. Sessões usam cookies HttpOnly e SameSite=Strict, com Secure em HTTPS, e expiram após 30 dias.

`server.mjs` adapta o SQLite nativo do Node.js à interface de consultas usada pela API. Ele cria `.data/vida.sqlite` e aplica a migração inicial quando necessário. O processo escuta apenas em `127.0.0.1`, na porta `4173` ou na porta definida em `PORT`.

Na produção existente, a mesma API usa Cloudflare D1. A migração em `drizzle/0000_autumn.sql` já foi aplicada à publicação existente; não altere a migração histórica para mudar o esquema de um banco em uso.

## Build

`scripts/build.mjs` lê o HTML da raiz e os assets de `public/`, incorpora a API e as funções compartilhadas e gera `dist/server/index.js`. Imagens PNG são incorporadas em base64 e convertidas em bytes na resposta HTTP. A pasta `dist/` é uma saída gerada, não a fonte a editar.

O empacotamento remove somente o import inicial da API que aponta para as funções de domínio. Caso a API receba novos módulos, ajuste o build para incluí-los.

## Instalação e conexão

O manifest e o service worker permitem instalação como aplicativo web em navegadores compatíveis. O cache guarda a interface, não as respostas da API ou os dados das contas. É necessária conexão com o servidor para ler e salvar dados pessoais.

## Limites atuais

- Notificações de horário funcionam enquanto o app está aberto; push em segundo plano ainda não está implementado.
- Recuperação de senha e confirmação de e-mail dependem de integração futura com um serviço de e-mail.
- Pendências abrangem os últimos 12 meses; atividades anteriores continuam acessíveis na agenda.
- Categorias em uso precisam ter seus registros reclassificados antes de serem excluídas.
- O saldo anterior usa pagamentos e recebimentos confirmados, considerando suas datas agendadas ou adiadas; não há um campo separado de data efetiva de liquidação.
- A demonstração fica em memória e não substitui o armazenamento das contas.

## Verificação

Os testes em `tests/` cobrem autenticação, isolamento entre contas, conflitos de versão, recorrência, adiamento, metas, saldo anterior e distribuição de despesas por categoria. Execute `npm run check` antes de enviar alterações.
