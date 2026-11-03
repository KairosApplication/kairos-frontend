# Render: frontend e APIs na mesma origem

Crie um **Web Service Node**, usando o `render.yaml` deste projeto. Um Static
Site nao executa o proxy. Build: `npm ci --include=dev && npm run build:server`.
Start: `npm run start:server`. Health check: `/healthz`. Node: 24.

## Configuracao do servidor

| Variavel | Valor |
| --- | --- |
| `API_UPSTREAM_URL` | `https://d3bmuckfmecew.cloudfront.net` (Spring Boot) |
| `CHATBOT_UPSTREAM_URL` | Origem HTTPS do chatbot **Python**, sem caminhos |
| `PUBLIC_ORIGIN` | Opcional no Render: usa `RENDER_EXTERNAL_URL`. Preencher com a origem HTTPS exata ao usar dominio personalizado. |
| `PORT` | Fornecida pelo Render. Localmente, padrao 3000. |

O CloudFront `d37txp61clrihq.cloudfront.net` e a API Java de persistencia
`kairos-api-ia`, nao o chatbot Python. Nao use esse endereco como
`CHATBOT_UPSTREAM_URL`. Sem o Python configurado, apenas as chamadas de chat
retornam 503; a API principal continua disponivel.

O token de servico da persistencia e as chaves OpenAI/Groq pertencem somente aos
servicos de IA. Nao sao necessarios neste proxy nem devem entrar em variaveis
`VITE_*`. URLs e tokens nao sao adicionados ao JavaScript do build `server`.

## Funcionamento

- O navegador acessa `/api/v1/...` no dominio do proprio frontend.
- `/api/v1/me/chat` e suas subrotas vao para o Python. As demais rotas `/api/v1/`
  vao para o Spring, preservando metodo, corpo, CSRF e cookies de usuario.
- O proxy valida a origem do navegador; rejeita origens externas e escritas sem
  `Origin`. Depois faz uma chamada servidor a servidor, sem repassar `Origin`,
  `Referer` ou headers `X-Forwarded-*` enviados pelo cliente.
- Cookies retornam ao dominio do frontend. Remove-se apenas `Domain`; `Path`,
  `Secure`, `HttpOnly`, `SameSite` e expiracao sao preservados. Cookies e CSRF
  continuam sendo validados pelas APIs. Nao ha repeticao automatica de escritas.
- CORS entre navegador e upstream deixa de ser necessario neste caminho. O
  chatbot Python ainda precisa validar a sessao no Spring pelo seu
  `SPRING_AUTH_URL` e conseguir consultar os bancos configurados no backend.
- O servidor entrega `index.html` nas rotas React, permitindo links diretos e
  atualizacao da pagina. Assets inexistentes retornam 404, sem HTML no lugar.

Os modos GitHub Pages e desenvolvimento continuam com sua configuracao atual.
O modo `server` ignora arquivos `.env`, inclusive `.env.local`, e sempre usa
chamadas de mesma origem. Os upstreams sao variaveis do processo Node em runtime.

## Teste local (PowerShell)

```powershell
npm run build:server
$env:API_UPSTREAM_URL = 'http://localhost:8080'
$env:CHATBOT_UPSTREAM_URL = 'http://localhost:8000'
$env:PUBLIC_ORIGIN = 'http://localhost:3000'
npm run start:server
```

Abra `http://localhost:3000`. Login e dados requerem os servicos reais ativos.
Use `npm run test:server` para os testes HTTP isolados do proxy e `npm run test`
para os testes do cliente. Esses testes automatizados nao consultam bancos reais
nem enviam perguntas a provedores de IA.
