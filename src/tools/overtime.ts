/** Überstundenrechner logic: overtime from actual vs. contracted hours, time off in lieu and payout. */
export interface OvertimeInput {
  /** Contracted weekly hours, e.g. 40 */
  weeklyHours: number;
  /** Working days per week, e.g. 5 */
  daysPerWeek: number;
  /** Actual net minutes worked per day (only working days) */
  workedMin: number[];
  /** Number of weeks the entries cover (for the target), default derived from days */
  weeks?: number;
  hourlyWage?: number;
  /** Overtime premium in percent, e.g. 25 */
  premiumPct?: number;
}
export interface OvertimeResult {
  targetMin: number;
  workedMin: number;
  overtimeMin: number; // negative = undertime (Minusstunden)
  dailyTargetMin: number;
  /** Time off in lieu, in whole + fractional working days */
  daysOff: number;
  payout: number;
}
export function calcOvertime(i: OvertimeInput): OvertimeResult {
  const daily = i.daysPerWeek > 0 ? (i.weeklyHours * 60) / i.daysPerWeek : 0;
  const target = i.weeks !== undefined ? i.weeks * i.weeklyHours * 60 : daily * i.workedMin.length;
  const worked = i.workedMin.reduce((a, b) => a + b, 0);
  const over = worked - target;
  const payout = over > 0 && i.hourlyWage ? (over / 60) * i.hourlyWage * (1 + (i.premiumPct || 0) / 100) : 0;
  return { targetMin: Math.round(target), workedMin: worked, overtimeMin: Math.round(over), dailyTargetMin: Math.round(daily), daysOff: daily ? Math.round((over / daily) * 100) / 100 : 0, payout: Math.round(payout * 100) / 100 };
}
