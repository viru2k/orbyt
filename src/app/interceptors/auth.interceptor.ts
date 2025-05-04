import { Injectable, Injector } from '@angular/core';
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
import { LocalStorageService } from '@orb-services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router, private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 👉  Obtenemos los servicios **cuando hace falta**
    const localStorage = this.injector.get(LocalStorageService);
    const token = localStorage.getToken();
    let modifiedReq = req;
    const setHeaders: Record<string, string> = {};
    if (token) {
      setHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (!req.headers.has('Accept')) {
      setHeaders['Accept'] = 'application/json';
    }
    if (Object.keys(setHeaders).length) {
      modifiedReq = req.clone({ setHeaders });
    }

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.clearToken();
          this.router.navigate(['/login']);
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
