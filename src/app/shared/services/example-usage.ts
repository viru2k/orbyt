import { Component, OnInit } from '@angular/core';
import { AdvancedInventoryService } from './advanced-inventory.service';
import { ServiceManagementService } from './service-management.service';

// Este es un ejemplo de cómo usar los nuevos servicios
@Component({
  template: `
    <!-- Ejemplo de uso de los servicios implementados -->
    <div class="inventory-dashboard">
      <h2>Dashboard de Inventario Avanzado</h2>

      <!-- Métricas del inventario -->
      <div class="metrics-section" *ngIf="inventoryOverview">
        <p>Total de productos: {{ inventoryOverview.metrics.totalProducts }}</p>
        <p>Valor total: {{ inventoryOverview.metrics.totalValue | currency }}</p>
        <p>Productos con stock bajo: {{ inventoryOverview.lowStockProducts.length }}</p>
      </div>

      <!-- Búsqueda de productos -->
      <div class="search-section">
        <input [(ngModel)]="searchQuery" (input)="searchProducts()" placeholder="Buscar productos...">
        <select [(ngModel)]="selectedStockLevel" (change)="filterByStockLevel()">
          <option value="">Todos los niveles</option>
          <option value="high">Stock alto</option>
          <option value="medium">Stock medio</option>
          <option value="low">Stock bajo</option>
          <option value="out">Sin stock</option>
        </select>
      </div>

      <!-- Resultados de búsqueda -->
      <div class="results-section">
        <div *ngFor="let product of searchResults" class="product-card">
          <h4>{{ product.name }}</h4>
          <p>Precio: {{ product.currentPrice | currency }}</p>
          <p>Stock: {{ product.availableStock }} ({{ product.stockLevel }})</p>
          <p>Propietario: {{ product.owner.fullName }}</p>
          <button (click)="getProductFullInfo(product.id)">Ver detalles completos</button>
        </div>
      </div>

      <!-- Servicios e Items -->
      <div class="services-section">
        <h3>Gestión de Servicios</h3>
        <div *ngFor="let service of services" class="service-card">
          <h4>{{ service.name }}</h4>
          <p>Tipo: {{ service.type }}</p>
          <p>Precio: {{ service.price | currency }}</p>
        </div>
      </div>
    </div>
  `
})
export class ExampleUsageComponent implements OnInit {

  // Propiedades para el inventario
  inventoryOverview: any;
  searchResults: any[] = [];
  searchQuery = '';
  selectedStockLevel = '';

  // Propiedades para servicios
  services: any[] = [];
  serviceStats: any;

  constructor(
    private advancedInventoryService: AdvancedInventoryService,
    private serviceManagementService: ServiceManagementService
  ) {}

  ngOnInit() {
    this.loadInventoryOverview();
    this.loadServices();
    this.loadServiceStats();
  }

  /**
   * Ejemplo: Cargar resumen completo del inventario
   */
  loadInventoryOverview() {
    this.advancedInventoryService.getInventoryOverview().subscribe({
      next: (overview) => {
        this.inventoryOverview = overview;
        console.log('📊 Inventario Overview:', overview);

        // Mostrar productos críticos
        console.log('🚨 Productos con stock bajo:', overview.lowStockProducts);
        console.log('🔥 Top movers:', overview.topMovers);
      },
      error: (error) => {
        console.error('Error loading inventory overview:', error);
      }
    });
  }

