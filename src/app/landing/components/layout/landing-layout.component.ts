import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LandingHeaderComponent } from './landing-header.component';
import { LandingFooterComponent } from './landing-footer.component';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LandingHeaderComponent,
    LandingFooterComponent
  ],
  template: `
    <div class="landing-layout">
      <app-landing-header></app-landing-header>
      
      <main class="landing-main">
        <router-outlet></router-outlet>
      </main>
      
      <app-landing-footer></app-landing-footer>
    </div>
  `,
  styleUrls: ['./landing-layout.component.scss']
})
export class LandingLayoutComponent {}