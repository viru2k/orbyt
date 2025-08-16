import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';

// API Services and DTOs
import {
  AppointmentResponseDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AgendaConfigResponseDto,
  UpdateAgendaConfigDto,
  HolidayResponseDto,
  CreateHolidayDto,
  AvailableSlotResponseDto,
  AppointmentSummaryResponseDto,
} from '../../api/models';
import { AgendaService } from '../../api/services';

// App Services and Models
import { NotificationService, SpinnerService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { CalendarDisplayEvent } from '@orb-components';

// Global State
import { linkToGlobalState } from '../component-state.reducer';

// Interaces
export interface LoadAppointmentsParams {
  from?: string; // Fecha de inicio ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
  to?: string; // Fecha de fin ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
  date?: string; // Fecha específica (YYYY-MM-DD)
  professionalId?: Array<number>; // IDs de profesionales (array)
  status?: Array<'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'>; // Estados (array)
}

export interface LoadAvailableTimesParams {
  date: string;
  professionalId?: number;
}

export interface LoadSummaryParams {
  from: string;
  to: string;
  professionalId?: number;
}

export interface AgendaState {
  appointments: AppointmentResponseDto[];
  agendaConfig: AgendaConfigResponseDto | null;
  agendaHolydays: HolidayResponseDto[];
  availableTimes: AvailableSlotResponseDto | null;
  summary: AppointmentSummaryResponseDto | null;
  selectedAppointment: AppointmentResponseDto | null;
  currentDateRange: { start: Date; end: Date } | null;
  loading: boolean;
  error: HttpErrorResponse | string | null;
  configLoading: boolean;
  holidaysLoading: boolean;
}

// Initial State
export const initialAgendaState: AgendaState = {
  appointments: [],
  agendaConfig: null,
  agendaHolydays: [],
  availableTimes: null,
  summary: null,
  selectedAppointment: null,
  currentDateRange: null,
  loading: false,
  error: null,
  configLoading: false,
  holidaysLoading: false,
};

// Helper function
function mapAppointmentToCalendarEvent(appointment: AppointmentResponseDto): CalendarDisplayEvent {

  // Convert ISO string dates to Date objects for angular-calendar
  const startDate = appointment.start ? new Date(appointment.start) : undefined;
  const endDate = appointment.end ? new Date(appointment.end) : undefined;


  // Generate CSS classes based on status
  const statusClass = appointment.status ? `status-${appointment.status.toLowerCase()}` : '';
  const cssClasses = ['fc-event-modern', statusClass].filter(Boolean).join(' ');

  const eventColor = appointment.color || '#3b82f6';
  
  return {
    id: appointment.id!.toString(),
    title: appointment.title || 'Turno sin título',
    start: startDate,
    end: endDate,
    allDay: appointment.allDay || false,
    color: eventColor,
    editable: true,
    cssClass: cssClasses,
    // Add inline styles for custom color
    ...(appointment.color && {
      style: {
        backgroundColor: eventColor,
        borderColor: eventColor
      }
    }),
    meta: {
      resourceId: appointment.extendedProps?.resourceId || appointment.roomId,
      clientId: appointment.extendedProps?.clientId,
      serviceId: appointment.serviceId,
      notes: appointment.notes,
      status: appointment.status,
      originalAppointment: appointment,
      professionalId: appointment.professional?.id,
      roomId: appointment.roomId,
      appointmentColor: eventColor,
    },
    // Keep extendedProps for backward compatibility
    extendedProps: {
      resourceId: appointment.extendedProps?.resourceId || appointment.roomId,
      clientId: appointment.extendedProps?.clientId,
      serviceId: appointment.serviceId,
      notes: appointment.notes,
      status: appointment.status,
      originalAppointment: appointment,
      professionalId: appointment.professional?.id,
      roomId: appointment.roomId,
      appointmentColor: eventColor,
    },
  };
}

@Injectable({ providedIn: 'root' })
export class AgendaStore extends ComponentStore<AgendaState> {
  private readonly agendaService = inject(AgendaService);
  private readonly notificationService = inject(NotificationService);
  private readonly spinner = inject(SpinnerService);

  constructor(private readonly globalStore: Store) {
    super(initialAgendaState);
    linkToGlobalState(this.state$, 'AgendaStore', this.globalStore);
  }

  // SELECTORS
  readonly appointments$ = this.select((state) => state.appointments);
  readonly agendaConfig$ = this.select((state) => state.agendaConfig);
  readonly agendaHolydays$ = this.select((state) => state.agendaHolydays);
  readonly availableTimes$ = this.select((state) => state.availableTimes);
  readonly summary$ = this.select((state) => state.summary);
  readonly selectedAppointment$ = this.select((state) => state.selectedAppointment);
  readonly currentDateRange$ = this.select((state) => state.currentDateRange);
  readonly loading$ = this.select((state) => state.loading);
  readonly configLoading$ = this.select((state) => state.configLoading);
  readonly holidaysLoading$ = this.select((state) => state.holidaysLoading);
  readonly error$ = this.select((state) => state.error);

  readonly calendarEvents$ = this.select(
    this.appointments$,
    (appointments) => appointments
      .filter(app => app.id != null && app.start && app.end)
      .map(mapAppointmentToCalendarEvent)
  );

  // UPDATERS
  private readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  private readonly setConfigLoading = this.updater((state, configLoading: boolean) => ({ ...state, configLoading }));
  private readonly setHolidaysLoading = this.updater((state, holidaysLoading: boolean) => ({ ...state, holidaysLoading }));
  private readonly setError = this.updater((state, error: HttpErrorResponse | string | null) => ({ ...state, error, loading: false }));
  private readonly setAgendaConfig = this.updater((state, config: AgendaConfigResponseDto) => ({ ...state, agendaConfig: config, configLoading: false }));
  private readonly setAgendaHolidays = this.updater((state, holydays: Array<HolidayResponseDto>) => ({ ...state, agendaHolydays: holydays, holidaysLoading: false }));
  private readonly addHoliday = this.updater((state, holiday: HolidayResponseDto) => ({ ...state, agendaHolydays: [...state.agendaHolydays, holiday], holidaysLoading: false }));
  private readonly removeHoliday = this.updater((state, holidayId: number) => ({
    ...state,
    agendaHolydays: state.agendaHolydays.filter(h => h.id !== holidayId),
    holidaysLoading: false
  }));
  private readonly setAvailableTimes = this.updater((state, availableTimes: AvailableSlotResponseDto) => ({ ...state, availableTimes, loading: false }));
  private readonly setSummary = this.updater((state, summary: AppointmentSummaryResponseDto) => ({ ...state, summary, loading: false }));
  private readonly setAppointments = this.updater((state, appointments: AppointmentResponseDto[]) => ({ ...state, appointments, loading: false }));
  private readonly addAppointment = this.updater((state, appointment: AppointmentResponseDto) => ({ ...state, appointments: [...state.appointments, appointment], loading: false }));
  private readonly updateAppointmentState = this.updater((state, appointment: AppointmentResponseDto) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    loading: false
  }));
  private readonly removeAppointment = this.updater((state, appointmentId: string) => ({
    ...state,
    appointments: state.appointments.filter((a:any) => a.id !== appointmentId),
    loading: false
  }));

  readonly setSelectedAppointment = this.updater((state, appointment: AppointmentResponseDto | null) => ({ ...state, selectedAppointment: appointment }));
  readonly setCurrentDateRange = this.updater((state, dateRange: { start: Date; end: Date } | null) => ({ ...state, currentDateRange: dateRange }));


  // EFFECTS

  readonly loadAgendaConfig = this.effect<number | undefined>((professionalId$) =>
    professionalId$.pipe(
      tap(() => this.setConfigLoading(true)),
      exhaustMap((professionalId) =>
        this.agendaService.agendaControllerGetConfig({ professionalId }).pipe(
          tapResponse(
            (config: AgendaConfigResponseDto) => {
              this.setAgendaConfig(config);
            },
            (error: any) => {
              this.setError(error);
              this.setConfigLoading(false);
              this.notificationService.showError(NotificationSeverity.Error, error.error?.message || 'Error al cargar la configuración de la agenda.');
            }
          )
        )
      )
    )
  );
  
  readonly loadAgendaHolidays = this.effect<number | undefined>((professionalId$) =>
    professionalId$.pipe(
      tap(() => this.setHolidaysLoading(true)),
      exhaustMap((professionalId) =>
        this.agendaService.agendaControllerGetHolidays({ professionalId }).pipe(
          tapResponse(
            (holydays: Array<HolidayResponseDto>) => {
              this.setAgendaHolidays(holydays);
            },
            (error: any) => {
              this.setError(error);
              this.setHolidaysLoading(false);
              this.notificationService.showError(NotificationSeverity.Error, error.error?.message || 'Error al cargar los feriados de la agenda.');
            }
          )
        )
      )
    )
  );

  readonly loadAvailableTimes = this.effect<LoadAvailableTimesParams>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.agendaService.agendaControllerGetAvailable(params).pipe(
          tapResponse(
            (availableTimes: AvailableSlotResponseDto) => {
              this.setAvailableTimes(availableTimes);
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, error.error?.message || 'Error al cargar los horarios disponibles.');
            }
          )
        )
      )
    )
  );

  readonly loadSummary = this.effect<LoadSummaryParams>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.agendaService.agendaControllerGetSummary(params).pipe(
          tapResponse(
            (summary: AppointmentSummaryResponseDto) => {
              this.setSummary(summary);
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, error.error?.message || 'Error al cargar el resumen de la agenda.');
            }
          )
        )
      )
    )
  );

  readonly loadAppointments = this.effect<LoadAppointmentsParams>((params$) =>
    params$.pipe(
      tap((params) => {
        this.setLoading(true);
        this.spinner.show();
        // Actualizar el rango de fechas solo si tenemos from/to
        if (params.from && params.to) {
          this.setCurrentDateRange({ 
            start: new Date(params.from), 
            end: new Date(params.to) 
          });
        }
      }),
      exhaustMap((params) =>
        this.agendaService.agendaControllerGetAppointments(params).pipe(
          tapResponse(
            (appointments: AppointmentResponseDto[]) => {
              this.setAppointments(appointments);
              this.spinner.hide();
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar los turnos.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  readonly createAppointment = this.effect<CreateAppointmentDto>((createDto$) =>
    createDto$.pipe(
      tap(() => {
        this.setLoading(true);
        this.spinner.show();
      }),
      exhaustMap((createDto) =>
        this.agendaService.agendaControllerCreate({ body: createDto }).pipe(
          tapResponse(
            (newAppointment: AppointmentResponseDto) => {
              this.addAppointment(newAppointment);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Turno creado con éxito.');
              this.spinner.hide();
              // Optionally reload all appointments for the current range
              const range = this.get().currentDateRange;
              if (range) {
                this.loadAppointments({ 
                  from: range.start.toISOString(), 
                  to: range.end.toISOString()
                });
              }
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al crear el turno.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  readonly updateAppointment = this.effect<{ id: string; dto: UpdateAppointmentDto }>((params$) =>
    params$.pipe(
      tap(() => {
        this.setLoading(true);
        this.spinner.show();
      }),
      exhaustMap(({ id, dto }) =>
        this.agendaService.agendaControllerUpdate({ id: Number(id), body: dto }).pipe(
          tapResponse(
            (updatedAppointment: AppointmentResponseDto) => {
              this.updateAppointmentState(updatedAppointment);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Turno actualizado con éxito.');
              this.spinner.hide();
               // Optionally reload all appointments for the current range
               const range = this.get().currentDateRange;
               if (range) {
                 this.loadAppointments({ 
                   from: range.start.toISOString().split('T')[0], 
                   to: range.end.toISOString().split('T')[0]
                 });
               }
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al actualizar el turno.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  readonly deleteAppointment = this.effect<string>((appointmentId$) =>
    appointmentId$.pipe(
      tap(() => {
        this.setLoading(true);
        this.spinner.show();
      }),
      exhaustMap((id) =>
        this.agendaService.agendaControllerDeleteAppointment({ id: Number(id) }).pipe(
          tapResponse(
            () => {
              this.removeAppointment(id);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Turno eliminado con éxito.');
              this.spinner.hide();
               // Optionally reload all appointments for the current range
               const range = this.get().currentDateRange;
               if (range) {
                 this.loadAppointments({ 
                   from: range.start.toISOString().split('T')[0], 
                   to: range.end.toISOString().split('T')[0]
                 });
               }
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al eliminar el turno.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  // NEW EFFECTS FOR CONFIG AND HOLIDAYS
  
  readonly updateAgendaConfig = this.effect<{ professionalId?: number; config: UpdateAgendaConfigDto }>((params$) =>
    params$.pipe(
      tap(() => {
        this.setConfigLoading(true);
        this.spinner.show();
      }),
      exhaustMap(({ professionalId, config }) =>
        this.agendaService.agendaControllerUpdateConfig({ professionalId: professionalId?.toString() || '1', body: config }).pipe(
          tapResponse(
            (updatedConfig: AgendaConfigResponseDto) => {
              this.setAgendaConfig(updatedConfig);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Configuración de agenda actualizada con éxito.');
              this.spinner.hide();
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.setConfigLoading(false);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al actualizar la configuración de agenda.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  readonly addHolidayEffect = this.effect<{ professionalId?: number; holiday: CreateHolidayDto }>((params$) =>
    params$.pipe(
      tap(() => {
        this.setHolidaysLoading(true);
        this.spinner.show();
      }),
      exhaustMap(({ professionalId, holiday }) =>
        this.agendaService.agendaControllerAddHoliday({ professionalId, body: holiday }).pipe(
          tapResponse(
            (newHoliday: HolidayResponseDto) => {
              this.addHoliday(newHoliday);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Feriado agregado con éxito.');
              this.spinner.hide();
            },
            (error: HttpErrorResponse) => {
              this.setError(error);
              this.setHolidaysLoading(false);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al agregar el feriado.');
              this.spinner.hide();
            }
          )
        )
      )
    )
  );

  // TODO: Backend needs to implement deleteHoliday endpoint
  readonly deleteHolidayEffect = this.effect<{ holidayId: number }>((params$) =>
    params$.pipe(
      tap(() => {
        // Temporarily remove from local state until backend implements delete endpoint
        this.notificationService.showError(NotificationSeverity.Error, 'Eliminar feriados no está implementado en el backend aún.');
      })
    )
  );
}
