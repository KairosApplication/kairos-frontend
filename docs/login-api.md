# Login do gerente

Referência: [kairos-springboot PR #30](https://github.com/KairosApplication/kairos-springboot/pull/30), commit `86ea01d`.
O contrato foi conferido no `SecurityConfig`, `AuthController`, DTOs e testes de integração. O servlet enviado anteriormente não é a API usada por esta entrega.

## Executar localmente

1. Prepare PostgreSQL, Redis e a API conforme o README do backend.
2. Copie `.env.example` para `.env.local` no frontend. Configure `VITE_API_BASE_URL` com a origem da API, sem `/api/v1` no final. O padrão é `http://localhost:8080`.
3. Na API, configure `CORS_ALLOWED_ORIGINS=http://localhost:5173`. Se acessar o frontend por `127.0.0.1`, adicione essa origem explicitamente. Se o Vite mudar de porta, configure também a nova origem na API.
4. Execute `npm ci` e `npm run dev` no frontend; acesse `http://localhost:5173/login`.
5. Use uma conta existente com role `MANAGER`. Não há cadastro de gerente nesta tela. Não coloque credenciais em arquivos versionados ou em variáveis `VITE_*`.

## Contrato implementado

- `GET /api/v1/auth/login`: `{ headerName, token }` para iniciar a sessão e obter CSRF.
- `POST /api/v1/auth/login`: formulário URL encoded com `email`, `password` e header `X-CSRF-TOKEN`. Sucesso `204`, credenciais inválidas `401`, CSRF inválido `403`.
- Após o POST, novo GET de CSRF, pois o backend renova o token no login.
- `GET /api/v1/auth/me`: `{ email, roles }`. Apenas `MANAGER` acessa as rotas do painel. O login retorna à rota conhecida solicitada, preservando filtros, ou segue para `/dashboard`.
- Para contas sem role de gerente, `POST /api/v1/auth/logout` com o CSRF renovado encerra a sessão. Falhas nesse encerramento são informadas.
- Todas as chamadas usam `credentials: 'include'` e `cache: 'no-store'`. A sessão é controlada pelo backend via cookie `JSESSIONID`; o frontend não grava senha, cookie ou token em local/session storage.

O service valida os payloads recebidos, trata status HTTP e falhas de rede e limita cada requisição a 15 segundos. As senhas não são alteradas antes do envio; apenas o e-mail é aparado.

## Ciclo de sessão

- `AuthProvider` e reducer tipado centralizam identidade, carregamento, erro e saída. A sessão é consultada ao abrir a aplicação, navegar e retornar à janela/aba autenticada. Não há polling que prolongue a sessão durante inatividade.
- Na primeira consulta de `/me`, as rotas protegidas aguardam confirmação. Sessões já confirmadas são revalidadas em segundo plano, mantendo layout e estado local durante a navegação. Falhas bloqueiam o painel com erro e nova tentativa; falha de rede não é tratada como logout.
- `401` remove a identidade e exige novo login; expiração detectada durante o uso exibe aviso. `403` e perfis sem `MANAGER` bloqueiam o painel.
- O logout na sidebar, disponível também no celular, busca CSRF atualizado e só confirma a saída após resposta `204` ou `401`. Falhas bloqueiam o conteúdo e permitem verificar novamente a sessão. Respostas antigas de restauração são ignoradas após login/logout.
- Header e sidebar exibem e-mail e iniciais derivados da sessão, pois `/me` não fornece nome completo. A duração da sessão é determinada pela API e seus cookies.
- Sessões autenticadas são redirecionadas ao painel quando visitam `/login`. Destinos de retorno são limitados às rotas conhecidas do gerente.

## Limites desta entrega

- A API não oferece `remember-me` nem recuperação de senha. O checkbox de manter conectado não foi adicionado; o botão de recuperação orienta procurar o administrador.
- Os dados da loja e as páginas dos módulos continuam demonstrativos; a integração entregue é de autenticação. Autorização e isolamento de dados precisam continuar sendo verificados no backend.
- Os testes do service simulam HTTP conforme o contrato. Eles não substituem uma validação ponta a ponta com a API real em execução, conta de gerente e cookies/CORS configurados.

## Verificações

Execute `npm run test`, `npm run lint` e `npm run build`. Os testes cobrem o contrato HTTP, reducer, destinos seguros e integração entre provider e rotas: restauração, StrictMode, bloqueio durante carregamento, falha de rede com nova tentativa, expiração, permissões e respostas atrasadas após logout.
