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
