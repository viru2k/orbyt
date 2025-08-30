import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AgendaService } from '../../../api/services/agenda.service';
import { BlockDatesDto } from '../../../api/models/block-dates-dto';
import { DayOverrideDto } from '../../../api/models/day-override-dto';
import { CalendarAvailabilityDto } from '../../../api/models/calendar-availability-dto';

@Injectable({
  providedIn: 'root'
})
export class AgendaBlockingService {
  private readonly agendaService = inject(AgendaService);

  /**
   * Bloquear múltiples fechas (vacaciones, días libres)
   * @param dates - Array de fechas en formato YYYY-MM-DD
   * @param reason - Razón del bloqueo (opcional)
   * @param professionalId - ID del profesional (opcional para admin)
   */
  blockMultipleDates(
    dates: string[], 
    reason?: string, 
    professionalId?: number
  ): Observable<void> {
    const body: BlockDatesDto = { dates, reason };
    return this.agendaService.agendaControllerBlockMultipleDates({ body, professionalId });
  }

  /**
   * Desbloquear fechas específicas
   * @param dates - Array de fechas a desbloquear
   * @param professionalId - ID del profesional (opcional para admin)
   */
  unblockDates(
    dates: string[], 
    professionalId?: number
  ): Observable<void> {
    const datesParam = dates.join(',');
    return this.agendaService.agendaControllerUnblockDates({ 
      dates: datesParam, 
      professionalId 
    });
  }

  /**
   * Crear configuración especial para un día específico
   * @param dayOverride - Configuración del día
   * @param professionalId - ID del profesional (opcional para admin)
   */
  createDayOverride(
    dayOverride: DayOverrideDto, 
    professionalId?: number
  ): Observable<void> {
    return this.agendaService.agendaControllerCreateDayOverride({ 
      body: dayOverride, 
      professionalId 
    });
  }

  /**
   * Obtener todos los overrides de días en un rango
   * @param from - Fecha inicio (YYYY-MM-DD) opcional
   * @param to - Fecha fin (YYYY-MM-DD) opcional  
   * @param professionalId - ID del profesional (opcional para admin)
   */
  getDayOverrides(
    from?: string, 
    to?: string, 
    professionalId?: number
  ): Observable<void> {
    return this.agendaService.agendaControllerGetDayOverrides({ 
      from, 
      to, 
      professionalId 
    });
  }

  /**
   * Obtener disponibilidad del calendario para un mes específico
   * @param year - Año (ej: 2025)
   * @param month - Mes (1-12) 
   * @param professionalId - ID del profesional (opcional para admin)
   */
  getCalendarAvailability(
    year: number, 
    month: number, 
    professionalId?: number
  ): Observable<CalendarAvailabilityDto> {
    return this.agendaService.agendaControllerGetCalendarAvailability({ 
      year, 
      month, 
      professionalId 
    });
  }

  /**
   * Obtener disponibilidad para un rango de fechas
   * @param from - Fecha inicio
   * @param to - Fecha fin
   * @param professionalId - ID del profesional (opcional para admin)
   */
  getAvailabilityRange(
    from: string, 
    to: string, 
    professionalId?: number
  ): Observable<any> {
    return this.agendaService.agendaControllerGetAvailabilityRange({ 
      from, 
      to, 
      professionalId 
    });
  }

  /**
   * Método de utilidad para formatear fechas
   * @param date - Date object
   * @returns string en formato YYYY-MM-DD
   */
  formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Método de utilidad para parsear string a Date
   * @param dateString - string en formato YYYY-MM-DD
   * @returns Date object
   */
  parseStringToDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }

  /**
   * Validar si una fecha es válida para bloqueo
   * @param date - Fecha a validar
   * @returns boolean
   */
  isValidDateForBlocking(date: string): boolean {
    const today = new Date();
    const targetDate = this.parseStringToDate(date);
    return targetDate >= today;
  }

  /**
   * Generar rango de fechas entre dos fechas
   * @param startDate - Fecha inicio
   * @param endDate - Fecha fin
   * @returns Array de fechas en formato string
   */
  generateDateRange(startDate: string, endDate: string): string[] {
    const start = this.parseStringToDate(startDate);
    const end = this.parseStringToDate(endDate);
    const dates: string[] = [];
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(this.formatDateToString(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}