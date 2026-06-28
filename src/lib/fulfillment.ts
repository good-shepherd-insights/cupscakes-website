/**
 * Fulfillment scheduling utilities.
 *
 * Pure functions — no framework imports, no side effects, no DOM.
 * Consumed client-side by OrderForm.astro's <script> block.
 */

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessHours = {
  open: string;  // "HH:MM" 24-hour format
  close: string; // "HH:MM" 24-hour format
};

export type FulfillmentConfig = {
  leadHours: number;
  businessHours: Partial<Record<DayOfWeek, BusinessHours>>;
  slotIntervalMinutes: number;
};

/**
 * Returns all calendar dates that are valid for ordering,
 * from the earliest selectable date (today + leadHours) through
 * a 30-day window, skipping days that have no businessHours entry.
 */
export function getAvailableDates(
  config: FulfillmentConfig,
  referenceDate: Date = new Date(),
): string[] {
  const dates: string[] = [];
  const earliest = new Date(referenceDate);
  earliest.setHours(earliest.getHours() + config.leadHours, 0, 0, 0);

  const latest = new Date(referenceDate);
  latest.setDate(latest.getDate() + 30);

  const dayKeys: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const current = new Date(earliest);
  while (current <= latest) {
    const dayKey = dayKeys[current.getDay()];
    if (config.businessHours[dayKey]) {
      dates.push(formatDate(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Returns available time slots for the given date string (YYYY-MM-DD),
 * formatted as "HH:MM – HH:MM" ranges based on the day's business hours
 * and slot interval. If the date is today (relative to referenceDate),
 * past time slots are excluded.
 */
export function getTimeSlots(
  config: FulfillmentConfig,
  date: string,
  referenceDate: Date = new Date(),
): string[] {
  const parsed = new Date(date + "T00:00:00");
  const dayKeys: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayKey = dayKeys[parsed.getDay()];
  const hours = config.businessHours[dayKey];
  if (!hours) return [];

  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);

  const slots: string[] = [];
  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // If the selected date is today, skip slots that have already started
  const isToday =
    parsed.getFullYear() === referenceDate.getFullYear() &&
    parsed.getMonth() === referenceDate.getMonth() &&
    parsed.getDate() === referenceDate.getDate();
  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  while (currentMinutes + config.slotIntervalMinutes <= closeMinutes) {
    if (!isToday || currentMinutes >= nowMinutes) {
      const startStr = formatMinutes(currentMinutes);
      const endStr = formatMinutes(currentMinutes + config.slotIntervalMinutes);
      slots.push(`${startStr} – ${endStr}`);
    }
    currentMinutes += config.slotIntervalMinutes;
  }

  return slots;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
