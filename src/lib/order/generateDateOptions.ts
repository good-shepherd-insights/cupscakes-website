interface DateOption {
  label: string;
  value: string;
  other?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateDateOptions(today: Date, leadDays: number, count: number): DateOption[] {
  const options: DateOption[] = [];
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + leadDays);

  while (options.length < count) {
    if (cursor.getDay() !== 0) {
      options.push({
        label: `${WEEKDAYS[cursor.getDay()]}. ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}`,
        value: toLocalISODate(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  options.push({ label: "Other Date", value: "other", other: true });
  return options;
}
