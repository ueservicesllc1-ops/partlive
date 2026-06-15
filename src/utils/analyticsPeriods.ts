export const getDailyPeriodKey = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getWeeklyPeriodKey = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  
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
