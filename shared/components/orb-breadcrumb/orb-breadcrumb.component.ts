import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'orb-breadcrumb',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  templateUrl: './orb-breadcrumb.component.html',
  styleUrls: ['./orb-breadcrumb.component.scss'],
})
export class OrbBreadcrumbComponent {
  @Input() items: MenuItem[] = [];
  @Input() home: MenuItem | undefined = {
    icon: 'fas fa-home',
    routerLink: '/home'
  };
}