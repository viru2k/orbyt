import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { ServiceCategoryResponseDto } from '../../../api/models/service-category-response-dto';
import { CreateServiceDto } from '../../../api/models/create-service-dto';
import { UpdateServiceDto } from '../../../api/models/update-service-dto';
import { ServicesStore } from '@orb-stores';
import { ServiceCategoriesService } from '../../../api/services/service-categories.service';
import { FormButtonAction } from '@orb-models';
import { UtilsService, NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
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
          <orb-select
            formControlName="serviceCategoryId"
            [options]="categoryOptions()"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccione una categoría">
          </orb-select>
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
  readonly servicesStore = inject(ServicesStore);
  private serviceCategoriesService = inject(ServiceCategoriesService);
  public utilsService = inject(UtilsService);
  private notificationService = inject(NotificationService);

  form!: FormGroup;
  isEditMode = false;
  categoryOptions = signal<ServiceCategoryResponseDto[]>([]);

  statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', severity: 'secondary', styleType: 'text' },
    { label: 'Guardar', action: 'save', severity: 'success', buttonType: 'submit', outlined: true },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.serviceCategoriesService.serviceCategoryControllerFindAll().subscribe({
      next: (categories) => {
        this.categoryOptions.set(categories);
      },
      error: (error) => {
        console.error('Error loading service categories:', error);
        this.notificationService.show(
          NotificationSeverity.Error,
          'Error al cargar las categorías de servicios'
        );
      }
    });
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
      serviceCategoryId: [null],
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
      
      const priceValue = this.service.basePrice || 0.01;
        
      const formData = {
        name: this.service.name || '',
        description: this.service.description || '',
        serviceCategoryId: (this.service as any).serviceCategoryId || null,
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
          serviceCategoryId: null,
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
        const updateData = {
          name: formData.name,
          description: formData.description,
          serviceCategoryId: formData.serviceCategoryId,
          basePrice: basePrice,
          duration: formData.duration,
          status: formData.status,
          notes: formData.notes
        };        
        this.updateService(updateData);
      } else {
        const createData = {
          name: formData.name,
          description: formData.description,
          serviceCategoryId: formData.serviceCategoryId,
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

  private createService(serviceData: any): void {
    const createDto: CreateServiceDto = {
      name: serviceData.name,
      description: serviceData.description || undefined,
      basePrice: serviceData.basePrice,
      serviceCategoryId: serviceData.serviceCategoryId || undefined,
      duration: serviceData.duration || undefined,
      notes: serviceData.notes || undefined
    };

    this.servicesStore.create(createDto);
    this.notificationService.show(
      NotificationSeverity.Success,
      `Servicio "${serviceData.name}" creado exitosamente`
    );
    this.saved.emit();
  }

  private updateService(serviceData: any): void {
    if (!this.service?.id) return;

    const updateDto: UpdateServiceDto = {
      name: serviceData.name,
      description: serviceData.description || undefined,
      basePrice: serviceData.basePrice,
      duration: serviceData.duration || undefined,
      notes: serviceData.notes || undefined
    };

    this.servicesStore.update({ id: this.service.id, serviceDto: updateDto });
    this.notificationService.show(
      NotificationSeverity.Success,
      `Servicio "${serviceData.name}" actualizado exitosamente`
    );
    this.saved.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}