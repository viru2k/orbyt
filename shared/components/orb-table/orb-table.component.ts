import { Component, Input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';

export interface OrbColumn {
  /** Propiedad en el objeto de datos  */
  field: string;
  /** Texto que aparece en cabecera  */
  header: string;
  /** ¿Ordenable? (default true) */
  sortable?: boolean;
  /** Ancho opcional p. ej. '120px' */
  width?: string;
}

@Component({
  selector: 'orb-table',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule],
  templateUrl: './orb-table.component.html',
  styleUrls: ['./orb-table.component.scss']
})
export class OrbTableComponent {
  /** Definición de columnas */
  @Input({ required: true }) columns: OrbColumn[] = [];
  /** Array de objetos a mostrar */
  @Input({ required: true }) data: any[] = [];
  /** Paginación opcional */
  @Input() rows = 10;
}
