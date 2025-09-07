import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../../../../store/component-state.reducer';
import { Store } from '@ngrx/store';
import { InventoryDashboardService } from '../../../../api/services/inventory-dashboard.service';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { 
  InventoryDashboardMetricsDto,
  RecentMovementsDto,
  LowStockProductsDto,
  StockDistributionDto,
  MovementsChartDto,
  StockMovementResponseDto,
  LowStockProductDto
} from '../../../../api/models';

export interface InventoryDashboardState {
  metrics: InventoryDashboardMetricsDto | null;
  recentMovements: StockMovementResponseDto[];
  lowStockProducts: LowStockProductDto[];
  stockDistribution: StockDistributionDto | null;
  movementsChart: MovementsChartDto | null;
  loading: boolean;
  error: any | null;
}

const initialState: InventoryDashboardState = {
  metrics: null,
  recentMovements: [],
  lowStockProducts: [],
  stockDistribution: null,
  movementsChart: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class InventoryDashboardStore extends ComponentStore<InventoryDashboardState> {
  private readonly inventoryDashboardService = inject(InventoryDashboardService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'InventoryDashboardStore', this.globalStore);
  }

  // Selectores
  readonly metrics$ = this.select((state) => state.metrics);
  readonly recentMovements$ = this.select((state) => state.recentMovements);
  readonly lowStockProducts$ = this.select((state) => state.lowStockProducts);
  readonly stockDistribution$ = this.select((state) => state.stockDistribution);
  readonly movementsChart$ = this.select((state) => state.movementsChart);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);

  // Selector para movimientos con metadata
  readonly selectRecentMovementsWithMetadata = this.select(
    this.recentMovements$,
    (movements) => movements.map(movement => ({
      ...movement,
      typeText: this.getMovementTypeText(movement.type),
      typeIcon: this.getMovementTypeIcon(movement.type),
      typeClass: `movement-${movement.type}`,
      formattedDate: new Date(movement.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  private readonly setError = this.updater((state, error: any) => ({ ...state, error, loading: false }));
  
  private readonly setMetrics = this.updater((state, metrics: InventoryDashboardMetricsDto) => ({
    ...state,
    metrics,
    loading: false
  }));
  
  private readonly setRecentMovements = this.updater((state, movements: StockMovementResponseDto[]) => ({
    ...state,
    recentMovements: movements,
    loading: false
  }));
  
  private readonly setLowStockProducts = this.updater((state, products: LowStockProductDto[]) => ({
    ...state,
    lowStockProducts: products,
    loading: false
  }));
  
  private readonly setStockDistribution = this.updater((state, distribution: StockDistributionDto) => ({
    ...state,
    stockDistribution: distribution,
    loading: false
  }));
  
  private readonly setMovementsChart = this.updater((state, chart: MovementsChartDto) => ({
    ...state,
    movementsChart: chart,
    loading: false
  }));

  // Effects
  readonly loadMetrics = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetDashboardMetrics().pipe(
          tapResponse(
            (metrics: InventoryDashboardMetricsDto) => this.setMetrics(metrics),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar métricas del dashboard.');
            }
          )
        )
      )
    )
  );

  readonly loadRecentMovements = this.effect<{ limit?: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.inventoryDashboardService.inventoryControllerGetRecentMovements(params).pipe(
          tapResponse(
            (response: RecentMovementsDto) => this.setRecentMovements(response.movements),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar movimientos recientes.');
            }
          )
        )
      )
    )
  );

  readonly loadLowStockProducts = this.effect<{ limit?: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.inventoryDashboardService.inventoryControllerGetLowStockProducts(params).pipe(
          tapResponse(
            (response: LowStockProductsDto) => {              
              this.setLowStockProducts(response.products);
            },
            (error: any) => {
              console.error('❌ LOW STOCK PRODUCTS - Error:', error);
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar productos con stock bajo.');
            }
          )
        )
      )
    )
  );

  readonly loadStockDistribution = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.inventoryDashboardService.inventoryControllerGetStockDistribution().pipe(
          tapResponse(
            (distribution: StockDistributionDto) => {              
              this.setStockDistribution(distribution);
            },
            (error: any) => {
              console.error('❌ STOCK DISTRIBUTION - Error:', error);
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar distribución de stock.');
            }
          )
        )
      )
    )
  );

  readonly loadMovementsChart = this.effect<{ period?: '7d' | '30d' }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.inventoryDashboardService.inventoryControllerGetMovementsChart(params).pipe(
          tapResponse(
            (chart: MovementsChartDto) => this.setMovementsChart(chart),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar gráfico de movimientos.');
            }
          )
        )
      )
    )
  );

  readonly loadAll = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => {
        this.loadMetrics();
        this.loadRecentMovements({ limit: 10 });
        this.loadLowStockProducts({ limit: 10 });
        this.loadStockDistribution();
        this.loadMovementsChart({ period: '7d' });
      })
    )
  );

  // Helper methods
  private getMovementTypeText(type: 'in' | 'out' | 'adjustment' | 'usage'): string {
    const typeMap = {
      'in': 'Entrada',
      'out': 'Salida',
      'adjustment': 'Ajuste',
      'usage': 'Uso Interno'
    };
    return typeMap[type] || type;
  }

  private getMovementTypeIcon(type: 'in' | 'out' | 'adjustment' | 'usage'): string {
    const iconMap = {
      'in': 'pi pi-arrow-down',
      'out': 'pi pi-arrow-up',
      'adjustment': 'pi pi-sliders-h',
      'usage': 'pi pi-cog'
    };
    return iconMap[type] || 'pi pi-circle';
  }
}