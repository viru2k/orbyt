import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';

@Component({
  selector: 'orb-stepper',
  standalone: true,
  imports: [CommonModule, StepperModule],
  templateUrl: './orb-stepper.component.html',
})
export class OrbStepperComponent {
  @Input() value: number = 0;
}
