export const retentionPolicyVersion = "0.1";

export const retentionRules = [
  {
    key: "identity",
    category: "Contatos e perfis",
    period: "Por finalidade",
    summary: "Enquanto a conta, o vínculo ou o atendimento exigir identificação.",
    disposition: "Anonimizar após pedido aprovado ou encerramento, salvo obrigação ou disputa registrada.",
    status: "purpose_based",
  },
  {
    key: "appointments",
    category: "Agenda e lista de espera",
    period: "Por finalidade",
    summary: "Até a conclusão do fluxo operacional e do histórico necessário ao estabelecimento.",
    disposition: "Remover contatos diretos quando a identificação deixar de ser necessária.",
    status: "purpose_based",
  },
  {
    key: "financial",
    category: "Financeiro e fechamentos",
    period: "Proposta: 5 anos",
    summary: "Prazo operacional conservador para obrigações e exercício de direitos.",
    disposition: "Preservar somente os campos necessários e dissociar contatos quando possível.",
    status: "pending_validation",
  },
  {
    key: "audit",
    category: "Auditoria e segurança",
    period: "Proposta: 12 meses",
    summary: "Janela para investigação de falhas, abuso e incidentes.",
    disposition: "Prorrogar apenas por incidente ativo, obrigação ou bloqueio jurídico documentado.",
    status: "pending_validation",
  },
  {
    key: "privacy_requests",
    category: "Pedidos de privacidade",
    period: "Proposta: 5 anos",
    summary: "Evidência mínima da solicitação, análise e resposta realizada.",
    disposition: "Minimizar o conteúdo e evitar cópias de documentos pessoais.",
    status: "pending_validation",
  },
  {
    key: "access_tokens",
    category: "Convites e links de acesso",
    period: "Até expirar ou revogar",
    summary: "Tokens válidos somente durante a finalidade de acesso.",
    disposition: "Invalidar o acesso; manter apenas hash e evento técnico pelo período de segurança aplicável.",
    status: "purpose_based",
  },
];

export const retentionStatusLabels = {
  purpose_based: "Regra por finalidade",
  pending_validation: "Validação pendente",
};
