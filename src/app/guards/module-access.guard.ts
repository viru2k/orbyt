import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthStore } from '@orb-stores';
import { ModuleAccessService } from '../features/access-management/services/module-access.service';
import { ModuleAction } from '../features/access-management/models/module-access.models';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessGuard implements CanActivate {
  private readonly authStore = inject(AuthStore);
  private readonly moduleAccessService = inject(ModuleAccessService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const currentUser = this.authStore.user();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Admin users have access to everything
    if (currentUser.isAdmin) {
      return of(true);
    }

    // Get module ID and required action from route data
    const moduleId = route.data?.['moduleId'] as string;
    const requiredAction = route.data?.['requiredAction'] as ModuleAction;

    if (!moduleId) {
      // If no module ID is specified, allow access (backward compatibility)
      return of(true);
    }

    return this.moduleAccessService.checkUserModuleAccess(
      currentUser.id,
      moduleId,
      requiredAction
    ).pipe(
      map(hasAccess => {
        if (!hasAccess) {
          this.router.navigate(['/dashboard'], {
            queryParams: {
              error: 'access_denied',
              module: moduleId
            }
          });
        }
        return hasAccess;
      }),
      catchError(error => {
        console.error('Error checking module access:', error);
        // Allow access on error to prevent breaking the app
        return of(true);
      })
    );
  }
}

// Route configuration helper interface
export interface ModuleRouteData {
  moduleId: string;
  requiredAction?: ModuleAction;
}