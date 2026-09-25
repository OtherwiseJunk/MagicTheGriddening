export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

export function fromDateString(dateString: string): Date | undefined {
  if (dateString == null || dateString.length != 8) return undefined;

  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Date months are 0-indexed
  const day = parseInt(dateString.substring(6));

  return new Date(year, month, day);
}
