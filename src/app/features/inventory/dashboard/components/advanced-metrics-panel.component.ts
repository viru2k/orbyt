import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedInventoryDashboardStore } from '../stores/advanced-inventory-dashboard.store';
import { OrbCardComponent, OrbButtonComponent } from '@orb-components';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: number;
  description?: string;
  alert?: boolean;
}

@Component({
  selector: 'orb-advanced-metrics-panel',
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbButtonComponent,
    ChartModule,
    ProgressBarModule,
    TagModule,
    BadgeModule,
    AvatarModule
  ],
  template: `
    <div class="advanced-metrics-panel">
      <!-- KPIs Avanzados -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div *ngFor="let metric of metricsCards()"
             class="metric-card p-4 border rounded-lg"
             [class]="getMetricCardClass(metric)">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-700">{{ metric.title }}</h3>
              <p class="text-2xl font-bold" [class]="getMetricValueClass(metric)">
                {{ metric.value }}
              </p>
              <p *ngIf="metric.description" class="text-sm text-gray-500 mt-1">
                {{ metric.description }}
              </p>
            </div>
            <div class="flex flex-col items-end">
              <i [class]="metric.icon + ' text-2xl'" [class]="getMetricIconClass(metric)"></i>
              <span *ngIf="metric.trend !== undefined"
                    class="text-sm font-medium mt-2"
                    [class]="getTrendClass(metric.trend)">
                <i [class]="getTrendIcon(metric.trend)"></i>
                {{ metric.trend }}%
              </span>
              <p-badge *ngIf="metric.alert" value="!" severity="danger" class="mt-1"></p-badge>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos Críticos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Stock Bajo Avanzado -->
        <orb-card>
          <div header class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Productos Críticos</h3>
            <orb-button
              label="Ver todos"
              size="small"
              severity="secondary"
              (click)="navigateToProducts()">
            </orb-button>
          </div>
          <div body>
            <div *ngIf="criticalProducts()?.urgentStock.length === 0" class="text-center text-gray-500 py-4">
              ✅ No hay productos con stock crítico
            </div>
            <div *ngFor="let product of criticalProducts()?.urgentStock.slice(0, 5)"
                 class="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50 mb-2 rounded">
              <div>
                <p class="font-medium text-gray-900">{{ product.name }}</p>
                <p class="text-sm text-gray-600">Stock: {{ product.currentStock }}</p>
                <p *ngIf="product.daysUntilStockout" class="text-xs text-red-600">
                  ⏰ Se agota en {{ product.daysUntilStockout }} días
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-red-600">{{ product.stockLevel }}</p>
                <p *ngIf="product.suggestedReorderQuantity" class="text-xs text-gray-500">
                  Reponer: {{ product.suggestedReorderQuantity }}
                </p>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Top Movers -->
        <orb-card>
          <div header class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Productos Más Activos</h3>
            <orb-button
              label="Análisis completo"
              size="small"
              severity="secondary"
              (click)="navigateToAnalysis()">
            </orb-button>
          </div>
          <div body>
            <div *ngIf="topMovers()?.length === 0" class="text-center text-gray-500 py-4">
              📊 Cargando análisis de movimientos...
            </div>
            <div *ngFor="let mover of topMovers()?.slice(0, 5)"
                 class="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 mb-2 rounded">
              <div>
                <p class="font-medium text-gray-900">{{ mover.productName }}</p>
                <p class="text-sm text-gray-600">{{ mover.totalMovements }} movimientos</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-blue-600">
                  {{ mover.movementFrequency }}/día
                </p>
                <p class="text-xs text-gray-500">
                  Rotación: {{ (mover.turnoverRate || 0).toFixed(1) }}x
                </p>
              </div>
            </div>
          </div>
        </orb-card>
      </div>

      <!-- Análisis de Valor y Tendencias -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Valor del Inventario -->
        <orb-card>
          <div header>
            <h3 class="text-lg font-semibold">Valor del Inventario</h3>
          </div>
          <div body>
            <div *ngIf="stockValueHistory()?.length" class="space-y-4">
              <p-chart
                type="line"
                [data]="stockValueChartData()"
                [options]="chartOptions"
                height="200">
              </p-chart>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Crecimiento:</span>
                <span [class]="getValueGrowthClass()">
                  {{ insights()?.valueGrowth?.toFixed(1) }}%
                </span>
              </div>
            </div>
            <div *ngIf="!stockValueHistory()?.length" class="text-center text-gray-500 py-8">
              📈 Cargando historial de valor...
            </div>
          </div>
        </orb-card>

        <!-- Eficiencia del Inventario -->
        <orb-card>
          <div header>
            <h3 class="text-lg font-semibold">Eficiencia</h3>
          </div>
          <div body>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">Score General</span>
                  <span class="font-medium">{{ insights()?.efficiencyScore || 0 }}/100</span>
                </div>
                <p-progressBar
                  [value]="insights()?.efficiencyScore || 0"
                  [showValue]="false"
                  styleClass="h-2">
                </p-progressBar>
              </div>

              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">Rotación Promedio</span>
                  <span class="font-medium">{{ (insights()?.turnoverRate || 0).toFixed(1) }}x</span>
                </div>
                <p-progressBar
                  [value]="Math.min((insights()?.turnoverRate || 0) * 20, 100)"
                  [showValue]="false"
                  styleClass="h-2">
                </p-progressBar>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Alertas y Notificaciones -->
        <orb-card>
          <div header>
            <h3 class="text-lg font-semibold">Alertas</h3>
          </div>
          <div body>
            <div *ngIf="insights()?.alerts.length === 0" class="text-center text-gray-500 py-4">
              ✅ Todo en orden
            </div>
            <div *ngFor="let alert of insights()?.alerts"
                 class="p-2 bg-orange-50 border-l-4 border-orange-400 mb-2 rounded">
              <p class="text-sm text-orange-800">{{ alert }}</p>
            </div>
          </div>
        </orb-card>
      </div>

      <!-- Búsqueda Rápida -->
      <orb-card>
        <div header>
          <h3 class="text-lg font-semibold">Búsqueda Rápida de Productos</h3>
        </div>
        <div body>
          <div class="flex gap-4 mb-4">
            <input
              type="text"
              class="flex-1 p-2 border rounded"
              placeholder="Buscar productos..."
              [(ngModel)]="searchQuery"
              (input)="onSearchQueryChange($event)">

            <select class="p-2 border rounded" [(ngModel)]="selectedStockFilter" (change)="onFilterChange()">
              <option value="">Todos los niveles</option>
              <option value="high">Stock Alto</option>
              <option value="medium">Stock Medio</option>
              <option value="low">Stock Bajo</option>
              <option value="out">Sin Stock</option>
            </select>
          </div>

          <div *ngIf="loadingSearch()" class="text-center py-4">
            🔍 Buscando...
          </div>

          <div *ngIf="searchResults()?.length === 0 && !loadingSearch()" class="text-center text-gray-500 py-4">
            No se encontraron productos
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let product of searchResults()?.slice(0, 9)"
                 class="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                 (click)="selectProduct(product)">
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">{{ product.name }}</h4>
                <p-tag
                  [value]="product.stockLevel"
                  [severity]="getStockLevelSeverity(product.stockLevel)">
                </p-tag>
              </div>
              <p class="text-sm text-gray-600 mb-1">Stock: {{ product.availableStock }}</p>
              <p class="text-sm font-medium text-green-600">{{ product.currentPrice | currency:'EUR':'symbol':'1.2-2' }}</p>
              <p *ngIf="product.turnoverRate" class="text-xs text-gray-500">
                Rotación: {{ product.turnoverRate.toFixed(1) }}x
              </p>
            </div>
          </div>
        </div>
      </orb-card>
    </div>
  `,
  styles: [`
    .metric-card {
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .metric-card.alert {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .text-trend-positive { color: #10b981; }
    .text-trend-negative { color: #ef4444; }
    .text-trend-neutral { color: #6b7280; }
  `]
})
export class AdvancedMetricsPanelComponent implements OnInit {
  private store = inject(AdvancedInventoryDashboardStore);
  private router = inject(Router);

