import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStore } from '../../../../store/stock/product.store';
import { MovementStore } from '../../shared/stores/movement.store';
import { InventoryDashboardStore } from '../stores/inventory-dashboard.store';
import { OrbCardComponent, OrbBreadcrumbComponent, OrbButtonComponent } from '@orb-components';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { InventoryDashboardMetricsDto } from '../../../../api/models';
import { toSignal } from '@angular/core/rxjs-interop';

interface DashboardKPI {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: number;
  trendLabel?: string;
}

@Component({
  selector: 'orb-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbBreadcrumbComponent,
    OrbButtonComponent,
    ChartModule,
    ProgressBarModule,
    TagModule
  ],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.css']
})
export class InventoryDashboardComponent implements OnInit {
  private productStore = inject(ProductStore);
  private movementStore = inject(MovementStore);
  private inventoryDashboardStore = inject(InventoryDashboardStore);
  private router = inject(Router);

  breadcrumbItems = [
    { label: 'Gestión' },
    { label: 'Dashboard de Inventario' }
  ];

  // Data streams converted to signals
  metrics = toSignal(this.inventoryDashboardStore.metrics$);
  recentMovements$ = this.inventoryDashboardStore.selectRecentMovementsWithMetadata;
  lowStockProducts$ = this.inventoryDashboardStore.lowStockProducts$;
  stockDistribution = toSignal(this.inventoryDashboardStore.stockDistribution$);
  movementsChart = toSignal(this.inventoryDashboardStore.movementsChart$);
  isLoading$ = this.inventoryDashboardStore.loading$;

  // KPIs computados con datos reales del backend
  totalProducts = computed(() => {
    const metrics = this.metrics();
    return metrics?.totalProducts ?? 0;
  });

  lowStockProducts = computed(() => {
    const metrics = this.metrics();
    return metrics?.lowStockProducts ?? 0;
  });

  totalValue = computed(() => {
    const metrics = this.metrics();
    return metrics?.totalInventoryValue ?? 0;
  });

  movementsToday = computed(() => {
    const metrics = this.metrics();
    return metrics?.movementsToday ?? 0;
  });

  // KPI data - temporarily using mock data
  kpis = computed((): DashboardKPI[] => [
    {
      label: 'Total Productos',
      value: this.totalProducts(),
      icon: 'pi pi-box',
      color: 'blue',
      trend: 5.2,
      trendLabel: '+5.2% vs mes anterior'
    },
    {
      label: 'Stock Bajo',
      value: this.lowStockProducts(),
      icon: 'pi pi-exclamation-triangle',
      color: 'orange',
      trend: -2.1,
      trendLabel: '-2.1% vs mes anterior'
    },
    {
      label: 'Valor Total Inventario',
      value: `€${this.totalValue().toLocaleString()}`,
      icon: 'pi pi-euro',
      color: 'green',
      trend: 8.5,
      trendLabel: '+8.5% vs mes anterior'
    },
    {
      label: 'Movimientos Hoy',
      value: this.movementsToday(),
      icon: 'pi pi-arrows-h',
      color: 'purple',
      trend: 12.3,
      trendLabel: '+12.3% vs ayer'
    }
  ]);

  // Chart data - temporarily using mock data
  stockDistributionData = {
    labels: ['Stock Normal', 'Stock Bajo', 'Sin Stock', 'Sobrestock'],
    datasets: [{
      data: [124, 12, 8, 12],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      hoverBackgroundColor: ['#059669', '#D97706', '#DC2626', '#7C3AED']
    }]
  };

  movementsChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Entradas',
        data: [12, 19, 15, 25, 22, 18, 8],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1
      },
      {
        label: 'Salidas',
        data: [8, 14, 12, 18, 15, 12, 5],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }
    ]
  };

  chartOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  lineChartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit() {
    // Load all dashboard data from backend - DATOS REALES
    this.inventoryDashboardStore.loadAll();
    
    // Debug subscription para low stock products
    this.lowStockProducts$.subscribe(products => {
    });
  }

  getKpiColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      orange: 'text-orange-600',
      green: 'text-green-600',
      purple: 'text-purple-600'
    };
    return colorMap[color] || 'text-gray-600';
  }

  getKpiBackgroundClass(color: string): string {
    const bgMap: { [key: string]: string } = {
      blue: 'bg-blue-50',
      orange: 'bg-orange-50',
      green: 'bg-green-50',
      purple: 'bg-purple-50'
    };
    return bgMap[color] || 'bg-gray-50';
  }

  getTrendClass(trend: number): string {
    return trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  }

  getTrendIcon(trend: number): string {
    return trend > 0 ? 'pi pi-arrow-up' : trend < 0 ? 'pi pi-arrow-down' : 'pi pi-minus';
  }

  navigateToMovements() {
    this.router.navigate(['/inventory/movements']);
  }

  navigateToProducts() {
    this.router.navigate(['/inventory/products']);
  }

  navigateToReports() {
    this.router.navigate(['/inventory/reports']);
  }

  getTrendData(type: string) {
    const trends: { [key: string]: { trend: number; label: string } } = {
      products: { trend: 5.2, label: 'vs mes anterior' },
      lowStock: { trend: -2.1, label: 'vs mes anterior' },
      value: { trend: 8.5, label: 'vs mes anterior' },
      movements: { trend: 12.3, label: 'vs ayer' }
    };
    return trends[type] || { trend: 0, label: '' };
  }

  getMovementIcon(type: string): string {
    switch (type) {
      case 'Entrada': return 'fa fa-arrow-up';
      case 'Salida': return 'fa fa-arrow-down';
      case 'Uso': return 'fa fa-arrow-down';
      default: return 'fa fa-exchange-alt';
    }
  }

  getMovementIconClass(type: string): string {
    switch (type) {
      case 'Entrada': return 'movement-in';
      case 'Salida': return 'movement-out';
      case 'Uso': return 'movement-usage';
      default: return 'movement-neutral';
    }
  }

  getMovementQuantityClass(quantity: number): string {
    return quantity > 0 ? 'quantity-positive' : 'quantity-negative';
  }

  // Chart data computed properties with fallbacks
  stockDistributionChartData = computed(() => {
    const distribution = this.stockDistribution();
    
    
    if (distribution) {
      return {
        labels: ['Stock Normal', 'Stock Bajo', 'Sin Stock', 'Sobrestock'],
        datasets: [{
          data: [distribution.normal, distribution.low, distribution.empty, distribution.over],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          hoverBackgroundColor: ['#059669', '#D97706', '#DC2626', '#7C3AED']
        }]
      };
    }
    
    return this.stockDistributionData;
  });

  movementsChartDataComputed = computed(() => {
    const chartData = this.movementsChart();
    
    if (chartData && chartData.labels && chartData.labels.length > 0) {
      return {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Entradas',
            data: chartData.entriesData,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgb(16, 185, 129)',
            tension: 0.1
          },
          {
            label: 'Salidas',
            data: chartData.exitsData,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgb(239, 68, 68)',
            tension: 0.1
          }
        ]
      };
    }
    
    return this.movementsChartData;
  });
}