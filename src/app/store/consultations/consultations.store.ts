import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  ConsultationResponseDto,
  ConsultationTokenResponseDto,
  ConsultationOperationResultDto,
  CreateConsultationDto,
  UpdateConsultationDto
} from '../../api/models';
import { ConsultationsService } from '../../api/services/consultations.service';

export interface ConsultationsState {
  // Consultations
  consultations: ConsultationResponseDto[];
  todayConsultations: ConsultationResponseDto[];
  clientHistory: { [clientId: number]: ConsultationResponseDto[] };
  selectedConsultation: ConsultationResponseDto | null;

  // Tokens
  consultationTokens: { [consultationId: number]: ConsultationTokenResponseDto[] };

  // Statistics
  stats: any | null;

  // Filters
  filters: {
    status?: string;
    clientId?: number;
    businessTypeId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    searchTerm?: string;
  };

  // UI state
  loading: boolean;
  loadingToday: boolean;
  loadingHistory: boolean;
  loadingTokens: boolean;
  loadingStats: boolean;
  error: any | null;
}

const initialState: ConsultationsState = {
  consultations: [],
  todayConsultations: [],
  clientHistory: {},
  selectedConsultation: null,
  consultationTokens: {},
  stats: null,
  filters: {
    page: 1,
    limit: 20
  },
  loading: false,
  loadingToday: false,
  loadingHistory: false,
  loadingTokens: false,
  loadingStats: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class ConsultationsStore extends ComponentStore<ConsultationsState> {
  private readonly consultationsService = inject(ConsultationsService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'ConsultationsStore', this.globalStore);
  }

  // Selectors
  readonly consultations$ = this.select((state) => state.consultations);
  readonly todayConsultations$ = this.select((state) => state.todayConsultations);
  readonly selectedConsultation$ = this.select((state) => state.selectedConsultation);
  readonly stats$ = this.select((state) => state.stats);
  readonly filters$ = this.select((state) => state.filters);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingToday$ = this.select((state) => state.loadingToday);
  readonly loadingHistory$ = this.select((state) => state.loadingHistory);
  readonly loadingTokens$ = this.select((state) => state.loadingTokens);
  readonly loadingStats$ = this.select((state) => state.loadingStats);

  // Computed selectors
  readonly selectConsultationsByStatus = (status: string) =>
    this.select(
      this.consultations$,
      (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === status) : []
    );

  // Status-specific observables
  readonly pendingConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === 'pending') : []
  );

  readonly inProgressConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === 'in_progress') : []
  );

  readonly completedConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === 'completed') : []
  );

  readonly cancelledConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === 'cancelled') : []
  );

  // Additional computed observables needed by components
  readonly totalConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.length : 0
  );

  readonly filteredConsultations$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations : []
  );

  readonly consultationsWithFollowUp$ = this.select(
    this.consultations$,
    (consultations) => Array.isArray(consultations) ? consultations.filter(c => c.status === 'pending' && c.followUpRequired) : []
  );

  readonly averageConsultationDuration$ = this.select(
    this.consultations$,
    (consultations) => {
      if (!Array.isArray(consultations) || !consultations.length) return 0;
      const durationsInMinutes = consultations
        .filter(c => c.startTime && c.endTime)
        .map(c => {
          const start = new Date(c.startTime!).getTime();
          const end = new Date(c.endTime!).getTime();
          return (end - start) / (1000 * 60); // Convert to minutes
        });

      if (durationsInMinutes.length === 0) return 0;

      const total = durationsInMinutes.reduce((sum, duration) => sum + duration, 0);
      return Math.round(total / durationsInMinutes.length);
    }
  );

  readonly selectClientHistory = (clientId: number) =>
    this.select((state) => state.clientHistory[clientId] || []);

  readonly selectConsultationTokens = (consultationId: number) =>
    this.select((state) => state.consultationTokens[consultationId] || []);

  readonly selectPaginatedConsultations = this.select(
    this.consultations$,
    this.filters$,
    (consultations, filters) => {
      if (!Array.isArray(consultations) || !consultations.length) return [];
      const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
      const endIndex = startIndex + (filters.limit || 20);
      return consultations.slice(startIndex, endIndex);
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

  private readonly setLoadingHistory = this.updater((state, loadingHistory: boolean) => ({
    ...state,
    loadingHistory
  }));

  private readonly setLoadingTokens = this.updater((state, loadingTokens: boolean) => ({
    ...state,
    loadingTokens
  }));

  private readonly setLoadingStats = this.updater((state, loadingStats: boolean) => ({
    ...state,
    loadingStats
  }));

  private readonly setConsultations = this.updater((state, consultations: ConsultationResponseDto[]) => ({
    ...state,
    consultations,
    loading: false
  }));

  private readonly setTodayConsultations = this.updater((state, todayConsultations: ConsultationResponseDto[]) => ({
    ...state,
    todayConsultations,
    loadingToday: false
  }));

  private readonly setClientHistory = this.updater((state, { clientId, consultations }: { clientId: number, consultations: ConsultationResponseDto[] }) => ({
    ...state,
    clientHistory: {
      ...state.clientHistory,
      [clientId]: consultations
    },
    loadingHistory: false
  }));

  private readonly setSelectedConsultation = this.updater((state, consultation: ConsultationResponseDto | null) => ({
    ...state,
    selectedConsultation: consultation
  }));

  private readonly setConsultationTokens = this.updater((state, { consultationId, tokens }: { consultationId: number, tokens: ConsultationTokenResponseDto[] }) => ({
    ...state,
    consultationTokens: {
      ...state.consultationTokens,
      [consultationId]: tokens
    },
    loadingTokens: false
  }));

  private readonly setStats = this.updater((state, stats: any) => ({
    ...state,
    stats,
    loadingStats: false
  }));

  private readonly setFilters = this.updater((state, filters: Partial<ConsultationsState['filters']>) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  }));

  private readonly addConsultation = this.updater((state, consultation: ConsultationResponseDto) => ({
    ...state,
    consultations: [consultation, ...state.consultations]
  }));

  private readonly updateConsultationInState = this.updater((state, consultation: ConsultationResponseDto) => ({
    ...state,
    consultations: state.consultations.map(c => c.id === consultation.id ? consultation : c),
    selectedConsultation: state.selectedConsultation?.id === consultation.id ? consultation : state.selectedConsultation,
    // Update in client history if exists
    clientHistory: Object.keys(state.clientHistory).reduce((acc, key) => ({
      ...acc,
      [key]: state.clientHistory[Number(key)].map(c => c.id === consultation.id ? consultation : c)
    }), {})
  }));

  private readonly removeConsultation = this.updater((state, consultationId: number) => ({
    ...state,
    consultations: state.consultations.filter(c => c.id !== consultationId),
    selectedConsultation: state.selectedConsultation?.id === consultationId ? null : state.selectedConsultation,
    // Remove from client history
    clientHistory: Object.keys(state.clientHistory).reduce((acc, key) => ({
      ...acc,
      [key]: state.clientHistory[Number(key)].filter(c => c.id !== consultationId)
    }), {})
  }));

  private readonly addConsultationToken = this.updater((state, { consultationId, token }: { consultationId: number, token: ConsultationTokenResponseDto }) => ({
    ...state,
    consultationTokens: {
      ...state.consultationTokens,
      [consultationId]: [...(state.consultationTokens[consultationId] || []), token]
    }
  }));

  private readonly removeConsultationToken = this.updater((state, { consultationId, tokenId }: { consultationId: number, tokenId: number }) => ({
    ...state,
    consultationTokens: {
      ...state.consultationTokens,
      [consultationId]: (state.consultationTokens[consultationId] || []).filter((_, index) => index !== tokenId)
    }
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingToday: false,
    loadingHistory: false,
    loadingTokens: false,
    loadingStats: false
  }));

  // Effects
  readonly loadConsultations = this.effect<Partial<ConsultationsState['filters']>>((params$) =>
    params$.pipe(
      tap((params) => {
        this.setFilters(params);
        this.setLoading(true);
      }),
      exhaustMap((params) => {
        const currentFilters = this.get().filters;
        const finalParams = { ...currentFilters, ...params };

        // Ensure status parameter is properly typed
        if (finalParams.status && typeof finalParams.status === 'string') {
          const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
          if (!validStatuses.includes(finalParams.status)) {
            delete finalParams.status;
          }
        }

        return this.consultationsService.consultationControllerFindAll({
          status: finalParams.status as any,
          clientId: finalParams.clientId,
          page: finalParams.page,
          limit: finalParams.limit
        }).pipe(
          tapResponse(
            (consultations: ConsultationResponseDto[]) => {
              this.setConsultations(consultations);
            },
            (error: any) => {
              console.error('Error loading consultations:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las consultas.'
              );
            }
          )
        );
      })
    )
  );

  readonly loadTodayConsultations = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingToday(true)),
      exhaustMap(() =>
        this.consultationsService.consultationControllerGetTodayConsultations().pipe(
          tapResponse(
            (consultations: ConsultationResponseDto[]) => {
              this.setTodayConsultations(consultations);
            },
            (error: any) => {
              console.error('Error loading today consultations:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las consultas de hoy.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadConsultationById = this.effect<number>((consultationId$) =>
    consultationId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.consultationsService.consultationControllerFindOne({ id }).pipe(
          tapResponse(
            (consultation: ConsultationResponseDto) => {
              this.setSelectedConsultation(consultation);
              this.setLoading(false);
            },
            (error: any) => {
              console.error('Error loading consultation:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadClientHistory = this.effect<number>((clientId$) =>
    clientId$.pipe(
      tap(() => this.setLoadingHistory(true)),
      exhaustMap((clientId) =>
        this.consultationsService.consultationControllerGetClientHistory({ clientId }).pipe(
          tapResponse(
            (consultations: ConsultationResponseDto[]) => {
              this.setClientHistory({ clientId, consultations });
            },
            (error: any) => {
              console.error('Error loading client history:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar el historial del cliente.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadConsultationTokens = this.effect<number>((consultationId$) =>
    consultationId$.pipe(
      tap(() => this.setLoadingTokens(true)),
      exhaustMap((consultationId) =>
        this.consultationsService.consultationControllerGetTokensForConsultation({ id: consultationId }).pipe(
          tapResponse(
            (tokens: ConsultationTokenResponseDto[]) => {
              this.setConsultationTokens({ consultationId, tokens });
            },
            (error: any) => {
              console.error('Error loading consultation tokens:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar los tokens de la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadStats = this.effect<{ from?: string; to?: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingStats(true)),
      exhaustMap((params) =>
        this.consultationsService.consultationControllerGetStats(params).pipe(
          tapResponse(
            (stats: any) => {
              this.setStats(stats);
            },
            (error: any) => {
              console.error('Error loading consultation stats:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las estadísticas de consultas.'
              );
            }
          )
        )
      )
    )
  );

  readonly createConsultation = this.effect<CreateConsultationDto>((consultationData$) =>
    consultationData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((consultationData) =>
        this.consultationsService.consultationControllerCreate({ body: consultationData }).pipe(
          tapResponse(
            (consultation: ConsultationResponseDto) => {
              this.addConsultation(consultation);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Consulta creada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly updateConsultation = this.effect<{ id: number; consultationData: UpdateConsultationDto }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, consultationData }) =>
        this.consultationsService.consultationControllerUpdate({ id, body: consultationData }).pipe(
          tapResponse(
            (consultation: ConsultationResponseDto) => {
              this.updateConsultationInState(consultation);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Consulta actualizada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly updateConsultationStatus = this.effect<{ id: number; status: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, status }) =>
        this.consultationsService.consultationControllerUpdateStatus({ id }).pipe(
          tapResponse(
            (consultation: ConsultationResponseDto) => {
              this.updateConsultationInState(consultation);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Estado de consulta actualizado con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar el estado de la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly deleteConsultation = this.effect<number>((consultationId$) =>
    consultationId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.consultationsService.consultationControllerRemove({ id }).pipe(
          tapResponse(
            () => {
              this.removeConsultation(id);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Consulta eliminada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al eliminar la consulta.'
              );
            }
          )
        )
      )
    )
  );

  readonly createConsultationToken = this.effect<{ consultationId: number; tokenData: any }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingTokens(true)),
      exhaustMap(({ consultationId, tokenData }) =>
        this.consultationsService.consultationControllerCreateToken({ id: consultationId, body: tokenData }).pipe(
          tapResponse(
            (token: ConsultationTokenResponseDto) => {
              this.addConsultationToken({ consultationId, token });
              this.setLoadingTokens(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Token creado con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear el token.'
              );
            }
          )
        )
      )
    )
  );

  readonly createAutoTokens = this.effect<number>((consultationId$) =>
    consultationId$.pipe(
      tap(() => this.setLoadingTokens(true)),
      exhaustMap((consultationId) =>
        this.consultationsService.consultationControllerCreateAutoTokens({ id: consultationId }).pipe(
          tapResponse(
            (tokens: ConsultationTokenResponseDto[]) => {
              this.setConsultationTokens({ consultationId, tokens });
              this.setLoadingTokens(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Tokens automáticos creados con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear los tokens automáticos.'
              );
            }
          )
        )
      )
    )
  );

  readonly revokeToken = this.effect<{ tokenId: number; consultationId: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingTokens(true)),
      exhaustMap(({ tokenId, consultationId }) =>
        this.consultationsService.consultationControllerRevokeToken({ tokenId }).pipe(
          tapResponse(
            (result: ConsultationOperationResultDto) => {
              this.removeConsultationToken({ consultationId, tokenId });
              this.setLoadingTokens(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Token revocado con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al revocar el token.'
              );
            }
          )
        )
      )
    )
  );

  readonly uploadFile = this.effect<{ consultationId: number; file: File }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ consultationId, file }) =>
        this.consultationsService.consultationControllerUploadFile({ id: consultationId }).pipe(
          tapResponse(
            () => {
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Archivo subido con éxito.'
              );
              // Reload consultation to get updated file list
              this.loadConsultationById(consultationId);
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al subir el archivo.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  updateFilters(filters: Partial<ConsultationsState['filters']>): void {
    this.setFilters(filters);
    this.loadConsultations(filters);
  }

  clearFilters(): void {
    const defaultFilters = { page: 1, limit: 20 };
    this.setFilters(defaultFilters);
    this.loadConsultations({});
  }

  refreshConsultations(): void {
    const currentFilters = this.get().filters;
    this.loadConsultations(currentFilters);
  }

  refreshTodayConsultations(): void {
    this.loadTodayConsultations();
  }

  refreshStats(): void {
    this.loadStats({});
  }

  selectConsultation(consultation: ConsultationResponseDto): void {
    this.setSelectedConsultation(consultation);
    // Load tokens for selected consultation
    this.loadConsultationTokens(consultation.id);
  }

  clearSelectedConsultation(): void {
    this.setSelectedConsultation(null);
  }

  getConsultationById(id: number): ConsultationResponseDto | undefined {
    return this.get().consultations.find(consultation => consultation.id === id);
  }

  getConsultationsByStatus(status: string): ConsultationResponseDto[] {
    return this.get().consultations.filter(consultation => consultation.status === status);
  }

  getConsultationsByClient(clientId: number): ConsultationResponseDto[] {
    return this.get().clientHistory[clientId] || [];
  }

  getConsultationTokens(consultationId: number): ConsultationTokenResponseDto[] {
    return this.get().consultationTokens[consultationId] || [];
  }

  getTotalConsultations(): number {
    return this.get().consultations.length;
  }

  getPendingConsultations(): ConsultationResponseDto[] {
    return this.getConsultationsByStatus('pending');
  }

  getCompletedConsultations(): ConsultationResponseDto[] {
    return this.getConsultationsByStatus('completed');
  }

  getInProgressConsultations(): ConsultationResponseDto[] {
    return this.getConsultationsByStatus('in_progress');
  }

  getCancelledConsultations(): ConsultationResponseDto[] {
    return this.getConsultationsByStatus('cancelled');
  }

  getMonthlyConsultationStats(months: number = 6): any {
    const consultations = this.get().consultations;
    const now = new Date();
    const monthsData: any[] = [];
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthConsultations = consultations.filter(consultation => {
        if (!consultation.createdAt) return false;
        const consultationDate = new Date(consultation.createdAt);
        return consultationDate >= monthStart && consultationDate <= monthEnd;
      });

      const monthLabel = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      labels.push(monthLabel);
      data.push(monthConsultations.length);

      monthsData.push({
        month: monthLabel,
        total: monthConsultations.length,
        completed: monthConsultations.filter(c => c.status === 'completed').length,
        pending: monthConsultations.filter(c => c.status === 'pending').length,
        cancelled: monthConsultations.filter(c => c.status === 'cancelled').length
      });
    }

    return {
      labels,
      data,
      monthsData
    };
  }
}