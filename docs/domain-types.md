# Tipagens dos módulos

## Referência do contrato

Os tipos em `src/types/` representam o JSON dos DTOs, controllers, mappers e enums de [kairos-springboot, commit `86ea01d`](https://github.com/KairosApplication/kairos-springboot/tree/86ea01dba3dd94ddeb84746521d866ce44e69a66/src/main/java/com/kairos/kairosapipostgres), da [PR #30](https://github.com/KairosApplication/kairos-springboot/pull/30). Essa é a versão usada na validação do login com o banco.

A main do backend consultada nesta entrega está em `f27c5b2` e ainda difere dessa versão: nela, `UserRequest`/`UserUpdateRequest` incluem `zipCode` e `plan`, e `CustomerRequest` não exige `companyId`. Os tipos desta entrega seguem a versão corrigida da PR #30. Ao mudar a versão da API, confira esses contratos antes de integrar os cadastros. A branch local do backend não foi alterada.

## Organização

| Arquivo | Contratos |
| --- | --- |
| `auth.ts` | Credenciais, CSRF, sessão e roles |
| `product.ts` | Produtos e categorias |
| `store.ts` | Setores, corredores e prateleiras/gôndolas |
| `inventory.ts` | Depósitos e vínculo de produtos com prateleiras |
| `user.ts` | Usuários, cadastro público de cliente, clientes e recomendações |
| `employee.ts` | Funcionários e vínculos com corredores/prateleiras |
| `restocking.ts` | Registros de reposição e avarias |
| `alert.ts` | Alertas de ruptura |
| `purchase.ts` | Total de uma compra |
| `api.ts` | Datas, atualizações parciais e erros de validação |

Os nomes `*Request`, `*UpdateRequest` e `*Response` acompanham os DTOs Java. `index.ts` permite importar apenas os tipos de um ponto comum:

```ts
import type { ProductRequest, ProductResponse, EmployeeResponse } from '../types'
```

## Regras de integração

- IDs e quantidades são números JSON. Os IDs SQL da versão de referência são inteiros; não converter silenciosamente IDs maiores que `Number.MAX_SAFE_INTEGER` se o backend mudar para BIGINT.
- `BigDecimal` de preço/total chega como `number`, em unidades monetárias, sem conversão para centavos. Cálculos financeiros definitivos continuam na API; usar formatação monetária para exibição.
- `LocalDateString` é `YYYY-MM-DD`. `LocalDateTimeString` representa a data/hora local enviada pela API, sem fuso. Não acrescentar `Z` automaticamente. Os aliases documentam o formato; não validam strings em execução.
- Listagens retornam arrays dos DTOs, sem envelope de paginação. O `Optional<T>` dos controllers não deve ser reproduzido como `{ value: T }`: os services consultados lançam erro quando não encontram o registro.
- Campos presentes com `null` nas respostas são diferentes de campos opcionais das requisições. Em alertas, funcionário, produto e datas podem ser nulos.
- `PatchRequest<T>` permite omitir ou enviar `null`, pois os services parciais ignoram esses valores. Isso **não apaga** o campo. As atualizações de categoria e cargo exigem seus campos e não usam esse helper.
- A API recebe cargos `MANAGER`, `STOCKER`, `CASHIER`, mas `EmployeeMapper` responde `manager`, `stocker`, `cashier`. Esses tipos não são as roles de sessão `MANAGER`, `EMPLOYEE`, `CUSTOMER`.
- `UserRequest` contém a senha de entrada. `UserResponse` não inclui senha. O cadastro público cria cliente e exige `companyId`; não é cadastro público de gerente.
- `ApiErrorResponse` representa erros do `GlobalExceptionHandler`. Não presumir que respostas de segurança `401`/`403` tenham esse JSON.
- TypeScript não valida JSON em execução. Ao integrar cada serviço, tratar a resposta como `unknown` e verificar os campos antes de usá-los, como já ocorre na autenticação.

## Lacunas para as próximas telas

- Produtos não expõem SKU, código de barras, situação de estoque ou estoque do depósito no `ProductResponse`.
- `ShelfResponse` não possui código visual como `A12` nem status de ruptura. Essas informações exigem composição ou evolução da API.
- `RestockingResponse` representa uma reposição registrada. Não possui prioridade ou status de tarefa pendente/em andamento/concluída. Não reutilizar `AlertStatus` como status de reposição.
- Funcionários não expõem turno, disponibilidade ou e-mail em `EmployeeResponse`; `UserResponse` pode fornecer o e-mail em integração posterior.
- Vendas expõem apenas `GET /api/v1/purchases/{id}/total`. Não há DTO público de listagem com pagamento, itens, horário e cliente; por isso não foi criado um contrato fictício de venda completa.
- Indicadores e séries do Dashboard ainda precisam de endpoints ou regras de composição definidos com a API.

## Verificação

O projeto usa `strict: true` no TypeScript da aplicação, incluindo `strictNullChecks`. `npm run build` verifica os tipos e as asserções de contrato em `contracts.test.ts`. As chamadas `expectTypeOf` são verificadas pelo compilador; `npm run test` sozinho não substitui essa etapa. Execute a suíte existente com `npm run test` e confira também `npm run lint`.

Esta entrega prepara os contratos para os próximos serviços. Não adiciona chamadas de cadastro, altera dados no banco ou muda as telas.
