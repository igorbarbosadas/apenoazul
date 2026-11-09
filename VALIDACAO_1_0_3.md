# Validação orientada · Apê no Azul 1.0.3

Atualização focada exclusivamente em cálculo financeiro. Os seus dados locais, README e imagem de capa não são substituídos.

## Antes de atualizar

1. Abra a versão publicada, entre em Ajustes e exporte o backup JSON.
2. Guarde o arquivo e substitua os arquivos do GitHub Pages pelo conteúdo do ZIP, inclusive `core.mjs`, `app.mjs` e `sw.js`.
3. Atualize a página. Não use “Limpar dados”.

## Testes de tela, com resultado esperado

1. **Início, novembro de 2026:** confira a diferença entre o valor recebido e a projeção. A projeção considera valores previstos, e “saldo realizado” deve usar apenas o que foi recebido e pago. Transferências não entram como rendimentos nem despesas.
2. **Imóvel, dezembro de 2026:** confira o total nominal de R$ 6.094,09 em parcelas da construtora, antes de reajustes. O financiamento total de R$ 195.770,80 não deve aparecer como prestação mensal.
3. **Finanças → Recorrentes, dezembro de 2026:** a renda recorrente Vale deve aparecer para confirmar, caso ainda esteja ativa e não tenha sido confirmada no período. Confirmar uma ocorrência somente uma vez.
4. **Ajustes → Prestação bancária:** somente se você já possui valor de prestação informado, deixe a data de início vazia temporariamente, consulte Início e confirme que aparece alerta. Não deve haver desconto bancário na previsão sem essa data. Depois restaure sua configuração original.
5. **Finanças → Movimentações e Relatórios:** confronte os recebimentos, as despesas pagas e o saldo projetado do mesmo mês. O gráfico de despesas considera pagamentos realizados, não lançamentos pendentes.
6. **Persistência:** recarregue a página e confirme que os registros, pagamentos e rendimentos não mudaram.

## Pontos ainda pendentes

- A renda de referência não substitui pagamentos efetivos. Um mês com receitas parciais cadastradas pode ficar com projeção abaixo do total que você espera receber. Nesse caso, registre as receitas previstas separadamente.
- O saldo realizado é uma diferença de fluxos do mês, não o saldo de uma conta bancária.
- A simulação do financiamento não inclui as condições completas do contrato bancário, como seguros e atualização monetária.
- Teste visual automatizado em navegador não foi executado nesta entrega. A validação funcional no GitHub Pages permanece necessária.

## Resumo técnico

Os três painéis Início, Finanças e Relatórios e a Agenda consomem os mesmos cálculos do `core.mjs`. Incluí testes de cenário com o backup fornecido pelo usuário, sem alterar o arquivo original. Os testes de centavos, pagamentos antecipados, pendências, recorrências e transferências foram executados no Node.js.
