import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AgendaBlockingService } from '../services/agenda-blocking.service';
import {
  BlockedDateItem,
  DayOverride,
  MonthlyCalendarData,
  LoadingStates,
  BlockingOperationResult,
  BulkBlockingConfig,
  AvailabilityStatus,
  BlockingType
} from '../models/agenda-blocking.models';

@Injectable({
  providedIn: 'root'
})
export class AgendaBlockingStore {
  
  // Private subjects para manejo interno del estado
  private readonly blockedDatesSubject = new BehaviorSubject<BlockedDateItem[]>([]);
  private readonly dayOverridesSubject = new BehaviorSubject<DayOverride[]>([]);
  private readonly calendarDataSubject = new BehaviorSubject<MonthlyCalendarData | null>(null);
  private readonly loadingSubject = new BehaviorSubject<LoadingStates>({
    loadingBlockedDates: false,
    loadingOverrides: false,
    loadingCalendar: false,
    blocking: false,
    unblocking: false,
    creatingOverride: false
  });
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos para los componentes
  readonly blockedDates$ = this.blockedDatesSubject.asObservable();
  readonly dayOverrides$ = this.dayOverridesSubject.asObservable();
  readonly calendarData$ = this.calendarDataSubject.asObservable();
  readonly loadingStates$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  // Observables derivados
  readonly isLoading$ = this.loadingStates$.pipe(
    map(states => Object.values(states).some(loading => loading))
  );

  readonly totalBlockedDates$ = this.blockedDates$.pipe(
    map(dates => dates.length)
  );

  readonly activeOverrides$ = this.dayOverrides$.pipe(
    map(overrides => overrides.filter(override => override.isActive))
  );

  constructor(private agendaBlockingService: AgendaBlockingService) {}

  /**
   * Cargar todas las fechas bloqueadas en un rango
   */
  loadBlockedDates(fromDate?: string, toDate?: string, professionalId?: number): void {
    this.setLoading('loadingBlockedDates', true);
    this.clearError();

    this.agendaBlockingService.getDayOverrides(fromDate, toDate, professionalId).pipe(
      catchError(error => {
        this.setError('Error al cargar fechas bloqueadas: ' + error.message);
        return EMPTY;
      }),
      finalize(() => this.setLoading('loadingBlockedDates', false))
    ).subscribe((response: any) => {
      // Transformar la respuesta del backend a nuestro modelo
      const blockedDates = this.transformToBlockedDateItems(response);
      this.blockedDatesSubject.next(blockedDates);
    });
  }

  /**
   * Cargar overrides de días específicos
   */
  loadDayOverrides(fromDate?: string, toDate?: string, professionalId?: number): void {
    this.setLoading('loadingOverrides', true);
    this.clearError();

    this.agendaBlockingService.getDayOverrides(fromDate, toDate, professionalId).pipe(
      catchError(error => {
        this.setError('Error al cargar configuraciones especiales: ' + error.message);
        return EMPTY;
      }),
      finalize(() => this.setLoading('loadingOverrides', false))
    ).subscribe((response: any) => {
      const overrides = this.transformToDayOverrides(response);
      this.dayOverridesSubject.next(overrides);
    });
  }

  /**
   * Cargar datos del calendario mensual
   */
  loadCalendarData(year: number, month: number, professionalId?: number): void {
    this.setLoading('loadingCalendar', true);
    this.clearError();

    this.agendaBlockingService.getCalendarAvailability(year, month, professionalId).pipe(
      catchError(error => {
        this.setError('Error al cargar calendario: ' + error.message);
        return EMPTY;
      }),
      finalize(() => this.setLoading('loadingCalendar', false))
    ).subscribe(response => {
      const calendarData = this.transformToCalendarData(year, month, response);
      this.calendarDataSubject.next(calendarData);
    });
  }

  /**
   * Bloquear múltiples fechas
   */
  blockDates(config: BulkBlockingConfig, professionalId?: number): Observable<BlockingOperationResult> {
    this.setLoading('blocking', true);
    this.clearError();

    return this.agendaBlockingService.blockMultipleDates(
      config.dates, 
      config.reason, 
      professionalId
    ).pipe(
      map(() => ({
        success: true,
        message: `${config.dates.length} fechas bloqueadas exitosamente`,
        processedDates: config.dates
      } as BlockingOperationResult)),
      catchError(error => {
        const result: BlockingOperationResult = {
          success: false,
          message: 'Error al bloquear fechas: ' + error.message,
          failedDates: config.dates,
          errors: [error.message]
        };
        this.setError(result.message!);
        return [result];
      }),
      finalize(() => {
        this.setLoading('blocking', false);
        // Recargar datos después de la operación
        this.refreshData();
      })
    );
  }

