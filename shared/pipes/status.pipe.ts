import { Pipe, PipeTransform } from '@angular/core';

// Definimos un tipo para la salida, que incluirá el texto y una clase CSS.
export interface StatusOutput {
  text: string;
  cssClass: string;
}

@Pipe({
  name: 'status',
  standalone: true, // Importante para que el pipe sea autocontenido
})
export class StatusPipe implements PipeTransform {
  transform(value: string | undefined | null): StatusOutput {
    if (!value) {
      // Valor por defecto si la entrada es nula o indefinida
      return { text: 'No definido', cssClass: 'status-undefined' };
    }

    switch (value.toUpperCase()) {
      case 'ACTIVE':
        return { text: 'Activo', cssClass: 'status-active' };
      case 'INACTIVE':
        return { text: 'Inactivo', cssClass: 'status-inactive' };
      default:
        return { text: value, cssClass: 'status-unknown' };
    }
  }
}