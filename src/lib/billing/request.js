export function isTrustedBillingRequest(request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === requestOrigin;

  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function billingRedirect(request, parameter, value) {
  const url = new URL("/app/assinatura", request.url);
  url.searchParams.set(parameter, value);
  return Response.redirect(url, 303);
}
