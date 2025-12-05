import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const url = req.url;
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
      
      // Log temporal para depurar
      if (error.status === 401) {
        console.log('Error 401 detectado. URL:', url, 'isAuthRequest:', isAuthRequest);
      }
      
      if (error.status === 401 && !isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/auth/login']);
      }
      
      return throwError(() => error);
    })
  );
};