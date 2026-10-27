# Gestão de Gôndolas — integração com a API

A rota protegida `/gondolas` consulta e altera o cadastro real. Requer a API JWT com `GET /api/v1/store-map` (branch de correção `fix/map-list-query-performance`, baseada na main `27c15b6`). A origem é `VITE_API_BASE_URL` no `.env.local` do frontend; as chamadas passam pelo cliente compartilhado com cookies e CSRF. Não há fallback para dados demonstrativos.

## Contratos utilizados

Todos os caminhos abaixo são relativos a `/api/v1`.

| Operação | Endpoint | Dados consumidos/enviados |
| --- | --- | --- |
| Consulta da empresa | `GET /store-map` | Objeto com `sectors`, `aisles`, `shelves`, `products`, `productShelves` |
| Cadastro | `POST /shelves/registration` | `{ aisleId: number, maximumCapacity: number }` → 201 |
| Edição | `PATCH /shelves/update/{id}` | Mesmo corpo do cadastro → 200 |
| Exclusão | `DELETE /shelves/delete/{id}` | Sem corpo → 204 |

As listas usam os DTOs existentes: setores (`id`, `name`), corredores (`id`, `sectorId`, `sectorName`, `position`), gôndolas (`id`, `aisleId`, `aislePosition`, `maximumCapacity`), produtos (`id`, `name`) e vínculos (`id`, `productId`, `shelfId`, `productQuantity`). O service valida respostas, IDs únicos, referências e quantidades antes de adaptar os dados aos tipos de apresentação.

A empresa é determinada pela API a partir do funcionário autenticado, não por um ID enviado pelo navegador. Conta sem funcionário/empresa recebe 403. A consulta evita baixar o catálogo global: a reprodução encontrou 50 mil gôndolas e 80 mil produtos; a consulta da empresa de teste retornou 500 e 800, respectivamente, em cerca de três segundos. As cinco listagens globais não são usadas como fallback.

## Comportamento

- ID numérico gerado pela API, sem renomear para os códigos ilustrativos A12/B11. O formulário oferece corredor existente e capacidade máxima inteira positiva, até o limite de `Integer` do backend.
- Busca por ID, setor, corredor ou produto, sem distinguir acentos/maiúsculas; filtros combinados, seis registros por página e seleção contextual no mapa.
- Indicadores derivados dos registros retornados: total, gôndolas com algum produto vinculado com quantidade zero, soma das capacidades e gôndolas cujos produtos vinculados têm saldo positivo.
- **Sem produtos:** nenhum vínculo. **Com saldo zero:** pelo menos um vínculo com quantidade zero. **Com saldo:** todos os vínculos com quantidade positiva. Saldo positivo não comprova abastecimento adequado; não há estoque mínimo nesse contrato.
- A quantidade de produtos representa os vínculos distintos, não a soma das unidades. O horário no rodapé é o da consulta no navegador, sem representar uma análise do backend.
- Cadastro/edição/exclusão persistem na API. Gôndolas com produtos conhecidos não podem ser excluídas pela interface. Outros impedimentos, incluindo vínculos não consultados aqui, continuam sob validação do servidor.
- Os modais preservam campos em erros de validação, associam mensagens aos campos, impedem envio duplo/fechamento durante a solicitação e restauram foco ao terminar. Falhas 403 não desconectam a conta; 401 solicita revalidação da sessão.

## Confirmação de gravações

O status esperado confirma a operação mesmo se o corpo não trouxer um DTO utilizável. A listagem é consultada separadamente. Se essa releitura falhar, o sucesso permanece visível e **Tentar novamente** repete somente a consulta.

Em perda de conexão, timeout, erro 5xx ou confirmação inesperada após iniciar a escrita, o resultado pode ser incerto. O modal fecha, os dados antigos deixam de permitir novas operações e a mensagem solicita uma consulta antes de tentar outra gravação. Nenhuma escrita é repetida automaticamente.

## Limites e verificação

Cadastro de setores/corredores e vinculação/transferência de produtos pertencem a etapas posteriores. O módulo de Produtos continua demonstrativo e não fornece links fictícios para o mapa real.

Verificar com `npm run lint`, `npm run test`, `npm run build` e `npm run test:browser`. Os testes usam simulador HTTP exclusivo de `src/test`, cobrindo contratos, CRUD, validação, conflitos, confirmação perdida, falha de releitura, filtros, paginação, teclado e recarga. Nenhuma escrita de negócio é feita no banco real pelos testes.
