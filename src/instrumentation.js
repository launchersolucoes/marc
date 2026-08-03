export async function register() {}

export function onRequestError(error, _request, context) {
  const event = {
    event: "marc_request_error",
    digest: typeof error?.digest === "string" ? error.digest : null,
    name: typeof error?.name === "string" ? error.name : "UnknownError",
    route: context?.routePath || "unknown",
    routeType: context?.routeType || "unknown",
    router: context?.routerKind || "unknown",
    occurredAt: new Date().toISOString(),
  };

  // Não registra headers, URL real, corpo da requisição ou mensagem do erro:
  // esses campos podem conter telefone, e-mail, token ou dados do cliente.
  console.error(JSON.stringify(event));
}
