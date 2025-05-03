import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
  selector: 'orb-text-input',
  standalone: true,
  imports: [FormsModule, InputTextModule, FloatLabel],
  templateUrl: './orb-text-input.component.html',
  styleUrls: ['./orb-text-input.component.scss'],
})
export class OrbTextInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() model: string = '';
}
