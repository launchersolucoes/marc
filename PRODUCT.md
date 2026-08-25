# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O público principal são donos e gerentes de barbearias e salões de beleza. Profissionais autônomos do mesmo setor também fazem parte do público quando precisam organizar a própria agenda e operação.

Essas pessoas trabalham em uma rotina de atendimento presencial, geralmente com horários coordenados por caderno, conversas manuais no WhatsApp ou planilhas. O trabalho central é manter a agenda organizada, reduzir faltas, acompanhar a equipe e entender o resultado financeiro do negócio sem aumentar o trabalho administrativo.

## Confirmed MVP Scope

- Cadastro e autenticação.
- Cadastro e configuração do estabelecimento.
- Cadastro de profissionais e equipe.
- Cadastro de serviços.
- Agenda interna.
- Página pública de agendamento.

## Roles and Permissions

- **Admin da plataforma:** equipe da Launcher, proprietária do Marc, com acesso administrativo global.
- **Dono do estabelecimento:** administra o negócio e pode também atuar como profissional.
- **Gerente:** visualiza e opera a agenda completa do estabelecimento.
- **Recepcionista:** visualiza e opera a agenda completa do estabelecimento.
- **Profissional:** visualiza e opera apenas a própria agenda.

Os papéis pertencem ao contexto de cada estabelecimento. Uma mesma pessoa pode ser dona do estabelecimento e também possuir um perfil profissional.

## Scheduling Rules

- Cada profissional define os próprios serviços, valores, duração e demais regras de atendimento.
- Cada profissional também define o intervalo de preparação antes e depois de cada serviço. Dono e gerente definem as regras gerais do estabelecimento: antecedência mínima, janela máxima de reservas, prazo de cancelamento/reagendamento e confirmação automática ou manual.
- O catálogo pode ser consultado pela equipe, mas somente um acesso conectado a um perfil profissional cria ou altera a própria oferta, valor e duração; recepção e gestão não assumem silenciosamente essas regras.
- O estabelecimento mantém nome, endereço, telefone, horário de funcionamento, logo, serviços, preços e equipe.
- A possibilidade de dono ou gerente alterar regras definidas por um profissional ainda depende de confirmação.

## Product Purpose

O Marc é um sistema web de agendamentos para barbearias e salões. Ele permite que clientes agendem sozinhos, automatiza lembretes no WhatsApp e reúne a gestão operacional e financeira do estabelecimento.

O produto existe para reduzir o trabalho manual, evitar conflitos de horário, diminuir faltas e dar aos responsáveis uma visão confiável da agenda, do faturamento e das comissões.

Sucesso significa uma operação previsível: clientes conseguem marcar com facilidade, a equipe sabe o que acontecerá no dia e os responsáveis gastam menos tempo confirmando horários ou reconciliando controles separados.

## Positioning

O diferencial central do Marc é reunir, no mesmo sistema e para a rotina específica de barbearias e salões:

- agendamento online disponível 24 horas;
- lembretes automáticos no WhatsApp;
- agenda individual por profissional;
- gestão financeira;
- cálculo de comissões;
- relatórios e histórico de clientes.

A proposta não é apenas substituir uma agenda digital, mas conectar aquisição do agendamento, confirmação, execução do atendimento e controle financeiro em um único fluxo.

## Operating Context

- Clientes escolhem serviço, profissional e horário.
- A equipe acompanha a agenda diária e o status dos atendimentos.
- Lembretes são enviados pelo WhatsApp antes do horário.
- Donos e gerentes acompanham entradas, saídas, faturamento e comissões.
- O produto substitui ou consolida controles antes espalhados entre caderno, WhatsApp manual e planilhas.
- O acesso acontece pelo navegador em celular ou computador; clientes não precisam instalar um aplicativo para agendar.

## Capabilities and Constraints

