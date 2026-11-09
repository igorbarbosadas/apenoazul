# Apê no Azul 1.0.2 | Revisão de estabilidade

## O que mudou
- Entrada monetária: `1.592` é interpretado como R$ 1.592,00, e `1.592,22` como R$ 1.592,22.
- Datas impossíveis, como 30/02/2026, são rejeitadas na validação de registros e backups.
- Transferências entre a mesma conta e com valor zero ou negativo são rejeitadas.
- Se o salvamento falhar, o aplicativo retorna ao último estado salvo, sem apresentar dados não persistidos como definitivos.
- Nenhuma modificação no README, identidade visual ou dados do exemplo.

## Testes manuais após publicação
1. Finanças > Contas: criar conta `Teste revisão` com R$ 1.592,22. Resultado esperado: saldo exibido como R$ 1.592,22. Recarregar e conferir persistência.
2. Finanças > Contas > Transferência: tentar R$ 0,00. Resultado esperado: mensagem de erro e nenhuma transferência criada.
3. Na mesma tela, transferir R$ 25,00 para outra conta. Resultado esperado: alteração de saldos sem criar renda ou gasto.
4. Finanças > Movimentações: lançar gasto de R$ 1.592,00 usando `1.592`, depois confirmar o valor correto na lista.
5. Ajustes > Backup: exportar os dados após testes. Resultado esperado: arquivo JSON e registros preservados após atualizar a página.
6. Verificar que a apresentação do repositório e os dados do imóvel permanecem iguais à versão anterior.

## Testes automáticos realizados
- `node tests/core.test.mjs`: 33 verificações passaram.
- `node tests/review-v102.test.mjs`: 17 verificações passaram.
- Verificação de sintaxe dos módulos JavaScript: passou.

## Limitação
O navegador de testes disponível não permitiu abrir a aplicação em endereço local (bloqueio da plataforma). Portanto os testes interativos dependem da publicação no GitHub Pages.
