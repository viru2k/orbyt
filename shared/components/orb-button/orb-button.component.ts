
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonSeverity, ButtonStyleType } from '@orb-models';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'normal' | 'large';

@Component({
  selector: 'orb-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './orb-button.component.html',
  styleUrls: ['./orb-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrbButtonComponent {
  // New API (Alpino design)
  @Input() variant: ButtonStyleType = 'outlined';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() block: boolean = false;
  @Input() rounded: boolean = false;
  @Input() icon: string = '';
  @Input() iconOnly: boolean = false;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() outlined: boolean = false;

  // Legacy API (backward compatibility)
  @Input() label: string = '';
  @Input() severity: ButtonSeverity = undefined;
  @Input() styleType?: ButtonStyleType | 'text';

  @Output() clicked = new EventEmitter<Event>();
  @Output() click = new EventEmitter<Event>();

  

  getPrimeSize(): 'small' | 'large' | undefined {
    const size = this.getSize();
    switch (size) {
      case 'xs':
      case 'sm':
      case 'small': return 'small';
      case 'lg':
      case 'xl':
      case 'large': return 'large';
      default: return undefined;
    }
  }

  /**
   * Get icon class for Font Awesome icons
   * @deprecated PrimeIcons support is deprecated. Use Font Awesome icons only.
   * @example
   * // Correct usage with Font Awesome:
   * icon="fa-plus"        // Returns: "fa fa-plus"
   * icon="fas fa-plus"    // Returns: "fas fa-plus"
   * icon="plus"           // Returns: "fa fa-plus"
   */
  getIconClass(): string {
    if (!this.icon || this.icon.trim() === '') return '';

    // Support Font Awesome with explicit prefix (fas, far, fal, fab)
    if (this.icon.startsWith('fas ') || this.icon.startsWith('far ') ||
        this.icon.startsWith('fal ') || this.icon.startsWith('fab ')) {
      return this.icon;
    }

    // Support Font Awesome with fa- prefix
    if (this.icon.startsWith('fa-')) {
      return `fas ${this.icon}`;
    }

    // DEPRECATED: PrimeIcons support (will be removed in future versions)
    if (this.icon.startsWith('pi-')) {
      console.warn(`[orb-button] PrimeIcons (${this.icon}) are deprecated. Please use Font Awesome icons instead.`);
      return `pi ${this.icon}`;
    }

    // Default to Font Awesome solid
    return `fas fa-${this.icon}`;
  }

  getCustomClasses(): string {
    const classes = [];

    if (this.block) classes.push('orb-btn--block');
    if (this.rounded) classes.push('orb-btn--rounded');
    if (this.iconOnly) classes.push('orb-btn--icon-only');

    return classes.join(' ');
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
