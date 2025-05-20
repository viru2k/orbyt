// Ejemplo: src/app/shared/types/form.types.ts (o similar)

import { ButtonSeverity, ButtonStyleType, ButtonType } from "../generic/generic.enum";



export interface FormButtonAction {
  label: string;
  action: string; // Identificador único para la acción a emitir
  severity?: ButtonSeverity;
  styleType?: ButtonStyleType;
  buttonType?: ButtonType; // Para el atributo type del botón HTML
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  tooltipPosition?: string;
  // Puedes añadir más propiedades de orb-button si es necesario
}