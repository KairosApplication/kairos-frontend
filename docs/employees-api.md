# Funcionários — integração real

Consulta `GET /employees/list`, cadastro `POST /employees/registration`, alteração de função `PATCH /employees/update/{id}` e exclusão `DELETE /employees/delete/{id}`, sob `/api/v1`. Usa cookies, CSRF e erros do cliente HTTP compartilhado. Não há fallback para dados demonstrativos.

O DTO fornece ID do funcionário, ID do usuário, nome e função. A tela pesquisa nome/ID, filtra função e pagina seis registros por vez. Totais representam somente os cadastros retornados, sem inferir presença, turno, e-mail ou empresa.

Cadastro envia `user: {name,lastName,email,cpf,birthDate,password}` e `position`. A senha inicial não é persistida no navegador. Edição altera somente função, conforme o contrato. A API aceita novos cadastros/alterações de CASHIER e STOCKER; gerentes são consultáveis, mas não editáveis/excluíveis nesta interface. Exclusão pede confirmação e remove o vínculo de funcionário, não o usuário.

Formulários associam labels e erros, focam o primeiro campo inválido e bloqueiam envio duplicado/fechamento durante a gravação. Erros conhecidos preservam o rascunho; falhas sem confirmação exigem nova consulta antes de gravar outra vez. A listagem é recarregada após sucesso.