  // Signals from store
  advancedMetrics = toSignal(this.store.advancedMetrics$);
  criticalProducts = toSignal(this.store.criticalProducts$);
  topMovers = toSignal(this.store.topMovers$);
  insights = toSignal(this.store.inventoryInsights$);
  stockValueHistory = toSignal(this.store.stockValueHistory$);
  searchResults = toSignal(this.store.searchResults$);
  loadingSearch = toSignal(this.store.loadingSearch$);

  // Local state
  searchQuery = '';
  selectedStockFilter = '';

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Computed properties
  metricsCards = computed((): MetricCard[] => {
    const metrics = this.advancedMetrics();
    if (!metrics) return [];

    return [
      {
        title: 'Valor Total',
        value: `€${(metrics.totalInventoryValue || 0).toLocaleString()}`,
        icon: 'pi pi-euro',
        color: 'green',
        trend: 8.5,
        description: 'Inventario total'
      },
      {
        title: 'Productos Activos',
        value: metrics.totalProducts || 0,
        icon: 'pi pi-box',
        color: 'blue',
        trend: 2.1,
        description: `${metrics.lowStockProductsCount || 0} con stock bajo`
      },
      {
        title: 'Stock Crítico',
        value: metrics.outOfStockProductsCount || 0,
        icon: 'pi pi-exclamation-triangle',
        color: 'red',
        alert: (metrics.outOfStockProductsCount || 0) > 0,
        description: 'Productos sin stock'
      },
      {
        title: 'Eficiencia',
        value: `${this.insights()?.efficiencyScore || 0}%`,
        icon: 'pi pi-chart-line',
        color: 'purple',
        trend: 5.2,
        description: 'Score general'
      }
    ];
  });

