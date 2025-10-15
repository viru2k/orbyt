import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { UserResponseDto, AdminUpdateUserDto, RoleDto, CreateSubUserDto, RoleResponseDto } from '../../api/models';

// Interfaces extendidas para nuevos endpoints
interface ExtendedCreateSubUserDto {
  email: string;
  password: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
}

interface ExtendedAdminUpdateUserDto {
  email?: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
}
import { UsersService } from '../../api/services/users.service';
import { RolesService } from '../../api/services/roles.service';
import { NotificationService } from '@orb-services';
import { exhaustMap, tap, withLatestFrom } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationSeverity } from '@orb-models';

export interface UsersState {
  // Current user profile
  currentUser: UserResponseDto | null;

  // All group users (admin + sub-users)
  groupUsers: UserResponseDto[];

  // Sub-users only
  subUsers: UserResponseDto[];

  // Available roles
  roles: RoleResponseDto[];

  // Selected user for editing/viewing
  selectedUser: UserResponseDto | null;

  // Filters and search
  filters: {
    searchTerm: string;
    role: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  // UI state
  loading: boolean;
  loadingProfile: boolean;
  loadingGroupUsers: boolean;
  loadingSubUsers: boolean;
  loadingRoles: boolean;
  creatingSubUser: boolean;
  updatingUser: boolean;
  error: string | null;

  // Stats
  stats: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    subUsers: number;
  };
}

const initialState: UsersState = {
  currentUser: null,
  groupUsers: [],
  subUsers: [],
  roles: [],
  selectedUser: null,
  filters: {
    searchTerm: '',
    role: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  loading: false,
  loadingProfile: false,
  loadingGroupUsers: false,
  loadingSubUsers: false,
  loadingRoles: false,
  creatingSubUser: false,
  updatingUser: false,
  error: null,
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    subUsers: 0
  }
};

