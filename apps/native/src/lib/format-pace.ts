export function paceMpsToMinPerKm(mps: number): string {
  if (!Number.isFinite(mps) || mps <= 0) return "";
  const secPerKm = 1000 / mps;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm - minutes * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function parsePaceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return Number.NaN;
  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);
  if (seconds >= 60) return Number.NaN;
  const secPerKm = minutes * 60 + seconds;
  if (secPerKm <= 0) return Number.NaN;
  return 1000 / secPerKm;
}
