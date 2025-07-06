import { inject } from '@angular/core';
import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import {
  ClientsService,
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
} from '@orb-api/index';
import { DateFormatService } from 'src/app/services/core/utils/date-format.service';


export interface ClientState {
  clients: ClientResponseDto[];
  displayClient: ClientResponseDto | null;
  loading: boolean;
  error: any | null;
}

const initialState: ClientState = {
  clients: [],
  displayClient: null,
  loading: false,
  error: null,
};

export const ClientStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, clientsService = inject(ClientsService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          clientsService.clientControllerFindAll().pipe(
            tap((clients) => {
              patchState(store, { clients, loading: false });
            })
          )
        )
      )
    ),
    create: rxMethod<CreateClientDto>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((clientDto) =>
          clientsService.clientControllerCreate(clientDto).pipe(
            tap((createdClient) => {
              patchState(store, (state) => ({
                clients: [...state.clients, createdClient],
                loading: false,
              }));
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: number; clientDto: UpdateClientDto }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ id, clientDto }) =>
          clientsService.clientControllerUpdate(id, clientDto).pipe(
            tap((updatedClient) => {
              patchState(store, (state) => ({
                clients: state.clients.map((c) =>
                  c.id === updatedClient.id ? updatedClient : c
                ),
                loading: false,
              }));
            })
          )
        )
      )
    ),
    delete: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((id) =>
          clientsService.clientControllerRemove(id).pipe(
            tap(() => {
              patchState(store, (state) => ({
                clients: state.clients.filter((c) => c.id !== id),
                loading: false,
              }));
            })
          )
        )
      )
    ),
    getClientById(id: number) {
      return store.clients().find((client) => client.id === id);
    },
    setDisplayClient(client: ClientResponseDto | null) {
      patchState(store, { displayClient: client });
    },
    clearDisplayClient() {
      patchState(store, { displayClient: null });
    },
  })),
  withComputed(({ clients }, dateFormatService = inject(DateFormatService)) => ({
    selectTotalClients: computed(() => clients().length),
    selectClientsWithMappedData: computed(() => {
      const clientList = clients();
      return clientList.map(client => {
        let statusText = 'No definido';
        let statusClass = 'status-undefined';
        if (client.status) {
          switch (client.status.toUpperCase()) {
            case 'ACTIVE':
              statusText = 'Activo';
              statusClass = 'status-active';
              break;
            case 'INACTIVE':
              statusText = 'Inactivo';
              statusClass = 'status-inactive';
              break;
            default:
              statusText = client.status;
              statusClass = 'status-unknown';
          }
        }
        
        // --- CAMBIO CLAVE AQUÍ ---
        // Creamos un objeto para cada fecha con el valor original y el formateado
        const displayCreatedAt = {
          value: client.createdAt,
          displayValue: dateFormatService.format(client.createdAt, 'dd/MM/yyyy HH:mm')
        };
        
        const displayUpdatedAt = {
            value: client.updatedAt,
            displayValue: dateFormatService.format(client.updatedAt, 'dd/MM/yyyy HH:mm')
        };

        return {
          ...client,
          statusText,
          statusClass,
          displayCreatedAt,
          displayUpdatedAt
        };
      });
    }),
  }))
);
