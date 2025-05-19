// src/app/shared/types/table.types.ts

// Importa los tipos necesarios de PrimeNG
import { FilterMetadata, SortMeta } from 'primeng/api';
// NO necesitas importar SortEvent aquí si orb-table va a emitir el SortEvent de PrimeNG directamente.

export interface TablePageEvent {
  first: number;
  rows: number;
  page?: number;
  pageCount?: number;
}

// TableFilterEvent CORREGIDO para ser compatible con el evento (onFilter) de p-table
// y el acceso a dt.filters.
export interface TableFilterEvent {
  filters: { [s: string]: FilterMetadata | FilterMetadata[] }; // Coincide con la estructura de event.filters de PrimeNG
  globalFilter?: string | null; // Mantenemos tu propiedad para el término del filtro global
}

// Definiciones para TableColumn, OrbActionItem, OrbTableFeatures (se mantienen como antes)
export interface TableColumn {
  field?: string;
  header: string;
  width?: string;
  sortable?: boolean; // Esencial para la ordenación por plantilla
  // ... más propiedades si las tienes
}

export interface OrbActionItem<T = any> {
  label: string;
  icon?: string;
  styleClass?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean | ((data?: T) => boolean);
  visible?: boolean | ((data?: T) => boolean);
  action?: (data?: T) => void;
  items?: OrbActionItem<T>[];
}

export interface OrbTableFeatures {
  showGlobalSearch?: boolean;
  globalSearchPlaceholder?: string;
}