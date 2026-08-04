# Testes E2E do Marc

A suíte pública roda sem criar dados e cobre landing page, cadastro, proteção de
rotas, página pública inexistente e separação responsiva do hero.

```bash
npm run test:e2e
```

Os testes autenticados são ativados somente com uma conta exclusiva de piloto:

```text
E2E_EMAIL=conta-exclusiva-do-piloto
E2E_PASSWORD=senha-da-conta-exclusiva
```

Essa conta deve pertencer a um estabelecimento de testes e não pode ser uma
conta Master. A separação evita que a automação altere dados administrativos ou
de produção. Enquanto as variáveis não existirem, o cenário autenticado aparece
como ignorado, e os testes públicos continuam obrigatórios.

O provisionamento é protegido contra execução acidental. Quando autorizado,
ele cria uma conta dedicada, salva as credenciais somente em `.env.local` e
prepara serviços e disponibilidade ilustrativos:

```bash
E2E_PROVISION_CONFIRM=provision-dedicated-pilot npm run pilot:provision
```

Depois da conta proprietária, a matriz de papéis cria acessos isolados de
gerente, recepção e profissional no mesmo estabelecimento piloto. As senhas
continuam somente em `.env.local`:

```bash
E2E_ROLE_PROVISION_CONFIRM=provision-role-matrix npm run pilot:roles
```

A suíte `appointment-flows.spec.mjs` usa essa matriz para validar o ciclo real:
gerência conclui e lança no caixa, recepção reagenda e cancela, e o profissional
bloqueia a própria agenda. Use somente no estabelecimento piloto, pois a
conclusão preserva o lançamento contábil ilustrativo mesmo após a limpeza do
cliente temporário.

Por isso, o cenário de conclusão exige confirmação explícita:

```bash
E2E_FINANCIAL_MUTATION_CONFIRM=complete-pilot-appointment npx playwright test tests/e2e/appointment-flows.spec.mjs
```

`public-booking.spec.mjs` também cobre a jornada sem vaga: o cliente entra na
lista de espera e a recepção pode converter a solicitação em atendimento ou
removê-la. Os contatos usados nesses cenários são apagados ao final do teste.

`booking-resilience.spec.mjs` força concorrência no mesmo horário, repetição de
pedidos, ocupação durante o preenchimento e falha temporária de rede. A suíte
confirma que o banco impede duplicidade e que a página oferece recuperação.
