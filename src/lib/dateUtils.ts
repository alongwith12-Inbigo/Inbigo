import { addDays, format, getDay, isBefore, parseISO } from 'date-fns';

export const DAYS_MAP = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];

export interface ReservationData {
  startDate: string;
  endDate: string;
  selectedDays: number[];
  isRepeating: boolean;
  teacherName: string;
  visitTime: string;
  visitorName: string;
  visitorOrg: string;
  reason: string;
  hasVehicle: boolean;
  carNumber: string;
  remarks: string;
}

export function generateDates(data: ReservationData) {
  if (!data.isRepeating) {
    return [data.startDate];
  }

  // Use parseISO to avoid timezone shifts
  let current = parseISO(data.startDate);
  const end = parseISO(data.endDate);
  const dates: string[] = [];

  while (isBefore(current, addDays(end, 1))) {
    if (data.selectedDays.includes(getDay(current))) {
      dates.push(format(current, 'yyyy-MM-dd'));
    }
    current = addDays(current, 1);
  }
  return dates;
}

export function cleanCarNumber(num: string) {
  return num.replace(/[\s-]/g, '');
}
