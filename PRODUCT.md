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
- Comissões por profissional são configuráveis por dono ou gerente, registradas como fotografia da taxa no momento da conclusão e exibidas em um relatório mensal; profissionais visualizam somente o próprio resultado.
- Donos e gerentes possuem relatórios mensais de faturamento, ticket médio, comparecimento, origem dos agendamentos, serviços e desempenho da equipe.
- Clientes podem entrar em uma lista de espera por serviço, profissional e data quando não houver vaga; a equipe converte solicitações em horários confirmados. Atendimentos pendentes ou confirmados podem ser reagendados com nova validação de disponibilidade, bloqueios e conflitos.
- Dono e gerente já podem atualizar os dados públicos do estabelecimento; cada usuário pode atualizar o próprio perfil, solicitar recuperação de senha por e-mail e trocar a senha em uma sessão autenticada.
- Convites de equipe já geram links individuais vinculados ao e-mail e com validade de 7 dias; o envio automático por e-mail ainda não foi conectado.
- Agendamento online, lembretes no WhatsApp, gestão financeira, agenda por profissional, comissões e relatórios são capacidades confirmadas como parte da proposta do produto. A primeira entrega da gestão financeira — entradas por atendimento, saídas manuais e saldo mensal — já está implementada.
- O primeiro MVP inclui autenticação, estabelecimentos, equipe, serviços, agenda interna e página pública de agendamento; esse núcleo já está implementado e segue em endurecimento.
- Pagamentos e automações de WhatsApp ficam para uma fase posterior. A infraestrutura da Meta WhatsApp Cloud API está explicitamente em espera até a Launcher possuir uma conta empresarial e um número dedicado.
- O lançamento está planejado com assinatura e teste de 7 dias antes da cobrança. A fundação técnica já está implementada: cada novo estabelecimento recebe automaticamente o trial, o acesso operacional é bloqueado após o vencimento sem apagar dados, a página pública de agendamento deixa de aceitar novas reservas e eventos de assinatura ficam registrados para auditoria.
- Donos e gerentes já visualizam o estado do trial/assinatura dentro do produto. A cobrança automática e o checkout ainda dependem da escolha e integração do provedor de pagamentos.
- A Launcher possui um painel Master protegido para acompanhar todos os estabelecimentos, profissionais, agendamentos e estados de assinatura. Enquanto a cobrança automática não estiver conectada, administradores da plataforma podem alterar plano, status e prazo de acesso manualmente, com registro de auditoria.
- A conta `launchersolucoes@gmail.com` é promovida automaticamente a administradora da plataforma quando for criada no Auth do Marc; o painel Master não depende de uma senha de banco compartilhada.
- Preços, limites de planos e demais regras comerciais ainda não foram confirmados como fatos do produto.
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
- `public/assets/marc-dashboard-hero.png`: mockup ilustrativo do produto.
- `public/assets/marc-whatsapp-reminder.png`: mockup ilustrativo do fluxo de lembretes.

Os preços, métricas, nomes de estabelecimentos, fotografias e depoimentos presentes na landing page são ilustrativos. Trabalhos futuros não devem tratá-los como clientes reais, resultados comprovados ou condições comerciais vigentes sem nova confirmação.

## Product Principles

1. **Diminuir trabalho manual:** cada fluxo deve economizar ações repetitivas para donos, gerentes e equipe.
2. **Manter a operação previsível:** agenda, confirmações, financeiro e comissões precisam formar uma visão coerente do negócio.
3. **Facilitar para o cliente final:** marcar um horário deve ser possível a qualquer momento, sem ligação, conversa demorada ou instalação de aplicativo.
4. **Falar em resultados concretos:** o produto deve explicar seu valor por meio de tempo, organização, redução de faltas e controle, sem jargão técnico.
5. **Não fabricar prova:** métricas, depoimentos, preços e alegações quantitativas devem permanecer claramente ilustrativos até serem validados.
