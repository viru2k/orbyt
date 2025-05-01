import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/storage/local-storage.service';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localStorage = inject(LocalStorageService);

  const token = localStorage.getToken();
  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};