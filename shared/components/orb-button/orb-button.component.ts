import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonSeverity, ButtonStyleType } from '@orb-models';

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
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() severity: ButtonSeverity = 'primary';
   @Input()  styleType?: ButtonStyleType | 'text';
   @Input() loading= false;

}
