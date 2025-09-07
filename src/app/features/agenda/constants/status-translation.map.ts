import { AppointmentStatus } from '../../../api/model/appointment-status.enum';

// Mapeo de estados a claves de traducción i18n
export const STATUS_TRANSLATION: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'STATUS.PENDING',
  [AppointmentStatus.CONFIRMED]: 'STATUS.CONFIRMED',
  [AppointmentStatus.CHECKED_IN]: 'STATUS.CHECKED_IN',
  [AppointmentStatus.IN_PROGRESS]: 'STATUS.IN_PROGRESS',
  [AppointmentStatus.COMPLETED]: 'STATUS.COMPLETED',
  [AppointmentStatus.CANCELLED]: 'STATUS.CANCELLED',
  [AppointmentStatus.NO_SHOW]: 'STATUS.NO_SHOW',
  [AppointmentStatus.RESCHEDULED]: 'STATUS.RESCHEDULED',
};
