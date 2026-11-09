<div align="center">

![Apê no Azul - Seu imóvel planejado, suas finanças em dia](assets/capa.svg)

# Apê no Azul

### Seu imóvel planejado. Suas finanças em dia.

Um painel para acompanhar a compra do imóvel, organizar os pagamentos e entender como cada compromisso afeta o orçamento pessoal.

[**Abrir aplicativo**](https://igorbarbosadas.github.io/apenoazul/) · [**Conhecer as funcionalidades**](#funcionalidades) · [**Como usar**](#como-usar)

![Versão](https://img.shields.io/badge/vers%C3%A3o-0.6-2455AF?style=flat-square) ![PWA](https://img.shields.io/badge/aplicativo-PWA-1E745D?style=flat-square) ![Hospedagem](https://img.shields.io/badge/hospedagem-GitHub%20Pages-293C58?style=flat-square) ![Idioma](https://img.shields.io/badge/idioma-PT--BR-66788E?style=flat-square)

</div>

---

## O projeto

O **Apê no Azul** nasceu para resolver uma dificuldade real: acompanhar a compra de um apartamento sem perder o controle das finanças do dia a dia. Ele reúne o cronograma de parcelas da construtora, despesas pessoais, previsão de caixa e objetivos para a entrega das chaves.

A versão atual é um **protótipo PWA** que funciona no navegador e pode ser publicado em hospedagem estática. O projeto está em desenvolvimento e ainda não oferece contas individuais nem sincronização entre dispositivos.

## O que você encontra no aplicativo

| Área | Para que serve |
|---|---|
| **Visão geral** | Consulta o saldo estimado do mês, próximos pagamentos e progresso dos compromissos. |
| **Parcelas** | Acompanha vencimentos, registra valores atualizados e pagamentos, adiciona e exclui parcelas. |
| **Meus gastos** | Registra, edita, busca e filtra despesas. Mostra o total por categoria e exporta os lançamentos mensais em CSV. |
| **Previsão** | Projeta os próximos 12 meses com destaque para meses em que o saldo estimado fica negativo. |
| **Objetivos** | Acompanha a meta financeira definida para a etapa de mudança e entrega das chaves. |
| **Ajustes** | Permite editar dados do imóvel, renda, financiamento e reserva mensal. |
| **Backup** | Exporta e importa os registros em JSON para transferir ou preservar informações. |

## Como usar

1. Abra o [Apê no Azul](https://igorbarbosadas.github.io/apenoazul/).
2. Entre em **Ajustes** e confira sua renda e os dados do imóvel.
3. Em **Parcelas**, registre os boletos que foram pagos e os valores corrigidos.
4. Em **Meus gastos**, anote as despesas do mês. Você pode buscar por descrição, filtrar por categoria, editar registros e exportar CSV.
5. Consulte **Visão geral** e **Previsão** para identificar os próximos compromissos.
6. Use a exportação de **backup JSON** regularmente. Os registros são armazenados somente neste navegador.

> **Nota sobre os números:** a parcela bancária deve ser preenchida conforme o financiamento contratado. A previsão não calcula automaticamente o INCC e não substitui os valores atualizados dos boletos.

## Exemplo real para testes

O protótipo vem configurado com um cenário baseado no **Urban Vila Guilherme, Torre A, apartamento 0306**, incluindo o cronograma nominal de 41 compromissos, o preço de R$ 276.804,89 e o valor de financiamento previsto de R$ 195.770,80. O objetivo é validar os cálculos e a experiência usando uma situação concreta.

Esses valores iniciais **não representam dados de todos os usuários** e podem ser alterados no aplicativo. Pagamentos não são marcados como quitados sem confirmação.

## Executar e publicar

O projeto usa **HTML, CSS e JavaScript**, sem backend nesta etapa.

Para publicar no **GitHub Pages**:

1. Envie os arquivos `index.html`, `icon.svg`, `manifest.webmanifest`, `sw.js` e a pasta `assets/` para a raiz do repositório.
2. Abra **Settings → Pages** no repositório.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch `main`, pasta `/(root)` e salve.
5. Acesse o endereço publicado quando a implantação estiver concluída.

Para testar localmente, você pode executar `python -m http.server 8000` na pasta do projeto e acessar `http://localhost:8000`. O service worker e a instalação PWA funcionam corretamente em HTTPS ou localhost.

## Segurança e limitações atuais

- Os dados são gravados no **localStorage** do navegador e não são sincronizados.
- Limpar os dados do navegador pode excluir lançamentos. Exporte um backup antes.
- O GitHub Pages é público. O código e os dados de exemplo incluídos nele podem ser visualizados por visitantes.
- A versão atual não possui cadastro, autenticação, cobrança, armazenamento em nuvem ou acesso multiusuário.
- O aplicativo não faz importação automática de contratos PDF nem aplicação automática de índices de correção.

## Próximos passos

- [x] Dashboard e cronograma financeiro
- [x] Cadastro de parcelas e despesas
- [x] Edição, busca, filtro de gastos e exportação CSV
- [x] Backup JSON e PWA inicial
- [ ] Orçamento planejado por categoria e comparativo com o realizado
- [ ] Lançamentos recorrentes e calendário de alertas
- [ ] Cadastro de múltiplos imóveis
- [ ] Contas e sincronização segura por usuário
- [ ] Importação de contratos com revisão dos dados extraídos
- [ ] Assinaturas, quando houver infraestrutura para contas e pagamentos

---

<div align="center">

**Apê no Azul** · Em desenvolvimento · Versão 0.6

*Planeje hoje. Acompanhe cada etapa do seu imóvel.*

</div>
