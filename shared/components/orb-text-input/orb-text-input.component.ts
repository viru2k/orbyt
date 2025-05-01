import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'orb-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './orbyt-text-input.component.html',
  styleUrls: ['./orbyt-text-input.component.scss'],
})
export class OrbTextInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() model: string = '';
}