  /**
   * Desbloquear fechas específicas
   */
  unblockDates(dates: string[], professionalId?: number): Observable<BlockingOperationResult> {
    this.setLoading('unblocking', true);
    this.clearError();

    return this.agendaBlockingService.unblockDates(dates, professionalId).pipe(
      map(() => ({
        success: true,
        message: `${dates.length} fechas desbloqueadas exitosamente`,
        processedDates: dates
      } as BlockingOperationResult)),
      catchError(error => {
        const result: BlockingOperationResult = {
          success: false,
          message: 'Error al desbloquear fechas: ' + error.message,
          failedDates: dates,
          errors: [error.message]
        };
        this.setError(result.message!);
        return [result];
      }),
      finalize(() => {
        this.setLoading('unblocking', false);
        // Recargar datos después de la operación
        this.refreshData();
      })
    );
  }

  /**
   * Crear configuración especial para un día
   */
  createDayOverride(override: DayOverride, professionalId?: number): Observable<BlockingOperationResult> {
    this.setLoading('creatingOverride', true);
    this.clearError();

    return this.agendaBlockingService.createDayOverride(override, professionalId).pipe(
      map(() => ({
        success: true,
        message: 'Configuración especial creada exitosamente',
        processedDates: [override.date]
      } as BlockingOperationResult)),
      catchError(error => {
        const result: BlockingOperationResult = {
          success: false,
          message: 'Error al crear configuración especial: ' + error.message,
          failedDates: [override.date],
          errors: [error.message]
        };
        this.setError(result.message!);
        return [result];
      }),
      finalize(() => {
        this.setLoading('creatingOverride', false);
        // Recargar datos después de la operación
        this.refreshData();
      })
    );
  }

  /**
   * Obtener fechas bloqueadas por tipo
   */
  getBlockedDatesByType(type: BlockingType): Observable<BlockedDateItem[]> {
    return this.blockedDates$.pipe(
      map(dates => dates.filter(date => date.type === type))
    );
  }

  /**
   * Verificar si una fecha específica está bloqueada
   */
  isDateBlocked(date: string): Observable<boolean> {
    return this.blockedDates$.pipe(
      map(dates => dates.some(blockedDate => blockedDate.date === date))
    );
  }

  /**
   * Limpiar todos los datos del store
   */
  clearAllData(): void {
    this.blockedDatesSubject.next([]);
    this.dayOverridesSubject.next([]);
    this.calendarDataSubject.next(null);
    this.clearError();
  }

  /**
   * Refrescar todos los datos
   */
  private refreshData(): void {
    const currentCalendar = this.calendarDataSubject.value;
    if (currentCalendar) {
      this.loadCalendarData(currentCalendar.year, currentCalendar.month);
    }
    this.loadBlockedDates();
    this.loadDayOverrides();
  }

  // Métodos privados para manejo interno
  private setLoading(key: keyof LoadingStates, value: boolean): void {
    const currentStates = this.loadingSubject.value;
    this.loadingSubject.next({ ...currentStates, [key]: value });
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // Métodos de transformación de datos
  private transformToBlockedDateItems(response: any): BlockedDateItem[] {
    if (!response || !Array.isArray(response)) return [];
    
    return response.map(item => ({
      id: `blocked-${item.date}-${Date.now()}`,
      date: item.date,
      reason: item.reason || item.note,
      type: item.blocked ? BlockingType.BLOCKED : BlockingType.CUSTOM_SCHEDULE,
      hasCustomSchedule: !item.blocked && (item.startTime || item.endTime),
      customSchedule: item.startTime || item.endTime ? {
        startTime: item.startTime,
        endTime: item.endTime,
        slotDuration: item.slotDuration
      } : undefined,
      note: item.note,
      createdAt: new Date()
    }));
  }

  private transformToDayOverrides(response: any): DayOverride[] {
    if (!response || !Array.isArray(response)) return [];
    
    return response.map(item => ({
      ...item,
      id: `override-${item.date}-${Date.now()}`,
      isCustomSchedule: !item.blocked && (item.startTime || item.endTime),
      isActive: true,
      createdAt: new Date()
    }));
  }

  private transformToCalendarData(year: number, month: number, response: any): MonthlyCalendarData {
    return {
      year,
      month,
      days: response?.days || {},
      blockedDates: response?.blockedDates || [],
      overrideDates: response?.overrideDates || [],
      holidays: response?.holidays || []
    };
  }
}