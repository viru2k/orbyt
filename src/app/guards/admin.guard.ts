import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../store/auth/auth.store';
import { map, take } from 'rxjs/operators';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';

export const AdminGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Determinar qué permiso se requiere basado en la ruta
  const path = route.routeConfig?.path || '';
  let requiredPermission$ = authStore.canManageUsers$; // default
  let permissionName = 'canManageUsers';

  if (path.includes('users')) {
    requiredPermission$ = authStore.canManageUsers$;
    permissionName = 'canManageUsers';
  } else if (path.includes('client')) {
    requiredPermission$ = authStore.canManageClients$;
    permissionName = 'canManageClients';
  } else if (path.includes('product')) {
    requiredPermission$ = authStore.canManageProducts$;
    permissionName = 'canManageProducts';
  } else if (path.includes('agenda')) {
    requiredPermission$ = authStore.canManageAgenda$;
    permissionName = 'canManageAgenda';
  }
  

  return requiredPermission$.pipe(
    take(1),
    map(hasPermission => {      
      
      if (hasPermission) {
        return true;
      } else {        
        notificationService.show(
          NotificationSeverity.Warn, 
          'No tienes permisos para acceder a esta sección'
        );
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};