import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';

import { OrbImageUploadModalComponent } from '../orb-image-upload-modal/orb-image-upload-modal.component';
import { EntityType } from '../../../src/app/shared/models/image-upload.interfaces';

import { FileUploadResponseDto } from '../../../src/app/api/models/file-upload-response-dto';
import { 
  AvatarEntity, 
  AvatarSize, 
  AvatarShape,
  EntityWithAvatar,
  AVATAR_SIZE_MAPPING,
  AVATAR_CONTEXT_CLASSES 
} from '../../../src/app/shared/models/entity-avatar.interfaces';
import { AvatarUtilsService } from '../../../src/app/shared/services/avatar-utils.service';

@Component({
  selector: 'orb-entity-avatar',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    TooltipModule,
    SkeletonModule,
    OrbImageUploadModalComponent
  ],
  templateUrl: './orb-entity-avatar.component.html',
  styleUrls: ['./orb-entity-avatar.component.scss']
})
export class OrbEntityAvatarComponent implements OnInit, OnDestroy, OnChanges {

  @Input() entity!: AvatarEntity;
  @Input() entityType?: 'user' | 'client' | 'product';
  @Input() avatar?: FileUploadResponseDto | null;
  @Input() size: AvatarSize = 'normal';
  @Input() shape: AvatarShape = 'circle';
  @Input() showUploadButton = false;
  @Input() clickable = false;
  @Input() loading = false;
  @Input() context: 'table' | 'modal' | 'profile' | 'card' = 'table';
  @Input() showTooltip = true;
  @Input() autoLoad = true; // Cargar avatar automáticamente desde el servidor
  
  @Output() avatarClick = new EventEmitter<EntityWithAvatar>();
  @Output() uploadClick = new EventEmitter<AvatarEntity>();
  @Output() avatarUpdated = new EventEmitter<FileUploadResponseDto>();

  // Estado del componente
  avatarUrl: string | null = null;
  initials = '';
  displayName = '';
  backgroundColor = '';
  tooltipText = '';
  isLoading = false;
  showModal = false;
  
  private destroy$ = new Subject<void>();
  private entityWithAvatar: EntityWithAvatar | null = null;

  constructor(private avatarUtils: AvatarUtilsService) {}

