export const currentLegalDocuments = {
  terms: {
    version: "2026-08-29",
    contentSha256: "5b3a2c77967c6d5eae3da876ae591bf1712761d078c7f0a9c5f7effffe3fe4b5",
    title: "Termos de Uso",
    href: "/termos",
  },
  privacy: {
    version: "2026-08-30",
    contentSha256: "1d5b46e1ea22d876fb1180aeb9138a05f8021b20fb2cbc67788a5c1a1c528d5e",
    title: "Política de Privacidade",
    href: "/privacidade",
  },
};

export function hasCurrentLegalAcceptance(acceptances = []) {
  return Object.entries(currentLegalDocuments).every(([documentType, document]) => (
    acceptances.some((acceptance) => (
      acceptance.document_type === documentType
      && acceptance.document_version === document.version
    ))
  ));
}
