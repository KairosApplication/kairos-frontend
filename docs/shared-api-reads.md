# Consultas compartilhadas e carregamento progressivo

Esta melhoria altera apenas o frontend. Reduz requisições repetidas e evita que consultas auxiliares bloqueiem toda a página. As consultas individuais continuam sujeitas à latência da API e do banco.

## Política de dados

- Somente respostas bem-sucedidas das leituras `/store-map`, `/employees/list`, `/customers/list`, `/restockings/list`, `/inventories/list` e `/categories/list` são reutilizadas.
- Os dados ficam em memória nesta aba, por até 30 segundos após a resposta. Não há armazenamento em localStorage, persistência após recarregar a página ou atualização periódica em segundo plano.
- Requisições simultâneas do mesmo endpoint compartilham uma operação HTTP. Cancelar o leitor de uma página não cancela a consulta que outra página pode reutilizar; a operação continua limitada pelo timeout do cliente.
- A identidade autenticada (e-mail e perfis) delimita o cache. Login, logout, troca de identidade e respostas de autorização inválida limpam as leituras. Respostas atrasadas de uma geração anterior são descartadas.
- Escritas invalidam os dados antes e depois da tentativa, inclusive resultados incertos. Atualizações explícitas também limpam as leituras. POST/PATCH/DELETE não são repetidos automaticamente.
- Autenticação, CSRF, IA e consultas fora da lista não são armazenados neste cache. Cada consumidor recebe uma cópia independente dos dados.

## Telas

Dashboard e Insights mostram o catálogo assim que ele chega; os indicadores de reposição têm carregamento e erro separados. Uma consulta pendente não é apresentada como zero registros.

Central de Reposição consulta inicialmente apenas catálogo e registros. A lista e o filtro identificam os responsáveis pelos IDs disponíveis. Equipe e depósitos são carregados ao abrir o formulário de criação/edição; falhas nessas opções ficam no formulário. Exclusão não exige essas consultas auxiliares.

Consultas GET/HEAD de dados, verificação de sessão (`/auth/me`) e o fluxo de login (obtenção de CSRF e envio de credenciais) aguardam até 60 segundos por padrão. Configure `VITE_API_READ_TIMEOUT_MS` no `.env.local`, entre 15000 e 300000 milissegundos; por exemplo, `120000` permite dois minutos. Configurações inválidas usam 60000. Reinicie o Vite após alterar o ambiente. Logout e gravações de negócio mantêm 15 segundos. O envio de credenciais não é repetido automaticamente após falha ou timeout. A mensagem de timeout informa o limite aplicado, separadamente da falha de conexão.

## Medição e limites

Teste de navegador com HTTP simulado, navegação SPA dentro da validade dos dados:

| Dashboard → Mapa → Insights → Reposições | Antes | Depois |
| --- | ---: | ---: |
| Catálogo | 4 | 1 |
| Registros de reposição | 3 | 1 |
| Equipe | 1 | 0 |
| Depósitos | 1 | 0 |
| Total de leituras de negócio iniciais | 9 | 2 |

Abrir o formulário acrescenta uma consulta de equipe e uma de depósitos. Abrir Funcionários em seguida reutiliza a equipe. Chamadas de autenticação não entram nessa contagem e continuam revalidando a sessão.

Essa medição verifica o número de chamadas, não o tempo da API real. Uma primeira listagem que excede o timeout configurado ainda pode falhar; listagens completas e consultas individuais no Spring precisam ser otimizadas pelo responsável pelo backend. Aumentar a espera permite aguardar respostas mais lentas, mas não acelera as consultas. Nenhum repositório externo foi alterado.
