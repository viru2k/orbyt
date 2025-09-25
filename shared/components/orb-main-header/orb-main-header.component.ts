import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'orb-main-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orb-main-header">
      <div class="header-content">
        <span class="header-title">
          <i *ngIf="icon" [class]="icon"></i>
          {{ title }}
        </span>
        <p *ngIf="subtitle" class="header-subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./orb-main-header.component.scss']
})
export class OrbMainHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
}