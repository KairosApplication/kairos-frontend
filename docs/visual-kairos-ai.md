# KAIROS IA — cobertura visual

Referência: captura Web (new), frame `574:1830`. Rota protegida `/kairos-ia`.

Lista pesquisável de conversas, seleção de histórico, nova conversa, mensagens de usuário/assistente, prioridades, links contextuais e formulário de envio. A demonstração usa respostas determinísticas para vendas, estoque e reposições, com resposta de orientação para os demais textos. Mensagens e conversas novas duram somente enquanto a página estiver montada.

O rótulo Demo, a origem de cada resposta e o aviso junto ao formulário deixam explícito que não há modelo de IA, consulta nova aos dados, API externa, chave ou envio de conteúdo fora do navegador. Falha preserva o texto e permite tentar novamente, sem duplicar a mensagem do usuário; envio duplo é bloqueado.

A integração real com IA está fora desta entrega. A PR nasce diretamente da main `077293d` e não depende das telas de Reposição ou Insights: os links usam rotas já existentes, que continuarão provisórias até as respectivas PRs serem integradas.
