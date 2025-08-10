import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@orb-stores';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'orb-sidebar',
  standalone: true,
  imports: [PanelMenuModule, CommonModule],
  templateUrl: './orb-sidebar.component.html',
  styleUrls: ['./orb-sidebar.component.scss']
})
export class OrbSidebarComponent implements OnInit {
  items: MenuItem[] = [];
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Suscribirse a los permisos del usuario para actualizar el menú dinámicamente
    combineLatest([
      this.authStore.canManageUsers$,
      this.authStore.canManageClients$,
      this.authStore.canManageProducts$,
      this.authStore.canManageAgenda$
    ]).pipe(
      map(([canManageUsers, canManageClients, canManageProducts, canManageAgenda]) => {
        const managementItems: MenuItem[] = [];
        
        if (canManageProducts) {
          managementItems.push({
            label: 'Productos',
            icon: 'fas fa-box-open',
            command: () => this.router.navigate(['/management/product'])
          });
        }
        
        if (canManageClients) {
          managementItems.push({
            label: 'Clientes',
            icon: 'fas fa-user-friends',
            command: () => this.router.navigate(['/management/client'])
          });
        }
        
        if (canManageUsers) {
          managementItems.push({
            label: 'Usuarios',
            icon: 'fas fa-users-cog',
            command: () => this.router.navigate(['/management/users'])
          });
        }

        return this.buildMenuItems(managementItems, canManageAgenda);
      })
    ).subscribe(items => {
      this.items = items;
    });
  }

  private buildMenuItems(managementItems: MenuItem[], canManageAgenda: boolean): MenuItem[] {
    const menuItems: MenuItem[] = [
      {
        label: 'Panel',
        icon: 'fas fa-tachometer-alt',
        command: () => this.router.navigate(['/dashboard'])
      }
    ];

    // Agenda section - only show if user can manage agenda
    if (canManageAgenda) {
      menuItems.push({
        label: 'Agenda',
        icon: 'fas fa-calendar-alt',
        items: [
          {
            label: 'Calendario',
            icon: 'fas fa-calendar-check',
            routerLink: ['/agenda']
          },
          {
            label: 'Crear cita',
            icon: 'fas fa-calendar-plus',
            routerLink: ['/agenda/schedule']
          },
        ]
      });
    }

    // Stock section (always visible for now)
    menuItems.push({
      label: 'Stock',
      icon: 'fas fa-warehouse',
      items: [
        {
          label: 'Entradas',
          icon: 'fas fa-arrow-down',
          command: () => this.router.navigate(['/stock/in'])
        },
        {
          label: 'Salidas',
          icon: 'fas fa-arrow-up',
          command: () => this.router.navigate(['/stock/out'])
        }
      ]
    });

    // Management section - only show if user has management permissions
    if (managementItems.length > 0) {
      menuItems.push({
        label: 'Gestión',
        icon: 'fas fa-cogs',
        items: managementItems
      });
    }

    // Profile section (always visible)
    menuItems.push({
      label: 'Perfil',
      icon: 'fas fa-user-circle',
      command: () => this.router.navigate(['/profile'])
    });

    return menuItems;
  }

  logout(): void {
    this.authStore.performLogout();
  }
}
