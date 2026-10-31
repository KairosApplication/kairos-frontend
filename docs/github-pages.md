# GitHub Pages

O workflow `.github/workflows/pages.yml` publica somente o site compilado em
`dist`. A publicacao ocorre a cada push na `main`, depois de lint, testes e build,
ou manualmente pela aba Actions. Nao e necessario atualizar a branch `gh-pages`.

## Ativacao no GitHub

1. Envie as alteracoes ao GitHub por uma PR e siga as aprovacoes exigidas para
   integra-la na `main`. Nao desative a protecao da branch.
2. No repositorio, abra **Settings > Pages > Build and deployment** e escolha
   **GitHub Actions** em **Source**, substituindo a publicacao pela `gh-pages`.
3. Em **Settings > Secrets and variables > Actions > Variables**, crie a
   variavel de repositorio `VITE_API_BASE_URL` com a origem HTTPS publica do
   backend Spring Boot, sem `/api/v1`. Opcionalmente, crie `VITE_AI_BASE_URL`
   com a origem HTTPS publica do servico de IA.
4. Abra **Actions > Deploy GitHub Pages > Run workflow**, selecione `main` e
   execute. Confira os jobs `build` e `deploy`; o job `deploy` informa o link.

Essas URLs sao configuracoes publicas e ficam no JavaScript do navegador.
Nunca inclua senhas, tokens ou chaves de IA nessas variaveis. GitHub Pages hospeda
apenas o frontend: o backend e o servico de IA precisam de hospedagem separada.
Sem a URL da API, a tela de login abre, mas a autenticacao fica indisponivel.
`localhost` nao funciona como backend para visitantes do site publicado.

## Endereco e integracao

No repositorio `kairosapplication/kairos-frontend`, o endereco esperado e:
`https://kairosapplication.github.io/kairos-frontend/#/login`.
Se o proprietario for outro, substitua `kairosapplication` no endereco. Se o nome
do repositorio mudar, ajuste tambem o `base` do modo `pages` em `vite.config.ts`.
Nenhum dominio personalizado esta configurado.

As rotas com hash permitem links diretos e atualizacao da pagina no Pages.
O build de desenvolvimento continua usando rotas normais em
`http://localhost:5173`.

No backend, permita a origem do site (por exemplo,
`https://kairosapplication.github.io`) no CORS e configure os cookies de
autenticacao HTTPS para acesso a partir dessa origem. A autorizacao continua
sendo responsabilidade do backend.

## Validacao local

Execute `npm ci`, `npm run lint`, `npm run test`, `npm run build` e
`npm run build:pages`. O modo `pages` ignora arquivos `.env`, inclusive
`.env.local`; para testar com APIs, forneca as URLs pelas variaveis de ambiente
do terminal antes do build.

Alterar as variaveis no GitHub nao atualiza um site ja publicado: execute o
workflow novamente para recompilar e publicar.
