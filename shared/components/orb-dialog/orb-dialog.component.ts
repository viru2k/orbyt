// src/app/shared/components/orb-dialog/orb-dialog.component.ts

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog'; // Módulo de p-dialog

// Importa tu tipo si lo creaste, o defínelo aquí
export type OrbDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

@Component({
  selector: 'orb-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './orb-dialog.component.html',
  styleUrls: ['./orb-dialog.component.scss'],
})
export class OrbDialogComponent implements OnChanges {
  // --- Entradas Principales ---
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header?: string;
  @Input() size: OrbDialogSize = 'md'; // Tamaño por defecto: mediano
  @Input() customWidth: string = '600px'; // Ancho personalizado si size = 'custom'

  // --- Entradas Passthrough para p-dialog (con valores por defecto comunes) ---
  @Input() modal: boolean = true; // p-dialog default: false, pero para un wrapper es común que sea true
  @Input() closable: boolean = true; // p-dialog default: true
  @Input() draggable: boolean = true; // p-dialog default: true
  @Input() resizable: boolean = false; // p-dialog default: true, pero para formularios fijos es común false
  @Input() dismissableMask: boolean = false; // p-dialog default: false. Si es modal, a veces se quiere true.
  @Input() closeOnEscape: boolean = true; // p-dialog default: true
  @Input() blockScroll: boolean = false; // p-dialog default: false
  @Input() position: "center" | "top" | "bottom" | "left" | "right" | "topleft" | "topright" | "bottomleft" | "bottomright" = "center";
  @Input() maximizable: boolean = false; // p-dialog default: false

  // --- Salidas Passthrough para p-dialog ---
  @Output() onShow = new EventEmitter<any>();
  @Output() onHide = new EventEmitter<any>(); // Útil para resetear estados en el padre
  @Output() onMaximize = new EventEmitter<any>();

  // Propiedad interna para el estilo del diálogo
  dialogStyle: { [key: string]: string } = {};

  constructor() {
    this._calculateDialogStyle(); // Calcular estilo inicial
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recalcular el estilo si 'size' o 'customWidth' cambian
    if (changes['size'] || changes['customWidth']) {
      this._calculateDialogStyle();
    }
  }

  private _calculateDialogStyle(): void {
    let widthToApply: string;
    switch (this.size) {
      case 'sm':
        widthToApply = '400px';
        break;
      case 'md':
        widthToApply = '600px';
        break;
      case 'lg':
        widthToApply = '800px';
        break;
      case 'xl':
        widthToApply = '1200px';
        break;
      case 'custom':
        widthToApply = this.customWidth;
        break;
      default: // Por si acaso, o si size no es válido
        widthToApply = '600px'; // Default a 'md'
    }
    this.dialogStyle = { width: widthToApply };
  }

  // Método para propagar el cambio de visibilidad desde p-dialog al padre
  onInternalVisibleChange(isVisible: boolean): void {
    this.visible = isVisible; // Sincronizar estado interno (aunque [(visible)] ya lo hace)
    this.visibleChange.emit(isVisible);
  }

  // Método para propagar el evento onHide y asegurar que visibleChange también se emita
  onInternalHide(event?: any): void {

    if (this.visible) {
      this.visible = false;
      this.visibleChange.emit(false);
    }
    this.onHide.emit(event);
  }

  // Propagar otros eventos
  onInternalShow(event: any): void {
    this.onShow.emit(event);
  }

  onInternalMaximize(event: any): void {
    this.onMaximize.emit(event);
  }
}