  stockValueChartData = computed(() => {
    const history = this.stockValueHistory();
    if (!history?.length) return null;

    return {
      labels: history.map(h => new Date(h.date).toLocaleDateString()),
      datasets: [{
        data: history.map(h => h.totalValue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    };
  });

  ngOnInit() {
    // Cargar datos avanzados
    this.store.loadAdvancedDashboard();
  }

  onSearchQueryChange(event: any) {
    this.searchQuery = event.target.value;
    if (this.searchQuery.trim()) {
      this.performSearch();
    }
  }

  onFilterChange() {
    this.performSearch();
  }

  private performSearch() {
    this.store.searchProducts({
      query: this.searchQuery.trim() || undefined,
      stockLevel: this.selectedStockFilter as any || undefined,
      limit: 20
    });
  }

  selectProduct(product: any) {
    this.router.navigate(['/inventory/products', product.id]);
  }

  navigateToProducts() {
    this.router.navigate(['/inventory/products']);
  }

  navigateToAnalysis() {
    this.router.navigate(['/inventory/analysis']);
  }

  // Utility methods
  getMetricCardClass(metric: MetricCard): string {
    return metric.alert ? 'alert border-red-500' : 'border-gray-200';
  }

  getMetricValueClass(metric: MetricCard): string {
    if (metric.alert) return 'text-red-600';

    const colorClasses = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      red: 'text-red-600',
      purple: 'text-purple-600'
    };

    return colorClasses[metric.color as keyof typeof colorClasses] || 'text-gray-900';
  }

  getMetricIconClass(metric: MetricCard): string {
    return this.getMetricValueClass(metric);
  }

  getTrendClass(trend: number): string {
    return trend > 0 ? 'text-trend-positive' : trend < 0 ? 'text-trend-negative' : 'text-trend-neutral';
  }

  getTrendIcon(trend: number): string {
    return trend > 0 ? 'pi pi-arrow-up' : trend < 0 ? 'pi pi-arrow-down' : 'pi pi-minus';
  }

  getValueGrowthClass(): string {
    const growth = this.insights()?.valueGrowth || 0;
    return this.getTrendClass(growth);
  }

  getStockLevelSeverity(level: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'info';
      case 'low': return 'warning';
      case 'out': return 'danger';
      default: return 'info';
    }
  }

  // Expose Math for template
  Math = Math;
}