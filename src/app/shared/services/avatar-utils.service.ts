import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { UserResponseDto } from '../../api/models/user-response-dto';
import { ClientResponseDto } from '../../api/models/client-response-dto';
import { ProductResponseDto } from '../../api/models/product-response-dto';
import { FileUploadResponseDto } from '../../api/models/file-upload-response-dto';
import { 
  AvatarEntity, 
  EntityWithAvatar 
} from '../models/entity-avatar.interfaces';
import { ImageUploadService } from './image-upload.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarUtilsService {

  constructor(private imageUploadService: ImageUploadService) {}

  /**
   * Obtener nombre para mostrar de una entidad
   */
  getEntityDisplayName(entity: AvatarEntity): string {
    if (this.isUserEntity(entity)) {
      return entity.fullName || entity.email || 'Usuario';
    }
    
    if (this.isClientEntity(entity)) {
      return entity.fullname || `${entity.name} ${entity.lastName}`.trim() || 'Cliente';
    }
    
    if (this.isProductEntity(entity)) {
      return entity.name || 'Producto';
    }
    
    return 'Entidad';
  }

  /**
   * Generar iniciales para una entidad
   */
  getEntityInitials(entity: AvatarEntity): string {
    const displayName = this.getEntityDisplayName(entity);
    return this.generateInitials(displayName);
  }

  /**
   * Generar iniciales de un nombre
   */
  generateInitials(name: string): string {
    if (!name || name.trim().length === 0) {
      return '?';
    }

    const words = name.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return '?';
    }
    
    if (words.length === 1) {
      // Para una sola palabra, tomar las primeras 2 letras
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Para múltiples palabras, tomar la primera letra de las primeras dos palabras
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  /**
   * Obtener URL del avatar de una entidad
   */
  getAvatarUrl(entity: AvatarEntity, avatar?: FileUploadResponseDto): string | null {
    // Priorizar avatar pasado como parámetro
    if (avatar) {
      const url = avatar.thumbnailUrl || avatar.url;
      return this.processAvatarUrl(url);
    }
    
    // Si no hay avatar como parámetro, buscar en las propiedades de la entidad
    // TODO: Add avatar support when backend provides image URLs
    // UserResponseDto and ProductResponseDto don't have image properties yet
    
    // Los clientes actualmente no tienen campo avatarUrl en el DTO
    // Esto se puede agregar en el futuro si se implementa
    
    return null;
  }

  /**
   * Procesar URL de avatar para hacerla compatible con el proxy
   */
  private processAvatarUrl(url: string): string {
    if (!url) return url;
    
    // Como el backend ya hizo público el acceso a /upload/, 
    // usamos las URLs completas directamente
    return url;
  }

  /**
   * Obtener color de fondo basado en el nombre (para avatares sin imagen)
   */
  getInitialsBackgroundColor(entity: AvatarEntity): string {
    const name = this.getEntityDisplayName(entity);
    return this.generateColorFromString(name);
  }

  /**
   * Generar color consistente basado en string
   */
  private generateColorFromString(str: string): string {
    // Colores predefinidos que contrastan bien con texto blanco
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // violet  
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#f97316', // orange
      '#6366f1', // indigo
      '#ec4899', // pink
      '#84cc16', // lime
      '#06b6d4', // cyan
      '#8b5a2b', // brown
      '#6b7280'  // gray
    ];

    // Generar hash simple del string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Usar hash para seleccionar color
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  }

  /**
   * Obtener avatar completo con datos de la entidad
   */
  getEntityWithAvatar(entity: AvatarEntity, avatar?: FileUploadResponseDto): EntityWithAvatar {
    return {
      id: entity.id,
      avatar,
      displayName: this.getEntityDisplayName(entity),
      initials: this.getEntityInitials(entity)
    };
  }

  /**
   * Cargar avatar de una entidad desde el servidor
   */
  loadEntityAvatar(entityType: 'user' | 'client' | 'product', entityId: number): Observable<FileUploadResponseDto | null> {
    return this.imageUploadService.getEntityAvatar(entityType, entityId).pipe(
      catchError(error => {
        console.error(`Error loading avatar for ${entityType} ${entityId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Obtener información completa del avatar (incluyendo carga desde servidor)
   */
  getCompleteAvatarInfo(
    entity: AvatarEntity, 
    entityType: 'user' | 'client' | 'product'
  ): Observable<EntityWithAvatar> {
    return this.loadEntityAvatar(entityType, entity.id).pipe(
      map(avatar => this.getEntityWithAvatar(entity, avatar || undefined))
    );
  }

  /**
   * Type guards
   */
  private isUserEntity(entity: AvatarEntity): entity is UserResponseDto {
    return 'email' in entity && 'fullName' in entity;
  }

  private isClientEntity(entity: AvatarEntity): entity is ClientResponseDto {
    return 'name' in entity && 'lastName' in entity;
  }

  private isProductEntity(entity: AvatarEntity): entity is ProductResponseDto {
    return 'currentPrice' in entity && 'name' in entity;
  }

  /**
   * Obtener tipo de entidad
   */
  getEntityType(entity: AvatarEntity): 'user' | 'client' | 'product' {
    if (this.isUserEntity(entity)) return 'user';
    if (this.isClientEntity(entity)) return 'client';
    if (this.isProductEntity(entity)) return 'product';
    throw new Error('Unknown entity type');
  }

  /**
   * Validar si una entidad tiene información suficiente para generar avatar
   */
  canGenerateAvatar(entity: AvatarEntity): boolean {
    const displayName = this.getEntityDisplayName(entity);
    return displayName !== 'Entidad' && displayName.trim().length > 0;
  }

  /**
   * Formatear información del avatar para mostrar
   */
  getAvatarTooltip(entity: AvatarEntity, avatar?: FileUploadResponseDto): string {
    const displayName = this.getEntityDisplayName(entity);
    
    if (avatar) {
      return `${displayName} - ${avatar.originalName}`;
    }
    
    return displayName;
  }

  /**
   * Obtener clase CSS para el contexto del avatar
   */
  getAvatarContextClass(context: 'table' | 'modal' | 'profile' | 'card'): string {
    return `entity-avatar-${context}`;
  }
}