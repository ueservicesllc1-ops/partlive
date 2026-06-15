export function getDailyMissionPeriodKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeeklyMissionPeriodKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const ww = String(weekNum).padStart(2, '0');
  return `${yyyy}-${ww}`;
}

export function getMissionPeriodKey(missionType: 'daily' | 'weekly' | 'event' | 'host' | 'vip' | 'new_user', date: Date = new Date(), eventId?: string): string {
  switch (missionType) {
    case 'daily':
      return getDailyMissionPeriodKey(date);
    case 'weekly':
    case 'host':
      return getWeeklyMissionPeriodKey(date);
    case 'event':
      return eventId || 'event_global';
    case 'new_user':
      return 'static_new_user';
    case 'vip':
      return 'static_vip';
    default:
      return 'global';
  }
}

export function isMissionActive(mission: any, now: Date = new Date()): boolean {
  if (mission.status !== 'active') return false;
  
  if (mission.startsAt) {
    const start = mission.startsAt.toDate ? mission.startsAt.toDate() : new Date(mission.startsAt);
    if (now < start) return false;
  }
  
  if (mission.endsAt) {
    const end = mission.endsAt.toDate ? mission.endsAt.toDate() : new Date(mission.endsAt);
    if (now > end) return false;
  }
  
  return true;
}

export function hasMissionExpired(mission: any, now: Date = new Date()): boolean {
  if (mission.status === 'ended') return true;
  if (mission.endsAt) {
    const end = mission.endsAt.toDate ? mission.endsAt.toDate() : new Date(mission.endsAt);
    if (now > end) return true;
  }
  return false;
}
