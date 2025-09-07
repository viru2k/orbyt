import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { CreateServiceDto } from '../../../api/models/create-service-dto';
import { UpdateServiceDto } from '../../../api/models/update-service-dto';
import { ServicesService } from '../../../api/services/services.service';
import { FormButtonAction } from '@orb-models';
import { UtilsService, NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent, OrbSimpleTextareaComponent, OrbCardComponent, OrbSelectComponent, OrbInputNumberComponent } from '@orb-components';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'orb-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    DropdownModule,
    InputNumberModule,
    TextareaModule,
    ToastModule,
    OrbFormFooterComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbCurrencyInputComponent,
    OrbSimpleTextareaComponent,
    OrbCardComponent,
    OrbSelectComponent,
    OrbInputNumberComponent
  ],
  template: `
    <orb-card>
      <form [formGroup]="form" (ngSubmit)="onSave()" orbBody>
        
        <!-- Service Name -->
        <orb-form-field 
          label="Nombre del Servicio" 
          [required]="true" 
          description="Nombre identificativo del servicio"
          class="col-12">
          <orb-text-input
            formControlName="name">
          </orb-text-input>
        </orb-form-field>

        <!-- Service Description -->
        <orb-form-field 
          label="Descripción" 
          description="Descripción detallada del servicio"
          class="col-12">
          <orb-simple-textarea
            formControlName="description"
            [rows]="3">
          </orb-simple-textarea>
        </orb-form-field>

        <!-- Category -->
        <orb-form-field 
          label="Categoría del Servicio" 
          description="Categoría o tipo de servicio"
          class="col-12 md:col-6">
          <orb-text-input
            formControlName="category">
          </orb-text-input>
        </orb-form-field>

        <!-- Status -->
        <orb-form-field 
          label="Estado" 
          description="Estado actual del servicio"
          class="col-12 md:col-6">
          <orb-select
            formControlName="status"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value">
          </orb-select>
        </orb-form-field>

        <!-- Base Price -->
        <orb-form-field 
          label="Precio Base" 
          [required]="true" 
          description="Precio base del servicio en euros"
          class="col-12 md:col-6">
          <orb-currency-input
            formControlName="basePrice">
          </orb-currency-input>
        </orb-form-field>

        <!-- Duration -->
        <orb-form-field 
          label="Duración (minutos)" 
          description="Duración estimada en minutos"
          class="col-12 md:col-6">
          <orb-input-number
            formControlName="duration"
            [min]="0"
            [max]="1440"
            suffix=" min">
          </orb-input-number>
        </orb-form-field>

        <!-- Notes -->
        <orb-form-field 
          label="Notas" 
          description="Notas adicionales sobre el servicio"
          class="col-12">
          <orb-simple-textarea
            formControlName="notes"
            [rows]="2">
          </orb-simple-textarea>
        </orb-form-field>

      </form>

      <orb-form-footer 
        [buttons]="footerActions" 
        (actionClicked)="handleFooterAction($event)"
        orbFooter>
      </orb-form-footer>

    </orb-card>
  `,
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnInit, OnChanges {
  @Input() service?: ServiceResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private servicesService = inject(ServicesService);
  public utilsService = inject(UtilsService);
  private notificationService = inject(NotificationService);

  form!: FormGroup;
  isEditMode = false;

  statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text', severity: 'secondary' },
    { label: 'Guardar', action: 'save', styleType: 'p-button-success', buttonType: 'submit', severity: 'info' },
  ];

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['service']) {
      this.isEditMode = !!this.service;
      this.loadServiceData();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: [''],
      basePrice: [0.01, [Validators.required, Validators.min(0.01)]],
      duration: [null],
      status: ['ACTIVE'],
      notes: ['']
    });
  }

  private loadServiceData(): void {
    if (this.isEditMode && this.service) {      
      
      // Ensure the form is initialized before patching
      if (!this.form) {
        this.initForm();
      }
      
      const priceValue = typeof this.service.basePrice === 'string' 
        ? parseFloat(this.service.basePrice as string) 
        : this.service.basePrice || 0.01;
        
      const formData = {
        name: this.service.name || '',
        description: this.service.description || '',
        category: this.service.category || '',
        basePrice: priceValue,
        duration: this.service.duration || null,
        status: this.service.status || 'ACTIVE',
        notes: this.service.notes || ''
      };
            
      this.form.patchValue(formData);
    } else {
      // Reset form for new service
      if (this.form) {
        this.form.reset({
          name: '',
          description: '',
          category: '',
          basePrice: 0.01,
          duration: null,
          status: 'ACTIVE',
          notes: ''
        });
      }
    }
  }

  handleFooterAction(action: string): void {
    switch (action) {
      case 'save':
        this.onSave();
        break;
      case 'cancel':
        this.onCancel();
        break;
    }
  }

  onSave(): void {
    if (this.form.valid) {
      const formData = this.form.value;      
      
      // Ensure basePrice is a number
      const basePrice = typeof formData.basePrice === 'string' 
        ? parseFloat(formData.basePrice) 
        : formData.basePrice;
      
      if (this.isEditMode) {
        const updateData: UpdateServiceDto = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          basePrice: basePrice,
          duration: formData.duration,
          status: formData.status,
          notes: formData.notes
        };        
        this.updateService(updateData);
      } else {
        const createData: CreateServiceDto = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          basePrice: basePrice,
          duration: formData.duration,
          status: formData.status || 'ACTIVE',
          notes: formData.notes
        };        
        this.createService(createData);
      }
    } else {      
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control && control.errors) {          
        }
      });
      
      this.notificationService.show(
        NotificationSeverity.Warn,
        'Por favor, completa todos los campos requeridos'
      );
    }
  }

  private createService(serviceData: CreateServiceDto): void {
    this.servicesService.serviceControllerCreate({ body: serviceData })
      .subscribe({
        next: (service) => {
          this.notificationService.show(
            NotificationSeverity.Success,
            'Servicio creado exitosamente'
          );
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error creating service:', error);
          this.notificationService.show(
            NotificationSeverity.Error,
            'Error al crear el servicio'
          );
        }
      });
  }

  private updateService(serviceData: UpdateServiceDto): void {
    if (!this.service?.id) return;
    
    this.servicesService.serviceControllerUpdate({ 
      id: this.service.id, 
      body: serviceData 
    })
      .subscribe({
        next: (service) => {
          this.notificationService.show(
            NotificationSeverity.Success,
            'Servicio actualizado exitosamente'
          );
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error updating service:', error);
          this.notificationService.show(
            NotificationSeverity.Error,
            'Error al actualizar el servicio'
          );
        }
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}