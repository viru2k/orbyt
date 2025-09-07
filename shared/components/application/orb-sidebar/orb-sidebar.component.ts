import { Component, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@orb-stores';
import { combineLatest, map } from 'rxjs';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'orb-sidebar',
  standalone: true,
  imports: [PanelMenuModule, CommonModule, OverlayPanelModule],
  templateUrl: './orb-sidebar.component.html',
  styleUrls: ['./orb-sidebar.component.scss']
})
export class OrbSidebarComponent implements OnInit {
  items: MenuItem[] = [];
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  
  // Signal for sidebar collapsed state
  isCollapsed = signal(false);
  
  // Popovers management
  @ViewChild('menuPopover') menuPopover!: OverlayPanel;
  @ViewChild('subMenuPopover') subMenuPopover!: OverlayPanel;
  
  // Current active popover data
  activePopoverItems: MenuItem[] = [];
  activeSubMenuItems: MenuItem[] = [];
  activeParentItem: MenuItem | null = null;

  ngOnInit(): void {
    // Inicializar menú básico inmediatamente
    this.items = this.buildMenuItems([], false);
    
    // Suscribirse a los permisos del usuario para actualizar el menú dinámicamente
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
            command: () => this.router.navigate(['/management/product'])
          });
        }

        if (canManageServices) {
          managementItems.push({
            label: 'Servicios',
            icon: 'fas fa-cog',
            command: () => this.router.navigate(['/management/services'])
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
          
          // Salas - disponible para usuarios con permisos de gestión de usuarios
          managementItems.push({
            label: 'Salas',
            icon: 'fas fa-door-open',
            command: () => this.router.navigate(['/management/rooms'])
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
         routerLink: ['/agenda']      
      });
    }

    // Consultas médicas section
    menuItems.push({
      label: 'Consultas',
      icon: 'fas fa-stethoscope',
      command: () => this.router.navigate(['/consultations'])
    });

    // Facturación section
    menuItems.push({
      label: 'Facturación',
      icon: 'fas fa-file-invoice-dollar',
      command: () => this.router.navigate(['/invoices'])
    });

    // Sistema de Recompensas
    menuItems.push({
      label: 'Recompensas',
      icon: 'fas fa-gift',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-line',
          command: () => this.router.navigate(['/rewards/dashboard'])
        },
        {
          label: 'Gestión de Programas',
          icon: 'fas fa-cog',
          command: () => this.router.navigate(['/rewards/management'])
        },
        {
          label: 'Vista del Cliente',
          icon: 'fas fa-user-star',
          command: () => this.router.navigate(['/rewards/client-view'])
        }
      ]
    });

    // Sistema de Emails
    menuItems.push({
      label: 'Emails',
      icon: 'fas fa-envelope',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-bar',
          command: () => this.router.navigate(['/email/dashboard'])
        },
        {
          label: 'Configuración',
          icon: 'fas fa-cog',
          command: () => this.router.navigate(['/email/settings'])
        },
        {
          label: 'Probar Email',
          icon: 'fas fa-paper-plane',
          command: () => this.router.navigate(['/email/test'])
        }
      ]
    });

    // Inventario section (always visible for now)
    menuItems.push({
      label: 'Inventario',
      icon: 'fas fa-warehouse',
      items: [
        {
          label: 'Dashboard',
          icon: 'fas fa-chart-pie',
          command: () => this.router.navigate(['/inventory/dashboard'])
        },
        {
          label: 'Movimientos',
          icon: 'fas fa-exchange-alt',
          command: () => this.router.navigate(['/inventory/movements'])
        },
        {
          label: 'Productos',
          icon: 'fas fa-box',
          command: () => this.router.navigate(['/inventory/products'])
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

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
    // Cerrar popovers cuando se expande el sidebar
    if (!this.isCollapsed()) {
      this.closeAllPopovers();
    }
  }

  onCollapsedMenuItemClick(event: Event, item: MenuItem): void {
    if (!this.isCollapsed()) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Si el item tiene command y no tiene items (hoja), ejecutar command
    if (item.command && (!item.items || item.items.length === 0)) {
      item.command({ originalEvent: event, item: item });
      this.closeAllPopovers();
      return;
    }
    
    // Si tiene items, mostrar popover
    if (item.items && item.items.length > 0) {
      this.activePopoverItems = item.items;
      this.activeParentItem = item;
      
      // Configurar posicionamiento a la derecha
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      setTimeout(() => {
        this.menuPopover.show(event, target);
        
        // Posicionar manualmente a la derecha
        const popoverEl = document.querySelector('.menu-popover .p-overlaypanel') as HTMLElement;
        if (popoverEl) {
          popoverEl.style.left = `${rect.right + 8}px`;
          popoverEl.style.top = `${rect.top}px`;
          popoverEl.style.transform = 'none';
        }
      }, 0);
    }
  }

  onPopoverItemClick(event: Event, item: MenuItem): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Si el item tiene command y no tiene items (hoja), ejecutar command
    if (item.command && (!item.items || item.items.length === 0)) {
      item.command({ originalEvent: event, item: item });
      this.closeAllPopovers();
      return;
    }
    
    // Si tiene routerLink, navegar
    if (item.routerLink) {
      this.router.navigate(item.routerLink);
      this.closeAllPopovers();
      return;
    }
    
    // Si tiene items, mostrar submenu popover
    if (item.items && item.items.length > 0) {
      this.activeSubMenuItems = item.items;
      this.subMenuPopover.toggle(event);
    }
  }

  closeAllPopovers(): void {
    if (this.menuPopover) {
      this.menuPopover.hide();
    }
    if (this.subMenuPopover) {
      this.subMenuPopover.hide();
    }
    this.activePopoverItems = [];
    this.activeSubMenuItems = [];
    this.activeParentItem = null;
  }

  onSubMenuItemClick(event: Event, item: MenuItem): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Si el item tiene command, ejecutar command
    if (item.command) {
      item.command({ originalEvent: event, item: item });
    }
    
    // Si tiene routerLink, navegar
    if (item.routerLink) {
      this.router.navigate(item.routerLink);
    }
    
    this.closeAllPopovers();
  }
}
