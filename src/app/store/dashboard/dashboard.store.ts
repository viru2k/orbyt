import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  DashboardMetricsDto
} from '../../api/models';
import { DashboardService } from '../../api/services/dashboard.service';

export interface DashboardState {
  // Dashboard metrics (complete stats)
  metrics: DashboardMetricsDto | null;

  // Quick stats
  quickStats: any | null;

  // Recent activities
  recentActivities: any[];

  // Current period filter
  currentPeriod: string;

  // UI state
  loading: boolean;
  loadingMetrics: boolean;
  loadingQuickStats: boolean;
  loadingActivities: boolean;
  error: any | null;
}

const initialState: DashboardState = {
  metrics: null,
  quickStats: null,
  recentActivities: [],
  currentPeriod: 'current',
  loading: false,
  loadingMetrics: false,
  loadingQuickStats: false,
  loadingActivities: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class DashboardStore extends ComponentStore<DashboardState> {
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'DashboardStore', this.globalStore);
  }

  // Selectors
  readonly metrics$ = this.select((state) => state.metrics);
  readonly quickStats$ = this.select((state) => state.quickStats);
  readonly recentActivities$ = this.select((state) => state.recentActivities);
  readonly currentPeriod$ = this.select((state) => state.currentPeriod);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingMetrics$ = this.select((state) => state.loadingMetrics);
  readonly loadingQuickStats$ = this.select((state) => state.loadingQuickStats);
  readonly loadingActivities$ = this.select((state) => state.loadingActivities);

  // Computed selectors
  readonly selectDashboardData = this.select(
    this.metrics$,
    this.quickStats$,
    this.recentActivities$,
    this.loading$,
    (metrics, quickStats, recentActivities, loading) => ({
      metrics,
      quickStats,
      recentActivities,
      loading
    })
  );

  // Revenue computed properties
  readonly totalRevenue$ = this.select(
    this.metrics$,
    (metrics) => metrics?.revenue?.totalRevenue || 0
  );

  readonly todayRevenue$ = this.select(
    this.metrics$,
    (metrics) => metrics?.revenue?.todayRevenue || 0
  );

  readonly thisWeekRevenue$ = this.select(
    this.metrics$,
    (metrics) => metrics?.revenue?.thisWeekRevenue || 0
  );

  readonly thisMonthRevenue$ = this.select(
    this.metrics$,
    (metrics) => metrics?.revenue?.thisMonthRevenue || 0
  );

  // Consultations computed properties
  readonly totalConsultations$ = this.select(
    this.metrics$,
    (metrics) => metrics?.consultations?.total || 0
  );

  readonly todayConsultations$ = this.select(
    this.metrics$,
    (metrics) => metrics?.consultations?.today || 0
  );

  // Appointments computed properties
  readonly pendingAppointments$ = this.select(
    this.metrics$,
    (metrics) => metrics?.appointments?.pending || 0
  );

  readonly todayAppointments$ = this.select(
    this.metrics$,
    (metrics) => metrics?.appointments?.today || 0
  );

  // Clients computed properties
  readonly activeClients$ = this.select(
    this.metrics$,
    (metrics) => metrics?.clients?.active || 0
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingMetrics = this.updater((state, loadingMetrics: boolean) => ({
    ...state,
    loadingMetrics
  }));

  private readonly setLoadingQuickStats = this.updater((state, loadingQuickStats: boolean) => ({
    ...state,
    loadingQuickStats
  }));

  private readonly setLoadingActivities = this.updater((state, loadingActivities: boolean) => ({
    ...state,
    loadingActivities
  }));

  private readonly setMetrics = this.updater((state, metrics: DashboardMetricsDto) => ({
    ...state,
    metrics,
    loadingMetrics: false
  }));

  private readonly setQuickStats = this.updater((state, quickStats: any) => ({
    ...state,
    quickStats,
    loadingQuickStats: false
  }));

  private readonly setRecentActivities = this.updater((state, recentActivities: any[]) => ({
    ...state,
    recentActivities,
    loadingActivities: false
  }));

  private readonly setCurrentPeriod = this.updater((state, currentPeriod: string) => ({
    ...state,
    currentPeriod
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingMetrics: false,
    loadingQuickStats: false,
    loadingActivities: false
  }));

  // Effects
  readonly loadDashboardMetrics = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingMetrics(true)),
      exhaustMap(() =>
        this.dashboardService.dashboardControllerGetMetrics().pipe(
          tapResponse(
            (metrics: DashboardMetricsDto) => {
              this.setMetrics(metrics);
            },
            (error: any) => {
              console.error('Error loading dashboard metrics:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las métricas del dashboard.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadQuickStats = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingQuickStats(true)),
      exhaustMap(() =>
        this.dashboardService.dashboardControllerGetQuickStats().pipe(
          tapResponse(
            (quickStats: any) => {
              this.setQuickStats(quickStats);
            },
            (error: any) => {
              console.error('Error loading quick stats:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las estadísticas rápidas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadRecentActivities = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingActivities(true)),
      exhaustMap(() =>
        this.dashboardService.dashboardControllerGetRecentActivity().pipe(
          tapResponse(
            (activities: any[]) => {
              this.setRecentActivities(activities || []);
            },
            (error: any) => {
              console.error('Error loading recent activities:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las actividades recientes.'
              );
            }
          )
        )
      )
    )
  );


  // Utility methods
  refreshDashboard(): void {
    this.setLoading(true);
    this.loadDashboardMetrics();
    this.loadQuickStats();
    this.loadRecentActivities();

    // Reset loading state when all individual loading states are false
    this.select(
      this.loadingMetrics$,
      this.loadingQuickStats$,
      this.loadingActivities$,
      (loadingMetrics, loadingQuickStats, loadingActivities) => ({
        loadingMetrics,
        loadingQuickStats,
        loadingActivities
      })
    ).subscribe(({ loadingMetrics, loadingQuickStats, loadingActivities }) => {
      if (!loadingMetrics && !loadingQuickStats && !loadingActivities) {
        this.setLoading(false);
      }
    });
  }

  refreshMetrics(): void {
    this.loadDashboardMetrics();
  }

  refreshQuickStats(): void {
    this.loadQuickStats();
  }

  refreshActivities(): void {
    this.loadRecentActivities();
  }

  // Period management
  updateCurrentPeriod(period: string): void {
    this.setCurrentPeriod(period);
  }

  // Helper methods
  getDashboardData() {
    return {
      metrics: this.get().metrics,
      quickStats: this.get().quickStats,
      recentActivities: this.get().recentActivities,
      loading: this.get().loading
    };
  }

  // Business logic helpers
  getRevenueProgress(goal: number): number {
    const current = this.get().metrics?.revenue?.totalRevenue || 0;
    return Math.min((current / goal) * 100, 100);
  }

  getConsultationsProgress(goal: number): number {
    const current = this.get().metrics?.consultations?.total || 0;
    return Math.min((current / goal) * 100, 100);
  }

  getRevenueGrowth(): number {
    const metrics = this.get().metrics;
    if (!metrics?.revenue) return 0;

    const thisWeek = metrics.revenue.thisWeekRevenue || 0;
    const total = metrics.revenue.totalRevenue || 0;
    const previousWeek = (total - thisWeek) / 4;

    return previousWeek > 0 ? ((thisWeek - previousWeek) / previousWeek) * 100 : 0;
  }

  getConsultationGrowth(): number {
    const metrics = this.get().metrics;
    if (!metrics?.consultations) return 0;

    const thisWeek = metrics.consultations.thisWeek || 0;
    const total = metrics.consultations.total || 0;
    const previousWeek = (total - thisWeek) / 4;

    return previousWeek > 0 ? ((thisWeek - previousWeek) / previousWeek) * 100 : 0;
  }

  getClientSatisfaction(): number {
    const metrics = this.get().metrics;
    if (!metrics?.consultations) return 0;

    const completed = metrics.consultations.completed || 0;
    const cancelled = metrics.consultations.cancelled || 0;
    const total = completed + cancelled;

    return total > 0 ? (completed / total) * 100 : 0;
  }
}