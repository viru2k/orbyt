import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, combineLatest, map } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../../../../store/component-state.reducer';
import { Store } from '@ngrx/store';
import { InventoryDashboardService } from '../../../../api/services/inventory-dashboard.service';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  InventoryDashboardAdvancedMetricsDto,
  AdvancedLowStockProductDto,
  TopMoversDto,
  MovementAnalysisDto,
  StockValueHistoryDto,
  ExtendedProductResponseDto,
  StockDistributionDto,
  MovementsChartDto
} from '../../../../api/models';

export interface AdvancedInventoryDashboardState {
  // Métricas avanzadas
  advancedMetrics: InventoryDashboardAdvancedMetricsDto | null;

  // Productos y análisis
  advancedLowStockProducts: AdvancedLowStockProductDto[];
  topMovers: TopMoversDto[];
  movementAnalysis: MovementAnalysisDto | null;

  // Históricos y tendencias
  stockValueHistory: StockValueHistoryDto[];

  // Búsqueda de productos
  searchResults: ExtendedProductResponseDto[];
  searchQuery: string;

  // Estados existentes para compatibilidad
  stockDistribution: StockDistributionDto | null;
  movementsChart: MovementsChartDto | null;

  // Estados de carga
  loading: boolean;
  loadingAdvanced: boolean;
  loadingSearch: boolean;
  error: any | null;
}

