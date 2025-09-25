import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'orb-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
    >
      <i *ngIf="loading" class="fa fa-spinner fa-spin mr-2"></i>
      <i *ngIf="icon && !loading" [class]="'fa fa-' + icon + (iconPosition === 'left' ? ' mr-2' : ' ml-2')"
         [ngClass]="{'order-last': iconPosition === 'right'}"></i>
      <span *ngIf="!iconOnly" [ngClass]="{'sr-only': loading}">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrbButtonComponent {
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

  @Output() click = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = [
      'orb-btn',
      `orb-btn--${this.variant}`,
      `orb-btn--${this.size}`,
    ];

    if (this.block) classes.push('orb-btn--block');
    if (this.rounded) classes.push('orb-btn--rounded');
    if (this.iconOnly) classes.push('orb-btn--icon-only');
    if (this.disabled) classes.push('orb-btn--disabled');
    if (this.loading) classes.push('orb-btn--loading');

    return classes.join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.click.emit(event);
    }
  }
}