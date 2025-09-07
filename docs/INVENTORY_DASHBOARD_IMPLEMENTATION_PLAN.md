# 📦 Plan de Implementación: Dashboard de Inventario Avanzado

## 🎯 **Objetivo**
Crear un sistema completo de gestión de inventario con dashboard de métricas, modal de búsqueda avanzada de productos y gestión de atributos extendidos (peso, volumen, dimensiones, empaquetado).

---

## 🔍 **Análisis del Sistema Actual**

### ✅ **Funcionalidades Existentes**
- **Modelo básico de productos**: `ProductResponseDto` con campos esenciales
- **Sistema de movimientos**: Entrada, salida, ajuste, uso interno
- **Store de productos**: ProductStore con CRUD básico
- **Store de movimientos**: MovementStore con filtros básicos
- **Formulario de movimientos**: Selector simple de productos
- **Lista de movimientos**: Vista tabular con paginación

### ❌ **Limitaciones Identificadas**
1. **Selector de productos limitado**: Dropdown simple sin búsqueda avanzada
2. **Falta de atributos físicos**: Sin peso, dimensiones, empaquetado
3. **Sin dashboard de métricas**: No hay visualización de KPIs
4. **Gestión de stock básica**: Sin alertas de stock bajo
5. **Reportes limitados**: Sin análisis de rotación de inventario

---

## 🚀 **Plan de Implementación**

### **Fase 1: Extensión del Modelo de Producto Backend** (Prioridad: Alta)

#### 1.1 Nuevas Entidades Backend
```typescript
// Dimensiones físicas del producto
interface ProductDimensionsEntity {
  id: number;
  productId: number;
  weight: number;           // en gramos
  weightUnit: 'g' | 'kg' | 'lb' | 'oz';
  length: number;           // en cm
  width: number;
  height: number;
  dimensionUnit: 'cm' | 'in' | 'm';
  volume: number;           // calculado o manual
  volumeUnit: 'ml' | 'l' | 'cm3' | 'm3';
  createdAt: Date;
  updatedAt: Date;
}

// Información de empaquetado
interface ProductPackagingEntity {
  id: number;
  productId: number;
  baseUnit: string;         // unidad, caja, ampolla, frasco
  unitsPerPackage: number;  // ej: 6 ampollas por caja
  packageType: string;      // caja, blister, frasco, botella
  minOrderQuantity: number;
  storageRequirements: string; // refrigerado, ambiente, etc.
  expirationMonths?: number;   // meses de caducidad
  barcode?: string;
  internalSku: string;
  supplierSku?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Configuración de inventario por producto
interface ProductInventoryConfigEntity {
  id: number;
  productId: number;
  reorderPoint: number;     // punto de reorden
  maxStockLevel: number;    // stock máximo
  minStockLevel: number;    // stock mínimo
  currentStock: number;     // stock actual
  reservedStock: number;    // stock reservado
  averageCost: number;      // costo promedio
  lastCost: number;         // último costo
  supplierId?: number;      // proveedor principal
  isActive: boolean;        // producto activo en inventario
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.2 Nuevos DTOs Backend
```typescript
// DTO para crear/actualizar dimensiones
export class UpdateProductDimensionsDto {
  @IsNumber()
  @Min(0)
  weight: number;

  @IsEnum(['g', 'kg', 'lb', 'oz'])
  weightUnit: 'g' | 'kg' | 'lb' | 'oz';

  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber() 
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0) 
  height: number;

  @IsEnum(['cm', 'in', 'm'])
  dimensionUnit: 'cm' | 'in' | 'm';

  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @IsEnum(['ml', 'l', 'cm3', 'm3'])
  volumeUnit: 'ml' | 'l' | 'cm3' | 'm3';
}

