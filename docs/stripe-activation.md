# Ativação da cobrança Stripe

A integração está implementada, mas permanece inativa até a configuração completa. Não defina valores comerciais no código: cada plano aponta para um `Price` recorrente criado na Stripe.

## Pré-requisitos

- Conta Stripe da Launcher verificada.
- Produtos e preços recorrentes confirmados para os planos que serão vendidos.
- Customer Portal configurado no mesmo modo usado pela aplicação (teste ou produção).
- Chave administrativa do Supabase disponível somente no servidor.

## Variáveis de ambiente

Configure na Vercel, sem prefixo `NEXT_PUBLIC_`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO` (opcional até o plano existir)
- `STRIPE_PRICE_MAX` (opcional até o plano existir)

O checkout só aparece quando existe uma chave Stripe, ao menos um `price_...`, o segredo do webhook e a chave administrativa do Supabase. Essa condição evita receber pagamentos sem conseguir atualizar o acesso.

## Webhook

Cadastre na Stripe o endpoint de produção:

`https://SEU_DOMINIO/api/billing/webhook`

Eventos necessários:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

O corpo do webhook é verificado com a assinatura da Stripe. Eventos repetidos são ignorados pelo identificador do provedor.

## Validação antes de produção

1. Configure tudo primeiro no modo de teste da Stripe.
2. Contrate cada plano pelo Checkout usando uma conta de piloto.
3. Confirme a atualização de plano, status e período dentro do Marc.
4. Abra o Customer Portal e valide faturas, troca de plano e cancelamento conforme a política comercial escolhida.
5. Simule pagamento pendente e cancelamento; nenhum estado inseguro deve liberar acesso.
6. Só depois repita a configuração com chaves, produtos e webhook do modo de produção.

## Decisões comerciais ainda pendentes

- valores e periodicidade de cada plano;
- limites e benefícios por plano;
- política de troca e proporcionalidade;
- prazo de tolerância para pagamento pendente;
- política de cancelamento e reembolso.
