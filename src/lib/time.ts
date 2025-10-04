export function hhmmToDecimal(hhmm?: string | null): number {
  if (!hhmm) return 0;
  const value = hhmm.trim();
  if (!value) return 0;

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number.parseFloat(value);
  }

  const match = value.match(/^(-?\d{1,3})(?::(\d{1,2}))?$/);
  if (!match) {
    return 0;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  const absoluteHours = Math.abs(hours) + minutes / 60;
  return hours < 0 ? -absoluteHours : absoluteHours;
}

export function toIsoDate(input: string): string {
  const value = input?.trim();
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = Number.parseInt(slashMatch[1], 10);
    const day = Number.parseInt(slashMatch[2], 10);
    let year = slashMatch[3];
    if (year.length === 2) {
      year = Number.parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year.padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const dashMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const month = Number.parseInt(dashMatch[1], 10);
    const day = Number.parseInt(dashMatch[2], 10);
    let year = dashMatch[3];
    if (year.length === 2) {
      year = Number.parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year.padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return value;
}

export function safeMaxDate(dates: string[]): string | undefined {
  const normalized = dates
    .map((date) => (date ? toIsoDate(date) : ""))
    .filter((value): value is string => Boolean(value));
  if (normalized.length === 0) {
    return undefined;
  }
  return normalized.reduce((latest, current) => (current > latest ? current : latest));
}
