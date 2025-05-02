import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@Component({
  selector: 'orb-scrollpanel',
  standalone: true,
  imports: [CommonModule, ScrollPanelModule],
  templateUrl: './orb-scrollpanel.component.html',
  
})
export class OrbScrollPanelComponent {
  @Input() style: { [key: string]: string } = { width: '100%', height: '200px' };
}
