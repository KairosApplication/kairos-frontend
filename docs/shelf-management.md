# Gestão de Gôndolas

A rota protegida `/gondolas` implementa a listagem da captura Web (new), frame `574:518`: quatro indicadores, busca, filtros, tabela e paginação com seis registros por página.

## Escopo

- Busca por código, setor ou nome dos produtos disponíveis na demonstração, ignorando acentos, maiúsculas e espaços nas extremidades.
- Filtros combinados de setor e situação. Alterar qualquer filtro retorna à primeira página.
- Indicadores calculados para a loja inteira, preservando os mesmos dados e situações do mapa: 24 gôndolas, 3 com rupturas, 4 com estoque baixo e 17 abastecidas; 8 produtos sem exposição.
- Contador dos resultados filtrados e botões Anterior/Próxima limitados às páginas existentes.
- Estado vazio com limpeza de filtros, carregamento e erro com nova tentativa.
- Link geral ao mapa e ação por linha que abre `/mapa?gondola=CODIGO` com a gôndola selecionada.

## Fonte e limites

Os modelos em `src/types/shelfCatalog.ts` são tipos de apresentação temporários, sem impor contrato à API. `getShelfCatalog` retorna uma cópia do estado demonstrativo compartilhado com o mapa, sem rede, persistência ou escrita no banco. O rodapé identifica a origem ilustrativa. Alterações em memória duram durante a navegação e são descartadas ao recarregar.

As situações vêm de `storeMapDemo`. Os seis registros iniciais e suas quantidades seguem a captura; os demais registros têm quantidades ilustrativas. A busca por nome de produto usa apenas os produtos demonstrativos preenchidos para A12, sem representar o catálogo completo.

Cadastro, edição e exclusão estão disponíveis em modais, além da consulta no mapa. Header e Sidebar existentes são preservados.

## Operações demonstrativas

- **Nova gôndola:** código único, setor existente e localização obrigatória. Os códigos são normalizados em maiúsculas; a validação temporária aceita até 12 letras, números ou hífen. Essa regra de apresentação deve ser reconciliada com o backend antes da integração.
- **Editar:** permite alterar código, setor e localização, preservando produtos, quantidades e situação de estoque. Após salvar, os filtros são limpos; os indicadores são recalculados.
- **Excluir:** exige confirmação, com foco inicial em Cancelar. Nesta demonstração, gôndolas com produtos vinculados não podem ser removidas; a mensagem explica o impedimento. O fluxo de transferência/vinculação de produtos ainda está pendente.
- Novas gôndolas começam com zero produtos e situação **Sem produtos**. Não são contabilizadas como abastecidas. O mapa apresenta essa situação na legenda quando houver registros correspondentes.
- O mapa usa o mesmo estado de cadastro, mantém posições livres por setor e acompanha renomeação, mudança de setor e exclusão de gôndolas vazias. O código completo fica disponível no painel de detalhes e no nome acessível quando precisar ser abreviado visualmente no mapa.
- Envio duplo e fechamento dos modais são bloqueados durante a operação. Erros preservam a entrada e permitem nova tentativa. Sucesso é anunciado e o foco retorna a Nova gôndola; cancelamento retorna ao botão de origem.

## Verificação

Validação: `npm run lint`, `npm run test` e `npm run build`. Os 76 testes do projeto incluem indicadores, paginação, filtros, nova tentativa, validação e duplicatas, criação/edição/exclusão, cancelamento, operação pendente, falha sem perda de entrada e sincronização dos dados com o mapa.

A revisão inicial da listagem conferiu 1440 × 1000, alinhamento das setas e rolagem própria da tabela em telas menores. A revisão adicional no Chrome percorreu criação, consulta no mapa, edição, exclusão vazia, impedimento de exclusão ocupada, Escape, retorno de foco e restauração dos exemplos ao recarregar. Os formulários foram conferidos em 390 e 320px, com sessão simulada somente no navegador de teste.
