import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'orb-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="orb-tag" 
      [class]="getTagClasses()"
      [style.background]="backgroundColor || undefined"
      [style.color]="textColor || undefined">
      <i *ngIf="icon" [class]="icon" class="orb-tag-icon"></i>
      {{ value }}
    </span>
  `,
  styleUrls: ['./orb-tag.component.scss']
})
export class OrbTagComponent {
  @Input() value: string = '';
  @Input() severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' = 'info';
  @Input() icon?: string;
  @Input() backgroundColor?: string;
  @Input() textColor?: string;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() outlined: boolean = false;

  getTagClasses(): string {
    let classes = `orb-tag--${this.severity}`;
    if (this.size !== 'normal') {
      classes += ` orb-tag--${this.size}`;
    }
    if (this.outlined) {
      classes += ` orb-tag--outlined`;
    }
    return classes;
  }
}