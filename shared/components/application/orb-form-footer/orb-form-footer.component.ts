// src/app/shared/components/orb-form-footer/orb-form-footer.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbButtonComponent } from '../../orb-button/orb-button.component'; // Asumiendo que orb-button está en esta ruta
import { TooltipModule } from 'primeng/tooltip'; // Si usas tooltips
import { FooterAlignment, FormButtonAction } from '@orb-models';

// Importa las interfaces definidas arriba si están en un archivo separado
// import { FormButtonAction, FooterAlignment, ButtonSeverity, ButtonStyleType, ButtonType } from '@orb-types';
// Si no, puedes definirlas aquí mismo para el componente. Por simplicidad, las redefiniré aquí:




@Component({
  selector: 'orb-form-footer',
  standalone: true,
  imports: [CommonModule, OrbButtonComponent, TooltipModule],
  templateUrl: './orb-form-footer.component.html',
  styleUrls: ['./orb-form-footer.component.scss']
})
export class OrbFormFooterComponent {
  /**
   * Array de objetos FormButtonAction que definen los botones a mostrar.
   */
  @Input() buttons: FormButtonAction[] = [];

  /**
   * Alineamiento de los botones en el footer.
   * 'left' -> justify-content-start
   * 'center' -> justify-content-center
   * 'right' -> justify-content-end (por defecto)
   */
  @Input() alignment: FooterAlignment = 'right';

  /**
   * Emite el string 'action' del FormButtonAction cuando se hace clic en un botón.
   */
  @Output() actionClicked = new EventEmitter<string>();

  get alignmentClass(): string {
    switch (this.alignment) {
      case 'left':
        return 'orb-form-footer-actions justify-content-start';
      case 'center':
        return 'orb-form-footer-actions justify-content-center';
      case 'right':
      default:
        return 'orb-form-footer-actions justify-content-end';
    }
  }

  onButtonClick(action: string): void {
    this.actionClicked.emit(action);
  }
}