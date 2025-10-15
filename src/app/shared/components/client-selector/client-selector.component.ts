import { Component, Input, Output, EventEmitter, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { OrbButtonComponent } from '@orb-components';
import { ClientResponseDto } from '../../../api/models';

@Component({
  selector: 'orb-client-selector',
  standalone: true,
  imports: [CommonModule, AvatarModule, OrbButtonComponent],
  templateUrl: './client-selector.component.html',
  styleUrls: ['./client-selector.component.scss'],
})
export class ClientSelectorComponent {
  @Input() selectedClient: ClientResponseDto | null = null;
  @Input() title: string = '📋 Información del Cliente';
  @Input() showActions: boolean = true;
  @Input() showSearchButton: boolean = true;
  @Input() searchButtonLabel: string = 'Seleccionar Cliente';
  @Input() required: boolean = false;

  @Output() clientChange = new EventEmitter<ClientResponseDto>();
  @Output() clientClear = new EventEmitter<void>();
  @Output() searchClick = new EventEmitter<void>();

  getClientName(): string {
    if (!this.selectedClient) return 'Cliente';
    return this.selectedClient.name || this.selectedClient.fullname || 'Cliente';
  }

  getClientInitial(): string {
    if (!this.selectedClient) return 'C';
    const name = this.selectedClient.name || this.selectedClient.fullname || 'C';
    return name.charAt(0).toUpperCase();
  }

  getPatientAge(birthDate: string | Date): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  onChangeClient(): void {
    this.searchClick.emit();
  }

  onClearClient(): void {
    this.clientClear.emit();
  }

  onSelectClient(): void {
    this.searchClick.emit();
  }
}
