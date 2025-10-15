import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of, Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  AppointmentResponseDto,
  AppointmentSummaryResponseDto,
  AppointmentProductLogResponseDto,
  AvailableSlotResponseDto,
  AgendaConfigResponseDto,
  CalendarAvailabilityDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  BookAppointmentDto
} from '../../api/models';
import { AgendaService } from '../../api/services/agenda.service';

export interface AppointmentsState {
  // Appointments
  appointments: AppointmentResponseDto[];
  todayAppointments: AppointmentResponseDto[];
  weekAppointments: AppointmentResponseDto[];
  selectedAppointment: AppointmentResponseDto | null;

  // Calendar and availability
  availableSlots: AvailableSlotResponseDto[];
  calendarConfig: AgendaConfigResponseDto | null;
  calendarAvailability: CalendarAvailabilityDto[];

  // Summary and statistics
  appointmentSummary: AppointmentSummaryResponseDto | null;
  productsUsed: AppointmentProductLogResponseDto[];

  // Filters and view settings
  filters: {
    from?: string;
    to?: string;
    clientId?: number;
    businessTypeId?: number;
    status?: string;
    page?: number;
    limit?: number;
  };

  currentView: 'day' | 'week' | 'month';
  selectedDate: string;

  // UI state
  loading: boolean;
  loadingToday: boolean;
  loadingWeek: boolean;
  loadingAvailability: boolean;
  loadingConfig: boolean;
  loadingSummary: boolean;
  loadingProductsUsed: boolean;
  error: any | null;
}

