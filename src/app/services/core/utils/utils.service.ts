import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

// Define una estructura para tus reglas de validación si es necesario.
// Por ahora, el ejemplo de getValidationRules devolverá un array de strings o un objeto simple.
// Si tienes un this.validatorsService.REQUIRED_RULE, necesitarías definir qué es.
// Asumamos que es un objeto simple para el ejemplo.
export interface ValidationRule {
  type: string; // ej. 'required', 'pattern', etc.
  message?: string; // Mensaje de error opcional
  // Puedes añadir más propiedades si tus "reglas" son más complejas
}

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  // Podrías definir tus constantes de reglas aquí o importarlas de otro servicio/constante
  public readonly REQUIRED_RULE: ValidationRule = { type: 'required', message: 'Este campo es requerido.' };
  public readonly EMAIL_RULE: ValidationRule = { type: 'email', message: 'Formato de email inválido.' };
  // ... otras reglas comunes

  constructor() { }

  /**
   * Verifica si un AbstractControl tiene el validador Validators.required.
   * @param control El AbstractControl (puede ser FormControl, FormGroup, FormArray) a verificar.
   * @returns boolean - true si el control es requerido, false en caso contrario.
   */
  isRequired(control: AbstractControl | null | undefined): boolean {
    if (!control || !control.validator) {
      return false;
    }
    // Un validador puede ser una función única o un array de funciones.
    // Validators.required es una referencia a una función específica.
    // Si el validador es un array, necesitamos buscar Validators.required en él.
    // Si es una sola función, la comparamos directamente.

    const validator = control.validator({} as AbstractControl); // Llamamos al validador con un control dummy para ver si 'required' está entre los errores que devuelve
    return !!(validator && validator['required']);
  }

  /**
   * Obtiene un array de reglas de validación para un control específico dentro de un FormGroup.
   * Similar a tu getDxValidationRules, pero adaptado a Angular Forms.
   * @param controlName El nombre del control dentro del FormGroup.
   * @param formGroup El FormGroup que contiene el control.
   * @param additionalRules Un array opcional de reglas adicionales a incluir.
   * @returns ValidationRule[] - Un array de objetos ValidationRule.
   */
  getValidationRules(
    controlName: string,
    formGroup: FormGroup,
    additionalRules?: ValidationRule[]
  ): ValidationRule[] {
    const rules: ValidationRule[] = [];
    const control = formGroup.get(controlName);

    if (!control) {
      console.warn(`Control '${controlName}' no encontrado en el FormGroup.`);
      return rules; // Retorna array vacío si el control no existe
    }

    // Verifica si el control tiene el validador 'required'
    if (this.isRequired(control)) {
      rules.push(this.REQUIRED_RULE); // Añade tu objeto de regla definida
    }

    // Aquí podrías añadir lógica para otros validadores estándar si los necesitas
    // Por ejemplo, para Validators.email:
    // const validatorOutput = control.validator ? control.validator({} as AbstractControl) : null;
    // if (validatorOutput && validatorOutput['email']) { // Verifica si el validador de email está presente
    //   rules.push(this.EMAIL_RULE); // Necesitarías definir EMAIL_RULE
    // }
    // O si tienes validadores de pattern, minLength, maxLength, etc.

    if (additionalRules) {
      rules.push(...additionalRules);
    }

    return rules;
  }

  /**
   * Un método más genérico para obtener todos los errores activos de un FormControl
   * y mapearlos a tus ValidationRule (o a mensajes de error).
   * Este es un enfoque alternativo o complementario a getValidationRules.
   */
  getControlErrorMessages(control: AbstractControl | null | undefined, controlName?: string): string[] {
    const messages: string[] = [];
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return messages; // No hay errores o el control no ha sido tocado/modificado
    }

    for (const key in control.errors) {
      if (Object.prototype.hasOwnProperty.call(control.errors, key)) {
        const errorValue = control.errors[key];
        switch (key) {
          case 'required':
            messages.push(`${controlName || 'Este campo'} es requerido.`);
            break;
          case 'email':
            messages.push(`El email ingresado no es válido.`);
            break;
          case 'minlength':
            messages.push(`Se requieren al menos ${errorValue.requiredLength} caracteres.`);
            break;
          case 'maxlength':
            messages.push(`Se permiten máximo ${errorValue.requiredLength} caracteres.`);
            break;
          case 'pattern':
            messages.push(`El valor no cumple el formato requerido.`);
            break;
          // Añade más casos para otros validadores comunes o personalizados
          default:
            messages.push(`Error de validación: ${key}`);
            break;
        }
      }
    }
    return messages;
  }
}