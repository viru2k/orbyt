import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../../../../store/component-state.reducer';
import { Store } from '@ngrx/store';
import { StockService } from '../../../../api/services/stock.service';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { 
  StockMovementResponseDto, 
  CreateStockMovementDto, 
  StockSummaryResponseDto 
} from '../../../../api/models';

export interface MovementState {
  movements: StockMovementResponseDto[];
  summaries: { [productId: number]: StockSummaryResponseDto };
  loading: boolean;
  error: any | null;
  selectedProductId: number | null;
}

const initialState: MovementState = {
  movements: [],
  summaries: {},
  loading: false,
  error: null,
  selectedProductId: null,
};

@Injectable({ providedIn: 'root' })
export class MovementStore extends ComponentStore<MovementState> {
  private readonly stockService = inject(StockService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'MovementStore', this.globalStore);
  }

  // Selectores
  readonly movements$ = this.select((state) => state.movements);
  readonly summaries$ = this.select((state) => state.summaries);
  readonly loading$ = this.select((state) => state.loading);
  readonly selectedProductId$ = this.select((state) => state.selectedProductId);

  readonly selectMovementsWithMetadata = this.select(
    this.movements$,
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
  private readonly setMovements = this.updater((state, movements: StockMovementResponseDto[]) => ({ 
    ...state, 
    movements, 
    loading: false 
  }));
  private readonly addMovement = this.updater((state, movement: StockMovementResponseDto) => ({ 
    ...state, 
    movements: [movement, ...state.movements], 
    loading: false 
  }));
  private readonly setSummary = this.updater((state, { productId, summary }: { productId: number, summary: StockSummaryResponseDto }) => ({
    ...state,
    summaries: { ...state.summaries, [productId]: summary },
    loading: false
  }));
  private readonly setSelectedProductId = this.updater((state, selectedProductId: number | null) => ({
    ...state,
    selectedProductId
  }));
  private readonly setError = this.updater((state, error: any) => ({ ...state, error, loading: false }));

  // Effects
  readonly loadMovements = this.effect<number>((productId$) =>
    productId$.pipe(
      tap(() => this.setLoading(true)),
      tap((productId) => this.setSelectedProductId(productId)),
      switchMap((productId) =>
        this.stockService.stockControllerGetMovements({ productId }).pipe(
          tapResponse(
            (movements: StockMovementResponseDto[]) => this.setMovements(movements),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar movimientos de stock.');
            }
          )
        )
      )
    )
  );

  readonly loadSummary = this.effect<number>((productId$) =>
    productId$.pipe(
      tap(() => this.setLoading(true)),
      switchMap((productId) =>
        this.stockService.stockControllerGetSummary({ productId }).pipe(
          tapResponse(
            (summary: StockSummaryResponseDto) => this.setSummary({ productId, summary }),
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al cargar resumen de stock.');
            }
          )
        )
      )
    )
  );

  readonly createMovement = this.effect<CreateStockMovementDto>((movementDto$) =>
    movementDto$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((movementDto) =>
        this.stockService.stockControllerCreate({ body: movementDto }).pipe(
          tapResponse(
            (newMovement: StockMovementResponseDto) => {
              this.addMovement(newMovement);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Movimiento de stock registrado con éxito.');
              // Recargar el resumen del producto afectado
              this.loadSummary(movementDto.productId);
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al registrar el movimiento de stock.');
            }
          )
        )
      )
    )
  );

  readonly clearMovements = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => {
        this.setMovements([]);
        this.setSelectedProductId(null);
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