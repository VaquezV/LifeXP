export function toLocalDateString(input: Date = new Date()) {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, '0');
  const day = `${input.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function fromLocalDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(input: Date, amount: number) {
  const nextDate = new Date(input);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

export function getStartOfWeek(input: Date = new Date()) {
  const dayIndex = input.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  return addDays(new Date(input.getFullYear(), input.getMonth(), input.getDate()), mondayOffset);
}

export function getWeekDateKeys(input: Date = new Date()) {
  const start = getStartOfWeek(input);
  return Array.from({ length: 7 }, (_, index) => toLocalDateString(addDays(start, index)));
}

export function getTrailingDateKeys(length: number, endDate: Date = new Date()) {
  return Array.from({ length }, (_, index) =>
    toLocalDateString(addDays(endDate, index - length + 1)),
  );
}

export function isWeekendDate(dateValue: string) {
  const dayIndex = fromLocalDateString(dateValue).getDay();
  return dayIndex === 0 || dayIndex === 6;
}

export function formatLongDate(value: string) {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(fromLocalDateString(value));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShortDay(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
  })
    .format(fromLocalDateString(value))
    .replace('.', '')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDayOfMonth(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
  }).format(fromLocalDateString(value));
}

export function formatShortMonth(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
  })
    .format(fromLocalDateString(value))
    .replace('.', '');
}

export function formatWeekRange(referenceDate: string) {
  const weekDates = getWeekDateKeys(fromLocalDateString(referenceDate));
  const start = weekDates[0];
  const end = weekDates[weekDates.length - 1];

  return `${formatDayOfMonth(start)} ${formatShortMonth(start)} - ${formatDayOfMonth(end)} ${formatShortMonth(end)}`;
}
