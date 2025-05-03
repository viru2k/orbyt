import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'orb-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './orb-sidebar.component.html',
  styleUrls: ['./orb-sidebar.component.scss'],
})
export class OrbSidebarComponent {
  navItems = [
    { label: 'Inicio', icon: 'pi pi-home', route: '/home' },
    { label: 'Agenda', icon: 'pi pi-calendar', route: '/agenda' },
    { label: 'Stock', icon: 'pi pi-box', route: '/stock' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/users' }
  ];
}
