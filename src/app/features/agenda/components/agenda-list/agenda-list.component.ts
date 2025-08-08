import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbTableComponent } from '@orb-shared-components/orb-table/orb-table.component';
import { TableColumn, OrbActionItem } from '@orb-models';
import { AppointmentResponseDto } from '../../../../api/model/models';

@Component({
  selector: 'app-agenda-list',
  standalone: true,
  imports: [CommonModule, OrbTableComponent],
  templateUrl: './agenda-list.component.html',
  styleUrls: ['./agenda-list.component.scss'],
})
export class AgendaListComponent {
  @Input() appointments: AppointmentResponseDto[] = [];
  @Input() isLoading = false;
  @Output() edit = new EventEmitter<AppointmentResponseDto>();
  @Output() delete = new EventEmitter<number>();

  columns: TableColumn[] = [
    { field: 'title', header: 'Título' },
    { field: 'notes', header: 'Notas' },
    { field: 'start', header: 'Inicio' },
    { field: 'end', header: 'Fin' },
    { field: 'status', header: 'Estado' },
  ];

  actions: OrbActionItem<AppointmentResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (item?: AppointmentResponseDto) => item && this.edit.emit(item),
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (item?: AppointmentResponseDto) => item && this.delete.emit(parseInt(item.id)),
      styleClass: 'p-button-danger',
    },
  ];
}
