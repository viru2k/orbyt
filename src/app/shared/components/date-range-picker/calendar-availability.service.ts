import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CalendarAvailability } from './date-range-picker.interfaces';

export interface CalendarAvailabilityQuery {
  year: number;
  month: number;
  professionalId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarAvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/agenda';
  
  // Cache para evitar requests repetidos
  private availabilityCache = new Map<string, CalendarAvailability>();
  private loading$ = new BehaviorSubject<boolean>(false);

  get isLoading$(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Obtiene la disponibilidad del calendario para un mes específico
   */
  getCalendarAvailability(query: CalendarAvailabilityQuery): Observable<CalendarAvailability | null> {
    const cacheKey = `${query.year}-${query.month}-${query.professionalId || 'current'}`;
    
    // Verificar cache primero
    if (this.availabilityCache.has(cacheKey)) {
      return of(this.availabilityCache.get(cacheKey)!);
    }

    this.loading$.next(true);

    let params = new HttpParams()
      .set('year', query.year.toString())
      .set('month', query.month.toString());

    if (query.professionalId) {
      params = params.set('professionalId', query.professionalId.toString());
    }

    return this.http.get<CalendarAvailability>(`${this.baseUrl}/calendar-availability`, { params })
      .pipe(
        map(availability => {
          // Guardar en cache
          this.availabilityCache.set(cacheKey, availability);
          this.loading$.next(false);
          return availability;
        }),
        catchError(error => {
          console.error('Error loading calendar availability:', error);
          this.loading$.next(false);
          return of(null);
        })
      );
  }

  /**
   * Obtiene la disponibilidad para múltiples meses
   */
  getAvailabilityRange(startYear: number, startMonth: number, endYear: number, endMonth: number, professionalId?: number): Observable<CalendarAvailability[]> {
    const requests: Observable<CalendarAvailability | null>[] = [];
    
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      requests.push(this.getCalendarAvailability({
        year: currentYear,
        month: currentMonth,
        professionalId
      }));
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return new Observable<CalendarAvailability[]>(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          const validResults = results.filter(result => result !== null) as CalendarAvailability[];
          observer.next(validResults);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Limpia el cache de disponibilidad
   */
  clearCache(): void {
    this.availabilityCache.clear();
  }

  /**
   * Limpia el cache para un profesional específico
   */
  clearCacheForProfessional(professionalId: number): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.availabilityCache.keys()) {
      if (key.endsWith(`-${professionalId}`) || key.endsWith('-current')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.availabilityCache.delete(key));
  }

  /**
   * Verifica si un día específico está disponible
   */
  isDayAvailable(date: Date, availability: CalendarAvailability): boolean {
    const dateStr = this.formatDateString(date);
    const dayAvailability = availability.days.find(day => day.date === dateStr);
    
    if (!dayAvailability) return false;
    
    return dayAvailability.status === 'available' || dayAvailability.status === 'limited';
  }

  /**
   * Obtiene los días disponibles en un rango de fechas
   */
  getAvailableDaysInRange(startDate: Date, endDate: Date, availability: CalendarAvailability[]): Date[] {
    const availableDays: Date[] = [];
    
    availability.forEach(monthAvailability => {
      monthAvailability.days.forEach(day => {
        if (day.status === 'available' || day.status === 'limited') {
          const dayDate = new Date(day.date);
          if (dayDate >= startDate && dayDate <= endDate) {
            availableDays.push(dayDate);
          }
        }
      });
    });
    
    return availableDays.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Obtiene estadísticas de disponibilidad para un mes
   */
  getMonthlyStats(availability: CalendarAvailability) {
    const stats = {
      totalDays: availability.days.length,
      workingDays: 0,
      availableDays: 0,
      limitedDays: 0,
      fullDays: 0,
      blockedDays: 0,
      holidays: 0,
      totalSlots: availability.totalAvailableSlots,
      bookedAppointments: availability.totalBookedAppointments
    };

    availability.days.forEach(day => {
      if (day.isWorkingDay) stats.workingDays++;
      if (day.isHoliday) stats.holidays++;
      
      switch (day.status) {
        case 'available':
          stats.availableDays++;
          break;
        case 'limited':
          stats.limitedDays++;
          break;
        case 'full':
          stats.fullDays++;
          break;
        case 'blocked':
          stats.blockedDays++;
          break;
      }
    });

    return stats;
  }

  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}