  ngOnInit() {
    this.updateAvatarDisplay();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entity'] || changes['avatar'] || changes['entityType']) {
      this.updateAvatarDisplay();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualizar display del avatar
   */
  private updateAvatarDisplay() {
    if (!this.entity) return;

    // Datos básicos de la entidad
    this.displayName = this.avatarUtils.getEntityDisplayName(this.entity);
    this.initials = this.avatarUtils.getEntityInitials(this.entity);
    this.backgroundColor = this.avatarUtils.getInitialsBackgroundColor(this.entity);
    
    // URL del avatar
    this.avatarUrl = this.avatarUtils.getAvatarUrl(this.entity, this.avatar || undefined);
    
    // Tooltip
    this.tooltipText = this.avatarUtils.getAvatarTooltip(this.entity, this.avatar || undefined);

    // Crear objeto EntityWithAvatar
    this.entityWithAvatar = this.avatarUtils.getEntityWithAvatar(this.entity, this.avatar || undefined);

    // Cargar avatar automáticamente si está configurado
    // PERO solo si no hay ya una URL de avatar en la entidad
    if (this.autoLoad && !this.avatar && this.entityType && !this.avatarUrl) {
      this.loadAvatarFromServer();
    }
  }

  /**
   * Cargar avatar desde el servidor
   */
  private loadAvatarFromServer() {
    console.log('🔄🔄 loadAvatarFromServer() iniciado');
    
    if (!this.entityType || this.isLoading) {
      console.log('🔄🔄 loadAvatarFromServer() cancelado:', { entityType: this.entityType, isLoading: this.isLoading });
      return;
    }

    this.isLoading = true;
    console.log('🔄🔄 Llamando avatarUtils.loadEntityAvatar() para entityType:', this.entityType, 'id:', this.entity.id);

    this.avatarUtils.loadEntityAvatar(this.entityType, this.entity.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avatar) => {
          console.log('🔄🔄 loadEntityAvatar response:', avatar);
          
          if (avatar) {
            console.log('🔄🔄 Avatar recibido, actualizando avatarUrl...');
            this.avatar = avatar;
            
            const newAvatarUrl = this.avatarUtils.getAvatarUrl(this.entity, avatar);
            console.log('🔄🔄 Nueva avatarUrl calculada:', newAvatarUrl);
            console.log('🔄🔄 AvatarUrl ANTES del cambio:', this.avatarUrl);
            
            this.avatarUrl = newAvatarUrl;
            console.log('🔄🔄 AvatarUrl DESPUÉS del cambio:', this.avatarUrl);
            
            this.tooltipText = this.avatarUtils.getAvatarTooltip(this.entity, avatar);
            
            if (this.entityWithAvatar) {
              this.entityWithAvatar.avatar = avatar;
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('🔄🔄 Error loading avatar:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Manejar click en el avatar
   */
  onAvatarClick() {
    if (this.clickable && this.entityWithAvatar) {
      this.avatarClick.emit(this.entityWithAvatar);
    }
  }

  /**
   * Manejar click en botón de upload
   */
  onUploadClick(event: Event) {
    event.stopPropagation(); // Evitar que se dispare avatarClick
    this.uploadClick.emit(this.entity);
  }

  /**
   * Manejar click en botón de editar
   */
  onEditClick(event: Event) {
    console.log('🖊️ EDIT BUTTON CLICKED!');
    event.stopPropagation(); // Evitar que se dispare avatarClick
    event.preventDefault();
    this.showModal = true;
    console.log('🖊️ showModal set to:', this.showModal);
    console.log('🖊️ modalEntityType:', this.modalEntityType);
    console.log('🖊️ entity.id:', this.entity?.id);
  }

  /**
   * Manejar imagen subida desde el modal
   */
  onModalImageUploaded(image: FileUploadResponseDto) {
    this.avatar = image;
    this.updateAvatarDisplay();
    this.avatarUpdated.emit(image);
  }

  /**
   * Manejar imagen eliminada desde el modal
   */
  onModalImageDeleted() {
    this.avatar = null;
    this.updateAvatarDisplay();
  }

  /**
   * Manejar error de subida desde el modal
   */
  onUploadError(error: string) {
    console.error('Upload error in modal:', error);
    // El modal ya maneja la notificación de error
  }

  /**
   * Manejar error al cargar imagen
   */
  onImageError() {
    this.avatarUrl = null;
  }

  // Getters para el template

  get contextClass(): string {
    return AVATAR_CONTEXT_CLASSES[this.context];
  }

  get hasImage(): boolean {
    return !!this.avatarUrl;
  }

  get isCircle(): boolean {
    return this.shape === 'circle';
  }

  get isSquare(): boolean {
    return this.shape === 'square';
  }

  get containerClasses(): string {
    const classes = ['entity-avatar-container'];
    
    if (this.clickable) {
      classes.push('clickable');
    }
    
    if (this.showUploadButton) {
      classes.push('with-upload-button');
    }
    
    classes.push(this.contextClass);
    classes.push(`size-${this.size}`);
    classes.push(`shape-${this.shape}`);
    
    return classes.join(' ');
  }

  get avatarStyles(): { [key: string]: string } {
    if (this.hasImage) {
      return {};
    }
    
    return {
      'background-color': this.backgroundColor,
      'color': '#ffffff'
    };
  }

  get modalEntityType(): EntityType {
    return this.entityType || 'user';
  }

  get modalTitle(): string {
    if (this.entityType === 'user') return 'Editar Avatar de Usuario';
    if (this.entityType === 'client') return 'Editar Avatar de Cliente';
    if (this.entityType === 'product') return 'Editar Imagen de Producto';
    return 'Editar Imagen';
  }
}