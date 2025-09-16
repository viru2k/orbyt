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
  RoomResponseDto,
  CreateRoomDto,
  UpdateRoomDto,
  RoomListResponseDto,
} from '../../api/models';
import { RoomsService } from '../../api/services/rooms.service';
import { DateFormatService } from 'src/app/services/core/utils/date-format.service';

export interface RoomState {
  rooms: RoomResponseDto[];
  displayRoom: RoomResponseDto | null;
  loading: boolean;
  error: any | null;
}

const initialState: RoomState = {
  rooms: [],
  displayRoom: null,
  loading: false,
  error: null,
};

export const RoomsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, roomsService = inject(RoomsService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          roomsService.roomControllerFindAll().pipe(
            tap((response: RoomListResponseDto) => {
              patchState(store, {
                rooms: response.rooms || [],
                loading: false
              });
            })
          )
        )
      )
    ),
    create: rxMethod<CreateRoomDto>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((roomDto) =>
          roomsService.roomControllerCreate({ body: roomDto }).pipe(
            tap((createdRoom) => {
              patchState(store, (state) => ({
                rooms: [...state.rooms, createdRoom],
                loading: false,
              }));
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: number; roomDto: UpdateRoomDto }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ id, roomDto }) =>
          roomsService.roomControllerUpdate({ id, body: roomDto }).pipe(
            tap((updatedRoom) => {
              patchState(store, (state) => ({
                rooms: state.rooms.map((r) =>
                  r.id === updatedRoom.id ? updatedRoom : r
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
          roomsService.roomControllerRemove({ id }).pipe(
            tap(() => {
              patchState(store, (state) => ({
                rooms: state.rooms.filter((r) => r.id !== id),
                loading: false,
              }));
            })
          )
        )
      )
    ),
    toggleStatus: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((id) =>
          roomsService.roomControllerToggleStatus({ id }).pipe(
            tap((updatedRoom) => {
              patchState(store, (state) => ({
                rooms: state.rooms.map((r) =>
                  r.id === updatedRoom.id ? updatedRoom : r
                ),
                loading: false,
              }));
            })
          )
        )
      )
    ),
    getRoomById(id: number) {
      return store.rooms().find((room) => room.id === id);
    },
    setDisplayRoom(room: RoomResponseDto | null) {
      patchState(store, { displayRoom: room });
    },
    clearDisplayRoom() {
      patchState(store, { displayRoom: null });
    },
  })),
  withComputed(({ rooms }, dateFormatService = inject(DateFormatService)) => ({
    selectTotalRooms: computed(() => rooms().length),
    selectRoomsWithMappedData: computed(() => {
      const roomList = rooms();
      return roomList.map(room => {
        let statusText = 'No definido';
        let statusClass = 'status-undefined';

        if (room.isActive !== undefined) {
          if (room.isActive) {
            statusText = 'Activa';
            statusClass = 'status-active';
          } else {
            statusText = 'Inactiva';
            statusClass = 'status-inactive';
          }
        }

        // Format dates
        const displayCreatedAt = {
          value: room.createdAt,
          displayValue: dateFormatService.format(room.createdAt, 'dd/MM/yyyy HH:mm')
        };

        const displayUpdatedAt = {
          value: room.updatedAt,
          displayValue: dateFormatService.format(room.updatedAt, 'dd/MM/yyyy HH:mm')
        };

        return {
          ...room,
          statusText,
          statusClass,
          displayCreatedAt,
          displayUpdatedAt,
        };
      });
    }),
    selectActiveRooms: computed(() => {
      return rooms().filter(room => room.isActive);
    }),
    selectInactiveRooms: computed(() => {
      return rooms().filter(room => !room.isActive);
    }),
  }))
);