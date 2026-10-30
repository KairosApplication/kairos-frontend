# KAIROS IA — cliente do chat pessoal

Contrato consultado em `KairosApplication/kairos-inteligencia-artificial`, main, `api.py` e `data/auth.py`. A aplicação de IA usa `kairos-api-ia` como persistência HTTP no servidor. O navegador não acessa essa API MongoDB diretamente nem recebe token de serviço, chave de modelo ou credencial de banco.

Configure `VITE_AI_BASE_URL` com a origem do serviço Python (padrão `http://localhost:8000`, sem `/api/v1`). Use HTTPS fora do desenvolvimento local. A origem do Spring continua em `VITE_API_BASE_URL`. Para autenticação por cookies entre serviços, os hosts e as políticas de cookie/CORS precisam ser compatíveis.

`VITE_CHATBOT_API_URL` também é aceito como alias e tem prioridade quando preenchido. As duas opções usam o mesmo cliente de autenticação, validação de origem e tratamento de falhas. Não é necessário definir ambas. Ausência de configuração explícita mantém a origem local padrão; falhas não são substituídas por respostas demonstrativas.

Endpoints pessoais: `GET /api/v1/me/chat/conversations?page=N&size=20`, `POST /api/v1/me/chat/conversations`, `GET /api/v1/me/chat/conversations/{id}` e `POST /api/v1/me/chat/messages`. Mensagens enviam somente `question` e `conversationId`. A identidade e o escopo são resolvidos no servidor. Listagem tem paginação por `hasNext`; pesquisa filtra IDs da página atual.

Cada requisição revalida a sessão no Spring e obtém CSRF; inclusive os GETs do serviço de chat recebem o header CSRF exigido por sua autenticação. Cookies são enviados com `credentials: include`. O texto do modelo é exibido como texto, sem HTML executável. Não há respostas predefinidas de produção ou repetição automática de POST.

Após resposta confirmada, o histórico é recarregado. Uma resposta bloqueada/não aprovada aparece como aviso. Falha incerta exige consulta do histórico antes de reenviar; rejeições conhecidas preservam o rascunho. Seleção, paginação e criação ficam bloqueadas durante o envio. Saída da página cancela as requisições locais, sem presumir que o processamento remoto foi desfeito.

## Compatibilidade da autenticação

As PRs `kairos-api-ia#8` e `kairos-inteligencia-artificial#9` foram mergeadas. A ponte Python agora encaminha `KAIROS_ACCESS`, `KAIROS_REFRESH`, `KAIROS_CSRF` e o header CSRF ao `/api/v1/auth/chat-context`, e repassa os cookies renovados ao navegador. Os serviços implantados precisam incluir essas versões e usar host compartilhado para os cookies, ou proxy adequado, além do CORS da origem do frontend. O frontend não tenta ler cookies HttpOnly ou usar um token de serviço como substituto da identidade. O funcionamento real ainda exige homologação dos serviços juntos.

## Fontes das respostas

As mensagens do assistente exibem somente as categorias registradas `pdf` (Documento PDF), `database` (Banco de dados) e `memory` (Memória). Categorias repetidas são removidas; valores desconhecidos e metadados internos são descartados pelo cliente. O histórico recarregado preserva as fontes por mensagem. Mensagens do usuário, respostas sem fontes e avisos de respostas bloqueadas/não aprovadas não recebem rótulos. Nenhuma fonte é deduzida do texto do modelo.

Esta PR altera apenas o frontend. CRUD da persistência, inferência e autenticação dos outros repositórios permanecem sob responsabilidade desses serviços. Testes usam HTTP simulado; não executam modelos pagos nem gravam no MongoDB real.
