import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { OrbButtonComponent } from '../orb-button/orb-button.component';
import { OrbActionItem } from '@orb-models';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'orb-actions-popover',
  standalone: true,
  imports: [
    CommonModule,
    PopoverModule,
    TooltipModule,
    ButtonModule
  ],
  templateUrl: './orb-actions-popover.component.html',
    styleUrls: ['./orb-actions-popover.component.scss']
})
export class OrbActionsPopoverComponent<T> {
  /**
   * La lista de acciones a mostrar dentro del popover.
   */
  @Input() actions: OrbActionItem<T>[] = [];

  /**
   * El objeto de datos de la fila actual (ej. el 'client').
   * Se pasará a la función `action` de cada OrbActionItem.
   */
  @Input() itemData!: T;
}
