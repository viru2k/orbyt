import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, catchError, of } from 'rxjs';

// API Services
import { InventoryDashboardService } from '../../api/services/inventory-dashboard.service';
import { ProductsService } from '../../api/services/products.service';

// DTOs
import { InventoryDashboardAdvancedMetricsDto } from '../../api/models/inventory-dashboard-advanced-metrics-dto';
import { ExtendedProductResponseDto } from '../../api/models/extended-product-response-dto';
import { AdvancedLowStockProductDto } from '../../api/models/advanced-low-stock-product-dto';
import { TopMoversDto } from '../../api/models/top-movers-dto';
import { MovementAnalysisDto } from '../../api/models/movement-analysis-dto';
import { StockValueHistoryDto } from '../../api/models/stock-value-history-dto';
import { ProductDimensionsDto } from '../../api/models/product-dimensions-dto';
import { ProductPackagingDto } from '../../api/models/product-packaging-dto';
import { ProductInventoryConfigDto } from '../../api/models/product-inventory-config-dto';

// Types
export interface InventoryOverview {
  metrics: InventoryDashboardAdvancedMetricsDto;
  lowStockProducts: AdvancedLowStockProductDto[];
  topMovers: TopMoversDto[];
  movementAnalysis: MovementAnalysisDto;
}

export interface ProductSearchOptions {
  query?: string;
  stockLevel?: 'high' | 'medium' | 'low' | 'out';
  category?: string;
  limit?: number;
}

export interface ProductFullInfo {
  product: ExtendedProductResponseDto;
  dimensions?: ProductDimensionsDto;
  packaging?: ProductPackagingDto;
  inventoryConfig?: ProductInventoryConfigDto;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedInventoryService {

  constructor(
    private inventoryService: InventoryDashboardService,
    private productsService: ProductsService
  ) {}

  /**
   * Obtener resumen completo del inventario con métricas avanzadas
   */
  getInventoryOverview(): Observable<InventoryOverview> {
    return combineLatest([
      this.inventoryService.inventoryControllerGetAdvancedDashboardMetrics(),
      this.inventoryService.inventoryControllerGetAdvancedLowStockProducts(),
      this.inventoryService.inventoryControllerGetTopMovers(),
      this.inventoryService.inventoryControllerGetMovementAnalysis()
    ]).pipe(
      map(([metrics, lowStockProducts, topMovers, movementAnalysis]) => ({
        metrics,
        lowStockProducts,
        topMovers,
        movementAnalysis
      })),
      catchError(error => {
        console.error('Error loading inventory overview:', error);
        throw error;
      })
    );
  }

  /**
   * Búsqueda avanzada de productos con filtros
   */
  searchProducts(options: ProductSearchOptions = {}): Observable<ExtendedProductResponseDto[]> {
    const params = {
      q: options.query,
      stockLevel: options.stockLevel,
      category: options.category,
      limit: options.limit || 50
    };

    return this.inventoryService.inventoryControllerSearchProducts(params).pipe(
      catchError(error => {
        console.error('Error searching products:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener información completa de un producto (incluyendo dimensiones, empaque y configuración)
   */
  getProductFullInfo(productId: number): Observable<ProductFullInfo> {
    return combineLatest([
      this.inventoryService.inventoryControllerSearchProducts({ limit: 1 }).pipe(
        map(products => products.find(p => p.id === productId)),
        catchError(() => of(undefined))
      ),
      this.inventoryService.inventoryControllerGetProductDimensions({ id: productId }).pipe(
        catchError(() => of(undefined))
      ),
      this.inventoryService.inventoryControllerGetProductPackaging({ id: productId }).pipe(
        catchError(() => of(undefined))
      ),
      this.inventoryService.inventoryControllerGetInventoryConfig({ id: productId }).pipe(
        catchError(() => of(undefined))
      )
    ]).pipe(
      map(([product, dimensions, packaging, inventoryConfig]) => {
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }
        return {
          product,
          dimensions,
          packaging,
          inventoryConfig
        };
      })
    );
  }

  /**
   * Actualizar configuración completa de un producto
   */
  updateProductConfiguration(
    productId: number,
    updates: {
      dimensions?: Partial<ProductDimensionsDto>;
      packaging?: Partial<ProductPackagingDto>;
      inventoryConfig?: Partial<ProductInventoryConfigDto>;
    }
  ): Observable<ProductFullInfo> {
    const updateOperations: Observable<any>[] = [];

    if (updates.dimensions) {
      updateOperations.push(
        this.inventoryService.inventoryControllerUpdateProductDimensions({
          id: productId,
          body: updates.dimensions
        })
      );
    }

    if (updates.packaging) {
      updateOperations.push(
        this.inventoryService.inventoryControllerUpdateProductPackaging({
          id: productId,
          body: updates.packaging
        })
      );
    }

    if (updates.inventoryConfig) {
      updateOperations.push(
        this.inventoryService.inventoryControllerUpdateInventoryConfig({
          id: productId,
          body: updates.inventoryConfig
        })
      );
    }

    if (updateOperations.length === 0) {
      return this.getProductFullInfo(productId);
    }

    return combineLatest(updateOperations).pipe(
      map(() => this.getProductFullInfo(productId)),
      map(obs => obs)
    ).pipe(
      map(() => this.getProductFullInfo(productId))
    );
  }

  /**
   * Obtener análisis de valor del inventario en el tiempo
   */
  getStockValueAnalysis(): Observable<StockValueHistoryDto[]> {
    return this.inventoryService.inventoryControllerGetStockValueHistory().pipe(
      catchError(error => {
        console.error('Error loading stock value history:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener productos críticos (combinando low stock y top movers)
   */
  getCriticalProducts(): Observable<{
    lowStock: AdvancedLowStockProductDto[];
    highMovement: TopMoversDto[];
  }> {
    return combineLatest([
      this.inventoryService.inventoryControllerGetAdvancedLowStockProducts(),
      this.inventoryService.inventoryControllerGetTopMovers()
    ]).pipe(
      map(([lowStock, highMovement]) => ({
        lowStock,
        highMovement
      })),
      catchError(error => {
        console.error('Error loading critical products:', error);
        return of({ lowStock: [], highMovement: [] });
      })
    );
  }

  /**
   * Búsqueda rápida por stock level
   */
  getProductsByStockLevel(stockLevel: 'high' | 'medium' | 'low' | 'out'): Observable<ExtendedProductResponseDto[]> {
    return this.searchProducts({ stockLevel, limit: 100 });
  }

  /**
   * Obtener productos sin configuración de inventario
   */
  getProductsWithoutConfig(): Observable<ExtendedProductResponseDto[]> {
    return this.searchProducts({ limit: 1000 }).pipe(
      map(products => products.filter(p => !p.inventoryConfig))
    );
  }

  /**
   * Calcular métricas personalizadas del inventario
   */
  calculateInventoryMetrics(): Observable<{
    totalProducts: number;
    totalValue: number;
    averageTurnover: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    return this.searchProducts({ limit: 1000 }).pipe(
      map(products => {
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.stockValue || 0), 0);
        const averageTurnover = products.reduce((sum, p) => sum + (p.turnoverRate || 0), 0) / totalProducts;
        const lowStockCount = products.filter(p => p.stockLevel === 'low').length;
        const outOfStockCount = products.filter(p => p.stockLevel === 'out').length;

        return {
          totalProducts,
          totalValue,
          averageTurnover,
          lowStockCount,
          outOfStockCount
        };
      })
    );
  }
}