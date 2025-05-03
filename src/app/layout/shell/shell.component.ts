import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrbSidebarComponent, OrbTopbarComponent } from '@orb-components';
import { ViewportService } from '@orb-services';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    OrbSidebarComponent,
    OrbTopbarComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
    private viewport = inject(ViewportService);
    isMobile = this.viewport.isMobile;
  }
