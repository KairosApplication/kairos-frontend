# Login do gerente

Referência: [kairos-springboot](https://github.com/KairosApplication/kairos-springboot), commit `f27c5b2`.
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
- `GET /api/v1/auth/me`: `{ email, roles }`. Apenas `MANAGER` segue para `/dashboard`.
- Para contas sem role de gerente, `POST /api/v1/auth/logout` com o CSRF renovado encerra a sessão. Falhas nesse encerramento são informadas.
- Todas as chamadas usam `credentials: 'include'` e `cache: 'no-store'`. A sessão é controlada pelo backend via cookie `JSESSIONID`; o frontend não grava senha, cookie ou token em local/session storage.

O service valida os payloads recebidos, trata status HTTP e falhas de rede e limita cada requisição a 15 segundos. As senhas não são alteradas antes do envio; apenas o e-mail é aparado.

## Limites desta entrega

- A API não oferece `remember-me` nem recuperação de senha. O checkbox de manter conectado não foi adicionado; o botão de recuperação orienta procurar o administrador.
- Contexto/reducer, restauração de sessão, logout global e proteção das rotas serão implementados na próxima entrega de autenticação. O acesso direto às rotas do gerente ainda não é bloqueado pelo frontend.
- Header e sidebar continuam com identificação demonstrativa; os dados reais do gerente serão conectados ao contexto de sessão nessa próxima entrega.
- Os testes do service simulam HTTP conforme o contrato. Eles não substituem uma validação ponta a ponta com a API real em execução, conta de gerente e cookies/CORS configurados.

## Verificações

Execute `npm run test`, `npm run lint` e `npm run build`. Os testes cobrem CSRF antes/depois de login, cookies, encoding de credenciais, respostas 204/401/403/5xx, payload inválido, falha de rede, sessão não mantida e rejeição de perfis sem permissão.
