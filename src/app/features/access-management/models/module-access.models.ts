// Module Access Management Models

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: ModuleCategory;
  isSystem: boolean; // System modules cannot be disabled
  requiresAdmin: boolean;
  parentModule?: string;
  subModules?: ModuleDefinition[];
}

export interface ModuleAccess {
  id: number;
  moduleId: string;
  userId?: number;
  roleId?: number;
  hasAccess: boolean;
  permissions: ModulePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface ModulePermission {
  action: ModuleAction;
  granted: boolean;
}

export interface UserModuleAccess {
  userId: number;
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  modules: ModuleAccessSummary[];
}

export interface RoleModuleAccess {
  roleId: number;
  roleName: string;
  roleDescription: string;
  modules: ModuleAccessSummary[];
}

export interface ModuleAccessSummary {
  moduleId: string;
  moduleName: string;
  hasAccess: boolean;
  permissions: ModulePermission[];
  source: AccessSource;
}

export enum ModuleCategory {
  CORE = 'core',
  MANAGEMENT = 'management',
  OPERATIONS = 'operations',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  INTEGRATIONS = 'integrations'
}

export enum ModuleAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  ADMIN = 'admin'
}

export enum AccessSource {
  DIRECT = 'direct',     // Direct user assignment
  ROLE = 'role',         // Inherited from role
  ADMIN = 'admin',       // Admin override
  SYSTEM = 'system'      // System default
}

export interface CreateModuleAccessDto {
  moduleId: string;
  userId?: number;
  roleId?: number;
  hasAccess: boolean;
  permissions: ModulePermission[];
}

export interface UpdateModuleAccessDto {
  hasAccess?: boolean;
  permissions?: ModulePermission[];
}

export interface ModuleAccessQuery {
  userId?: number;
  roleId?: number;
  moduleId?: string;
  category?: ModuleCategory;
  hasAccess?: boolean;
}

