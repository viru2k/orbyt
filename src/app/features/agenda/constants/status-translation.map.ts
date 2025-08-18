import { AppointmentStatus } from '../../../api/model/appointment-status.enum';

export const STATUS_TRANSLATION: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Pendiente',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.CHECKED_IN]: 'Check-in',
  [AppointmentStatus.IN_PROGRESS]: 'En Progreso',
  [AppointmentStatus.COMPLETED]: 'Completado',
  [AppointmentStatus.CANCELLED]: 'Cancelado',
  [AppointmentStatus.NO_SHOW]: 'No Show',
  [AppointmentStatus.RESCHEDULED]: 'Reprogramado',
};
