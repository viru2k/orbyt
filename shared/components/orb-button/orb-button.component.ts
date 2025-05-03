import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'orb-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './orb-button.component.html',
  styleUrls: ['./orb-button.component.scss'],
})
export class OrbButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() rounded = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() serverity: 'secondary' | 'success' | 'info'| 'warn'| 'help'| 'danger'| 'contrast'= 'success';
}
