import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-landing-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenubarModule
  ],
  template: `
    <header class="landing-header">
      <div class="container">
        <nav class="navbar">
          <!-- Logo -->
          <div class="navbar-brand">
            <a routerLink="/" class="brand-link">
              <img src="/assets/images/orbyt-logo.svg" alt="Orbyt" class="logo">
              <span class="brand-text">Orbyt</span>
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="navbar-nav d-none d-lg-flex">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
              Inicio
            </a>
            <a routerLink="/funcionalidades" routerLinkActive="active" class="nav-link">
              Funcionalidades
            </a>
            <a routerLink="/precios" routerLinkActive="active" class="nav-link">
              Precios
            </a>
            <a routerLink="/demo" routerLinkActive="active" class="nav-link">
              Demo
            </a>
            <div class="nav-dropdown">
              <span class="nav-link dropdown-toggle" (click)="toggleResourcesDropdown()">
                Recursos
                <i class="pi pi-angle-down ml-1"></i>
              </span>
              <div class="dropdown-menu" [class.show]="showResourcesDropdown()">
                <a routerLink="/recursos/blog" class="dropdown-item">Blog</a>
                <a routerLink="/recursos/casos-exito" class="dropdown-item">Casos de Éxito</a>
                <a routerLink="/recursos/webinars" class="dropdown-item">Webinars</a>
                <a routerLink="/recursos/guias" class="dropdown-item">Guías</a>
              </div>
            </div>
            <a routerLink="/contacto" routerLinkActive="active" class="nav-link">
              Contacto
            </a>
          </div>

          <!-- Action Buttons -->
          <div class="navbar-actions d-none d-md-flex">
            <a routerLink="/auth/login" class="btn btn-outline">
              Iniciar Sesión
            </a>
            <a routerLink="/auth/registro" class="btn btn-primary">
              Prueba Gratis
            </a>
          </div>

          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-toggle d-lg-none" (click)="toggleMobileMenu()">
            <i class="pi pi-bars" *ngIf="!showMobileMenu()"></i>
            <i class="pi pi-times" *ngIf="showMobileMenu()"></i>
          </button>
        </nav>

        <!-- Mobile Navigation -->
        <div class="mobile-nav" [class.show]="showMobileMenu()">
          <div class="mobile-nav-content">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" 
               class="mobile-nav-link" (click)="closeMobileMenu()">
              Inicio
            </a>
            <a routerLink="/funcionalidades" routerLinkActive="active" 
               class="mobile-nav-link" (click)="closeMobileMenu()">
              Funcionalidades
            </a>
            <a routerLink="/precios" routerLinkActive="active" 
               class="mobile-nav-link" (click)="closeMobileMenu()">
              Precios
            </a>
            <a routerLink="/demo" routerLinkActive="active" 
               class="mobile-nav-link" (click)="closeMobileMenu()">
              Demo
            </a>
            
            <div class="mobile-nav-section">
              <span class="mobile-nav-title">Recursos</span>
              <a routerLink="/recursos/blog" class="mobile-nav-sublink" (click)="closeMobileMenu()">Blog</a>
              <a routerLink="/recursos/casos-exito" class="mobile-nav-sublink" (click)="closeMobileMenu()">Casos de Éxito</a>
              <a routerLink="/recursos/webinars" class="mobile-nav-sublink" (click)="closeMobileMenu()">Webinars</a>
              <a routerLink="/recursos/guias" class="mobile-nav-sublink" (click)="closeMobileMenu()">Guías</a>
            </div>
            
            <a routerLink="/contacto" routerLinkActive="active" 
               class="mobile-nav-link" (click)="closeMobileMenu()">
              Contacto
            </a>

            <div class="mobile-nav-actions">
              <a routerLink="/auth/login" class="btn btn-outline btn-block" (click)="closeMobileMenu()">
                Iniciar Sesión
              </a>
              <a routerLink="/auth/registro" class="btn btn-primary btn-block" (click)="closeMobileMenu()">
                Prueba Gratis 14 Días
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./landing-header.component.scss']
})
export class LandingHeaderComponent implements OnInit {
  
  // Signals for reactive state management
  showMobileMenu = signal(false);
  showResourcesDropdown = signal(false);

  ngOnInit(): void {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-dropdown')) {
        this.showResourcesDropdown.set(false);
      }
      if (!target.closest('.mobile-menu-toggle') && !target.closest('.mobile-nav')) {
        this.showMobileMenu.set(false);
      }
    });
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.set(!this.showMobileMenu());
    // Close resources dropdown when mobile menu toggles
    this.showResourcesDropdown.set(false);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  toggleResourcesDropdown(): void {
    this.showResourcesDropdown.set(!this.showResourcesDropdown());
  }
}