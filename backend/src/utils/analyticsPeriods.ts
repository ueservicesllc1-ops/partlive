export const getDailyPeriodKey = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getWeeklyPeriodKey = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  
  // Calculate ISO Week Number
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const ww = String(weekNum).padStart(2, '0');
  
  return `${yyyy}-${ww}`;
};

export const getMonthlyPeriodKey = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

export const getAnalyticsPeriodKey = (
  period: 'daily' | 'weekly' | 'monthly',
  date: Date = new Date()
): string => {
  switch (period) {
    case 'daily':
      return getDailyPeriodKey(date);
    case 'weekly':
      return getWeeklyPeriodKey(date);
    case 'monthly':
      return getMonthlyPeriodKey(date);
    default:
      return getDailyPeriodKey(date);
  }
};

export const getDateRangeForPeriod = (
  periodKey: string
): { start: Date; end: Date } => {
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
    const start = new Date(periodKey + 'T00:00:00Z');
    const end = new Date(periodKey + 'T23:59:59Z');
    return { start, end };
  }

  // If YYYY-MM (monthly)
  if (/^\d{4}-\d{2}$/.test(periodKey)) {
    const [year, month] = periodKey.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    return { start, end };
  }

  // If YYYY-WW (weekly)
  if (/^\d{4}-\d{2}$/.test(periodKey) || periodKey.includes('-W') || /^\d{4}-\d{2}$/.test(periodKey)) {
    // Default to last 7 days range if parsing is too complex or non-daily
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    return { start, end };
  }

  // Fallback
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};
