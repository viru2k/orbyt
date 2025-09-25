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

  return authStore.user$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      // Si el usuario es administrador (tiene rol de admin), permitir acceso a todo
      const isAdmin = user.roles?.some(role => role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'administrator');
      if (isAdmin) {
        return true;
      }

      // Para usuarios no admin, verificar permisos específicos
      const path = route.routeConfig?.path || '';
      let hasPermission = false;
      let sectionName = '';

      if (path.includes('users')) {
        hasPermission = user.canManageUsers ?? false;
        sectionName = 'usuarios';
      } else if (path.includes('client')) {
        hasPermission = user.canManageClients ?? false;
        sectionName = 'clientes';
      } else if (path.includes('product')) {
        hasPermission = user.canManageProducts ?? false;
        sectionName = 'productos';
      } else if (path.includes('agenda')) {
        hasPermission = user.canManageAgenda ?? false;
        sectionName = 'agenda';
      } else {
        // Default: permitir acceso si no es una sección específica
        hasPermission = true;
      }

      if (hasPermission) {
        return true;
      } else {
        notificationService.show(
          NotificationSeverity.Warn,
          `No tienes permisos para acceder a la sección de ${sectionName}`
        );
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};