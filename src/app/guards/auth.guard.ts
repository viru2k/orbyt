import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/storage/local-storage.service';
import { AuthStore } from '../store/auth/auth.store';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const localStorage = inject(LocalStorageService);
  const authStore = inject(AuthStore);

  const token = localStorage.getToken();
  if (!token) {
    // Store the attempted URL for redirecting after login
    authStore.setReturnUrl(state.url);
    router.navigate(['/login']);
    return false;
  }

  return true;
};