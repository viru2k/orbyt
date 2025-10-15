import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@orb-stores';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { OrbThemeToggleComponent } from '../orb-theme-toggle/orb-theme-toggle.component';
import { OrbLanguageSelectorComponent } from '../../orb-language-selector/orb-language-selector.component';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'orb-topbar',
  standalone: true,
  imports: [
    CommonModule,
    MenuModule,
    OrbThemeToggleComponent,
    OrbLanguageSelectorComponent
  ],
  templateUrl: './orb-topbar.component.html',
  styleUrls: ['./orb-topbar.component.scss']
})
export class OrbTopbarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  items: MenuItem[] = [];
  isMenuOpen = false;
  expandedItems: Set<MenuItem> = new Set();

  ngOnInit(): void {
    // Build menu with permissions
    combineLatest([
      this.authStore.canManageUsers$,
      this.authStore.canManageClients$,
      this.authStore.canManageProducts$,
      this.authStore.canManageServices$,
      this.authStore.canManageAgenda$
    ]).pipe(
      map(([canManageUsers, canManageClients, canManageProducts, canManageServices, canManageAgenda]) => {
        const managementItems: MenuItem[] = [];

        if (canManageProducts) {
          managementItems.push({
            label: 'Productos',
            icon: 'fas fa-box-open',
            command: () => { this.router.navigate(['/management/product']); this.toggleMenu(); }
          });
        }

        if (canManageServices) {
          managementItems.push({
            label: 'Servicios',
            icon: 'fas fa-cog',
            command: () => { this.router.navigate(['/management/services']); this.toggleMenu(); }
          });
        }

        if (canManageClients) {
          managementItems.push({
            label: 'Clientes',
            icon: 'fas fa-user-friends',
            command: () => { this.router.navigate(['/management/client']); this.toggleMenu(); }
          });
        }

        if (canManageUsers) {
          managementItems.push({
            label: 'Usuarios',
            icon: 'fas fa-users-cog',
            command: () => { this.router.navigate(['/management/users']); this.toggleMenu(); }
          });

          managementItems.push({
            label: 'Salas',
            icon: 'fas fa-door-open',
            command: () => { this.router.navigate(['/management/rooms']); this.toggleMenu(); }
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
        command: () => { this.router.navigate(['/dashboard']); this.toggleMenu(); }
      }
    ];

    if (canManageAgenda) {
      menuItems.push({
        label: 'Agenda',
        icon: 'fas fa-calendar-alt',
        command: () => { this.router.navigate(['/agenda']); this.toggleMenu(); }
      });
    }

    menuItems.push({
      label: 'Consultas',
      icon: 'fas fa-stethoscope',
      command: () => { this.router.navigate(['/consultations']); this.toggleMenu(); }
    });

    menuItems.push({
      label: 'Facturación',
      icon: 'fas fa-file-invoice-dollar',
      command: () => { this.router.navigate(['/invoices']); this.toggleMenu(); }
    });

    menuItems.push({
      label: 'Recompensas',
      icon: 'fas fa-gift',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-line',
          command: () => { this.router.navigate(['/rewards/dashboard']); this.toggleMenu(); }
        },
        {
          label: 'Gestión de Programas',
          icon: 'fas fa-cog',
          command: () => { this.router.navigate(['/rewards/management']); this.toggleMenu(); }
        },
        {
          label: 'Vista del Cliente',
          icon: 'fas fa-user-star',
          command: () => { this.router.navigate(['/rewards/client-view']); this.toggleMenu(); }
        }
      ]
    });

    menuItems.push({
      label: 'Emails',
      icon: 'fas fa-envelope',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-bar',
          command: () => { this.router.navigate(['/email/dashboard']); this.toggleMenu(); }
        },
        {
          label: 'Configuración',
          icon: 'fas fa-cog',
          command: () => { this.router.navigate(['/email/settings']); this.toggleMenu(); }
        },
        {
          label: 'Probar Email',
          icon: 'fas fa-paper-plane',
          command: () => { this.router.navigate(['/email/test']); this.toggleMenu(); }
        }
      ]
    });

    menuItems.push({
      label: 'Inventario',
      icon: 'fas fa-warehouse',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-pie',
          command: () => { this.router.navigate(['/inventory/dashboard']); this.toggleMenu(); }
        },
        {
          label: 'Movimientos',
          icon: 'fas fa-exchange-alt',
          command: () => { this.router.navigate(['/inventory/movements']); this.toggleMenu(); }
        },
        {
          label: 'Productos',
          icon: 'fas fa-box',
          command: () => { this.router.navigate(['/inventory/products']); this.toggleMenu(); }
        }
      ]
    });

    if (managementItems.length > 0) {
      menuItems.push({
        label: 'Gestión',
        icon: 'fas fa-cogs',
        items: managementItems
      });
    }

    menuItems.push({
      label: 'Perfil',
      icon: 'fas fa-user-circle',
      command: () => { this.router.navigate(['/profile']); this.toggleMenu(); }
    });

    return menuItems;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.expandedItems.clear();
    }
  }

  isItemExpanded(item: MenuItem): boolean {
    return this.expandedItems.has(item);
  }

  onMenuItemClick(event: Event, item: MenuItem): void {
    event.preventDefault();
    event.stopPropagation();

    // Toggle expansion if has subitems
    if (item.items && item.items.length > 0) {
      if (this.expandedItems.has(item)) {
        this.expandedItems.delete(item);
      } else {
        this.expandedItems.add(item);
      }
    } else if (item.command) {
      // Execute command if no subitems
      item.command({ originalEvent: event, item });
    }
  }

  onSubMenuItemClick(event: Event, item: MenuItem): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.command) {
      item.command({ originalEvent: event, item });
    }
  }

  logout() {
    this.authStore.performLogout();
    this.isMenuOpen = false;
  }
}
