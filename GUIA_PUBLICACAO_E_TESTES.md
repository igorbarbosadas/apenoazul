# Apê no Azul 1.0 | Publicação e testes

## Publicar no GitHub Pages

1. Exporte um backup do aplicativo antigo antes de qualquer alteração no GitHub.
2. No repositório, guarde uma cópia da versão antiga. Você pode criar uma branch chamada `versao-antiga` antes de substituir os arquivos.
3. Extraia o ZIP deste projeto.
4. Envie o conteúdo da pasta de publicação para a raiz do repositório: `index.html`, `styles.css`, `app.mjs`, `core.mjs`, `storage.mjs`, `demo-data.json`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png`, `README.md` e pasta `assets`.
5. Em **Settings > Pages**, mantenha `Deploy from a branch`, `main` e `/(root)`.
6. Acesse `https://igorbarbosadas.github.io/apenoazul/`. Se a versão anterior continuar carregando, feche a aba e reabra. Não limpe dados do site sem antes exportar o backup.

## Importar o backup antigo

1. Acesse **Ajustes > Importar backup antigo ou novo**.
2. Selecione o arquivo JSON da versão anterior.
3. Confirme a substituição. O sistema tenta preservar uma cópia de recuperação local.
4. Confira o aviso de rendimento da Vale de outubro de 2026. O valor original tem mais de duas casas decimais, então precisa ser revisado manualmente.
5. Confirme as 41 obrigações e o valor de R$ 800 registrado como pago.

## Roteiro de validação, com resultado esperado

| Local | Ação | Resultado esperado |
|---|---|---|
| Início | Abrir novembro/2026 | Resumo do imóvel e rendimentos/despesas do mês |
| Finanças | Registrar rendimento recebido de R$ 200,00 | Aumenta o recebido em R$ 200 sem criar entrada prevista |
| Finanças | Registrar rendimento previsto de R$ 100,00 | Aparece em a receber, não em recebido |
| Finanças | Registrar gasto pago de R$ 25,50 | Aumenta as saídas em R$ 25,50 |
| Finanças | Editar e excluir o gasto | O histórico e os totais mudam uma única vez |
| Recorrentes | Criar uma conta mensal de R$ 80 | A previsão considera a ocorrência, sem registrá-la como paga |
| Recorrentes | Confirmar a ocorrência | A conta deixa a lista de pendentes e aparece no histórico uma única vez |
| Imóvel > Parcelas | Conferir dezembro/2026 | Duas parcelas da construtora somam R$ 6.094,09 antes de reajustes |
| Imóvel > Parcelas | Pagar parcialmente uma parcela | O saldo em aberto diminui sem alterar o valor contratado |
| Imóvel > Financiamento | Simular SAC e Price | Os sistemas geram trajetórias distintas sem adicionar R$ 195.770,80 ao gasto mensal |
| Agenda | Consultar dezembro/2026 | Compromissos nominais e recorrentes do período |
| Relatórios | Trocar o mês | Gráfico, categorias e valores acompanham o período |
| Metas | Adicionar uma meta e valor guardado | Progresso acompanha os valores salvos |
| Documentos | Anexar PDF de até 2 MB | Documento aparece para abrir ou excluir |
| Ajustes | Exportar e reimportar JSON | Os registros são recuperados e os totais permanecem coerentes |
| Geral | Recarregar no navegador | Registros permanecem salvos |
| Celular | Abrir menu inferior e modal | Conteúdo acessível sem rolagem horizontal exagerada |

## Limites desta fase

O serviço é hospedado no GitHub Pages, sem servidor próprio. Não há cadastro online, sincronização entre aparelhos, integrações bancárias, processamento automático de contratos nem assinatura comercial. O armazenamento é local, preferencialmente IndexedDB, com fallback para armazenamento local. Para preservar dados, exporte backups regularmente.

O valor de financiamento total não é uma despesa mensal. INCC é apenas referência/simulação, e reajustes contratuais devem ser informados no boleto. Saldo projetado não equivale ao saldo da sua conta bancária.

## Testes técnicos efetuados

Os testes de regras de negócio podem ser repetidos com `node tests/core.test.mjs`. A verificação de sintaxe utiliza `node --check app.mjs`. A execução interativa em navegador precisa ser validada na publicação, pois o navegador automatizado do ambiente bloqueou acesso ao aplicativo local.
