# Prontidão do piloto — Marc

Este checklist define o mínimo necessário para colocar um primeiro estabelecimento real em operação sem confundir integrações futuras com bloqueios do MVP.

## Núcleo validado

- [x] Cadastro, login, recuperação de senha e onboarding do estabelecimento.
- [x] Perfis de dono, gerente, recepção e profissional com escopos distintos.
- [x] Cadastro de equipe, clientes e serviços.
- [x] Preço, duração e disponibilidade controlados pelo profissional conectado.
- [x] Criação, confirmação, início, reagendamento, cancelamento, falta e conclusão de atendimentos.
- [x] Proteção contra horários duplicados, bloqueios, datas passadas e referências externas ao estabelecimento.
- [x] Página pública, lista de espera e conversão da espera em atendimento.
- [x] Caixa mensal, despesas, comissões e relatórios operacionais.
- [x] Trial de 14 dias e bloqueio seguro após vencimento.
- [x] Navegação mobile persistente, skeletons por rota e formulários contextuais em sheets.

## Antes de cadastrar o primeiro piloto real

- [ ] Confirmar nome, slug público, endereço, telefone e fuso horário do estabelecimento.
- [ ] Cadastrar profissionais e vincular cada acesso ao perfil correto.
- [ ] Cada profissional deve revisar seus serviços, preços, duração, disponibilidade e folgas.
- [ ] Definir as porcentagens de comissão com o responsável pelo estabelecimento.
- [ ] Fazer um agendamento interno e um público em horário de teste.
- [ ] Concluir o atendimento de teste e conferir caixa, comissão e relatório.
- [ ] Testar recepção e profissional em celulares reais antes de compartilhar o link com clientes.
- [ ] Definir uma pessoa da Launcher para suporte durante a primeira semana.

## Integrações que não bloqueiam o piloto assistido

- Cobrança automática pelo Stripe: a fundação está pronta; ativar seguindo `docs/stripe-activation.md` quando produtos, chaves e webhook estiverem disponíveis.
- Convites por e-mail: o link copiável funciona; envio automático depende de `RESEND_API_KEY` e `EMAIL_FROM`.
- Login Google: permanece oculto até o provedor ser configurado no Supabase.
- Lembretes por WhatsApp: permanecem em espera até existir conta empresarial e número dedicado na Meta.

## Comandos de aceite

```bash
npm run build
npm run test:all
```

Os testes autenticados usam exclusivamente o estabelecimento piloto configurado nas variáveis `E2E_*`. O cenário de conclusão financeira exige `E2E_FINANCIAL_MUTATION_CONFIRM=complete-pilot-appointment`.

