import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'orb-sidebar',
  standalone: true,
  imports: [PanelMenuModule],
  templateUrl: './orb-sidebar.component.html',
  styleUrls: ['./orb-sidebar.component.scss']
})
export class OrbSidebarComponent {
  items: MenuItem[];

  constructor(private router: Router) {
    this.items = [
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
          { label: 'Calendario',      icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/agenda'] },
          {    label: 'Crear cita',
            icon: 'pi pi-fw pi-user-plus', routerLink: ['/agenda/scheldule'] }, 
          // ... otros items de gestión
        ]
      },
      // ---------- Stock ----------
      {
        label: 'Stock',
        icon: 'pi pi-fw pi-box',
        items: [
         
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

       {
        label: 'Gestión',
        items: [
          { label: 'Productos', icon: 'pi pi-hammer', routerLink: ['/stock/products'] },
          { label: 'Clientes', icon: 'pi pi-users', routerLink: ['/client/list'] }, 
          // ... otros items de gestión
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
  }
}