@Injectable({ providedIn: 'root' })
export class UsersStore extends ComponentStore<UsersState> {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'UsersStore', this.globalStore);
  }

  // Selectors
  readonly currentUser$ = this.select((state) => state.currentUser);
  readonly groupUsers$ = this.select((state) => state.groupUsers);
  readonly subUsers$ = this.select((state) => state.subUsers);
  readonly roles$ = this.select((state) => state.roles);
  readonly selectedUser$ = this.select((state) => state.selectedUser);
  readonly filters$ = this.select((state) => state.filters);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingProfile$ = this.select((state) => state.loadingProfile);
  readonly loadingGroupUsers$ = this.select((state) => state.loadingGroupUsers);
  readonly loadingSubUsers$ = this.select((state) => state.loadingSubUsers);
  readonly loadingRoles$ = this.select((state) => state.loadingRoles);
  readonly creatingSubUser$ = this.select((state) => state.creatingSubUser);
  readonly updatingUser$ = this.select((state) => state.updatingUser);
  readonly stats$ = this.select((state) => state.stats);

  // Additional selectors for compatibility
  readonly users$ = this.subUsers$;
  readonly error$ = this.select((state) => state.error);

  // Computed selectors
  readonly filteredGroupUsers$ = this.select(
    this.groupUsers$,
    this.filters$,
    (users, filters) => this.filterUsers(users, filters)
  );

  readonly filteredSubUsers$ = this.select(
    this.subUsers$,
    this.filters$,
    (users, filters) => this.filterUsers(users, filters)
  );

  readonly isCurrentUserAdmin$ = this.select(
    this.currentUser$,
    (user) => user?.isAdmin === true
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingProfile = this.updater((state, loadingProfile: boolean) => ({
    ...state,
    loadingProfile
  }));

  private readonly setLoadingGroupUsers = this.updater((state, loadingGroupUsers: boolean) => ({
    ...state,
    loadingGroupUsers
  }));

  private readonly setLoadingSubUsers = this.updater((state, loadingSubUsers: boolean) => ({
    ...state,
    loadingSubUsers
  }));

  private readonly setLoadingRoles = this.updater((state, loadingRoles: boolean) => ({
    ...state,
    loadingRoles
  }));

  private readonly setCreatingSubUser = this.updater((state, creatingSubUser: boolean) => ({
    ...state,
    creatingSubUser
  }));

  private readonly setUpdatingUser = this.updater((state, updatingUser: boolean) => ({
    ...state,
    updatingUser
  }));

  private readonly setCurrentUser = this.updater((state, currentUser: UserResponseDto) => ({
    ...state,
    currentUser,
    loadingProfile: false
  }));

  private readonly setGroupUsers = this.updater((state, groupUsers: UserResponseDto[]) => ({
    ...state,
    groupUsers,
    loadingGroupUsers: false,
    stats: {
      ...state.stats,
      totalUsers: groupUsers.length,
      activeUsers: groupUsers.filter(user => user.active === true).length,
      adminUsers: groupUsers.filter(user => user.isAdmin === true).length
    }
  }));

  private readonly setSubUsers = this.updater((state, subUsers: UserResponseDto[]) => ({
    ...state,
    subUsers,
    loadingSubUsers: false,
    stats: {
      ...state.stats,
      subUsers: subUsers.length
    }
  }));

  private readonly setRoles = this.updater((state, roles: RoleResponseDto[]) => ({
    ...state,
    roles,
    loadingRoles: false
  }));

  private readonly setSelectedUser = this.updater((state, selectedUser: UserResponseDto | null) => ({
    ...state,
    selectedUser
  }));

  private readonly setFilters = this.updater((state, filters: Partial<UsersState['filters']>) => ({
    ...state,
    filters: {
      ...state.filters,
      ...filters
    }
  }));

  private readonly addSubUser = this.updater((state, newUser: UserResponseDto) => ({
    ...state,
    subUsers: [...state.subUsers, newUser],
    groupUsers: [...state.groupUsers, newUser],
    creatingSubUser: false,
    stats: {
      ...state.stats,
      totalUsers: state.stats.totalUsers + 1,
      subUsers: state.stats.subUsers + 1,
      activeUsers: newUser.active === true ? state.stats.activeUsers + 1 : state.stats.activeUsers
    }
  }));

  private readonly updateSubUser = this.updater((state, updatedUser: UserResponseDto) => ({
    ...state,
    subUsers: state.subUsers.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    ),
    groupUsers: state.groupUsers.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    ),
    selectedUser: state.selectedUser?.id === updatedUser.id ? updatedUser : state.selectedUser,
    updatingUser: false
  }));

  private readonly setError = this.updater((state, error: string | null) => ({
    ...state,
    error,
    loading: false,
    loadingProfile: false,
    loadingGroupUsers: false,
    loadingSubUsers: false,
    loadingRoles: false,
    creatingSubUser: false,
    updatingUser: false
  }));

  // Effects
  readonly loadCurrentUserProfile = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingProfile(true)),
      exhaustMap(() =>
        this.usersService.userControllerGetMyProfile().pipe(
          tapResponse(
            (user: UserResponseDto) => {
              this.setCurrentUser(user);
            },
            (error: any) => {
              console.error('Error loading user profile:', error);
              const errorMessage = error?.error?.message || 'Error al cargar el perfil del usuario.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly loadGroupUsers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingGroupUsers(true)),
      exhaustMap(() =>
        this.usersService.userControllerGetGroupUsers().pipe(
          tapResponse(
            (users: UserResponseDto[]) => {
              this.setGroupUsers(users || []);
            },
            (error: any) => {
              console.error('Error loading group users:', error);
              const errorMessage = error?.error?.message || 'Error al cargar los usuarios del grupo.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly loadSubUsers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingSubUsers(true)),
      exhaustMap(() =>
        this.usersService.userControllerGetSubUsers().pipe(
          tapResponse(
            (users: UserResponseDto[]) => {
              this.setSubUsers(users || []);
            },
            (error: any) => {
              console.error('Error loading sub-users:', error);
              const errorMessage = error?.error?.message || 'Error al cargar los sub-usuarios.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly loadRoles = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingRoles(true)),
      exhaustMap(() =>
        this.rolesService.rolesControllerFindAll().pipe(
          tapResponse(
            (roles: any[]) => {
              this.setRoles(roles || []);
            },
            (error: any) => {
              console.error('Error loading roles:', error);
              const errorMessage = error?.error?.message || 'Error al cargar los roles.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly createUser = this.effect<ExtendedCreateSubUserDto>((userData$) =>
    userData$.pipe(
      tap(() => this.setCreatingSubUser(true)),
      exhaustMap((userData) =>
        this.usersService.userControllerCreateSubUser({ body: userData as any }).pipe(
          tapResponse(
            (newUser: UserResponseDto) => {
              this.addSubUser(newUser);
              this.notificationService.show(NotificationSeverity.Success, 'Sub-usuario creado exitosamente.');
            },
            (error: any) => {
              console.error('Error creating sub-user:', error);
              const errorMessage = error?.error?.message || 'Error al crear el sub-usuario.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly updateUser = this.effect<{ id: string | number; userData: ExtendedAdminUpdateUserDto }>((params$) =>
    params$.pipe(
      tap(() => this.setUpdatingUser(true)),
      exhaustMap(({ id, userData }) =>
        this.usersService.userControllerUpdateSubUser({ id: Number(id), body: userData as any }).pipe(
          tapResponse(
            (updatedUser: UserResponseDto) => {
              this.updateSubUser(updatedUser);
              this.notificationService.show(NotificationSeverity.Success, 'Usuario actualizado exitosamente.');
            },
            (error: any) => {
              console.error('Error updating user:', error);
              const errorMessage = error?.error?.message || 'Error al actualizar el usuario.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  // Utility methods
  refreshUsers(): void {
    this.setLoading(true);
    this.loadCurrentUserProfile();
    this.loadGroupUsers();
    this.loadSubUsers();
  }

  refreshProfile(): void {
    this.loadCurrentUserProfile();
  }

  refreshGroupUsers(): void {
    this.loadGroupUsers();
  }

  refreshSubUsers(): void {
    this.loadSubUsers();
  }

  refreshRoles(): void {
    this.loadRoles();
  }

  // Filter and search methods
  updateFilters(filters: Partial<UsersState['filters']>): void {
    this.setFilters(filters);
  }

  clearFilters(): void {
    this.setFilters({
      searchTerm: '',
      role: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }

  searchUsers(searchTerm: string): void {
    this.setFilters({ searchTerm });
  }

  // User selection methods
  selectUser(user: UserResponseDto): void {
    this.setSelectedUser(user);
  }

  clearSelection(): void {
    this.setSelectedUser(null);
  }

  // Helper methods
  getUsersData() {
    return {
      currentUser: this.get().currentUser,
      groupUsers: this.get().groupUsers,
      subUsers: this.get().subUsers,
      selectedUser: this.get().selectedUser,
      loading: this.get().loading,
      stats: this.get().stats
    };
  }

  // Business logic helpers
  private filterUsers(users: UserResponseDto[], filters: UsersState['filters']): UserResponseDto[] {
    let filtered = [...users];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.fullName?.toLowerCase().includes(term)) ||
        (user.email?.toLowerCase().includes(term))
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user =>
        user.roles?.some(role => role.name === filters.role) ||
        (filters.role === 'admin' && user.isAdmin)
      );
    }

    // Status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => user.active === isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (filters.sortBy) {
        case 'name':
          aValue = a.fullName || '';
          bValue = b.fullName || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.isAdmin ? 'admin' : a.roles?.[0]?.name || '';
          bValue = b.isAdmin ? 'admin' : b.roles?.[0]?.name || '';
          break;
        case 'status':
          aValue = a.active ? 'active' : 'inactive';
          bValue = b.active ? 'active' : 'inactive';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          aValue = a.fullName || '';
          bValue = b.fullName || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return filters.sortOrder === 'asc' ? result : -result;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return filters.sortOrder === 'asc' ? result : -result;
      }

      return 0;
    });

    return filtered;
  }

  isUserAdmin(user: UserResponseDto): boolean {
    return user?.isAdmin === true || user?.roles?.some(role => role.name === 'admin') || false;
  }

  isUserActive(user: UserResponseDto): boolean {
    return user?.active === true;
  }

  canEditUser(user: UserResponseDto): boolean {
    const currentUser = this.get().currentUser;
    if (!currentUser || !this.isUserAdmin(currentUser)) {
      return false;
    }

    // Admin can edit sub-users but not other admins
    return !this.isUserAdmin(user);
  }

  getUserPermissions(user: UserResponseDto): string[] {
    return user?.roles?.map(role => role.name) || [];
  }

  getUserStats() {
    const state = this.get();
    return {
      totalUsers: state.groupUsers.length,
      activeUsers: state.groupUsers.filter(user => user.active === true).length,
      inactiveUsers: state.groupUsers.filter(user => user.active !== true).length,
      adminUsers: state.groupUsers.filter(user => this.isUserAdmin(user)).length,
      subUsers: state.subUsers.length,
      recentlyCreated: state.groupUsers.filter(user => {
        const createdAt = new Date(user.createdAt || '');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdAt > sevenDaysAgo;
      }).length
    };
  }
}
