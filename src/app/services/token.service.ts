import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  /**
   * Extrae el token JWT del response HTTP
   * @param response Response HTTP del login
   * @returns string del token JWT o null si no se puede extraer
   */
  extractTokenFromResponse(response: any): string | null {
    const body = response?.body;
    
    if (typeof body === 'string') {
      try {
        // Intentar parsear como JSON
        const parsedBody = JSON.parse(body);
        if (parsedBody && parsedBody.access_token) {
          return parsedBody.access_token;
        }
      } catch (e) {
        // Si no es JSON válido, asumir que es directamente el token
        return body;
      }
    } else if (body && typeof body === 'object' && body.access_token) {
      return body.access_token;
    }
    
    return null;
  }

  /**
   * Decodifica la información del JWT sin verificar la firma
   * @param token JWT token
   * @returns Payload del token o null si hay error
   */
  decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.warn('Error decodificando token JWT:', error);
      return null;
    }
  }

  /**
   * Obtiene la fecha de expiración del token en milisegundos
   * @param token JWT token
   * @returns Timestamp de expiración en milisegundos
   */
  getTokenExpiration(token: string): number {
    const payload = this.decodeToken(token);
    if (payload && payload.exp) {
      return payload.exp * 1000; // Convertir a milisegundos
    }
    return Date.now() + (24 * 60 * 60 * 1000); // Default: 24 horas
  }

  /**
   * Verifica si el token está expirado
   * @param token JWT token
   * @returns true si está expirado
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    return Date.now() >= expiration;
  }

  /**
   * Verifica si el token está cerca de expirar
   * @param token JWT token
   * @param warningPercentage Porcentaje de vida útil para advertencia (default: 0.95)
   * @returns true si está cerca de expirar
   */
  isTokenNearExpiration(token: string, warningPercentage = 0.95): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp || !payload.iat) return false;
    
    const now = Date.now() / 1000; // Convertir a segundos
    const tokenLifetime = payload.exp - payload.iat;
    const timeElapsed = now - payload.iat;
    
    return timeElapsed >= (tokenLifetime * warningPercentage);
  }
}