// DTO extendido de producto con toda la información
export class ExtendedProductResponseDto extends ProductResponseDto {
  dimensions?: ProductDimensionsDto;
  packaging?: ProductPackagingDto;
  inventoryConfig?: ProductInventoryConfigDto;
  stockLevel: 'high' | 'medium' | 'low' | 'out';
  daysUntilStockout?: number;
  turnoverRate?: number;
}
```

#### 1.3 Nuevos Endpoints Backend
```typescript
// Gestión de dimensiones
PUT /products/{id}/dimensions
GET /products/{id}/dimensions

// Gestión de empaquetado
PUT /products/{id}/packaging  
GET /products/{id}/packaging

// Configuración de inventario
PUT /products/{id}/inventory-config
GET /products/{id}/inventory-config

// Búsqueda avanzada
GET /products/search?query=&status=&minStock=&maxStock=&category=
```

### **Fase 2: Dashboard de Inventario Backend** (Prioridad: Alta)

#### 2.1 Endpoints de Dashboard
```typescript
// Métricas generales
GET /inventory/dashboard/metrics
Response: InventoryDashboardMetricsDto {
  totalProducts: number;
  totalInventoryValue: number;
  totalActiveProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageProductValue: number;
  lastMonthMovements: number;
  inventoryTurnoverRate: number;
  totalMovementValue: number;
  criticalItemsCount: number;
}

// Productos con stock bajo
GET /inventory/dashboard/low-stock
Response: LowStockProductDto[] {
  productId: number;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  reorderPoint: number;
  daysUntilStockout: number;
  suggestedReorderQuantity: number;
  lastMovementDate: Date;
  averageConsumptionRate: number;
}

// Productos más movidos
GET /inventory/dashboard/top-movers?period=30
Response: TopMoversDto[] {
  productId: number;
  productName: string;
  totalMovements: number;
  inMovements: number;
  outMovements: number;
  adjustmentMovements: number;
  usageMovements: number;
  movementValue: number;
  turnoverRate: number;
  trend: 'up' | 'down' | 'stable';
}

// Histórico de valor de inventario
GET /inventory/dashboard/stock-value-history?period=12
Response: StockValueHistoryDto[] {
  period: string;        // '2025-01', '2025-02', etc.
  totalValue: number;
  productCount: number;
  averageValue: number;
  monthOverMonthGrowth: number;
}

// Análisis de movimientos
GET /inventory/dashboard/movement-analysis?period=30
Response: MovementAnalysisDto {
  totalMovements: number;
  movementsByType: {
    in: number;
    out: number;
    adjustment: number;
    usage: number;
  };
  topUsers: UserMovementStatsDto[];
  dailyActivity: DailyActivityDto[];
  averageMovementValue: number;
}
```

### **Fase 3: Frontend - Modal de Búsqueda de Productos** (Prioridad: Media)

#### 3.1 Componente ProductSearchModal ✅ IMPLEMENTADO
- **Ubicación**: `src/app/shared/components/product-search-modal/`
- **Funcionalidades**:
  - ✅ Búsqueda en tiempo real con debounce
  - ✅ Filtros avanzados (estado, stock, precio, dimensiones)
  - ✅ Vista grid y lista intercambiable
  - ✅ Multi-selección opcional
  - ✅ Información rica del producto con tooltips
  - ✅ Estados de carga y vacío
  - ✅ Responsive design completo

#### 3.2 Integración en Movimientos
```typescript
// Reemplazar en movement-form.component.html
<orb-product-search-modal
  [(visible)]="showProductSearchModal"
  title="Seleccionar Producto para Movimiento"
  [showStockFilter]="true"
  [showPriceFilter]="false"
  [allowMultiSelect]="false"
  (productSelected)="onProductSelected($event)"
  (cancel)="onCancelProductSearch()">
</orb-product-search-modal>

