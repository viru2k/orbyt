import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get token from localStorage
  const token = localStorage.getItem('orbyt_landing_token');
  
  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Handle the request and catch authentication errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('orbyt_landing_token');
        
        // Redirect to login only if not already on auth pages
        const currentUrl = router.url;
        if (!currentUrl.startsWith('/auth/')) {
          router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: currentUrl } 
          });
        }
      }
      
      return throwError(() => error);
    })
  );
};