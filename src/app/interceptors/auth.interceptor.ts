import { inject, Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService, NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { AuthStore } from '@orb-stores'; // <-- 1. Importar el AuthStore

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const localStorage = this.injector.get(LocalStorageService);
    const token = localStorage.getToken();
    let modifiedReq = req;
    
    if (token) {
      modifiedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const notificationService = this.injector.get(NotificationService);
        const authStore = this.injector.get(AuthStore); // <-- 2. Obtener el AuthStore

        if (error.status === 401) {
         
          if (req.url.includes('/auth/login')) {
            // El AuthStore se encargará de mostrar el error "Credenciales incorrectas"
          } else {
            // Si el error 401 ocurre en cualquier otra petición, significa que el token es inválido o ha expirado.
            notificationService.showError(NotificationSeverity.Error, 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            authStore.logout(); 
          }
        } else if (error.status === 403) {          
          notificationService.showError(NotificationSeverity.Error, error.error.message || 'No tienes permiso para realizar esta acción.');
        } else if (error.status === 404) {
          this.router.navigate(['/not-found']);
        } else if (error.status >= 500) {
          this.router.navigate(['/server-error']);
        }
        
        return throwError(() => error);
      })
    );
  }
}
