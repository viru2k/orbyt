import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { Accordion, AccordionTab } from 'primeng/accordion';

@Component({
  selector: 'orb-accordion',
  standalone: true,
  imports: [CommonModule, AccordionModule],
  templateUrl: './orb-accordion.component.html',
  styleUrls: ['./orb-accordion.component.scss']
})
export class OrbAccordionComponent {
  @Input() multiple: boolean = false;
}
