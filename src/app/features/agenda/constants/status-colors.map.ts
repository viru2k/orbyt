import { AppointmentStatus } from '../../../api/model/appointment-status.enum';

export interface EventColor {
  primary: string;
  secondary: string;
}

export const STATUS_COLORS: Record<AppointmentStatus, EventColor> = {
  [AppointmentStatus.PENDING]: { primary: '#f97316', secondary: '#f9731680' }, // Naranja
  [AppointmentStatus.CONFIRMED]: { primary: '#10b981', secondary: '#10b98180' }, // Verde
  [AppointmentStatus.CHECKED_IN]: { primary: '#3b82f6', secondary: '#3b82f680' }, // Azul
  [AppointmentStatus.IN_PROGRESS]: { primary: '#8b5cf6', secondary: '#8b5cf680' }, // Violeta
  [AppointmentStatus.COMPLETED]: { primary: '#6b7280', secondary: '#6b728080' }, // Gris
  [AppointmentStatus.CANCELLED]: { primary: '#ef4444', secondary: '#ef444480' }, // Rojo
  [AppointmentStatus.NO_SHOW]: { primary: '#d97706', secondary: '#d9770680' }, // Ambar
  [AppointmentStatus.RESCHEDULED]: { primary: '#f59e0b', secondary: '#f59e0b80' }, // Amarillo
};
