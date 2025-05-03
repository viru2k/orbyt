import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'orb-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './orb-text-input.component.html',
  styleUrls: ['./orb-text-input.component.scss'],
})
export class OrbTextInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() model: string = '';
}
