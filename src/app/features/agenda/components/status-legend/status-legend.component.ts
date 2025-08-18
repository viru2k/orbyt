import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-legend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-legend">
      <h4>Leyenda de Estados</h4>
      <ul>
        <li *ngFor="let item of statusColors | keyvalue">
          <span class="color-box" [style.backgroundColor]="getPrimaryColor(item.value)"></span>
          <span>{{ item.key }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .status-legend {
      padding: 1rem;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .color-box {
      width: 1rem;
      height: 1rem;
      margin-right: 0.5rem;
      border-radius: 3px;
    }
  `]
})
export class StatusLegendComponent {
  @Input() statusColors: any;

  getPrimaryColor(color: any): string {
    return color.primary;
  }
}