// En movement-form.component.ts
onProductSelected(product: ProductResponseDto): void {
  this.selectedProduct.set(product);
  this.productId = product.id;
  this.productName = product.name;
  this.showProductSearchModal = false;
}
```

### **Fase 4: Frontend - Dashboard de Inventario** (Prioridad: Alta)

#### 4.1 Componente InventoryDashboard
```typescript
// src/app/features/inventory/dashboard/inventory-dashboard.component.ts
@Component({
  selector: 'orb-inventory-dashboard',
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.scss']
})
export class InventoryDashboardComponent implements OnInit {
  // Signals para datos reactivos
  dashboardMetrics = signal<InventoryDashboardMetricsDto | null>(null);
  lowStockProducts = signal<LowStockProductDto[]>([]);
  topMovers = signal<TopMoversDto[]>([]);
  stockValueHistory = signal<StockValueHistoryDto[]>([]);
  movementAnalysis = signal<MovementAnalysisDto | null>(null);
  isLoading = signal(false);

  // Configuración de charts
  stockValueChartData: any;
  movementTypeChartData: any;
  topMoversChartData: any;
  chartOptions: any;

  // KPIs computados
  inventoryGrowth = computed(() => {
    const history = this.stockValueHistory();
    if (history.length < 2) return 0;
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    return ((current.totalValue - previous.totalValue) / previous.totalValue) * 100;
  });

  criticalStockCount = computed(() => {
    return this.lowStockProducts().filter(p => p.daysUntilStockout <= 7).length;
  });
}
```

#### 4.2 Widgets del Dashboard
```typescript
interface DashboardWidget {
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large';
  refreshInterval?: number;
}

const DASHBOARD_WIDGETS: DashboardWidget[] = [
  {
    title: 'Métricas Principales',
    component: 'metrics-overview-card',
    size: 'large'
  },
  {
    title: 'Valor del Inventario',
    component: 'inventory-value-chart',
    size: 'medium'
  },
  {
    title: 'Alertas de Stock',
    component: 'stock-alerts-widget',
    size: 'medium'
  },
  {
    title: 'Top Productos en Movimiento',
    component: 'top-movers-chart',
    size: 'medium'
  },
  {
    title: 'Análisis de Movimientos',
    component: 'movement-analysis-widget',
    size: 'large'
  },
  {
    title: 'Productos Críticos',
    component: 'critical-products-table',
    size: 'medium'
  }
];
```

### **Fase 5: Funcionalidades Avanzadas** (Prioridad: Baja)

#### 5.1 Sistema de Alertas Inteligentes
```typescript
interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiry' | 'unusual_movement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  productId: number;
  productName: string;
  message: string;
  actionRequired: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// Servicio de alertas
@Injectable()
export class InventoryAlertsService {
  checkLowStock(): InventoryAlert[];
  checkExpiryItems(): InventoryAlert[];
  checkUnusualMovements(): InventoryAlert[];
  acknowledgeAlert(alertId: string): void;
  resolveAlert(alertId: string): void;
}
```

#### 5.2 Predicción de Demanda
```typescript
interface DemandPrediction {
  productId: number;
  productName: string;
  predictedDemand: {
    next7Days: number;
    next30Days: number;
    next90Days: number;
  };
  confidence: number; // 0-100%
  seasonalityFactor: number;
  trendDirection: 'up' | 'down' | 'stable';
  recommendedOrderQuantity: number;
  suggestedOrderDate: Date;
}
```

#### 5.3 Reportes Avanzados
```typescript
interface InventoryReport {
  id: string;
  name: string;
  type: 'valuation' | 'abc_analysis' | 'turnover' | 'supplier_performance';
  parameters: any;
  generatedAt: Date;
  format: 'pdf' | 'excel' | 'csv';
  downloadUrl: string;
}

