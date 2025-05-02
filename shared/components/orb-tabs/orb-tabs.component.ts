import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'orb-tabs',
  standalone: true,
  imports: [CommonModule, TabViewModule],
  templateUrl: './orb-tabs.component.html'
})
export class OrbTabsComponent {
  @Input() value: number = 0;
}
