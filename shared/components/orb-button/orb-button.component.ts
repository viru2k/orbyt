import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonSeverity, ButtonStyleType } from '@orb-models';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline' | 'ghost' | 'text';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'normal' | 'large';

@Component({
  selector: 'orb-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-button.component.html',
  styleUrls: ['./orb-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrbButtonComponent {
  // New API (Alpino design)
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() block: boolean = false;
  @Input() rounded: boolean = false;
  @Input() icon: string = '';
  @Input() iconOnly: boolean = false;
  @Input() iconPosition: 'left' | 'right' = 'left';

  // Legacy API (backward compatibility)
  @Input() label: string = '';
  @Input() severity: ButtonSeverity = 'primary';
  @Input() styleType?: ButtonStyleType | 'text';

  @Output() clicked = new EventEmitter<Event>();
  @Output() click = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = [
      'orb-btn',
      `orb-btn--${this.getVariant()}`,
      `orb-btn--${this.getSize()}`,
    ];

    if (this.block) classes.push('orb-btn--block');
    if (this.rounded) classes.push('orb-btn--rounded');
    if (this.iconOnly) classes.push('orb-btn--icon-only');
    if (this.disabled) classes.push('orb-btn--disabled');
    if (this.loading) classes.push('orb-btn--loading');

    return classes.join(' ');
  }

  private getVariant(): ButtonVariant {
    // Map legacy severity to new variant
    if (this.variant !== 'primary') {
      return this.variant;
    }

    switch (this.severity) {
      case 'success': return 'success';
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      case 'help': return 'info';
      case 'secondary': return 'secondary';
      default: return 'primary';
    }
  }

  private getSize(): ButtonSize {
    if (this.size === 'md' || this.size === 'sm' || this.size === 'lg' || this.size === 'xs' || this.size === 'xl') {
      return this.size;
    }

    // Map legacy size to new size
    switch (this.size) {
      case 'small': return 'sm';
      case 'large': return 'lg';
      default: return 'md';
    }
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
      this.click.emit(event);
    }
  }

  // Legacy method for backward compatibility
  onClick(event: Event) {
    this.handleClick(event);
  }
}