- O produto é uma aplicação web.
- A base permanente é uma aplicação Next.js conectada ao Supabase, com autenticação, banco relacional e políticas de acesso por estabelecimento.
- Cadastro por e-mail e senha, onboarding do estabelecimento, serviços, equipe, disponibilidade, agenda interna, clientes e agendamento público já persistem dados reais.
- O ciclo do atendimento já permite confirmar, iniciar, concluir, cancelar e registrar falta. Atendimentos concluídos geram uma entrada financeira vinculada e dono/gerência podem registrar despesas no caixa mensal.
- Profissionais e clientes podem ser editados, desativados ou arquivados sem apagar o histórico; convites podem ser renovados ou revogados, e cada profissional pode pausar ou reativar suas próprias ofertas. Pessoas com atendimentos futuros não podem ser arquivadas até que esses horários sejam tratados.
- Comissões por profissional são configuráveis por dono ou gerente, registradas como fotografia da taxa no momento da conclusão e exibidas em um relatório mensal; profissionais visualizam somente o próprio resultado.
- Donos e gerentes possuem relatórios mensais de faturamento, ticket médio, comparecimento, origem dos agendamentos, serviços e desempenho da equipe.
- Donos e gerentes podem exportar os atendimentos do mês em uma planilha compatível com Excel e salvar a visão consolidada do relatório como PDF; os arquivos respeitam o estabelecimento autenticado e neutralizam fórmulas vindas de campos de texto.
- Clientes podem entrar em uma lista de espera por serviço, profissional e data quando não houver vaga; a equipe converte solicitações em horários confirmados. Atendimentos pendentes ou confirmados podem ser reagendados com nova validação de disponibilidade, bloqueios e conflitos.
- Cada confirmação pública agora entrega uma área do cliente sem senha por link seguro, revogável e válido por 90 dias. Nela, o cliente consulta próximos horários e histórico, cancela ou reagenda, acompanha e abandona a lista de espera, atualiza os próprios dados e agenda novamente. O banco guarda somente o hash do token; a equipe pode gerar ou substituir o acesso pela ficha do cliente, e as mutações são auditadas sem registrar contatos pessoais nos metadados.
- Donos e gerentes configuram a antecedência mínima para reservar, a janela de até 60 dias, o prazo de cancelamento/reagendamento e se novas reservas públicas entram confirmadas ou aguardam a equipe. Os defaults são 2 horas, 60 dias, 2 horas e confirmação automática. Buffers antes/depois de cada serviço são definidos pelo profissional e bloqueiam disponibilidade, folgas e conflitos diretamente no banco.
- A entrega automática desse link continua dependente de Resend ou WhatsApp. Até essas integrações serem ativadas, o link aparece na confirmação do agendamento e pode ser copiado pela equipe.
- Dono e gerente já podem atualizar os dados públicos do estabelecimento; cada usuário pode atualizar o próprio perfil, solicitar recuperação de senha por e-mail e trocar a senha em uma sessão autenticada.
- Convites de equipe geram links individuais vinculados ao e-mail e com validade de 7 dias. O envio transacional está preparado para Resend e mantém o link copiável como fallback; a entrega automática passa a funcionar quando `RESEND_API_KEY` e `EMAIL_FROM` forem configurados.
- O login Google está implementado atrás da flag `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. Ele deve permanecer oculto até o provedor Google ser configurado no Supabase e a flag ser ativada.
- Agendamento online, lembretes no WhatsApp, gestão financeira, agenda por profissional, comissões e relatórios são capacidades confirmadas como parte da proposta do produto. A primeira entrega da gestão financeira — entradas por atendimento, saídas manuais e saldo mensal — já está implementada.
- O primeiro MVP inclui autenticação, estabelecimentos, equipe, serviços, agenda interna e página pública de agendamento; esse núcleo já está implementado e segue em endurecimento.
- A camada de integridade do MVP normaliza telefones de clientes por estabelecimento, impede duplicações equivalentes e rejeita agendamentos com data passada, preço adulterado ou referências de cliente, serviço e profissional fora do mesmo estabelecimento.
- Um estabelecimento isolado de piloto mantém serviços e disponibilidade ilustrativos para testes E2E. A suíte valida login, permissões de dono, carregamento das áreas operacionais, responsividade, agendamento público e o ciclo interno de criar, iniciar e cancelar atendimentos; dados transacionais de teste são removidos ao final de cada cenário.
- Automações de WhatsApp ficam para uma fase posterior. A infraestrutura da Meta WhatsApp Cloud API está explicitamente em espera até a Launcher possuir uma conta empresarial e um número dedicado.
- O lançamento está confirmado com assinatura e teste grátis de 14 dias antes da cobrança. A fundação técnica já está implementada: cada novo estabelecimento recebe automaticamente o trial, o acesso operacional é bloqueado após o vencimento sem apagar dados, a página pública de agendamento deixa de aceitar novas reservas e eventos de assinatura ficam registrados para auditoria.
- Donos e gerentes já visualizam o estado do trial/assinatura dentro do produto. A fundação de cobrança usa Stripe Checkout, Customer Portal e webhooks idempotentes, mas permanece inativa até a Launcher configurar a conta, os produtos, os Price IDs, as chaves e o endpoint de webhook.
- A Launcher possui um painel Master protegido para acompanhar todos os estabelecimentos, profissionais, agendamentos e estados de assinatura. Enquanto a cobrança automática não estiver conectada, administradores da plataforma podem alterar plano, status e prazo de acesso manualmente, com registro de auditoria.
- O painel Master também coordena o piloto assistido: calcula prontidão sem expor dados de clientes, acompanha três rodadas, guarda validações manuais e centraliza problemas P1/P2/P3. A matriz isolada de dono, gerente, recepção e profissional já está provisionada para o estabelecimento piloto.
- O acesso Master usa uma lista explícita de administradores. A conta da Launcher deve primeiro existir no Auth do Marc e, depois de validada, ser autorizada pelo identificador interno do usuário; o endereço de e-mail sozinho nunca concede privilégios globais.
- Os preços mensais estão confirmados: Starter por R$ 29,90, Pro por R$ 49,90 e Max por R$ 99,90. Os limites e demais regras comerciais continuam sujeitos à confirmação.
- Números de clientes, agendamentos, redução de faltas e tempo economizado ainda não foram confirmados.

## Brand Commitments

- Nome: Marc.
- A marca usa um mascote de cachorro estilizado com óculos escuros.
- A voz é direta, confiante e sem jargão técnico.
- A comunicação deve falar em benefícios concretos para donos e gerentes: tempo economizado, menos faltas, mais organização, melhor controle e profissionalismo.
- O logotipo fornecido está em `public/assets/marc-logo.png`; a versão recortada usada na interface está em `public/assets/marc-logo-cropped.png`.
- O mascote isolado está em `public/assets/marc-mascot.png`; o favicon oficial está em `src/app/icon.png`.
- O sistema visual existente está documentado em `design.md` e implementado em `src/app/globals.css`.

## Evidence on Hand

- `prompt.md`: estrutura e conteúdo pretendidos para a landing page.
- `design.md`: identidade visual, tokens, tipografia e tom de voz existentes.
- `src/app/landing-page.jsx`: implementação da landing page e demonstração das capacidades do produto.
- `public/assets/marc-product-overview.png`: captura real da visão geral do estabelecimento piloto, com dados demonstrativos.
- `public/assets/marc-product-agenda.png`: captura real da agenda interna do estabelecimento piloto, com dados demonstrativos.
- `public/assets/marc-product-booking-mobile.png`: captura real do agendamento público em viewport móvel, com dados demonstrativos.
- `public/assets/marc-whatsapp-reminder.png`: mockup ilustrativo do fluxo de lembretes.

Os preços mensais e o teste grátis de 14 dias estão confirmados. Métricas, nomes de estabelecimentos, fotografias, depoimentos e limites de planos presentes na landing page continuam ilustrativos até nova confirmação.

## Product Principles

1. **Diminuir trabalho manual:** cada fluxo deve economizar ações repetitivas para donos, gerentes e equipe.
2. **Manter a operação previsível:** agenda, confirmações, financeiro e comissões precisam formar uma visão coerente do negócio.
3. **Facilitar para o cliente final:** marcar um horário deve ser possível a qualquer momento, sem ligação, conversa demorada ou instalação de aplicativo.
4. **Falar em resultados concretos:** o produto deve explicar seu valor por meio de tempo, organização, redução de faltas e controle, sem jargão técnico.
5. **Não fabricar prova:** métricas, depoimentos e alegações quantitativas sem confirmação devem permanecer claramente ilustrativos; os preços mensais e o teste de 14 dias são fatos comerciais confirmados.
