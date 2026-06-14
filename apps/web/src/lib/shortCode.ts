export function generateShortCode(): string {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join("");
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${letters}-${digits}`;
}
