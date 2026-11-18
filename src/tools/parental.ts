/**
 * Elternzeit nach BEEG (Germany).
 * - Each parent: up to 3 years per child; up to 24 months of it may be taken between the 3rd and 8th birthday (§ 15).
 * - The mother's protection period after birth (8/12 weeks) counts towards her Elternzeit (§ 15 Abs. 2).
 * - Written notice to the employer at the latest 7 weeks before the start for periods before the 3rd birthday,
 *   13 weeks for periods between the 3rd and 8th birthday (§ 16).
 * - Protection against dismissal from the notice, at the earliest 8 weeks (resp. 14 weeks) before the start (§ 18).
 */
import { type CalDate, addDays, addMonths, addYears, compare } from '../lib/dates';

export interface ParentalInput { birth: CalDate; start: CalDate; months: number }
export interface ParentalResult {
  end: CalDate;
  noticeDeadline: CalDate;
  protectionFrom: CalDate;
  thirdBirthday: CalDate;
  eighthBirthday: CalDate;
  beyondThird: boolean;
  startsBeforeBirth: boolean;
}

export function calcParental(i: ParentalInput): ParentalResult {
  const end = addDays(addMonths(i.start, i.months), -1);
  const third = addYears(i.birth, 3), eighth = addYears(i.birth, 8);
  const lastBeforeThird = addDays(third, -1);
  const lateStart = compare(i.start, third) >= 0; // whole period after 3rd birthday
  const weeksNotice = lateStart ? 13 : 7, weeksProt = lateStart ? 14 : 8;
  return {
    end,
    noticeDeadline: addDays(i.start, -weeksNotice * 7),
    protectionFrom: addDays(i.start, -weeksProt * 7),
    thirdBirthday: third,
    eighthBirthday: eighth,
    beyondThird: compare(end, lastBeforeThird) > 0,
    startsBeforeBirth: compare(i.start, i.birth) < 0,
  };
}
