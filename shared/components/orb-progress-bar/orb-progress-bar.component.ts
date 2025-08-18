import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'orb-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orb-progress-bar" [class]="styleClass">
      <div class="orb-progress-bar-track">
        <div 
          class="orb-progress-bar-fill" 
          [style.width.%]="value"
          [style.background]="color || undefined">
        </div>
      </div>
      <div class="orb-progress-bar-label" *ngIf="showValue">
        {{ value }}%
      </div>
    </div>
  `,
  styleUrls: ['./orb-progress-bar.component.scss']
})
export class OrbProgressBarComponent {
  @Input() value: number = 0;
  @Input() showValue: boolean = true;
  @Input() color?: string;
  @Input() styleClass?: string;
}