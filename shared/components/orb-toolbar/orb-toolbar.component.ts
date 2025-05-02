import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'orb-toolbar',
  standalone: true,
  imports: [CommonModule, ToolbarModule],
  templateUrl: './orb-toolbar.component.html',
})
export class OrbToolbarComponent {}
