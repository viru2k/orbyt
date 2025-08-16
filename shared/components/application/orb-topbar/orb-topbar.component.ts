import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@orb-stores';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { OrbThemeToggleComponent } from '../orb-theme-toggle/orb-theme-toggle.component';

@Component({
  selector: 'orb-topbar',
  standalone: true,
    imports: [PanelMenuModule, OrbThemeToggleComponent],
  templateUrl: './orb-topbar.component.html',
  styleUrls: ['./orb-topbar.component.scss']
})
export class OrbTopbarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  
    userInitials = this.authStore.userInitials$ ;
  items: MenuItem[] = [
    {
      label: 'Panel',
      icon: 'pi pi-fw pi-home',
      command: () => this.router.navigate(['/home'])
    },
    // ---------- Agenda ----------
    {
      label: 'Agenda',
      icon: 'pi pi-fw pi-calendar',
      items: [
        {
          label: 'Calendario',
          icon: 'pi pi-fw pi-calendar-plus',
          command: () => this.router.navigate(['/agenda'])
        },
        {
          label: 'Crear cita',
          icon: 'pi pi-fw pi-user-plus',
          command: () => this.router.navigate(['/agenda/create'])
        }
      ]
    },
    // ---------- Stock ----------
    {
      label: 'Stock',
      icon: 'pi pi-fw pi-box',
      items: [
        {
          label: 'Productos',
          icon: 'pi pi-fw pi-list',
          command: () => this.router.navigate(['/stock/products'])
        },
        {
          label: 'Entradas',
          icon: 'pi pi-fw pi-arrow-down',
          command: () => this.router.navigate(['/stock/in'])
        },
        {
          label: 'Salidas',
          icon: 'pi pi-fw pi-arrow-up',
          command: () => this.router.navigate(['/stock/out'])
        }
      ]
    },
    // ---------- Usuarios ----------
    {
      label: 'Usuarios',
      icon: 'pi pi-fw pi-users',
      items: [
        {
          label: 'Lista',
          icon: 'pi pi-fw pi-list',
          command: () => this.router.navigate(['/users'])
        },
        {
          label: 'Nuevo usuario',
          icon: 'pi pi-fw pi-user-plus',
          command: () => this.router.navigate(['/users/create'])
        }
      ]
    },
    // ---------- Perfil ----------
    {
      label: 'Perfil',
      icon: 'pi pi-fw pi-user',
      command: () => this.router.navigate(['/profile'])
    }
  ];
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authStore.performLogout();
    // No necesario navegar aquí, el effect ya lo hace
  }


  


}
