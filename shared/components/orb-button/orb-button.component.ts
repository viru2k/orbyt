import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'orb-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './orbyt-button.component.html',
  styleUrls: ['./orbyt-button.component.scss'],
})
export class OrbButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
}
