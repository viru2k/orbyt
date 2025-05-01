import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'orb-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-label.component.html',
})
export class OrbLabelComponent {
  @Input() text: string = '';
}
