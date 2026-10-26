# Gestão de Gôndolas — integração com a API

A rota protegida `/gondolas` consulta e altera o cadastro real. Referência: backend local JWT `kairos-springboot`, commit `28c73d8`. A origem é `VITE_API_BASE_URL` no `.env.local` do frontend; as chamadas passam pelo cliente compartilhado com cookies e CSRF. Não há fallback para dados demonstrativos.

## Contratos utilizados

Todos os caminhos abaixo são relativos a `/api/v1`.

| Operação | Endpoint | Dados consumidos/enviados |
| --- | --- | --- |
| Setores | `GET /sectors/list` | `id`, `name` |
| Corredores | `GET /aisles/list` | `id`, `sectorId`, `sectorName`, `position` |
| Gôndolas | `GET /shelves/list` | `id`, `aisleId`, `aislePosition`, `maximumCapacity` |
| Produtos | `GET /products/list` | `id`, `name` |
| Vínculos e saldo | `GET /product-shelves/list` | `id`, `productId`, `shelfId`, `productQuantity` |
| Cadastro | `POST /shelves/registration` | `{ aisleId: number, maximumCapacity: number }` → 201 |
| Edição | `PATCH /shelves/update/{id}` | Mesmo corpo do cadastro → 200 |
| Exclusão | `DELETE /shelves/delete/{id}` | Sem corpo → 204 |

Os DTOs estão em `src/types/shelfApi.ts`. O service valida respostas, IDs únicos, referências e quantidades antes de adaptar os dados aos tipos de apresentação. Respostas incompatíveis exibem erro em vez de valores inventados.

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