const initialState: AdvancedInventoryDashboardState = {
  advancedMetrics: null,
  advancedLowStockProducts: [],
  topMovers: [],
  movementAnalysis: null,
  stockValueHistory: [],
  searchResults: [],
  searchQuery: '',
  stockDistribution: null,
  movementsChart: null,
  loading: false,
  loadingAdvanced: false,
  loadingSearch: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AdvancedInventoryDashboardStore extends ComponentStore<AdvancedInventoryDashboardState> {
  private readonly inventoryDashboardService = inject(InventoryDashboardService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'AdvancedInventoryDashboardStore', this.globalStore);
  }

  // Selectores básicos
  readonly advancedMetrics$ = this.select((state) => state.advancedMetrics);
  readonly advancedLowStockProducts$ = this.select((state) => state.advancedLowStockProducts);
  readonly topMovers$ = this.select((state) => state.topMovers);
  readonly movementAnalysis$ = this.select((state) => state.movementAnalysis);
  readonly stockValueHistory$ = this.select((state) => state.stockValueHistory);
  readonly searchResults$ = this.select((state) => state.searchResults);
  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly stockDistribution$ = this.select((state) => state.stockDistribution);
  readonly movementsChart$ = this.select((state) => state.movementsChart);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingAdvanced$ = this.select((state) => state.loadingAdvanced);
  readonly loadingSearch$ = this.select((state) => state.loadingSearch);
  readonly error$ = this.select((state) => state.error);

  // Selectores computados
  readonly criticalProducts$ = this.select(
    this.advancedLowStockProducts$,
    this.topMovers$,
    (lowStock, topMovers) => ({
      urgentStock: lowStock.filter(p => (p.daysUntilStockout || 0) <= 7),
      criticalValue: lowStock.filter(p => (p.stockValue || 0) > 1000),
      fastMovers: topMovers.filter(t => (t.movementFrequency || 0) > 5)
    })
  );

  readonly inventoryInsights$ = this.select(
    this.advancedMetrics$,
    this.movementAnalysis$,
    this.stockValueHistory$,
    (metrics, analysis, history) => ({
      totalValue: metrics?.totalInventoryValue || 0,
      valueGrowth: this.calculateValueGrowth(history),
      turnoverRate: analysis?.averageTurnoverRate || 0,
      efficiencyScore: this.calculateEfficiencyScore(metrics, analysis),
      alerts: this.generateAlerts(metrics, analysis)
    })
  );

  readonly dashboardOverview$ = this.select(
    this.advancedMetrics$,
    this.criticalProducts$,
    this.inventoryInsights$,
    (metrics, critical, insights) => ({
      metrics,
      critical,
      insights,
      lastUpdated: new Date().toISOString()
    })
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  private readonly setLoadingAdvanced = this.updater((state, loading: boolean) => ({ ...state, loadingAdvanced: loading }));
  private readonly setLoadingSearch = this.updater((state, loading: boolean) => ({ ...state, loadingSearch: loading }));
  private readonly setError = this.updater((state, error: any) => ({ ...state, error, loading: false, loadingAdvanced: false }));

  private readonly setAdvancedMetrics = this.updater((state, metrics: InventoryDashboardAdvancedMetricsDto) => ({
    ...state,
    advancedMetrics: metrics,
    loadingAdvanced: false
  }));

  private readonly setAdvancedLowStockProducts = this.updater((state, products: AdvancedLowStockProductDto[]) => ({
    ...state,
    advancedLowStockProducts: products
  }));

  private readonly setTopMovers = this.updater((state, movers: TopMoversDto[]) => ({
    ...state,
    topMovers: movers
  }));

  private readonly setMovementAnalysis = this.updater((state, analysis: MovementAnalysisDto) => ({
    ...state,
    movementAnalysis: analysis
  }));

  private readonly setStockValueHistory = this.updater((state, history: StockValueHistoryDto[]) => ({
    ...state,
    stockValueHistory: history
  }));

  private readonly setSearchResults = this.updater((state, results: ExtendedProductResponseDto[]) => ({
    ...state,
    searchResults: results,
    loadingSearch: false
  }));

  private readonly setSearchQuery = this.updater((state, query: string) => ({
    ...state,
    searchQuery: query
  }));

  // Effects para métricas avanzadas
  readonly loadAdvancedMetrics = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingAdvanced(true)),
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetAdvancedDashboardMetrics().pipe(
          tapResponse(
            (metrics: InventoryDashboardAdvancedMetricsDto) => this.setAdvancedMetrics(metrics),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar métricas avanzadas.');
            }
          )
        )
      )
    )
  );

  readonly loadAdvancedLowStockProducts = this.effect<void>((trigger$) =>
    trigger$.pipe(
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetAdvancedLowStockProducts().pipe(
          tapResponse(
            (products: AdvancedLowStockProductDto[]) => this.setAdvancedLowStockProducts(products),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar productos con stock bajo.');
            }
          )
        )
      )
    )
  );

  readonly loadTopMovers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetTopMovers().pipe(
          tapResponse(
            (movers: TopMoversDto[]) => this.setTopMovers(movers),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar productos con mayor movimiento.');
            }
          )
        )
      )
    )
  );

  readonly loadMovementAnalysis = this.effect<void>((trigger$) =>
    trigger$.pipe(
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetMovementAnalysis().pipe(
          tapResponse(
            (analysis: MovementAnalysisDto) => this.setMovementAnalysis(analysis),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar análisis de movimientos.');
            }
          )
        )
      )
    )
  );

  readonly loadStockValueHistory = this.effect<void>((trigger$) =>
    trigger$.pipe(
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetStockValueHistory().pipe(
          tapResponse(
            (history: StockValueHistoryDto[]) => this.setStockValueHistory(history),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar historial de valor.');
            }
          )
        )
      )
    )
  );

  // Effect para búsqueda de productos
  readonly searchProducts = this.effect<{ query?: string; stockLevel?: 'high' | 'medium' | 'low' | 'out'; limit?: number }>((params$) =>
    params$.pipe(
      tap((params) => {
        this.setLoadingSearch(true);
        if (params.query) {
          this.setSearchQuery(params.query);
        }
      }),
      exhaustMap((params) =>
        this.inventoryDashboardService.inventoryControllerSearchProducts(params).pipe(
          tapResponse(
            (results: ExtendedProductResponseDto[]) => this.setSearchResults(results),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error en la búsqueda de productos.');
            }
          )
        )
      )
    )
  );

  // Effect para cargar todo el dashboard avanzado
  readonly loadAdvancedDashboard = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingAdvanced(true)),
      exhaustMap(() =>
        combineLatest([
          this.inventoryDashboardService.inventoryControllerGetAdvancedDashboardMetrics(),
          this.inventoryDashboardService.inventoryControllerGetAdvancedLowStockProducts(),
          this.inventoryDashboardService.inventoryControllerGetTopMovers(),
          this.inventoryDashboardService.inventoryControllerGetMovementAnalysis(),
          this.inventoryDashboardService.inventoryControllerGetStockValueHistory()
        ]).pipe(
          tapResponse(
            ([metrics, lowStock, topMovers, analysis, history]) => {
              this.setAdvancedMetrics(metrics);
              this.setAdvancedLowStockProducts(lowStock);
              this.setTopMovers(topMovers);
              this.setMovementAnalysis(analysis);
              this.setStockValueHistory(history);
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar dashboard avanzado.');
            }
          )
        )
      )
    )
  );

  // Métodos utilitarios privados
  private calculateValueGrowth(history: StockValueHistoryDto[]): number {
    if (history.length < 2) return 0;

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    if (!latest || !previous || previous.totalValue === 0) return 0;

    return ((latest.totalValue - previous.totalValue) / previous.totalValue) * 100;
  }

  private calculateEfficiencyScore(
    metrics: InventoryDashboardAdvancedMetricsDto | null,
    analysis: MovementAnalysisDto | null
  ): number {
    if (!metrics || !analysis) return 0;

    // Score basado en rotación, stock ratio y value efficiency
    const turnoverScore = Math.min((analysis.averageTurnoverRate || 0) * 20, 100);
    const stockScore = Math.max(100 - ((metrics.lowStockProductsCount || 0) * 5), 0);
    const valueScore = Math.min(((metrics.totalInventoryValue || 0) / 10000) * 10, 100);

    return Math.round((turnoverScore + stockScore + valueScore) / 3);
  }

  private generateAlerts(
    metrics: InventoryDashboardAdvancedMetricsDto | null,
    analysis: MovementAnalysisDto | null
  ): string[] {
    const alerts: string[] = [];

    if (metrics) {
      if ((metrics.lowStockProductsCount || 0) > 10) {
        alerts.push(`⚠️ ${metrics.lowStockProductsCount} productos con stock bajo`);
      }

      if ((metrics.outOfStockProductsCount || 0) > 0) {
        alerts.push(`🚨 ${metrics.outOfStockProductsCount} productos sin stock`);
      }

      if ((metrics.totalInventoryValue || 0) < 10000) {
        alerts.push('📉 Valor total del inventario por debajo del mínimo');
      }
    }

    if (analysis && (analysis.averageTurnoverRate || 0) < 1) {
      alerts.push('🐌 Rotación promedio muy baja');
    }

    return alerts;
  }
}