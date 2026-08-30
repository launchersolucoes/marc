# Protocolo operacional de retenção de dados

**Versão:** 0.1  
**Atualizado em:** 30 de agosto de 2026  
**Estado:** proposta operacional pendente de validação jurídica e contábil

Este documento orienta a operação do Marc enquanto a política formal é revisada. Ele não é parecer jurídico e não autoriza descarte automático. A LGPD não estabelece um prazo universal para todos os dados: a conservação depende da finalidade, do encerramento do tratamento e das hipóteses legais aplicáveis.

## Princípios

1. Coletar e conservar somente o necessário para uma finalidade informada.
2. Anonimizar contatos antes de preservar histórico sempre que a identificação não for necessária.
3. Interromper o descarte quando existir obrigação legal, disputa, incidente ou bloqueio jurídico documentado.
4. Registrar responsável, motivo e data de revisão de toda exceção.
5. Revisar esta matriz trimestralmente e sempre que uma função, fornecedor ou obrigação mudar.

## Matriz proposta

| Categoria | Regra operacional | Destino ao final | Estado |
|---|---|---|---|
| Contatos e perfis | Enquanto a conta, o vínculo ou o atendimento exigir identificação | Anonimizar após pedido aprovado ou encerramento, salvo obrigação ou disputa registrada | Por finalidade |
| Agenda e lista de espera | Até a conclusão do fluxo e do histórico necessário ao estabelecimento | Remover contatos diretos quando a identificação deixar de ser necessária | Por finalidade |
| Financeiro e fechamentos | Proposta de 5 anos após o período ou encerramento relevante | Preservar somente campos necessários e dissociar contatos quando possível | Validação jurídica e contábil pendente |
| Auditoria e segurança | Proposta de 12 meses | Eliminar; prorrogar somente por incidente ativo, obrigação ou bloqueio documentado | Validação jurídica pendente |
| Pedidos de privacidade | Proposta de 5 anos após o encerramento do pedido | Preservar evidência mínima da análise e resposta; evitar cópias de documentos pessoais | Validação jurídica pendente |
| Convites e links de acesso | Até expiração ou revogação | Invalidar o acesso; conservar apenas hash e evento técnico pelo período de segurança aplicável | Por finalidade |

O prazo de cinco anos para registros financeiros é uma proposta conservadora informada pelos prazos tributários dos artigos 173 e 174 do CTN. A aplicação concreta deve ser confirmada por assessoria jurídica e contábil antes de virar rotina automática.

## Encerramento e pedidos de exclusão

- Confirmar identidade, vínculo, escopo e existência de obrigação de conservação.
- Suspender horários futuros e acessos antes da anonimização.
- Anonimizar nome, telefone e e-mail quando o histórico puder permanecer sem identificar a pessoa.
- Registrar a decisão na fila Master, inclusive quando a exclusão for parcial ou recusada.
- Não anexar documento pessoal à solicitação sem necessidade comprovada.

## Bloqueio jurídico

Uma exceção deve conter motivo, categoria afetada, responsável, data de início e próxima revisão. O bloqueio não permite uso para nova finalidade e termina assim que o fundamento deixar de existir.

## Backups e ambiente piloto

O projeto permanece no plano gratuito do Supabase, sem backup agendado. Até existir plano com backup e restauração validada, o piloto deve usar somente dados sintéticos. Quando backups forem ativados, exclusões deverão alcançar as cópias no ciclo normal de rotação; restaurações exigirão reaplicação das exclusões ocorridas depois da cópia restaurada.

## Responsabilidades

- **Launcher / Marc:** contas da plataforma, segurança, assinatura, fila de direitos e execução técnica.
- **Estabelecimento:** finalidade e qualidade dos dados de seus clientes e atendimentos, além da validação do vínculo em pedidos relacionados à operação.
- **Assessoria jurídica e contábil:** confirmação dos prazos, bases de conservação e procedimento de exceção.

## Referências oficiais

- [LGPD — Lei nº 13.709/2018, especialmente artigos 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD — Perguntas frequentes sobre término do tratamento e conservação](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes)
- [ANPD — Direitos dos titulares de dados](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1)
- [Código Tributário Nacional — artigos 173 e 174](https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm)
