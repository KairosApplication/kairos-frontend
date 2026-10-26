# Acessibilidade: formulários e mensagens

Task KAIROS-72; revalidação de KAIROS-74 e KAIROS-78.

Atualização em 26/10/2026: o Perfil passou a consultar a identidade autenticada, sem formulário de edição demonstrativa. A cobertura de validação e sucesso repetido foi mantida no formulário de Configurações; o teste do Perfil agora verifica identidade, campos de consulta e ausência de dados fictícios. Os itens abaixo registram a entrega original da PR #44.

- Perfil, Configurações, cadastro demonstrativo de Funcionários e criação demonstrativa de Reposições associam os erros a seus campos via TextField, aria-invalid e aria-describedby.
- Campos obrigatórios rejeitam também espaços em branco; e-mail, limites numéricos e validade nativa são conferidos antes de aceitar o formulário.
- O primeiro campo inválido recebe foco após a renderização. Corrigir um campo não move o foco para outro campo automaticamente.
- O e-mail duplicado de Funcionários e quantidades fora do intervalo em Reposições têm instruções específicas junto ao campo.
- Labels dos componentes compartilhados mostram * nos campos required; os formulários alterados apresentam a legenda.
- Tema e alternância entre Vendas/Clientes têm nomes de grupo, preservando os botões nativos e seus estados aria-pressed.
- Mensagens de resultado dos quatro formulários usam região persistente role=status, aria-live=polite e aria-atomic=true. Cada publicação substitui o nó interno, inclusive quando o texto do resultado se repete.
- Mensagens de erro gerais continuam usando role=alert. A conversa de IA já possui role=log/aria-live e não foi substituída por um segundo anúncio.

Testes Playwright verificam erros, descrições acessíveis, foco, correção, sucesso repetido e cancelamento. A alteração do nó na região viva é verificada automaticamente; a fala efetiva e ausência de anúncios duplicados ainda exigem conferência manual em NVDA, registrada na auditoria consolidada.

Dados continuam demonstrativos; os testes simulam a sessão e não acessam a API. Branch independente da main a532b75, com a mesma infraestrutura de navegador das outras três PRs. Nenhuma PR foi mergeada nesta entrega.
