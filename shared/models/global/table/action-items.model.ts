import { FilterMetadata } from "primeng/api";

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

export interface TableFilterEvent {
  filters: { [s: string]: FilterMetadata | FilterMetadata[] }; // Coincide con la estructura de event.filters de PrimeNG
  globalFilter?: string | null; // Mantenemos tu propiedad para el término del filtro global
}