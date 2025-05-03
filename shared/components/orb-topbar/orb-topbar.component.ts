import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@orb-stores';

@Component({
  selector: 'orb-topbar',
  standalone: true,
  templateUrl: './orb-topbar.component.html',
  styleUrls: ['./orb-topbar.component.scss']
})
export class OrbTopbarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
