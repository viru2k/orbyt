import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type ContainerPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'orb-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./orb-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrbContainerComponent {
  @Input() size: ContainerSize = 'xl';
  @Input() padding: ContainerPadding = 'md';
  @Input() fluid: boolean = false;
  @Input() centered: boolean = true;

  get containerClasses(): string {
    const classes = ['orb-container'];

    if (this.fluid) {
      classes.push('orb-container--fluid');
    } else {
      classes.push(`orb-container--${this.size}`);
    }

    classes.push(`orb-container--padding-${this.padding}`);

    if (this.centered) {
      classes.push('orb-container--centered');
    }

    return classes.join(' ');
  }
}