export function calendarToInstant(date: string): string {
    const [y, m, d] = date.split("-").map((p) => Number.parseInt(p, 10));
    return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

export function instantToCalendar(instant: string): string {
    return instant.slice(0, 10);
}
