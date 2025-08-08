import { Injectable, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  private datePipe = inject(DatePipe);

  /**
   * Formatea un valor de fecha según una cadena de formato especificada.
   * @param value La fecha a formatear (string, número o objeto Date).
   * @param format La cadena de formato (ej. 'dd/MM/yyyy HH:mm', 'longDate').
   * @param locale El locale opcional a usar para el formato. Por defecto es 'es-ES'.
   * @returns La cadena de fecha formateada, o una cadena vacía si el valor no es válido.
   */
  format(value: string | number | Date | null | undefined, format: string, locale = 'es-ES'): string {
    if (!value) {
      return 'N/A'; // Devuelve 'N/A' si la fecha es nula, como en el original
    }
    try {
      // Utiliza el DatePipe de Angular para una funcionalidad robusta
      return this.datePipe.transform(value, format, undefined, locale) || '';
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return String(value); // Devuelve el valor original en caso de error
    }
  }
}
