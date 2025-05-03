import { Injectable } from '@angular/core';
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
import { LocalStorageService } from '../services/storage/local-storage.service';
import { NotificationService } from '@orb-services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private localStorage: LocalStorageService,
    private notification: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.localStorage.getToken();

    const authReq = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.localStorage.clearToken();
          this.router.navigate(['/login']);
          this.notification.showError('Sesión expirada', 'Por favor inicia sesión de nuevo.');
        } else if (error.status === 403) {
          this.router.navigate(['/access-denied']);
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
