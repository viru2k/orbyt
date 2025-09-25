import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  ModuleDefinition,
  ModuleAccess,
  UserModuleAccess,
  RoleModuleAccess,
  CreateModuleAccessDto,
  UpdateModuleAccessDto,
  ModuleAccessQuery,
  SYSTEM_MODULES,
  ModuleCategory,
  ModuleAction,
  AccessSource,
  ModuleAccessSummary,
  DEFAULT_CATEGORY_PERMISSIONS
} from '../models/module-access.models';

import { UserResponseDto, RoleResponseDto } from '../../../api/models';
import { UsersService } from '../../../api/services/users.service';
import { RolesService } from '../../../api/services/roles.service';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessService {
  private readonly http = inject(HttpClient);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);

  private readonly baseUrl = '/api/module-access';

  // Cache for modules and access data
  private modulesSubject = new BehaviorSubject<ModuleDefinition[]>(SYSTEM_MODULES);
  private userAccessCache = new Map<number, UserModuleAccess>();
  private roleAccessCache = new Map<number, RoleModuleAccess>();

  public readonly modules$ = this.modulesSubject.asObservable();

  constructor() {
    this.initializeModules();
  }

  // Module Management
  getModules(): Observable<ModuleDefinition[]> {
    return this.modules$;
  }

  getModulesByCategory(category: ModuleCategory): Observable<ModuleDefinition[]> {
    return this.modules$.pipe(
      map(modules => modules.filter(m => m.category === category))
    );
  }

  getModuleById(moduleId: string): Observable<ModuleDefinition | undefined> {
    return this.modules$.pipe(
      map(modules => this.findModuleById(modules, moduleId))
    );
  }

  private findModuleById(modules: ModuleDefinition[], moduleId: string): ModuleDefinition | undefined {
    for (const module of modules) {
      if (module.id === moduleId) {
        return module;
      }
      if (module.subModules) {
        const found = this.findModuleById(module.subModules, moduleId);
        if (found) return found;
      }
    }
    return undefined;
  }

  // User Module Access Management
  getUserModuleAccess(userId: number): Observable<UserModuleAccess> {
    // Check cache first
    if (this.userAccessCache.has(userId)) {
      return of(this.userAccessCache.get(userId)!);
    }

    // For now, create a mock user access until the proper API is available
    return combineLatest([
      this.getModules(),
      this.getModuleAccessForUser(userId)
    ]).pipe(
      map(([modules, accessList]) => {
        const userAccess: UserModuleAccess = {
          userId: userId,
          userName: `User ${userId}`,
          userEmail: `user${userId}@example.com`,
          isAdmin: false,
          modules: this.buildModuleAccessSummary(modules, accessList, [])
        };

        // Cache the result
        this.userAccessCache.set(userId, userAccess);
        return userAccess;
      }),
      catchError(error => {
        console.error('Error getting user module access:', error);
        return of(this.createEmptyUserAccess(userId));
      })
    );
  }

  getAllUsersModuleAccess(): Observable<UserModuleAccess[]> {
    // Return mock data until proper API is available
    return of([
      {
        userId: 1,
        userName: 'Admin User',
        userEmail: 'admin@example.com',
        isAdmin: true,
        modules: []
      },
      {
        userId: 2,
        userName: 'Regular User',
        userEmail: 'user@example.com',
        isAdmin: false,
        modules: []
      }
    ]);
  }

  // Role Module Access Management
  getRoleModuleAccess(roleId: number): Observable<RoleModuleAccess> {
    if (this.roleAccessCache.has(roleId)) {
      return of(this.roleAccessCache.get(roleId)!);
    }

    return combineLatest([
      this.getModules(),
      this.getModuleAccessForRole(roleId)
    ]).pipe(
      map(([modules, accessList]) => {
        const roleAccess: RoleModuleAccess = {
          roleId: roleId,
          roleName: `Role ${roleId}`,
          roleDescription: `Description for role ${roleId}`,
          modules: this.buildModuleAccessSummary(modules, accessList)
        };

        this.roleAccessCache.set(roleId, roleAccess);
        return roleAccess;
      }),
      catchError(error => {
        console.error('Error getting role module access:', error);
        return of(this.createEmptyRoleAccess(roleId));
      })
    );
  }

  getAllRolesModuleAccess(): Observable<RoleModuleAccess[]> {
    // Return mock data until proper API is available
    return of([
      {
        roleId: 1,
        roleName: 'Admin',
        roleDescription: 'Administrator role with full access',
        modules: []
      },
      {
        roleId: 2,
        roleName: 'User',
        roleDescription: 'Standard user role',
        modules: []
      }
    ]);
  }

  // CRUD Operations for Module Access
  createModuleAccess(createDto: CreateModuleAccessDto): Observable<ModuleAccess> {
    return this.http.post<ModuleAccess>(`${this.baseUrl}`, createDto).pipe(
      map(access => {
        this.invalidateCache(createDto.userId, createDto.roleId);
        return access;
      }),
      catchError(error => {
        console.error('Error creating module access:', error);
        throw error;
      })
    );
  }

  updateModuleAccess(accessId: number, updateDto: UpdateModuleAccessDto): Observable<ModuleAccess> {
    return this.http.patch<ModuleAccess>(`${this.baseUrl}/${accessId}`, updateDto).pipe(
      map(access => {
        this.invalidateAllCache();
        return access;
      }),
      catchError(error => {
        console.error('Error updating module access:', error);
        throw error;
      })
    );
  }

  deleteModuleAccess(accessId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${accessId}`).pipe(
      map(() => {
        this.invalidateAllCache();
      }),
      catchError(error => {
        console.error('Error deleting module access:', error);
        throw error;
      })
    );
  }

  // Bulk operations
  updateUserModuleAccess(userId: number, moduleAccess: ModuleAccessSummary[]): Observable<void> {
    const updates = moduleAccess.map(access => ({
      moduleId: access.moduleId,
      hasAccess: access.hasAccess,
      permissions: access.permissions
    }));

    return this.http.put<void>(`${this.baseUrl}/user/${userId}/bulk`, { updates }).pipe(
      map(() => {
        this.invalidateCache(userId);
      }),
      catchError(error => {
        console.error('Error updating user module access:', error);

        // If API doesn't exist yet, simulate the operation
        if (error.status === 404) {
          this.invalidateCache(userId);
          return of(undefined);
        }
        throw error;
      })
    );
  }

  updateRoleModuleAccess(roleId: number, moduleAccess: ModuleAccessSummary[]): Observable<void> {
    const updates = moduleAccess.map(access => ({
      moduleId: access.moduleId,
      hasAccess: access.hasAccess,
      permissions: access.permissions
    }));

    return this.http.put<void>(`${this.baseUrl}/role/${roleId}/bulk`, { updates }).pipe(
      map(() => {
        this.invalidateCache(undefined, roleId);
      }),
      catchError(error => {
        console.error('Error updating role module access:', error);

        // If API doesn't exist yet, simulate the operation
        if (error.status === 404) {
          this.invalidateCache(undefined, roleId);
          return of(undefined);
        }
        throw error;
      })
    );
  }

  // Access checking utilities
  checkUserModuleAccess(userId: number, moduleId: string, action?: ModuleAction): Observable<boolean> {
    return this.getUserModuleAccess(userId).pipe(
      map(userAccess => {
        const moduleAccess = userAccess.modules.find(m => m.moduleId === moduleId);
        if (!moduleAccess || !moduleAccess.hasAccess) {
          return false;
        }

        if (!action) {
          return true;
        }

        return moduleAccess.permissions.some(p => p.action === action && p.granted);
      })
    );
  }

  // Private helper methods
  private initializeModules(): void {
    // In a real implementation, this would fetch modules from the backend
    // For now, we use the predefined SYSTEM_MODULES
    this.modulesSubject.next(SYSTEM_MODULES);
  }

  private getModuleAccessForUser(userId: number): Observable<ModuleAccess[]> {
    return this.http.get<ModuleAccess[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.warn('Module access API not available, using defaults:', error);
        return of([]);
      })
    );
  }

  private getModuleAccessForRole(roleId: number): Observable<ModuleAccess[]> {
    return this.http.get<ModuleAccess[]>(`${this.baseUrl}/role/${roleId}`).pipe(
      catchError(error => {
        console.warn('Module access API not available, using defaults:', error);
        return of([]);
      })
    );
  }

  private buildModuleAccessSummary(
    modules: ModuleDefinition[],
    accessList: ModuleAccess[],
    userRoles: any[] = []
  ): ModuleAccessSummary[] {
    const summary: ModuleAccessSummary[] = [];

    const processModule = (module: ModuleDefinition): void => {
      // Find direct access
      const directAccess = accessList.find(a => a.moduleId === module.id && a.userId);

      // Find role-based access
      const roleAccess = accessList.find(a =>
        a.moduleId === module.id &&
        a.roleId &&
        userRoles.some(role => role.id === a.roleId)
      );

      // Determine access and source
      let hasAccess = false;
      let permissions = DEFAULT_CATEGORY_PERMISSIONS[module.category] || [];
      let source = AccessSource.SYSTEM;

      if (directAccess) {
        hasAccess = directAccess.hasAccess;
        permissions = directAccess.permissions;
        source = AccessSource.DIRECT;
      } else if (roleAccess) {
        hasAccess = roleAccess.hasAccess;
        permissions = roleAccess.permissions;
        source = AccessSource.ROLE;
      } else if (module.isSystem) {
        hasAccess = true;
        source = AccessSource.SYSTEM;
      }

      summary.push({
        moduleId: module.id,
        moduleName: module.name,
        hasAccess,
        permissions,
        source
      });

      // Process sub-modules
      if (module.subModules) {
        module.subModules.forEach(processModule);
      }
    };

    modules.forEach(processModule);
    return summary;
  }

  private createEmptyUserAccess(userId: number): UserModuleAccess {
    return {
      userId,
      userName: 'Unknown User',
      userEmail: '',
      isAdmin: false,
      modules: []
    };
  }

  private createEmptyRoleAccess(roleId: number): RoleModuleAccess {
    return {
      roleId,
      roleName: 'Unknown Role',
      roleDescription: '',
      modules: []
    };
  }

  private invalidateCache(userId?: number, roleId?: number): void {
    if (userId) {
      this.userAccessCache.delete(userId);
    }
    if (roleId) {
      this.roleAccessCache.delete(roleId);
    }
  }

  private invalidateAllCache(): void {
    this.userAccessCache.clear();
    this.roleAccessCache.clear();
  }

  // Utility methods for UI
  getModuleIcon(moduleId: string): Observable<string> {
    return this.getModuleById(moduleId).pipe(
      map(module => module?.icon || 'fa fa-cube')
    );
  }

  getModulesByParent(parentId?: string): Observable<ModuleDefinition[]> {
    return this.modules$.pipe(
      map(modules => {
        if (!parentId) {
          return modules.filter(m => !m.parentModule);
        }

        const parentModule = this.findModuleById(modules, parentId);
        return parentModule?.subModules || [];
      })
    );
  }

  getCategorizedModules(): Observable<{ [key in ModuleCategory]?: ModuleDefinition[] }> {
    return this.modules$.pipe(
      map(modules => {
        const categorized: { [key in ModuleCategory]?: ModuleDefinition[] } = {};

        modules.forEach(module => {
          if (!categorized[module.category]) {
            categorized[module.category] = [];
          }
          categorized[module.category]!.push(module);
        });

        return categorized;
      })
    );
  }
}