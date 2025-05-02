import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'orb-divider',
  standalone: true,
  imports: [CommonModule, DividerModule],
  template: `<p-divider [type]="type" [layout]="layout"></p-divider>`,
})
export class OrbDividerComponent {
  @Input() type: 'solid' | 'dashed' = 'solid';
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
}