const initialState: AppointmentsState = {
  appointments: [],
  todayAppointments: [],
  weekAppointments: [],
  selectedAppointment: null,
  availableSlots: [],
  calendarConfig: null,
  calendarAvailability: [],
  appointmentSummary: null,
  productsUsed: [],
  filters: {
    page: 1,
    limit: 20
  },
  currentView: 'week',
  selectedDate: new Date().toISOString(),
  loading: false,
  loadingToday: false,
  loadingWeek: false,
  loadingAvailability: false,
  loadingConfig: false,
  loadingSummary: false,
  loadingProductsUsed: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class AppointmentsStore extends ComponentStore<AppointmentsState> {
  private readonly agendaService = inject(AgendaService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'AppointmentsStore', this.globalStore);
  }

  // Selectors
  readonly appointments$ = this.select((state) => state.appointments);
  readonly todayAppointments$ = this.select((state) => state.todayAppointments);
  readonly weekAppointments$ = this.select((state) => state.weekAppointments);
  readonly selectedAppointment$ = this.select((state) => state.selectedAppointment);
  readonly availableSlots$ = this.select((state) => state.availableSlots);
  readonly calendarConfig$ = this.select((state) => state.calendarConfig);
  readonly calendarAvailability$ = this.select((state) => state.calendarAvailability);
  readonly appointmentSummary$ = this.select((state) => state.appointmentSummary);
  readonly productsUsed$ = this.select((state) => state.productsUsed);
  readonly filters$ = this.select((state) => state.filters);
  readonly currentView$ = this.select((state) => state.currentView);
  readonly selectedDate$ = this.select((state) => state.selectedDate);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingToday$ = this.select((state) => state.loadingToday);
  readonly loadingWeek$ = this.select((state) => state.loadingWeek);
  readonly loadingAvailability$ = this.select((state) => state.loadingAvailability);
  readonly loadingConfig$ = this.select((state) => state.loadingConfig);
  readonly loadingSummary$ = this.select((state) => state.loadingSummary);
  readonly loadingProductsUsed$ = this.select((state) => state.loadingProductsUsed);

  // Aliases for template compatibility
  readonly agendaConfig$ = this.calendarConfig$;
  readonly summary$ = this.appointmentSummary$;
  readonly calendarEvents$ = this.select(
    this.appointments$,
    (appointments) => appointments.map(appointment => {
      const statusColor = this.getStatusColor(appointment.status || 'PENDING');

      // Build title: nombre - servicio
      let title = appointment.title || '';

      if (appointment.service?.name) {
        title = `${title} - ${appointment.service.name}`;
      }

      return {
        id: appointment.id?.toString() || '',
        title: title,
        start: appointment.start ? new Date(appointment.start) : new Date(),
        end: appointment.end ? new Date(appointment.end) : new Date(),
        color: {
          primary: statusColor,
          secondary: statusColor + '20'  // Add transparency for secondary
        },
        extendedProps: {
          originalAppointment: appointment,
          roomName: appointment.room?.name || null,
          serviceName: appointment.service?.name || null
        },
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true
        }
      };
    })
  );

  // Event observables for component interaction
  readonly appointmentUpdated$ = new Subject<{ appointment: AppointmentResponseDto; wasDragDrop?: boolean }>();

  // Computed selectors
  readonly selectAppointmentsByStatus = (status: string) =>
    this.select(
      this.appointments$,
      (appointments) => appointments.filter(a => a.status === status)
    );

  readonly selectAppointmentsByClient = (clientId: number) =>
    this.select(
      this.appointments$,
      (appointments) => appointments.filter(a => a.client?.id === clientId)
    );

  readonly selectAppointmentsByDate = (date: string) =>
    this.select(
      this.appointments$,
      (appointments) => appointments.filter(a => {
        const appointmentDate = new Date(a.start || a.createdAt).toDateString();
        const targetDate = new Date(date).toDateString();
        return appointmentDate === targetDate;
      })
    );

  readonly selectUpcomingAppointments = this.select(
    this.appointments$,
    (appointments) => {
      const now = new Date();
      return appointments.filter(a => new Date(a.start || a.createdAt) > now);
    }
  );

  readonly selectPastAppointments = this.select(
    this.appointments$,
    (appointments) => {
      const now = new Date();
      return appointments.filter(a => new Date(a.start || a.createdAt) < now);
    }
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingToday = this.updater((state, loadingToday: boolean) => ({
    ...state,
    loadingToday
  }));

  private readonly setLoadingWeek = this.updater((state, loadingWeek: boolean) => ({
    ...state,
    loadingWeek
  }));

  private readonly setLoadingAvailability = this.updater((state, loadingAvailability: boolean) => ({
    ...state,
    loadingAvailability
  }));

  private readonly setLoadingConfig = this.updater((state, loadingConfig: boolean) => ({
    ...state,
    loadingConfig
  }));

  private readonly setLoadingSummary = this.updater((state, loadingSummary: boolean) => ({
    ...state,
    loadingSummary
  }));

  private readonly setLoadingProductsUsed = this.updater((state, loadingProductsUsed: boolean) => ({
    ...state,
    loadingProductsUsed
  }));

  private readonly setAppointments = this.updater((state, appointments: AppointmentResponseDto[]) => ({
    ...state,
    appointments,
    loading: false
  }));

  private readonly setTodayAppointments = this.updater((state, todayAppointments: AppointmentResponseDto[]) => ({
    ...state,
    todayAppointments,
    loadingToday: false
  }));

  private readonly setWeekAppointments = this.updater((state, weekAppointments: AppointmentResponseDto[]) => ({
    ...state,
    weekAppointments,
    loadingWeek: false
  }));

  private readonly setSelectedAppointment = this.updater((state, appointment: AppointmentResponseDto | null) => ({
    ...state,
    selectedAppointment: appointment
  }));

  private readonly setAvailableSlots = this.updater((state, availableSlots: AvailableSlotResponseDto[]) => ({
    ...state,
    availableSlots,
    loadingAvailability: false
  }));

  private readonly setCalendarConfig = this.updater((state, calendarConfig: AgendaConfigResponseDto) => ({
    ...state,
    calendarConfig,
    loadingConfig: false
  }));

  private readonly setCalendarAvailability = this.updater((state, calendarAvailability: CalendarAvailabilityDto[]) => ({
    ...state,
    calendarAvailability,
    loadingAvailability: false
  }));

  private readonly setAppointmentSummary = this.updater((state, appointmentSummary: AppointmentSummaryResponseDto) => ({
    ...state,
    appointmentSummary,
    loadingSummary: false
  }));

  private readonly setProductsUsed = this.updater((state, productsUsed: AppointmentProductLogResponseDto[]) => ({
    ...state,
    productsUsed,
    loadingProductsUsed: false
  }));

  private readonly setFilters = this.updater((state, filters: Partial<AppointmentsState['filters']>) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  }));

  private readonly setCurrentView = this.updater((state, currentView: AppointmentsState['currentView']) => ({
    ...state,
    currentView
  }));

  private readonly setSelectedDate = this.updater((state, selectedDate: string) => ({
    ...state,
    selectedDate
  }));

  private readonly addAppointment = this.updater((state, appointment: AppointmentResponseDto) => ({
    ...state,
    appointments: [appointment, ...state.appointments]
  }));

  private readonly updateAppointmentState = this.updater((state, appointment: AppointmentResponseDto) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    todayAppointments: state.todayAppointments.map(a => a.id === appointment.id ? appointment : a),
    weekAppointments: state.weekAppointments.map(a => a.id === appointment.id ? appointment : a),
    selectedAppointment: state.selectedAppointment?.id === appointment.id ? appointment : state.selectedAppointment
  }));

  private readonly removeAppointment = this.updater((state, appointmentId: number) => ({
    ...state,
    appointments: state.appointments.filter(a => Number(a.id) !== appointmentId),
    todayAppointments: state.todayAppointments.filter(a => Number(a.id) !== appointmentId),
    weekAppointments: state.weekAppointments.filter(a => Number(a.id) !== appointmentId),
    selectedAppointment: Number(state.selectedAppointment?.id) === appointmentId ? null : state.selectedAppointment
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingToday: false,
    loadingWeek: false,
    loadingAvailability: false,
    loadingConfig: false,
    loadingSummary: false,
    loadingProductsUsed: false
  }));

  // Effects
  readonly loadAppointments = this.effect<Partial<AppointmentsState['filters']>>((params$) =>
    params$.pipe(
      tap((params) => {
        this.setFilters(params);
        this.setLoading(true);
      }),
      exhaustMap((params) => {
        const currentFilters = this.get().filters;
        const finalParams = { ...currentFilters, ...params };

        return this.agendaService.agendaControllerGetAppointments({
          from: finalParams.from,
          to: finalParams.to,
          status: finalParams.status as any
        }).pipe(
          tapResponse(
            (appointments: AppointmentResponseDto[]) => {
              this.setAppointments(appointments);
            },
            (error: any) => {
              console.error('Error loading appointments:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las citas.'
              );
            }
          )
        );
      })
    )
  );

  readonly loadTodayAppointments = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingToday(true)),
      exhaustMap(() =>
        this.agendaService.agendaControllerGetToday().pipe(
          tapResponse(
            (appointments: AppointmentResponseDto[]) => {
              this.setTodayAppointments(appointments);
            },
            (error: any) => {
              console.error('Error loading today appointments:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las citas de hoy.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadWeekAppointments = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingWeek(true)),
      exhaustMap(() =>
        this.agendaService.agendaControllerGetWeek().pipe(
          tapResponse(
            (appointments: AppointmentResponseDto[]) => {
              this.setWeekAppointments(appointments);
            },
            (error: any) => {
              console.error('Error loading week appointments:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las citas de la semana.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadAvailableSlots = this.effect<{ from: string; to: string; businessTypeId?: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingAvailability(true)),
      exhaustMap((params) =>
        this.agendaService.agendaControllerGetAvailable({ date: params.from }).pipe(
          tapResponse(
            (slots: AvailableSlotResponseDto) => {
              // Convert single object to array if needed
              const slotsArray = Array.isArray(slots) ? slots : [slots];
              this.setAvailableSlots(slotsArray);
            },
            (error: any) => {
              console.error('Error loading available slots:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar los horarios disponibles.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadCalendarConfig = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingConfig(true)),
      exhaustMap(() =>
        this.agendaService.agendaControllerGetConfig().pipe(
          tapResponse(
            (config: AgendaConfigResponseDto) => {
              this.setCalendarConfig(config);
            },
            (error: any) => {
              console.error('Error loading calendar config:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar la configuración del calendario.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadAppointmentSummary = this.effect<{ from: string; to: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingSummary(true)),
      exhaustMap((params) =>
        this.agendaService.agendaControllerGetSummary(params).pipe(
          tapResponse(
            (summary: AppointmentSummaryResponseDto) => {
              this.setAppointmentSummary(summary);
            },
            (error: any) => {
              console.error('Error loading appointment summary:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar el resumen de citas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadProductsUsed = this.effect<number>((appointmentId$) =>
    appointmentId$.pipe(
      tap(() => this.setLoadingProductsUsed(true)),
      exhaustMap((appointmentId) =>
        this.agendaService.agendaControllerGetProductsUsed({ id: appointmentId }).pipe(
          tapResponse(
            (products: AppointmentProductLogResponseDto[]) => {
              this.setProductsUsed(products);
            },
            (error: any) => {
              console.error('Error loading products used:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar los productos utilizados.'
              );
            }
          )
        )
      )
    )
  );

  readonly createAppointment = this.effect<CreateAppointmentDto>((appointmentData$) =>
    appointmentData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((appointmentData) =>
        this.agendaService.agendaControllerCreate({ body: appointmentData }).pipe(
          tapResponse(
            (appointment: AppointmentResponseDto) => {
              this.addAppointment(appointment);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Cita creada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear la cita.'
              );
            }
          )
        )
      )
    )
  );

  readonly updateAppointment = this.effect<{ id: number; appointmentData: UpdateAppointmentDto }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, appointmentData }) =>
        this.agendaService.agendaControllerUpdate({ id, body: appointmentData }).pipe(
          tapResponse(
            (appointment: AppointmentResponseDto) => {
              this.updateAppointmentState(appointment);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Cita actualizada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar la cita.'
              );
            }
          )
        )
      )
    )
  );

  readonly bookAppointment = this.effect<BookAppointmentDto>((bookingData$) =>
    bookingData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((bookingData) =>
        this.agendaService.agendaControllerBook({ body: bookingData }).pipe(
          tapResponse(
            (appointment: AppointmentResponseDto) => {
              this.addAppointment(appointment);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Cita reservada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al reservar la cita.'
              );
            }
          )
        )
      )
    )
  );

  readonly deleteAppointment = this.effect<number>((appointmentId$) =>
    appointmentId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.agendaService.agendaControllerDeleteAppointment({ id }).pipe(
          tapResponse(
            () => {
              this.removeAppointment(id);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Cita eliminada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al eliminar la cita.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  updateFilters(filters: Partial<AppointmentsState['filters']>): void {
    this.setFilters(filters);
    this.loadAppointments(filters);
  }

  clearFilters(): void {
    const defaultFilters = { page: 1, limit: 20 };
    this.setFilters(defaultFilters);
    this.loadAppointments({});
  }

  changeView(view: AppointmentsState['currentView']): void {
    this.setCurrentView(view);
    // Reload appointments based on view
    switch (view) {
      case 'day':
        this.loadTodayAppointments();
        break;
      case 'week':
        this.loadWeekAppointments();
        break;
      case 'month':
        this.refreshAppointments();
        break;
    }
  }

  changeDate(date: string): void {
    this.setSelectedDate(date);
    this.refreshAppointments();
  }

  refreshAppointments(): void {
    const currentFilters = this.get().filters;
    this.loadAppointments(currentFilters);
  }

  refreshTodayAppointments(): void {
    this.loadTodayAppointments();
  }

  refreshWeekAppointments(): void {
    this.loadWeekAppointments();
  }

  refreshCalendarConfig(): void {
    this.loadCalendarConfig();
  }

  selectAppointment(appointment: AppointmentResponseDto): void {
    this.setSelectedAppointment(appointment);
    // Load products used for selected appointment
    this.loadProductsUsed(Number(appointment.id));
  }

  clearSelectedAppointment(): void {
    this.setSelectedAppointment(null);
  }

  getAppointmentById(id: number): AppointmentResponseDto | undefined {
    return this.get().appointments.find(appointment => appointment.id === String(id));
  }

  getAppointmentsByStatus(status: string): AppointmentResponseDto[] {
    return this.get().appointments.filter(appointment => appointment.status === status);
  }

  getAppointmentsByClient(clientId: number): AppointmentResponseDto[] {
    return this.get().appointments.filter(appointment => appointment.client?.id === clientId);
  }

  getUpcomingAppointments(): AppointmentResponseDto[] {
    const now = new Date();
    return this.get().appointments.filter(appointment => new Date(appointment.start) > now);
  }

  getPastAppointments(): AppointmentResponseDto[] {
    const now = new Date();
    return this.get().appointments.filter(appointment => new Date(appointment.start) < now);
  }

  getTodayAppointmentsCount(): number {
    return this.get().todayAppointments.length;
  }

  getWeekAppointmentsCount(): number {
    return this.get().weekAppointments.length;
  }

  getPendingAppointments(): AppointmentResponseDto[] {
    return this.getAppointmentsByStatus('pending');
  }

  getConfirmedAppointments(): AppointmentResponseDto[] {
    return this.getAppointmentsByStatus('confirmed');
  }

  getCompletedAppointments(): AppointmentResponseDto[] {
    return this.getAppointmentsByStatus('completed');
  }

  getCancelledAppointments(): AppointmentResponseDto[] {
    return this.getAppointmentsByStatus('cancelled');
  }

  // Helper method for calendar event colors
  private getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      // Handle both uppercase and lowercase formats
      'PENDING': '#9ca3af',        // Gris claro
      'pending': '#9ca3af',
      'CONFIRMED': '#3b82f6',      // Azul
      'confirmed': '#3b82f6',
      'CHECKED_IN': '#06b6d4',     // Cian
      'checked_in': '#06b6d4',
      'IN_PROGRESS': '#fbbf24',    // Amarillo/Naranja
      'in_progress': '#fbbf24',
      'COMPLETED': '#22c55e',      // Verde
      'completed': '#22c55e',
      'CANCELLED': '#ef4444',      // Rojo
      'cancelled': '#ef4444',
      'NO_SHOW': '#78716c',        // Marrón
      'no_show': '#78716c',
      'RESCHEDULED': '#a855f7',    // Púrpura
      'rescheduled': '#a855f7'
    };
    return colorMap[status] || colorMap['PENDING'];
  }

  // Method aliases for template compatibility
  loadAvailabilitySlots = this.loadAvailableSlots;

  loadSummary(params: any): void {
    // Implementation would depend on your API
    console.warn('loadSummary method called - implementation needed');
  }
}