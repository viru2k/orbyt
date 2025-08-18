import { AppointmentStatus } from '../../../api/model/appointment-status.enum';

export const STATUS_SEVERITY: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'warning',
  [AppointmentStatus.CONFIRMED]: 'info',
  [AppointmentStatus.CHECKED_IN]: 'info',
  [AppointmentStatus.IN_PROGRESS]: 'info',
  [AppointmentStatus.COMPLETED]: 'success',
  [AppointmentStatus.CANCELLED]: 'danger',
  [AppointmentStatus.NO_SHOW]: 'danger',
  [AppointmentStatus.RESCHEDULED]: 'warning',
};
