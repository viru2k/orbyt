import { FilterMetadata } from "primeng/api";
import { ButtonStyleType } from "../generic/generic.enum";

export interface OrbActionItem<T = any> {
    label: string;
    icon?: string;
    styleClass?: string;
    styleType?: ButtonStyleType ;
    tooltip?: string;
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    disabled?: boolean | ((data?: T) => boolean);
    visible?: boolean | ((data?: T) => boolean);
    action?: (data?: T) => void;
    items?: OrbActionItem<T>[];
    // Properties for button styling
    severity?: 'secondary' | 'success' | 'info' | 'warn'| 'help' | 'danger'   | 'contrast' | undefined;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'large';
    outlined?: boolean;
  }

export interface TableFilterEvent {
  filters: { [s: string]: FilterMetadata | FilterMetadata[] }; // Coincide con la estructura de event.filters de PrimeNG
  globalFilter?: string | null; // Mantenemos tu propiedad para el término del filtro global
}