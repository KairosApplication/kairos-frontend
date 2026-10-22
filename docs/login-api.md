# Login do gerente

Referência escolhida: checkout **local** de `kairos-springboot`, commit `28c73d8`, em 22/10/2026. Contrato conferido em `SecurityConfig`, `AuthController`, `TokenAuthService`, `AuthCookies`, `ApiAuthenticationFilter` e DTOs.

Esta versão usa JWT com cookies HttpOnly e renovação automática no backend. A main oficial consultada (`f27c5b2`) ainda utiliza `JSESSIONID` e não é o contrato desta PR. A versão JWT precisa estar disponível no ambiente que executar este frontend; esta entrega não publica nem altera o backend.

## Executar localmente

1. Prepare PostgreSQL, Redis e a API conforme o README do backend.
2. Copie `.env.example` para `.env.local` no frontend. Configure `VITE_API_BASE_URL` com a origem da API, sem `/api/v1` no final. O padrão é `http://localhost:8080`.
3. Na API, configure `CORS_ALLOWED_ORIGINS=http://localhost:5173`. Se acessar o frontend por `127.0.0.1`, adicione essa origem explicitamente. Se o Vite mudar de porta, configure também a nova origem na API.
4. Execute `npm ci` e `npm run dev` no frontend; acesse `http://localhost:5173/login`.
5. Use uma conta existente com role `MANAGER`. Não há cadastro de gerente nesta tela. Não coloque credenciais em arquivos versionados ou em variáveis `VITE_*`.

## Contrato implementado

- `GET /api/v1/auth/login`: `{ headerName, token }` para obter CSRF.
- `POST /api/v1/auth/login`: formulário URL encoded com `email`, `password` e header `X-CSRF-TOKEN`. Sucesso **200**, corpo `{ accessToken, tokenType: "Bearer", expiresIn }` e cookies HttpOnly `KAIROS_ACCESS`/`KAIROS_REFRESH`. Credenciais inválidas `401`, CSRF inválido `403`.
- O corpo é validado e descartado. O bearer não vai para storage, contexto, logs ou headers Authorization do navegador.
- Após o POST, novo GET de CSRF, pois o login invalida o cookie CSRF antigo. `/me` confirma que o navegador manteve os cookies.
- `GET /api/v1/auth/me`: `{ email, roles }`. Apenas `MANAGER` acessa as rotas do painel. O login retorna à rota conhecida solicitada, preservando filtros, ou segue para `/dashboard`.
- Para contas sem role de gerente, `POST /api/v1/auth/logout` com o CSRF renovado encerra a sessão. Falhas nesse encerramento são informadas.
- Todas as chamadas usam `credentials: 'include'`, `cache: 'no-store'` e rejeitam redirects inesperados. O frontend não grava senha, cookie ou token em local/session storage.
- A API renova o access cookie ausente/expirado durante as requisições protegidas, usando o refresh cookie e a sessão no Redis. Um `401` definitivo é tratado como fim do acesso; o frontend não cria ciclos de `/refresh` nem repete escritas automaticamente.

## Cliente HTTP compartilhado

`src/services/apiClient.ts` centraliza `/api/v1`, cookies, cancelamento, timeout de 15 segundos por requisição e JSON não confiável. `apiRequest('/products/list')` devolve a resposta HTTP para o service do módulo validar o status e os dados.

Para POST/PUT/PATCH/DELETE, o cliente obtém CSRF atual antes da escrita, substitui qualquer header antigo e preserva corpo e headers do módulo. Não há cache persistente de CSRF. Se a obtenção falhar ou a operação for cancelada, a escrita não é enviada. Status 401/403/409/5xx não provocam replay de cadastros, exclusões ou senhas.

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

`npm run test:browser` inclui login HTTP 200, retorno à rota protegida solicitada, recarga, logout, 401 definitivo e ausência de bearer no storage/headers. O backend desses testes é simulado; a suíte de acessibilidade também usa o contrato JWT atualizado.

### Validação real — 22/10/2026

Executada em Chrome isolado contra a API local `28c73d8`, usando somente a conta fictícia de gerente já cadastrada. Nenhuma senha foi alterada nem dado operacional criado.

- Login real, `/me` e cookies `KAIROS_ACCESS`/`KAIROS_REFRESH` HttpOnly: aprovados.
- Remoção controlada do access cookie e recarga: a API renovou o acesso pelo refresh cookie, sem pedir novo login.
- Logout real: retorno ao Login e remoção dos cookies; nenhum storage de autenticação encontrado.

Esse teste não espera a expiração temporal de um JWT nem substitui os testes de segurança do backend, a revisão com leitor de tela ou a integração dos demais módulos.
