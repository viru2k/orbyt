import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import { ServicesService } from '../../api/services/services.service';
import { ServiceResponseDto, CreateServiceDto, UpdateServiceDto, ServiceListResponseDto } from '../../api/models';

// Estado inicial del store
interface ServicesState {
  services: ServiceResponseDto[];
  loading: boolean;
  error: string | null;
  selectedService: ServiceResponseDto | null;
}

const initialState: ServicesState = {
  services: [],
  loading: false,
  error: null,
  selectedService: null,
};

// Store de servicios usando NgRx Signals
export const ServicesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // Computed properties
  withComputed((store) => ({
    // Servicios con datos mapeados adicionales
    selectServicesWithMappedData: computed(() =>
      store.services().map(service => ({
        ...service,
        statusText: service.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
        formattedPrice: `$${service.basePrice.toLocaleString('es-CO')}`,
        durationText: service.duration ? `${service.duration} min` : '-',
        categoryText: service.category || 'Sin categoría'
      }))
    ),

    // Servicios activos
    activeServices: computed(() =>
      store.services().filter(service => service.status === 'ACTIVE')
    ),

    // Total de servicios
    totalServices: computed(() => store.services().length),

    // Servicios por categoría
    servicesByCategory: computed(() => {
      const services = store.services();
      const categories = [...new Set(services.map(s => s.category || 'Sin categoría'))];
      return categories.map(category => ({
        category,
        count: services.filter(s => (s.category || 'Sin categoría') === category).length,
        services: services.filter(s => (s.category || 'Sin categoría') === category)
      }));
    })
  })),

  // Métodos del store
  withMethods((store, servicesService = inject(ServicesService)) => ({

    // Cargar todos los servicios
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          servicesService.serviceControllerFindAll().pipe(
            tapResponse({
              next: (response: ServiceListResponseDto) => {
                patchState(store, {
                  services: response.services || [],
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error loading services:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al cargar los servicios',
                });
              },
            })
          )
        )
      )
    ),

    // Crear nuevo servicio
    create: rxMethod<CreateServiceDto>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((createDto) =>
          servicesService.serviceControllerCreate({ body: createDto }).pipe(
            tapResponse({
              next: (newService: ServiceResponseDto) => {
                patchState(store, {
                  services: [...store.services(), newService],
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error creating service:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al crear el servicio',
                });
              },
            })
          )
        )
      )
    ),

    // Actualizar servicio
    update: rxMethod<{ id: number; serviceDto: UpdateServiceDto }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, serviceDto }) =>
          servicesService.serviceControllerUpdate({ id, body: serviceDto }).pipe(
            tapResponse({
              next: (updatedService: ServiceResponseDto) => {
                const services = store.services();
                const updatedServices = services.map(service =>
                  service.id === id ? updatedService : service
                );
                patchState(store, {
                  services: updatedServices,
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error updating service:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al actualizar el servicio',
                });
              },
            })
          )
        )
      )
    ),

    // Eliminar servicio
    delete: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          servicesService.serviceControllerRemove({ id }).pipe(
            tapResponse({
              next: () => {
                const services = store.services();
                const filteredServices = services.filter(service => service.id !== id);
                patchState(store, {
                  services: filteredServices,
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error deleting service:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al eliminar el servicio',
                });
              },
            })
          )
        )
      )
    ),

    // Cambiar estado del servicio (ACTIVE/INACTIVE)
    toggleStatus: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          servicesService.serviceControllerToggleStatus({ id }).pipe(
            tapResponse({
              next: (updatedService: ServiceResponseDto) => {
                const services = store.services();
                const updatedServices = services.map(service =>
                  service.id === id ? updatedService : service
                );
                patchState(store, {
                  services: updatedServices,
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error toggling service status:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al cambiar el estado del servicio',
                });
              },
            })
          )
        )
      )
    ),

    // Buscar servicio por ID
    findById: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          servicesService.serviceControllerFindOne({ id }).pipe(
            tapResponse({
              next: (service: ServiceResponseDto) => {
                patchState(store, {
                  selectedService: service,
                  loading: false,
                  error: null,
                });
              },
              error: (error: any) => {
                console.error('Error finding service:', error);
                patchState(store, {
                  loading: false,
                  error: 'Error al buscar el servicio',
                });
              },
            })
          )
        )
      )
    ),

    // Seleccionar servicio
    selectService: (service: ServiceResponseDto | null) => {
      patchState(store, { selectedService: service });
    },

    // Limpiar errores
    clearError: () => {
      patchState(store, { error: null });
    },

    // Resetear estado
    reset: () => {
      patchState(store, initialState);
    },
  }))
);