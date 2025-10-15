import { UtilsService } from '@orb-services';
import { Component, EventEmitter, Input, OnInit, AfterViewInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductStore } from '@orb-stores';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from '../../../../api/models';
import { FormButtonAction } from '@orb-models';
import { ImageUploadService } from '../../../../shared/services/image-upload.service';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent, OrbSimpleTextareaComponent, OrbCardComponent, OrbSelectComponent, OrbEntityAvatarComponent } from '@orb-components';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { FileUploadResponseDto } from '../../../../api/models/file-upload-response-dto';
import { AvatarEntity } from '../../../../shared/models/entity-avatar.interfaces';

@Component({
  selector: 'orb-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    OrbFormFooterComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbCurrencyInputComponent,
    OrbSimpleTextareaComponent,
    OrbCardComponent,
    OrbSelectComponent,
    OrbEntityAvatarComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  @Input() product?: ProductResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productStore = inject(ProductStore);
  public utilsService = inject(UtilsService);
  private notificationService = inject(NotificationService);
  private imageUploadService = inject(ImageUploadService);

  form!: FormGroup;
  isEditMode = false;
  currentProductEntity: AvatarEntity | null = null;
  currentAvatar: FileUploadResponseDto | null = null;
  private pendingAvatarUpload: File | null = null;

  statusOptions = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Descatalogado', value: 'descatalogado' },
    { label: 'Agotado', value: 'agotado' },
    { label: 'Suspendido', value: 'suspendido' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', severity: 'secondary', styleType: 'text' },
    { label: 'Guardar', action: 'save', severity: 'success', buttonType: 'submit', outlined: true },
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.product;
    this.initForm();

    if (this.isEditMode && this.product) {
      this.currentProductEntity = { ...this.product } as AvatarEntity;
    } else {
      // Para modo creación, crear una entidad temporal
      this.currentProductEntity = {
        id: 0,
        name: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AvatarEntity;
    }
  }

  ngAfterViewInit(): void {
    // Cargar datos después de que la vista esté completamente inicializada
    if (this.isEditMode && this.product) {
      this.loadProductData();
    }
  }

  private loadProductData(): void {
    if (this.product) {
      console.log('Loading product data:', this.product);

      const priceValue = typeof this.product.currentPrice === 'string'
        ? parseFloat(this.product.currentPrice)
        : this.product.currentPrice || 0.01;

      const formData = {
        name: this.product.name || '',
        description: this.product.description || '',
        price: priceValue,
        status: this.product.status || 'activo',
        avatarUrl: this.product.avatar?.url || ''
      };

      console.log('Patching form with:', formData);
      this.form.patchValue(formData);

      // Forzar detección de cambios
      this.form.markAsPristine();
      this.form.updateValueAndValidity();

      console.log('Form value after patch:', this.form.value);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0.01, [Validators.required, Validators.min(0.01)]],
      status: ['activo', Validators.required],
      avatarUrl: [''], // Campo para almacenar la URL del avatar
    });
  }

  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();    
    
    // Ensure price is properly converted to number
    const price = typeof formValue.price === 'string' ? parseFloat(formValue.price) : formValue.price;    

    if (this.isEditMode && this.product?.id) {
      // --- MODO EDICIÓN ---
      const updateDto: UpdateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: price,
        avatarUrl: formValue.avatarUrl || undefined
      };

      this.productStore.update({ id: this.product.id, dto: updateDto });
    } else {
      // --- MODO CREACIÓN ---
      const createDto: CreateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: price,
        avatarUrl: formValue.avatarUrl || undefined
      };

      this.productStore.create(createDto);
    }

    // Esperar un poco antes de cerrar para que la operación se procese
    setTimeout(() => {
      this.saved.emit();
    }, 500);
  }

  // Manejar el click en el botón de upload (abre el modal)
  onUploadClick(): void {
    console.log('Upload button clicked');
  }

  // Manejar cuando el avatar se actualiza desde el componente
  onAvatarUploaded(result: FileUploadResponseDto): void {
    console.log('Avatar uploaded:', result);
    this.currentAvatar = result;

    // Guardar la URL para incluirla en el DTO
    if (result?.url) {
      this.form.patchValue({ avatarUrl: result.url });

      // En modo edición, actualizar el producto inmediatamente con el avatarUrl
      if (this.isEditMode && this.product?.id) {
        const updateDto: UpdateProductDto = {
          avatarUrl: result.url
        };
        this.productStore.update({ id: this.product.id, dto: updateDto });
      }
    }
  }
}
