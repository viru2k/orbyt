
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';

// Importaciones de API y DTOs
import { ClientsService, ClientResponseDto, CreateClientDto, UpdateClientDto } from '@orb-api/index'; // Asumiendo que @api es tu alias para src/app/api
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService, SpinnerService } from '@orb-services'; // Asumiendo que tienes estos servicios
import { NotificationSeverity } from '@orb-models';

// Estado del Store de Clientes
// src/app/store/crm/client.store.ts
// ... (imports y estado inicial se mantienen) ...
export interface ClientState {
  clients: ClientResponseDto[];
  selectedClient: ClientResponseDto | null;
  loading: boolean;
  error: HttpErrorResponse | null | string; // Puede ser string para errores personalizados
  // Podrías añadir paginación si el API la soporta y la necesitas
  // totalRecords: number;
  // page: number;
  // limit: number;
}

export const initialClientState: ClientState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
  // totalRecords: 0,
  // page: 1,
  // limit: 10,
};

export const ClientStore = signalStore(
  { providedIn: 'root' },
  withState(initialClientState),
  withComputed(({ clients, selectedClient, loading, error }) => ({
    allClients: computed(() => clients()),
    currentClient: computed(() => selectedClient()), // Este es el que usa el form
    isLoading: computed(() => loading()),
    getError: computed(() => error()),
  })),
  withMethods((store,
               clientsService = inject(ClientsService),
               spinner = inject(SpinnerService),
               notification = inject(NotificationService)
  ) => {
    // --- Método para cargar un cliente por ID ---
    // Este es el método que el formulario (y otros) puede llamar.
    // Es un "comando" que inicia la carga.
    const loadClientById = rxMethod<number>(
      pipe(
        tap(() => {
          spinner.show(); // Mostrar spinner al iniciar
          patchState(store, { loading: true, selectedClient: null, error: null });
        }),
        switchMap((id: number) =>
          clientsService.clientControllerFindOne(id).pipe(
            tap((client: ClientResponseDto) => {
              patchState(store, { selectedClient: client, loading: false });
              spinner.hide(); // Ocultar spinner al completar
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loading: false, selectedClient: null });
              notification.showError(NotificationSeverity.Error,`Error al cargar el cliente con ID: ${id}.`);
              spinner.hide();
              return of(null); // Manejar el error y continuar
            })
          )
        )
      )
    );

    // --- Cargar todos los clientes ---
    // Este es un "comando"
    const loadClients = rxMethod<void>( // Puede aceptar parámetros de paginación/filtro si es necesario
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loading: true, error: null });
        }),
        switchMap(() => // Aquí irían los parámetros de paginación/filtro
          clientsService.clientControllerFindAll().pipe( // Asume que no hay paginación por ahora
            tap((response: ClientResponseDto[]) => {
              patchState(store, { clients: response, loading: false });
              spinner.hide();
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loading: false, clients: [] });
              notification.showError(NotificationSeverity.Error,'Error al cargar los clientes.');
              spinner.hide();
              return of([]);
            })
          )
        )
      )
    );

    // --- Crear un nuevo cliente ---
    // Este es un "comando"
    const createClient = rxMethod<CreateClientDto>(
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loading: true, error: null });
        }),
        switchMap((createDto: CreateClientDto) =>
          clientsService.clientControllerCreate(createDto).pipe(
            tap((newClient: ClientResponseDto) => {
              // Opcional: Actualizar la lista local o invalidar y forzar recarga
              // patchState(store, { clients: [...store.clients(), newClient] });
              // Es común recargar la lista para asegurar consistencia, especialmente con paginación/filtros
              loadClients(); // Llama a loadClients para refrescar la lista
              notification.showSuccess(NotificationSeverity.Success,'Cliente creado con éxito.');
              // loading y spinner se manejan en loadClients
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loading: false });
              notification.showError(NotificationSeverity.Error,'Error al crear el cliente.');
              spinner.hide(); // Asegurar que el spinner se oculte en caso de error aquí
              return of(null);
            })
          )
        )
      )
    );

    // --- Actualizar un cliente existente ---
    // Este es un "comando"
    const updateClient = rxMethod<{ id: number; updateDto: UpdateClientDto }>(
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loading: true, error: null });
        }),
        switchMap(({ id, updateDto }) =>
          clientsService.clientControllerUpdate(id, updateDto).pipe(
            tap((updatedClient: ClientResponseDto) => {
              // Opcional: Actualizar la lista local o invalidar y forzar recarga
              // patchState(store, {
              //   clients: store.clients().map(c => c.id === id ? updatedClient : c),
              //   selectedClient: store.selectedClient()?.id === id ? updatedClient : store.selectedClient(),
              // });
              loadClients(); // Llama a loadClients para refrescar la lista
              if (store.selectedClient()?.id === id) { // Actualizar el cliente seleccionado si es el mismo
                patchState(store, { selectedClient: updatedClient });
              }
              notification.showSuccess(NotificationSeverity.Success,'Cliente actualizado con éxito.');
              // loading y spinner se manejan en loadClients
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loading: false });
              notification.showError(NotificationSeverity.Error,'Error al actualizar el cliente.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    );

    // --- Eliminar un cliente ---
    // Este es un "comando"
    const deleteClient = rxMethod<number>(
      pipe(
        tap(() => {
          spinner.show();
          patchState(store, { loading: true, error: null });
        }),
        switchMap((id: number) =>
          clientsService.clientControllerRemove(id).pipe(
            tap(() => {
              // Opcional: Actualizar la lista local o invalidar y forzar recarga
              // patchState(store, {
              //  clients: store.clients().filter(c => c.id !== id),
              //  selectedClient: store.selectedClient()?.id === id ? null : store.selectedClient(),
              // });
              loadClients(); // Llama a loadClients para refrescar la lista
              if (store.selectedClient()?.id === id) {
                 patchState(store, { selectedClient: null });
              }
              notification.showSuccess(NotificationSeverity.Success,'Cliente eliminado con éxito.');
              // loading y spinner se manejan en loadClients
            }),
            catchError((err: HttpErrorResponse) => {
              patchState(store, { error: err, loading: false });
              notification.showError(NotificationSeverity.Error,'Error al eliminar el cliente.');
              spinner.hide();
              return of(null);
            })
          )
        )
      )
    );
    

    

    return {
      loadClients,
      loadClientById,
      createClient,
      updateClient,
      deleteClient,
      selectClient(client: ClientResponseDto | null): void { // Este no es un efecto, solo actualiza estado
        patchState(store, { selectedClient: client });
      },
      clearError(): void {
        patchState(store, { error: null });
      }
    };
  })
);