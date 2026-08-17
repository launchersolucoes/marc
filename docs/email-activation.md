# Ativação de e-mail transacional

O Marc já envia convites de equipe pelo Resend quando as variáveis estão configuradas. Sem elas, o link copiável continua disponível e o piloto não fica bloqueado.

## Pré-requisitos

1. Criar ou acessar a conta Resend da Launcher.
2. Adicionar o domínio remetente que será usado pelo Marc.
3. Publicar os registros DNS indicados pelo Resend e aguardar a validação.
4. Criar uma API key restrita ao envio de e-mails.

## Variáveis na Vercel

- `RESEND_API_KEY`
- `EMAIL_FROM`, no formato `Marc <noreply@seu-dominio>`

Configure primeiro no ambiente Preview e depois em Production. Nunca prefixe a chave com `NEXT_PUBLIC_`.

## Aceite

1. Abra um estabelecimento piloto.
2. Convide um endereço controlado pela Launcher como profissional.
3. Confirme recebimento, remetente, assunto, validade do link e tela de aceite.
4. Reenvie ou crie outro convite para verificar que falhas não removem o link copiável.
5. Consulte os logs por `marc_email_delivery_failed`; o evento registra somente motivo e status do provedor, nunca destinatário ou conteúdo.

O envio possui timeout de 8 segundos para não bloquear indefinidamente a ação da equipe.
