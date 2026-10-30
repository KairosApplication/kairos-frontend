# Central de Reposição — registros reais

Consulta `/restockings/list`, `/employees/list`, `/inventories/list` e o catálogo `/store-map`, sob `/api/v1`. Depósitos são selecionados pelos setores presentes no catálogo. A API valida autorização e empresa durante as gravações.

Cadastro usa `/restockings/registration`, edição `/restockings/update/{id}` e exclusão `/restockings/delete/{id}`. O JSON envia IDs numéricos de produto, gôndola, responsável e depósito, quantidade reposta positiva e avarias entre zero e a quantidade reposta. A data é definida no servidor.

O contrato fornece registros de reposição, não tarefas com estados pendente/em andamento/concluído. O quadro apresenta os registros filtrados, com e sem avarias, sem inferir esses estados. Busca, responsável, data e consulta de todos os registros de cada grupo são funcionais. Editar/excluir registro não significa movimentação automática de estoque.

Há feedback de leitura e gravação, confirmação de exclusão, bloqueio de envio duplicado e reconsulta após respostas incertas. Não há dados demonstrativos nem repetição automática de gravações. O histórico semanal Redis não é exigido para abrir a página.
