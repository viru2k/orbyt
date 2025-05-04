import { Component } from '@angular/core';
import { OrbCardComponent } from '@orb-components';

@Component({
  selector: 'orb-dashboard',
  imports: [OrbCardComponent],
  standalone: true,
  templateUrl: './orb-dashboard.component.html',
  styleUrls: ['./orb-dashboard.component.scss']
})
export class DashboardComponent {}
