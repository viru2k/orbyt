import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { HeroSectionComponent } from '../../components/sections/hero-section.component';
import { SocialProofComponent } from '../../components/sections/social-proof.component';
import { FeaturesGridComponent } from '../../components/sections/features-grid.component';
import { HowItWorksComponent } from '../../components/sections/how-it-works.component';
import { TestimonialsComponent } from '../../components/sections/testimonials.component';
import { PricingPreviewComponent } from '../../components/sections/pricing-preview.component';
import { FaqSectionComponent } from '../../components/sections/faq-section.component';
import { CtaSectionComponent } from '../../components/sections/cta-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    SocialProofComponent,
    FeaturesGridComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    PricingPreviewComponent,
    FaqSectionComponent,
    CtaSectionComponent
  ],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <app-hero-section></app-hero-section>
      
      <!-- Social Proof -->
      <app-social-proof></app-social-proof>
      
      <!-- Features Grid -->
      <app-features-grid></app-features-grid>
      
      <!-- How It Works -->
      <app-how-it-works></app-how-it-works>
      
      <!-- Testimonials -->
      <app-testimonials></app-testimonials>
      
      <!-- Pricing Preview -->
      <app-pricing-preview></app-pricing-preview>
      
      <!-- FAQ -->
      <app-faq-section></app-faq-section>
      
      <!-- Final CTA -->
      <app-cta-section></app-cta-section>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  
  ngOnInit(): void {
    // Track page view
    // TODO: Integrate with analytics service
    console.log('Home page viewed');
  }
}