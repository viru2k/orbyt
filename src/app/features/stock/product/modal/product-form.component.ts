import { UtilsService } from '@orb-services';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductStore } from '@orb-stores';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from '../../../../api/model/models';
import { FormButtonAction } from '@orb-models';
import { FileUploadResponseDto } from '../../../../api/models/file-upload-response-dto';
import { AvatarEntity } from '../../../../shared/models/entity-avatar.interfaces';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent, OrbSimpleTextareaComponent, OrbEntityAvatarComponent, OrbCardComponent } from '@orb-components';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ImageUploadService } from '../../../../shared/services/image-upload.service';
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
    OrbEntityAvatarComponent,
    OrbCardComponent
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
  private imageUploadService = inject(ImageUploadService);
  private notificationService = inject(NotificationService);


  form!: FormGroup;
  isEditMode = false;
  currentProductEntity: AvatarEntity | null = null;
  currentAvatar: FileUploadResponseDto | null = null;

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
      console.log('🛠️ PRODUCT EDIT MODE:', this.product);
      console.log('🛠️ Product name:', this.product.name);
      console.log('🛠️ Product description:', this.product.description);
      console.log('🛠️ Product currentPrice:', this.product.currentPrice);
      
      // Usar setTimeout para asegurar que el formulario esté completamente inicializado
      setTimeout(() => {
        const priceValue = typeof this.product!.currentPrice === 'string' 
          ? parseFloat(this.product!.currentPrice) 
          : this.product!.currentPrice || 0.01;
          
        console.log('🛠️ Price conversion:', this.product!.currentPrice, '→', priceValue);
        
        this.form.patchValue({
          name: this.product!.name || '',
          description: this.product!.description || '',
          price: priceValue
        });
        
        console.log('🛠️ Form values after patch:', this.form.getRawValue());
      }, 0);
      
      this.currentProductEntity = { ...this.product };
    } else {
      // Para modo creación, crear una entidad temporal
      this.currentProductEntity = ({
        id: 0, // ID temporal para nuevo producto
        name: '',
        description: '',
        currentPrice: 0,
        status: 'ACTIVE',
        owner: {
          id: 0,
          email: '',
          fullName: 'Usuario Temporal'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown) as ProductResponseDto;
    }
  }

  private initForm(): void {
    // El formulario coincide con los campos del CreateProductDto
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0.01, [Validators.required, Validators.min(0.01)]],
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
    console.log('🚀 SUBMIT - Form values:', formValue);

    if (this.isEditMode && this.product?.id) {
      // --- MODO EDICIÓN ---
      const updateDto: UpdateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
      };
      console.log('🚀 SUBMIT - Update DTO:', updateDto);
      console.log('🚀 SUBMIT - Product ID:', this.product.id);
      
      this.productStore.update({ id: this.product.id, dto: updateDto });
    } else {
      // --- MODO CREACIÓN ---
      const createDto: CreateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
      };
      console.log('🚀 SUBMIT - Create DTO:', createDto);
      
      this.productStore.create(createDto);
    }

    this.saved.emit();
  }

  // Manejar la carga de avatar
  onAvatarUploaded(result: any): void {
    console.log('Image uploaded:', result);
    this.currentAvatar = result;
    
    // Recargar los productos para reflejar el cambio
    this.productStore.load();
  }
  
  // Manejar errores de upload
  onUploadError(error: string): void {
    console.error('Upload error:', error);
    this.notificationService.showError(
      NotificationSeverity.Error, 
      `Error al subir imagen: ${error}`
    );
  }
}