  /**
   * Ejemplo: Búsqueda de productos con filtros
   */
  searchProducts() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.advancedInventoryService.searchProducts({
      query: this.searchQuery,
      stockLevel: this.selectedStockLevel as any,
      limit: 20
    }).subscribe({
      next: (products) => {
        this.searchResults = products;
        console.log('🔍 Resultados de búsqueda:', products);
      },
      error: (error) => {
        console.error('Error searching products:', error);
      }
    });
  }

  /**
   * Ejemplo: Filtrar por nivel de stock
   */
  filterByStockLevel() {
    if (this.selectedStockLevel) {
      this.advancedInventoryService.getProductsByStockLevel(this.selectedStockLevel as any)
        .subscribe({
          next: (products) => {
            this.searchResults = products;
            console.log(`📦 Productos con stock ${this.selectedStockLevel}:`, products);
          }
        });
    }
  }

  /**
   * Ejemplo: Obtener información completa de un producto
   */
  getProductFullInfo(productId: number) {
    this.advancedInventoryService.getProductFullInfo(productId).subscribe({
      next: (fullInfo) => {
        console.log('📋 Información completa del producto:', fullInfo);

        // Ejemplo de actualización de configuración
        if (!fullInfo.inventoryConfig) {
          this.updateProductConfiguration(productId);
        }
      },
      error: (error) => {
        console.error('Error getting product full info:', error);
      }
    });
  }

  /**
   * Ejemplo: Actualizar configuración de un producto
   */
  updateProductConfiguration(productId: number) {
    this.advancedInventoryService.updateProductConfiguration(productId, {
      inventoryConfig: {
        minStock: 10,
        maxStock: 100,
        reorderPoint: 20,
        reorderQuantity: 50
      },
      dimensions: {
        length: 10,
        width: 5,
        height: 3,
        weight: 0.5
      }
    }).subscribe({
      next: (updatedInfo) => {
        console.log('✅ Configuración actualizada:', updatedInfo);
      },
      error: (error) => {
        console.error('Error updating configuration:', error);
      }
    });
  }

  /**
   * Ejemplo: Cargar servicios e items
   */
  loadServices() {
    this.serviceManagementService.getAllItems().subscribe({
      next: (items) => {
        this.services = items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type,
          description: item.description
        }));
        console.log('🛠️ Servicios e items cargados:', this.services);
      },
      error: (error) => {
        console.error('Error loading services:', error);
      }
    });
  }

  /**
   * Ejemplo: Cargar estadísticas de servicios
   */
  loadServiceStats() {
    this.serviceManagementService.getServiceStats().subscribe({
      next: (stats) => {
        this.serviceStats = stats;
        console.log('📈 Estadísticas de servicios:', stats);
      },
      error: (error) => {
        console.error('Error loading service stats:', error);
      }
    });
  }

  /**
   * Ejemplo: Búsqueda de servicios con autocompletado
   */
  searchServiceSuggestions(query: string) {
    this.serviceManagementService.getItemSuggestions(query, 5).subscribe({
      next: (suggestions) => {
        console.log('💡 Sugerencias de servicios:', suggestions);
      }
    });
  }

  /**
   * Ejemplo: Obtener métricas personalizadas
   */
  loadCustomMetrics() {
    this.advancedInventoryService.calculateInventoryMetrics().subscribe({
      next: (metrics) => {
        console.log('🎯 Métricas personalizadas:', metrics);

        // Ejemplo de análisis
        if (metrics.lowStockCount > 10) {
          console.warn('⚠️ Tienes muchos productos con stock bajo!');
        }

        if (metrics.averageTurnover < 1) {
          console.warn('📉 La rotación promedio es baja');
        }
      }
    });
  }

  /**
   * Ejemplo: Análisis de valor del stock
   */
  analyzeStockValue() {
    this.advancedInventoryService.getStockValueAnalysis().subscribe({
      next: (history) => {
        console.log('💰 Análisis de valor del stock:', history);

        // Ejemplo de procesamiento de datos para gráficos
        const chartData = history.map(item => ({
          date: item.date,
          value: item.totalValue,
          change: item.changePercent
        }));

        console.log('📊 Datos para gráfico:', chartData);
      }
    });
  }

  /**
   * Ejemplo: Obtener productos críticos
   */
  analyzeCriticalProducts() {
    this.advancedInventoryService.getCriticalProducts().subscribe({
      next: (critical) => {
        console.log('🚨 Productos críticos:', critical);

        // Crear alertas automáticas
        critical.lowStock.forEach(product => {
          if (product.daysUntilStockout && product.daysUntilStockout < 7) {
            console.warn(`⚡ ${product.name} se agotará en ${product.daysUntilStockout} días!`);
          }
        });
      }
    });
  }
}

/**
 * EJEMPLOS DE USO RÁPIDO:
 *
 * 1. Búsqueda básica de productos:
 * this.advancedInventoryService.searchProducts({ query: 'shampoo' })
 *
 * 2. Productos con stock bajo:
 * this.advancedInventoryService.getProductsByStockLevel('low')
 *
 * 3. Resumen del inventario:
 * this.advancedInventoryService.getInventoryOverview()
 *
 * 4. Buscar servicios:
 * this.serviceManagementService.searchItems({ query: 'corte', type: 'service' })
 *
 * 5. Estadísticas de servicios:
 * this.serviceManagementService.getServiceStats()
 *
 * 6. Items más caros:
 * this.serviceManagementService.getTopPricedItems(10)
 *
 * 7. Métricas personalizadas:
 * this.advancedInventoryService.calculateInventoryMetrics()
 */