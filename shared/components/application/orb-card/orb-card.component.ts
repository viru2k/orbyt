import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'orb-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './orb-card.component.html',
  styleUrls: ['./orb-card.component.scss']
})
export class OrbCardComponent {}