// Tipos de reportes
const REPORT_TYPES = {
  INVENTORY_VALUATION: {
    name: 'Valorización de Inventario',
    description: 'Reporte detallado del valor del inventario por producto',
    parameters: ['date', 'category', 'location']
  },
  ABC_ANALYSIS: {
    name: 'Análisis ABC de Productos', 
    description: 'Clasificación de productos por valor de ventas',
    parameters: ['period', 'criteria']
  },
  TURNOVER_ANALYSIS: {
    name: 'Análisis de Rotación',
    description: 'Análisis de rotación de inventario por producto',
    parameters: ['period', 'category']
  },
  SUPPLIER_PERFORMANCE: {
    name: 'Rendimiento de Proveedores',
    description: 'Análisis de rendimiento de proveedores',
    parameters: ['period', 'supplier']
  }
};
```

---

## 📋 **Cronograma de Implementación**

### **Sprint 1 (Semana 1-2)**: Backend Extendido
- [ ] Crear entidades de dimensiones, empaquetado e inventario
- [ ] Implementar DTOs y validaciones
- [ ] Crear endpoints de gestión de producto extendido
- [ ] Implementar endpoints de dashboard de inventario
- [ ] Testing de APIs

### **Sprint 2 (Semana 3)**: Frontend Modal de Búsqueda 
- [x] ✅ Implementar ProductSearchModal component
- [ ] Integrar modal en movement-form y movement-list
- [ ] Conectar con APIs reales
- [ ] Testing e2e del modal

### **Sprint 3 (Semana 4-5)**: Dashboard Frontend
- [ ] Crear componente InventoryDashboard
- [ ] Implementar widgets de métricas
- [ ] Crear gráficos con Chart.js
- [ ] Implementar sistema de alertas visuales
- [ ] Responsive design y optimización

### **Sprint 4 (Semana 6)**: Funcionalidades Avanzadas
- [ ] Sistema de alertas automáticas
- [ ] Reportes básicos en PDF/Excel  
- [ ] Predicción de demanda simple
- [ ] Optimizaciones de performance

### **Sprint 5 (Semana 7)**: Testing y Refinamiento
- [ ] Testing completo del sistema
- [ ] Ajustes de UX/UI
- [ ] Optimización de queries
- [ ] Documentación de usuario
- [ ] Deploy a producción

---

## 🎯 **Beneficios Esperados**

### **Para el Negocio**
- **Reducción de costos**: Optimización de niveles de stock
- **Mejor servicio**: Menos productos agotados
- **Decisiones informadas**: Dashboard con métricas clave
- **Eficiencia operativa**: Búsqueda rápida de productos
- **Visibilidad completa**: Trazabilidad total del inventario

### **Para los Usuarios**
- **Búsqueda intuitiva**: Modal avanzado vs dropdown simple
- **Información completa**: Todos los atributos del producto
- **Alertas proactivas**: Notificaciones de stock bajo
- **Análisis visual**: Gráficos y métricas comprensibles
- **Gestión eficiente**: Menos tiempo en tareas rutinarias

### **Técnicos**
- **Escalabilidad**: Arquitectura modular y extensible
- **Mantenibilidad**: Código bien estructurado
- **Performance**: Queries optimizadas y caching
- **Integraciones**: APIs RESTful bien documentadas
- **Monitoreo**: Logs y métricas para troubleshooting

---

## 🔧 **Consideraciones Técnicas**

### **Backend**
- **Base de datos**: Nuevas tablas con relaciones 1:1 con productos
- **Performance**: Índices en campos de búsqueda frecuente
- **Caching**: Redis para métricas de dashboard
- **Validaciones**: DTOs robustos para entrada de datos
- **Testing**: Cobertura completa de nuevos endpoints

### **Frontend**
- **State Management**: Signals de Angular para reactividad
- **Performance**: Lazy loading y virtual scrolling
- **UX**: Loading states y error handling
- **Responsive**: Mobile-first design
- **Accessibility**: WCAG 2.1 compliance

### **Integración**
- **APIs**: OpenAPI spec actualizada
- **Tipos**: DTOs sincronizados frontend/backend
- **Testing**: E2E con nuevas funcionalidades
- **Deployment**: CI/CD pipeline actualizado

---

Este plan proporciona una hoja de ruta completa para transformar el sistema básico de inventario actual en una solución empresarial robusta con capacidades avanzadas de análisis y gestión.