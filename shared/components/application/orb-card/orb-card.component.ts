import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'orb-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-card.component.html',
  styleUrls: ['./orb-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrbCardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() size: CardSize = 'md';
  @Input() padding: CardPadding = 'md';
  @Input() hover: boolean = false;
  @Input() clickable: boolean = false;
  @Input() loading: boolean = false;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() headerIcon: string = '';
  @Input() noDivider: boolean = false;

  get cardClasses(): string {
    const classes = [
      'orb-card',
      `orb-card--${this.variant}`,
      `orb-card--${this.size}`,
      `orb-card--padding-${this.padding}`,
    ];

    if (this.hover) classes.push('orb-card--hover');
    if (this.clickable) classes.push('orb-card--clickable');
    if (this.loading) classes.push('orb-card--loading');
    if (this.noDivider) classes.push('orb-card--no-divider');

    return classes.join(' ');
  }
}