// Pre-defined system modules
export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Panel principal con métricas y resúmenes',
    icon: 'fa fa-tachometer-alt',
    route: '/dashboard',
    category: ModuleCategory.CORE,
    isSystem: true,
    requiresAdmin: false
  },
  {
    id: 'client-management',
    name: 'Gestión de Clientes',
    description: 'Administración de clientes y sus datos',
    icon: 'fa fa-users',
    route: '/management/client',
    category: ModuleCategory.MANAGEMENT,
    isSystem: false,
    requiresAdmin: false
  },
  {
    id: 'product-management',
    name: 'Gestión de Productos',
    description: 'Administración de productos y servicios',
    icon: 'fa fa-box',
    route: '/management/product',
    category: ModuleCategory.MANAGEMENT,
    isSystem: false,
    requiresAdmin: false
  },
  {
    id: 'services-management',
    name: 'Gestión de Servicios',
    description: 'Administración de servicios ofrecidos',
    icon: 'fa fa-concierge-bell',
    route: '/management/services',
    category: ModuleCategory.MANAGEMENT,
    isSystem: false,
    requiresAdmin: false
  },
  {
    id: 'inventory',
    name: 'Inventario',
    description: 'Control de stock y movimientos',
    icon: 'fa fa-warehouse',
    route: '/inventory',
    category: ModuleCategory.OPERATIONS,
    isSystem: false,
    requiresAdmin: false,
    subModules: [
      {
        id: 'inventory-dashboard',
        name: 'Dashboard Inventario',
        description: 'Resumen del estado del inventario',
        icon: 'fa fa-chart-bar',
        route: '/inventory/dashboard',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'inventory'
      },
      {
        id: 'inventory-movements',
        name: 'Movimientos',
        description: 'Historial de movimientos de inventario',
        icon: 'fa fa-exchange-alt',
        route: '/inventory/movements',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'inventory'
      }
    ]
  },
  {
    id: 'user-management',
    name: 'Gestión de Usuarios',
    description: 'Administración de usuarios del sistema',
    icon: 'fa fa-user-cog',
    route: '/management/users',
    category: ModuleCategory.SETTINGS,
    isSystem: false,
    requiresAdmin: true
  },
  {
    id: 'room-management',
    name: 'Gestión de Salas',
    description: 'Administración de salas y espacios',
    icon: 'fa fa-door-open',
    route: '/management/rooms',
    category: ModuleCategory.SETTINGS,
    isSystem: false,
    requiresAdmin: true
  },
  {
    id: 'profile',
    name: 'Perfil',
    description: 'Gestión del perfil personal',
    icon: 'fa fa-user',
    route: '/profile',
    category: ModuleCategory.CORE,
    isSystem: true,
    requiresAdmin: false
  },
  {
    id: 'agenda',
    name: 'Agenda',
    description: 'Calendario y citas',
    icon: 'fa fa-calendar',
    route: '/agenda',
    category: ModuleCategory.OPERATIONS,
    isSystem: false,
    requiresAdmin: false,
    subModules: [
      {
        id: 'agenda-new',
        name: 'Nueva Cita',
        description: 'Crear nueva cita',
        icon: 'fa fa-plus',
        route: '/agenda/new',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'agenda'
      },
      {
        id: 'agenda-config',
        name: 'Configuración Agenda',
        description: 'Configurar parámetros de la agenda',
        icon: 'fa fa-cog',
        route: '/agenda/config',
        category: ModuleCategory.SETTINGS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'agenda'
      }
    ]
  },
  {
    id: 'consultations',
    name: 'Consultas',
    description: 'Gestión de consultas médicas',
    icon: 'fa fa-stethoscope',
    route: '/consultations',
    category: ModuleCategory.OPERATIONS,
    isSystem: false,
    requiresAdmin: false,
    subModules: [
      {
        id: 'consultation-tokens',
        name: 'Tokens de Consulta',
        description: 'Gestión de tokens para consultas',
        icon: 'fa fa-key',
        route: '/consultations/tokens',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'consultations'
      }
    ]
  },
  {
    id: 'rewards',
    name: 'Recompensas',
    description: 'Sistema de recompensas y fidelización',
    icon: 'fa fa-star',
    route: '/rewards',
    category: ModuleCategory.OPERATIONS,
    isSystem: false,
    requiresAdmin: false,
    subModules: [
      {
        id: 'rewards-dashboard',
        name: 'Dashboard Recompensas',
        description: 'Resumen del sistema de recompensas',
        icon: 'fa fa-chart-pie',
        route: '/rewards/dashboard',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'rewards'
      },
      {
        id: 'rewards-management',
        name: 'Gestión Recompensas',
        description: 'Administración de programas de recompensas',
        icon: 'fa fa-cog',
        route: '/rewards/management',
        category: ModuleCategory.SETTINGS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'rewards'
      },
      {
        id: 'rewards-client-view',
        name: 'Vista Cliente Recompensas',
        description: 'Vista de recompensas del cliente',
        icon: 'fa fa-eye',
        route: '/rewards/client-view',
        category: ModuleCategory.OPERATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'rewards'
      }
    ]
  },
  {
    id: 'email',
    name: 'Email Marketing',
    description: 'Gestión de campañas de email',
    icon: 'fa fa-envelope',
    route: '/email',
    category: ModuleCategory.INTEGRATIONS,
    isSystem: false,
    requiresAdmin: false,
    subModules: [
      {
        id: 'email-dashboard',
        name: 'Dashboard Email',
        description: 'Resumen de campañas de email',
        icon: 'fa fa-chart-line',
        route: '/email/dashboard',
        category: ModuleCategory.INTEGRATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'email'
      },
      {
        id: 'email-settings',
        name: 'Configuración Email',
        description: 'Configuración del sistema de email',
        icon: 'fa fa-cog',
        route: '/email/settings',
        category: ModuleCategory.SETTINGS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'email'
      },
      {
        id: 'email-test',
        name: 'Test Email',
        description: 'Pruebas de envío de email',
        icon: 'fa fa-paper-plane',
        route: '/email/test',
        category: ModuleCategory.INTEGRATIONS,
        isSystem: false,
        requiresAdmin: false,
        parentModule: 'email'
      }
    ]
  },
  {
    id: 'invoices',
    name: 'Facturación',
    description: 'Gestión de facturas y pagos',
    icon: 'fa fa-file-invoice',
    route: '/invoices',
    category: ModuleCategory.OPERATIONS,
    isSystem: false,
    requiresAdmin: false
  }
];

// Default permissions per module category
export const DEFAULT_CATEGORY_PERMISSIONS: Record<ModuleCategory, ModulePermission[]> = {
  [ModuleCategory.CORE]: [
    { action: ModuleAction.READ, granted: true }
  ],
  [ModuleCategory.MANAGEMENT]: [
    { action: ModuleAction.READ, granted: true },
    { action: ModuleAction.CREATE, granted: false },
    { action: ModuleAction.UPDATE, granted: false },
    { action: ModuleAction.DELETE, granted: false }
  ],
  [ModuleCategory.OPERATIONS]: [
    { action: ModuleAction.READ, granted: true },
    { action: ModuleAction.CREATE, granted: false },
    { action: ModuleAction.UPDATE, granted: false },
    { action: ModuleAction.EXPORT, granted: false }
  ],
  [ModuleCategory.REPORTS]: [
    { action: ModuleAction.READ, granted: true },
    { action: ModuleAction.EXPORT, granted: false }
  ],
  [ModuleCategory.SETTINGS]: [
    { action: ModuleAction.READ, granted: true },
    { action: ModuleAction.UPDATE, granted: false },
    { action: ModuleAction.ADMIN, granted: false }
  ],
  [ModuleCategory.INTEGRATIONS]: [
    { action: ModuleAction.READ, granted: true },
    { action: ModuleAction.CREATE, granted: false },
    { action: ModuleAction.UPDATE, granted: false }
  ]
};