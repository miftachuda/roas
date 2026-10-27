/**
 * Date utility for 24h operational day window (00:00 to 24:00).
 * Rule: "if time fetch is not yet 24 use prev day"
 */

export function getInitialOperationalDate() {
  const now = new Date();
  // Any time during today before 24:00:00 (which is virtually all times),
  // today's full 24h record is incomplete.
  // Therefore, the completed operational day is yesterday.
  const target = new Date(now);
  target.setDate(target.getDate() - 1);
  
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseOperationalDayRange(dateString) {
  // dateString is YYYY-MM-DD
  if (!dateString) {
    dateString = getInitialOperationalDate();
  }

  const [year, month, day] = dateString.split('-').map(Number);
  
  // Start: Day 00:00:00.000
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  // End: Day 24:00:00.000 (which is Next Day 00:00:00.000)
  const endDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  const pad = (n) => String(n).padStart(2, '0');

  // Format for PHD Server: MM/DD/YYYY HH:mm:ss.000
  const serverStart = `${pad(month)}/${pad(day)}/${year} 00:00:00.000`;
  const serverEnd = `${pad(endDate.getMonth() + 1)}/${pad(endDate.getDate())}/${endDate.getFullYear()} 00:00:00.000`;

  const displayDate = startDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    dateString,
    startDate,
    endDate,
    serverStart,
    serverEnd,
    displayDate,
    windowLabel: `${pad(day)}/${pad(month)}/${year} 00:00 — 24:00`
  };
}

export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
