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
import { AvatarDto } from '../../../src/app/api/models/avatar-dto';
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
  @Input() avatar?: FileUploadResponseDto | AvatarDto | null;
  @Input() size: AvatarSize = 'normal';
  @Input() shape: AvatarShape = 'circle';
  @Input() showUploadButton = false;
  @Input() clickable = false;
  @Input() loading = false;
  @Input() context: 'table' | 'modal' | 'profile' | 'card' = 'table';
  @Input() showTooltip = true;
  @Input() autoLoad = true; // Cargar avatar automáticamente desde el servidor
  @Input() tooltipText: string = '';
  @Input() customTooltipText: boolean = false;
  @Input() displayNamePath?: string; // Ruta para obtener el nombre a mostrar (ej: "owner.fullName")
  @Input() customDisplayName?: string; // Nombre personalizado directo
  @Output() avatarClick = new EventEmitter<EntityWithAvatar>();
  @Output() uploadClick = new EventEmitter<AvatarEntity>();
  @Output() avatarUpdated = new EventEmitter<FileUploadResponseDto>();

  // Estado del componente
  avatarUrl: string | null = null;
  initials = '';
  displayName = '';
  backgroundColor = '';
  isLoading = false;
  showModal = false;
  
  private destroy$ = new Subject<void>();
  private entityWithAvatar: EntityWithAvatar | null = null;
  private avatarLoadAttempted = false;

  constructor(private avatarUtils: AvatarUtilsService) {}

  ngOnInit() {
    this.updateAvatarDisplay();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entity'] || changes['avatar'] || changes['entityType'] ||
        changes['displayNamePath'] || changes['customDisplayName'] || changes['customTooltipText']) {
      // Resetear flag de carga si cambió la entidad o el tipo
      if (changes['entity'] || changes['entityType']) {
        this.avatarLoadAttempted = false;
      }
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

    // Datos básicos de la entidad - usar personalizado si está disponible
    this.displayName = this.getDisplayName();
    this.initials = this.avatarUtils.generateInitials(this.displayName);
    this.backgroundColor = this.avatarUtils.getInitialsBackgroundColor(this.entity);

    // URL del avatar - pasar contexto para optimización de imagen
    this.avatarUrl = this.avatarUtils.getAvatarUrl(this.entity, this.avatar || undefined, this.context);

    // Tooltip - usar personalizado si no está establecido customTooltipText
    if (!this.customTooltipText) {
      this.tooltipText = this.displayName;
    }

    // Crear objeto EntityWithAvatar
    this.entityWithAvatar = this.avatarUtils.getEntityWithAvatar(this.entity, this.avatar || undefined);

    // Cargar avatar automáticamente si está configurado
    // PERO solo si no hay ya una URL de avatar en la entidad y no se ha intentado cargar antes
    if (this.autoLoad && !this.avatar && this.entityType && !this.avatarUrl && !this.avatarLoadAttempted) {
      this.loadAvatarFromServer();
    }
  }

  /**
   * Cargar avatar desde el servidor
   */
  private loadAvatarFromServer() {    
    
    if (!this.entityType || this.isLoading || this.avatarLoadAttempted) {   
      return;
    }

    this.isLoading = true;
    this.avatarLoadAttempted = true;    

    this.avatarUtils.loadEntityAvatar(this.entityType, this.entity.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avatar) => {          
          
          if (avatar) {            
            this.avatar = avatar;
            
            const newAvatarUrl = this.avatarUtils.getAvatarUrl(this.entity, avatar, this.context);

            this.avatarUrl = newAvatarUrl;            
            
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
    event.stopPropagation(); // Evitar que se dispare avatarClick
    event.preventDefault();
    this.showModal = true;            
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

  /**
   * Obtener icono de fallback según el tipo de entidad
   */
  getFallbackIcon(): string {
    switch (this.entityType) {
      case 'user':
        return 'account_box';
      case 'product':
        return 'package_2';
      case 'client':
        return 'contacts_product';
      default:
        return 'account_box';
    }
  }

  /**
   * Obtener el nombre a mostrar considerando configuraciones personalizadas
   */
  private getDisplayName(): string {
    // Si hay un nombre personalizado directo, usarlo
    if (this.customDisplayName?.trim()) {
      return this.customDisplayName.trim();
    }

    // Si hay una ruta específica, extraer el valor
    if (this.displayNamePath?.trim()) {
      const extractedValue = this.extractValueFromPath(this.entity, this.displayNamePath);
      if (extractedValue?.trim()) {
        return extractedValue.trim();
      }
    }

    // Fallback al comportamiento estándar
    return this.avatarUtils.getEntityDisplayName(this.entity);
  }

  /**
   * Extraer valor de una ruta de propiedades anidadas (ej: "owner.fullName")
   */
  private extractValueFromPath(obj: any, path: string): string | null {
    if (!obj || !path) return null;

    try {
      const keys = path.split('.');
      let current = obj;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }

      return typeof current === 'string' ? current : String(current || '');
    } catch (error) {
      console.warn(`Error extracting value from path "${path}":`, error);
      return null;
    }
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