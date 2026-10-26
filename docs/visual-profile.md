# Meu Perfil — identidade autenticada

Referência visual: captura Web (new), frame `574:1989`. Rota protegida `/perfil`.

## Comportamento atual

A página reutiliza a sessão confirmada por `/api/v1/auth/me`: e-mail e role MANAGER. O mesmo e-mail identifica a conta no Header, Sidebar e Perfil. Trocar a sessão atualiza a identificação sem preservar dados da conta anterior.

O mock de Ana Costa foi removido. Nome completo, telefone, empresa, unidade, data de vínculo e configuração de 2FA não são fornecidos pelo contrato atual e não são preenchidos com dados fictícios. A Sidebar também deixa de identificar Mercado Aurora como empresa real do gerente. Os demais módulos continuam com seus dados demonstrativos identificados.

O Perfil é de consulta: não há simulação de salvar dados, upload de foto ou ativação de segurança. A orientação de senha continua acessível por botão e modal, sem coleta de credenciais ou alteração da conta. Cargo e permissão indicam somente o acesso de gerente confirmado pela sessão, sem atribuir um título de administrador da unidade.

O layout mantém cartões, campos associados aos labels, foco e adaptação aos temas. O rodapé do Perfil não apresenta a loja fictícia nem a data fixa da demonstração.

## Lacuna no backend escolhido

Referência: checkout local JWT `28c73d8`, conferido em 26/10/2026.

- `AuthController.me`/`AuthResponse` retornam apenas `email` e `roles`.
- `UserResponse` fornece `id`, `name` e `email`, mas o controller só oferece consulta por ID ou a listagem global. A sessão do frontend não recebe esse ID.
- O frontend não consulta `/users/list` para localizar a própria conta nem decodifica JWT/cookies HttpOnly para inventar uma fonte de identidade.
- Não há empresa em `AuthResponse` ou `UserResponse`; também não foi encontrado controller de empresa. O vínculo do gerente precisa ser resolvido no backend, sem presumir que ele pertence a `employees`.

Para concluir nome e empresa reais, ampliar a identificação do próprio usuário autenticado (por exemplo, o `/auth/me` existente ou um endpoint próprio), retornando dados do principal validado. Proposta para discussão com a API: identificação do usuário, nome de apresentação e vínculo de empresa/unidade quando confirmado pelo backend. Esses campos não são um contrato implementado nesta PR.

Não expor senhas, hashes, CPF ou listar usuários de outras contas para resolver essa informação. Alterações de nome/e-mail, telefone, foto e segurança precisam de endpoints, validações e autorização próprios antes de habilitar edição.

## Verificação

Testes cobrem consistência entre Perfil/Header/Sidebar, troca de conta, ausência de dados fictícios, consulta sem operações falsas, bloqueio sem sessão de gerente e retorno de foco do modal. A cobertura de erros de formulário e anúncio de sucesso repetido continua no formulário de Configurações, que ainda é explicitamente demonstrativo.

Executar `npm run test`, `npm run lint`, `npm run build` e `npm run test:browser`. Nenhum teste desta entrega altera o banco ou a conta do gerente.
