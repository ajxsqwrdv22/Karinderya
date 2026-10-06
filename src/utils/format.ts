/** Formats a number as Philippine pesos, e.g. 8450 → "₱8,450.00". */
export function peso(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact peso for tight spaces, e.g. 52300 → "₱52.3K". */
export function pesoCompact(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    return `₱${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
  }
  return peso(value);
}

/** Formats a quantity with its unit, trimming a trailing ".0". */
export function withUnit(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

/** "14:05" → "2:05 PM" */
export function to12Hour(iso: string): string {
  const date = new Date(iso);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${meridiem}`;
}

/** "Today" or "Oct 3" depending on how recent the timestamp is. */
export function friendlyDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) return 'Today';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Percentage of `value` relative to `total`, clamped to 0–100. */
export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}