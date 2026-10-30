# Produtos nas gôndolas

A ação **Gerenciar produtos da gôndola** consulta os vínculos no catálogo por empresa, permite cadastrar quantidade positiva, editar quantidade e remover um vínculo após confirmação.

Leitura: `GET /api/v1/store-map`. Gravação: `POST /product-shelves/registration`, `PATCH /product-shelves/update/{id}`, `DELETE /product-shelves/delete/{id}`, com prefixo `/api/v1`, cookies e CSRF compartilhados.

As quantidades seguem o DTO: inteiros positivos de até 2147483647. Remover um vínculo remove o saldo cadastrado; não representa transferência ao depósito. A API não aceita zerar a quantidade nesses endpoints. Conflitos e permissões retornados pelo servidor são apresentados ao usuário.

Não há repetição automática de gravações. Sem confirmação, o formulário fica indisponível até consultar novamente. Fechar após alterações atualiza os indicadores da página de gôndolas. Nenhum endpoint de listagem global é usado para descobrir produtos ou gôndolas.
