import { UtilsService } from '@orb-services';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductStore } from '@orb-stores';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from '../../../../api/model/models';
import { FormButtonAction } from '@orb-models';
import { ImageUploadService } from '../../../../shared/services/image-upload.service';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent, OrbSimpleTextareaComponent, OrbCardComponent, OrbSelectComponent } from '@orb-components';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';

@Component({
  selector: 'orb-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    TextareaModule,
    ToastModule,
    OrbFormFooterComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbCurrencyInputComponent,
    OrbSimpleTextareaComponent,
    OrbCardComponent,
    OrbSelectComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
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
  private pendingAvatarUpload: File | null = null;

  statusOptions = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text' , severity: 'secondary'},
    { label: 'Guardar', action: 'save', styleType: 'p-button-success' , buttonType: 'submit' ,severity: 'info'},
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.product;
    this.initForm();
    this.loadProductData();
  }

  private loadProductData(): void {
    if (this.isEditMode && this.product) {     
      
      // Usar setTimeout para asegurar que el formulario esté completamente inicializado
      setTimeout(() => {
        const priceValue = typeof this.product!.currentPrice === 'string' 
          ? parseFloat(this.product!.currentPrice) 
          : this.product!.currentPrice || 0.01;
                  
        
        this.form.patchValue({
          name: this.product!.name || '',
          description: this.product!.description || '',
          price: priceValue,
          status: this.product!.status || 'activo',
          avatarUrl: (this.product as any).avatarUrl || ''
        });
                
      }, 0);
      
    }
  }

  private initForm(): void {
    // El formulario incluye el campo avatarUrl
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0.01, [Validators.required, Validators.min(0.01)]],
      status: ['activo', Validators.required],
      avatarUrl: [''],
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
      };

      // Add avatarUrl if provided (extend the DTO)
      if (formValue.avatarUrl) {
        (updateDto as any).avatarUrl = formValue.avatarUrl;
      }            
      
      this.productStore.update({ id: this.product.id, dto: updateDto });
    } else {
      // --- MODO CREACIÓN ---
      const createDto: CreateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: price,
      };

      // Note: Avatar upload after creation will be handled separately when backend provides creation response

      this.productStore.create(createDto);
    }

    // Esperar un poco antes de cerrar para que la operación se procese
    setTimeout(() => {
      this.saved.emit();
    }, 500);
  }

  // Handle file selection for avatar (before upload)
  onAvatarFileSelected(file: File): void {
    if (!this.isEditMode) {
      // In create mode, store the file for later upload
      this.pendingAvatarUpload = file;
    }
    // In edit mode, upload immediately (existing behavior)
  }

  // Upload pending avatar after product creation
  private uploadPendingAvatar(productId: number): void {
    if (this.pendingAvatarUpload) {
      this.imageUploadService.uploadAvatar(
        this.pendingAvatarUpload,
        'product',
        productId,
        { fileType: 'avatar' }
      ).subscribe({
        next: (result) => {
          console.log('Avatar uploaded after product creation:', result);
          this.productStore.load();
          this.pendingAvatarUpload = null;
        },
        error: (error) => {
          console.error('Error uploading avatar after product creation:', error);
          this.notificationService.showError(
            NotificationSeverity.Error,
            `Error al subir avatar: ${error.message || error}`
          );
        }
      });
    }
  }
}
