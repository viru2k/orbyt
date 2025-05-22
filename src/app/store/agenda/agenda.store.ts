// src/app/store/agenda/agenda.store.ts
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// API Services and DTOs from @api (src/app/api/model/ and src/app/api/api/)
import {
  AgendaService,
  AppointmentResponseDto, // Este es el DTO que tu API devuelve para las citas
  CreateAppointmentDto,   // Este es el DTO para crear (y actualizar, según tu AgendaService) citas
  AgendaConfigResponseDto,
  UserResponseDto,        // Asumo que se usa para los profesionales en AgendaConfigResponseDto
} from '@orb-api/index';

// Component-specific DTOs or Interfaces for FullCalendar
import { CalendarDisplayEvent } from '@orb-components'; // Tu interfaz para eventos de FullCalendar

// App Services
import { NotificationService, SpinnerService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';

// Interfaz para Salas (basada en AgendaConfigResponseDto, si es necesario un mapeo o tipo específico)
export interface Room { // Esta interfaz es local al store si necesitas una estructura particular.
  id: number;          // Si AgendaConfigResponseDto.rooms ya tiene la estructura deseada, puedes usarla directamente.
  name: string;
}

// Interfaz para los parámetros de carga de turnos
export interface LoadAppointmentsParams {
  startDate: Date;
  endDate: Date;
  professionalId?: number;
  roomId?: number;
  status?: string[]; // Array de estados de turno a filtrar
}

// Estado del Store de Agenda
export interface AgendaState {
  appointments: AppointmentResponseDto[]; // Almacena los turnos originales de la API
  agendaConfig: AgendaConfigResponseDto | null;
  selectedAppointment: AppointmentResponseDto | null;
  currentDateRange: { start: Date; end: Date } | null;
  loadingAppointments: boolean;
  loadingConfig: boolean;
  loadingMutation: boolean;
  error: HttpErrorResponse | string | null;
}

export const initialAgendaState: AgendaState = {
  appointments: [],
  agendaConfig: null,
  selectedAppointment: null,
  currentDateRange: null,
  loadingAppointments: false,
  loadingConfig: false,
  loadingMutation: false,
  error: null,
};

// Helper function para mapear AppointmentResponseDto (de tu API) a CalendarDisplayEvent (para FullCalendar)
function mapAppointmentToCalendarEvent(appointment: AppointmentResponseDto): CalendarDisplayEvent {
  // El AppointmentResponseDto de tu API tiene:
  // id: number;
  // title?: string;
  // startDateTime: string;
  // endDateTime: string;
  // allDay?: boolean;
  // color?: string;
  // status?: string;
  // notes?: string;
  // professionalId?: number;
  // clientId?: number;
  // serviceId?: number;
  // roomId?: number;

  // El ejemplo que diste: { "id": 1, "title": "Corte de cabello", "date": "...", "status": "confirmed", ... }
  // Usaremos los campos del AppointmentResponseDto definido en tu API.
  // 'date' de tu ejemplo se mapea a 'startDateTime'. Es crucial que 'endDateTime' esté presente en la respuesta de la API.

  if (!appointment.id) {
    console.error('Appointment sin ID encontrado:', appointment);
    // Decide cómo manejar esto: filtrar, lanzar error, o crear un ID temporal (no recomendado para datos reales)
    // Por ahora, lo filtramos en el computed signal si es necesario, o aseguramos que la API siempre devuelva ID.
  }
  if (!appointment.start || !appointment.end) {
      console.warn('Appointment sin startDateTime o endDateTime:', appointment.title, appointment.id);
      // Un evento de calendario necesita al menos un 'start'. Si 'end' falta, FullCalendar podría tratarlo como de duración cero o un día completo.
      // Es mejor asegurar que la API provea ambos para eventos con duración.
  }


  return {
    id: appointment.id!.toString(), // FullCalendar espera IDs de string. 'id' es number en el DTO.
    title: appointment.title || 'Turno sin título', // Usa el title del DTO, o un default si es undefined/null
    start: appointment.start, // Este es el campo correcto de tu AppointmentResponseDto
    end: appointment.end,     // Este es el campo correcto de tu AppointmentResponseDto
    allDay: appointment.allDay || false,
    color: appointment.color,
    editable: true, // Puedes hacerlo condicional basado en appointment.status u otra lógica
    extendedProps: {
      resourceId: appointment.extendedProps?.resourceId || appointment.roomId, // Asigna un resourceId si aplica
      clientId: appointment.extendedProps?.clientId,
      serviceId: appointment.serviceId,
      notes: appointment.notes,
      status: appointment.status,
      originalAppointment: appointment, // Guardar el objeto original es útil para modales de edición
      professionalId: appointment.professional?.id,
      roomId: appointment.roomId,
      // Los campos 'name', 'description', 'reminderSentAt' de tu ejemplo no están
      // en el AppointmentResponseDto de tu API, por lo que no se pueden mapear aquí.
    },
  };
}


export const AgendaStore = signalStore(
  { providedIn: 'root' },
  withState(initialAgendaState),

  withComputed(({ appointments, agendaConfig, selectedAppointment, loadingAppointments, loadingConfig, loadingMutation, error, currentDateRange }) => ({
    calendarEvents: computed(() =>
      appointments()
        .filter(app => app.id != null && app.start && app.end) // Filtra turnos sin datos esenciales
        .map(mapAppointmentToCalendarEvent)
    ),
    slotDurationMinutes: computed(() => agendaConfig()?.slotDurationMinutes),
    workingDays: computed(() => agendaConfig()?.workingDays || []),
      workStart: computed(() => agendaConfig()?.workStart || []),
          workEnd: computed(() => agendaConfig()?.workEnd || []),
    allowOverbooking: computed(() => agendaConfig()?.allowOverbooking || []),
    currentSelection: computed(() => selectedAppointment()),
    isLoading: computed(() => loadingAppointments() || loadingConfig() || loadingMutation()),
    lastError: computed(() => error()),
    activeDateRange: computed(() => currentDateRange()),
  })),

  withMethods((
    store,
    agendaService = inject(AgendaService),
    spinner = inject(SpinnerService),
    notification = inject(NotificationService)
  ) => ({
    loadAgendaConfig: rxMethod<void>(
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loadingConfig: true, error: null });
        }),
        switchMap(() =>
          //agendaService.agendaControllerGetAgendaConfig().pipe(
            agendaService.agendaControllerGetConfig().pipe(
            tap((config: AgendaConfigResponseDto) => {
              patchState(store, { agendaConfig: config, loadingConfig: false });
              spinner.hide();
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loadingConfig: false });
              notification.showError(NotificationSeverity.Error,'Error al cargar la configuración de la agenda.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    ),

    loadAppointments: rxMethod<LoadAppointmentsParams>(
      pipe(
        tap((params) => {
          spinner.show();
          patchState(store, { loadingAppointments: true, error: null, currentDateRange: { start: params.startDate, end: params.endDate } });
        }),
        switchMap((params: LoadAppointmentsParams) =>
         // agendaService.agendaControllerFindAllAppointments( // Este método usa los DTOs de @api
         agendaService.agendaControllerGetAppointments(
            params.startDate.toISOString(),
            params.endDate.toISOString(),
            params.status?.join(',')
          ).pipe(
            tap((loadedAppointments: AppointmentResponseDto[]) => { // Recibe AppointmentResponseDto[]
              patchState(store, { appointments: loadedAppointments, loadingAppointments: false });
              spinner.hide();
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loadingAppointments: false, appointments: [] });
              notification.showError(NotificationSeverity.Error,'Error al cargar los turnos.');
              spinner.hide();
              return of([]);
            })
          )
        )
      )
    ),



    createAppointment: rxMethod<CreateAppointmentDto>( // Espera CreateAppointmentDto de @api
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loadingMutation: true, error: null });
        }),
        switchMap((createDto: CreateAppointmentDto) =>
        agendaService.agendaControllerCreate(createDto).pipe(
            tap((newAppointment: AppointmentResponseDto) => { // Recibe AppointmentResponseDto
              if (store.currentDateRange()) {
                (store as any).loadAppointments(store.currentDateRange() ); // Llama al método del store
              } else {
                 patchState(store, { loadingMutation: false });
                 spinner.hide();
              }
              notification.showSuccess(NotificationSeverity.Success,'Turno creado con éxito.');
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loadingMutation: false });
              notification.showError(NotificationSeverity.Error,'Error al crear el turno.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    ),

    // API usa CreateAppointmentDto para actualizar
    updateAppointment: rxMethod<{ id: number; dto: CreateAppointmentDto }>( // Espera CreateAppointmentDto de @api para 'dto'
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loadingMutation: true, error: null });
        }),
        switchMap(({ id, dto }) =>
          agendaService.agendaControllerUpdate(id, dto).pipe( // Usa DTO de @api
            tap((updatedAppointment: AppointmentResponseDto) => { // Recibe AppointmentResponseDto
              if (store.currentDateRange()) {
                (store as any).loadAppointments(store.currentDateRange() ); // Llama al método del store
              } else {
                patchState(store, { loadingMutation: false });
                spinner.hide();
              }
              if (Number(store.selectedAppointment()?.id) === id) {
                patchState(store, { selectedAppointment: updatedAppointment });
              }
              notification.showSuccess(NotificationSeverity.Success,'Turno actualizado con éxito.');
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loadingMutation: false });
              notification.showError(NotificationSeverity.Error,'Error al actualizar el turno.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    ),

    deleteAppointment: rxMethod<number>(
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loadingMutation: true, error: null });
        }),
        switchMap((id: number) =>
          agendaService.agendaControllerDeleteAppointment(id).pipe(
            tap(() => {
              if (store.currentDateRange()) {
                (store as any).loadAppointments(store.currentDateRange() ); // Llama al método del store
              } else {
                patchState(store, { loadingMutation: false });
                spinner.hide();
              }
              if (Number(store.selectedAppointment()?.id) === id) {
                patchState(store, { selectedAppointment: null });
              }
              notification.showSuccess(NotificationSeverity.Success,'Turno eliminado con éxito.');
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loadingMutation: false });
              notification.showError(NotificationSeverity.Error,'Error al eliminar el turno.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    ),

    selectAppointment(appointment: AppointmentResponseDto | null): void {
      patchState(store, { selectedAppointment: appointment });
    },
    clearSelectedAppointment(): void {
      patchState(store, { selectedAppointment: null });
    },
    setCurrentDateRange(startDate: Date, endDate: Date): void {
        patchState(store, { currentDateRange: { start: startDate, end: endDate } });
    },
    clearError(): void {
      patchState(store, { error: null });
    }
  }))
  // import { withDevtools } from '@ngrx/signals/devtools';
  // export const AgendaStore = signalStore( /* ... */, withDevtools({ name: 'Agenda Store' }) );
);
