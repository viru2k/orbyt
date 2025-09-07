import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Landing sections
import { HeroSectionComponent } from '../../components/sections/hero-section.component';
import { FeaturesGridComponent } from '../../components/sections/features-grid.component';
import { HowItWorksComponent } from '../../components/sections/how-it-works.component';
import { TestimonialsComponent } from '../../components/sections/testimonials.component';
import { PricingPreviewComponent } from '../../components/sections/pricing-preview.component';
import { FaqSectionComponent } from '../../components/sections/faq-section.component';
import { CtaSectionComponent } from '../../components/sections/cta-section.component';

// Layout
import { LandingLayoutComponent } from '../../components/layout/landing-layout.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LandingLayoutComponent,
    HeroSectionComponent,
    FeaturesGridComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    PricingPreviewComponent,
    FaqSectionComponent,
    CtaSectionComponent
  ],
  template: `
    <app-landing-layout>
      <app-hero-section></app-hero-section>
      <app-features-grid></app-features-grid>
      <app-how-it-works></app-how-it-works>
      <app-testimonials></app-testimonials>
      <app-pricing-preview></app-pricing-preview>
      <app-faq-section></app-faq-section>
      <app-cta-section></app-cta-section>
    </app-landing-layout>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

}