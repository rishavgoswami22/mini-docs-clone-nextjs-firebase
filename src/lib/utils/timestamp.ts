function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Returns current time as DD-MM-YYYY HH:mm:ss */
export function now(): string {
  const d = new Date();
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

/** Parse DD-MM-YYYY HH:mm:ss back to a Date object. Falls back to current date on bad input. */
export function parseTimestamp(ts: string | number | undefined): Date {
  if (!ts) return new Date();

  if (typeof ts === "number") return new Date(ts);

  const match = String(ts).match(
    /^(\d{2})-(\d{2})-(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return new Date();

  const [, day, month, year, hours, minutes, seconds] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
}
