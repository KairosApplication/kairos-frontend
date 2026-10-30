# Perfil e Configurações — sessão e preferências reais

Configurações usa a identidade do AuthProvider, sem a loja e as sessões fictícias anteriores. E-mail e permissões vêm da sessão; nome da loja, unidade, telefone e preferências de notificação não fornecidos ficam identificados como não informados, sem formulário que simule salvamento.

Tema claro/escuro continua real e persistente no navegador. Idioma representa o idioma implementado na aplicação; o fuso exibido é o do navegador, sem presumir alteração no servidor. Navegação por seções conserva foco e os controles suportam reflow.

**Verificar sessão** e **Atualizar identificação** usam a revalidação existente em `/auth/me`. **Gerenciar acessos** mostra a conta atual e oferece encerramento explícito da sessão pelo fluxo `/auth/logout`, com CSRF. Não apresenta outras sessões ou timeout inventados. Perfil permanece em consulta porque o contrato de identificação não fornece ID/nome/empresa suficientes para edição segura.

Testes cobrem identidade, campos somente leitura, persistência do tema, navegação, revalidação, logout, teclado e contraste. Não há alteração de cadastro real nos testes.
