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
    authStore.setReturnUrl(state.url);
    router.navigate(['/login']);
    return false;
  }

  // Si tenemos token pero no tenemos datos de usuario, cargar el perfil
  // No podemos acceder al estado directamente desde el guard, mejor usar un selector
  let shouldLoadProfile = true;
  
  // Verificar si ya tenemos usuario usando el observable (pero de forma síncrona)
  authStore.user$.pipe().subscribe(user => {
    shouldLoadProfile = !user;
  }).unsubscribe();
  
  if (token && shouldLoadProfile) {    
    authStore.loadUserProfile(token);
  }

  // Registrar actividad del usuario
  authStore.recordActivity();
    
  return true;
};