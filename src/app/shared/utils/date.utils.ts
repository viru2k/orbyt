/**
 * Utilidades para el manejo de fechas y conversiones
 * especialmente para formularios HTML5 y APIs ISO 8601
 */

/**
 * Convierte una fecha ISO 8601 o string de fecha al formato datetime-local
 * usado por los inputs HTML5 type="datetime-local"
 *
 * @param dateString - Fecha en formato ISO 8601 o cualquier formato válido para Date()
 * @returns String en formato YYYY-MM-DDTHH:mm para input datetime-local
 *
 * @example
 * convertToDatetimeLocal('2023-12-25T14:30:00.000Z') // '2023-12-25T14:30'
 * convertToDatetimeLocal('2023-12-25') // '2023-12-25T00:00'
 */
export function convertToDatetimeLocal(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Verificar que la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn(`Fecha inválida proporcionada: ${dateString}`);
    return '';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte un valor de datetime-local a formato ISO 8601
 * para envío a APIs que requieren formato estándar
 *
 * @param datetimeLocal - Valor del input datetime-local (YYYY-MM-DDTHH:mm)
 * @returns String en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 *
 * @example
 * convertFromDatetimeLocal('2023-12-25T14:30') // '2023-12-25T14:30:00.000Z'
 */
export function convertFromDatetimeLocal(datetimeLocal: string | null | undefined): string {
  if (!datetimeLocal) return '';

  try {
    // datetime-local format: YYYY-MM-DDTHH:mm
    // Convert to ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ
    const date = new Date(datetimeLocal);

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn(`Valor datetime-local inválido: ${datetimeLocal}`);
      return '';
    }

    return date.toISOString();
  } catch (error) {
    console.error(`Error convirtiendo datetime-local: ${datetimeLocal}`, error);
    return '';
  }
}

/**
 * Convierte una fecha a formato solo de fecha (YYYY-MM-DD)
 * para inputs HTML5 type="date"
 *
 * @param dateString - Fecha en cualquier formato válido para Date()
 * @returns String en formato YYYY-MM-DD
 *
 * @example
 * convertToDateOnly('2023-12-25T14:30:00.000Z') // '2023-12-25'
 */
export function convertToDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Fecha inválida proporcionada: ${dateString}`);
    return '';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha a formato solo de tiempo (HH:mm)
 * para inputs HTML5 type="time"
 *
 * @param dateString - Fecha en cualquier formato válido para Date()
 * @returns String en formato HH:mm
 *
 * @example
 * convertToTimeOnly('2023-12-25T14:30:00.000Z') // '14:30'
 */
export function convertToTimeOnly(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Fecha inválida proporcionada: ${dateString}`);
    return '';
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * con opciones de localización
 *
 * @param dateString - Fecha en cualquier formato válido para Date()
 * @param locale - Código de localización (por defecto 'es-ES')
 * @param options - Opciones de formato de fecha
 * @returns String formateado para mostrar al usuario
 *
 * @example
 * formatDateForDisplay('2023-12-25T14:30:00.000Z') // '25 de diciembre de 2023'
 * formatDateForDisplay('2023-12-25T14:30:00.000Z', 'es-ES', { dateStyle: 'short' }) // '25/12/23'
 */
export function formatDateForDisplay(
  dateString: string | null | undefined,
  locale: string = 'es-ES',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Fecha inválida proporcionada: ${dateString}`);
    return '';
  }

  return date.toLocaleDateString(locale, options);
}

/**
 * Formatea una fecha y hora para mostrar en la interfaz de usuario
 *
 * @param dateString - Fecha en cualquier formato válido para Date()
 * @param locale - Código de localización (por defecto 'es-ES')
 * @returns String formateado con fecha y hora
 *
 * @example
 * formatDateTimeForDisplay('2023-12-25T14:30:00.000Z') // '25 de diciembre de 2023, 14:30'
 */
export function formatDateTimeForDisplay(
  dateString: string | null | undefined,
  locale: string = 'es-ES'
): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Fecha inválida proporcionada: ${dateString}`);
    return '';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };

  const formattedDate = date.toLocaleDateString(locale, dateOptions);
  const formattedTime = date.toLocaleTimeString(locale, timeOptions);

  return `${formattedDate}, ${formattedTime}`;
}

/**
 * Calcula la edad basada en la fecha de nacimiento
 *
 * @param birthDate - Fecha de nacimiento en cualquier formato válido
 * @returns Edad en años como número
 *
 * @example
 * calculateAge('1990-06-15') // 33 (dependiendo del año actual)
 */
export function calculateAge(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;

  const birth = new Date(birthDate);
  const today = new Date();

  if (isNaN(birth.getTime())) {
    console.warn(`Fecha de nacimiento inválida: ${birthDate}`);
    return 0;
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Valida si una string es una fecha válida
 *
 * @param dateString - String a validar
 * @returns true si es una fecha válida, false si no
 *
 * @example
 * isValidDate('2023-12-25') // true
 * isValidDate('invalid-date') // false
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Obtiene la fecha actual en formato ISO 8601
 *
 * @returns Fecha actual en formato ISO 8601
 *
 * @example
 * getCurrentISODate() // '2023-12-25T14:30:00.000Z'
 */
export function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Obtiene la fecha actual en formato datetime-local
 * útil para establecer valores por defecto en formularios
 *
 * @returns Fecha actual en formato YYYY-MM-DDTHH:mm
 *
 * @example
 * getCurrentDatetimeLocal() // '2023-12-25T14:30'
 */
export function getCurrentDatetimeLocal(): string {
  return convertToDatetimeLocal(getCurrentISODate());
}