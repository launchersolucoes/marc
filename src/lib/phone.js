export function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function isValidPhone(input) {
  const digits = normalizePhone(input);
  return digits.length >= 8 && digits.length <= 15;
}
