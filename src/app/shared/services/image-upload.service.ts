import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { UploadService } from '../../api/services/upload.service';
import { ProductsService } from '../../api/services/products.service';
import { UsersService } from '../../api/services/users.service';
import { FileUploadResponseDto } from '../../api/models/file-upload-response-dto';
import { ProductResponseDto } from '../../api/models/product-response-dto';
import { UserResponseDto } from '../../api/models/user-response-dto';
import { 
  EntityType, 
  FileType, 
  ValidationResult, 
  ImageUploadOptions,
  ImageUploadConfig,
  DEFAULT_IMAGE_CONFIG,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE
} from '../models/image-upload.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  constructor(
    private uploadService: UploadService,
    private productsService: ProductsService,
    private usersService: UsersService
  ) {}

  /**
   * Subir avatar para una entidad específica usando endpoints dedicados
   */
  uploadAvatar(
    file: File, 
    entityType: EntityType, 
    entityId?: number,
    options?: Partial<ImageUploadOptions>
  ): Observable<FileUploadResponseDto> {
    
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // Para usuarios, si no se proporciona entityId, usar endpoint de perfil personal
    // Si se proporciona entityId, usar endpoint genérico (contexto administrativo)
    switch (entityType) {
      case 'user':
        if (entityId) {
          // Contexto administrativo: subir avatar para usuario específico
          return this.uploadGenericImage(file, entityType, entityId, { ...options, fileType: 'avatar' });
        } else {
          // Contexto personal: subir avatar propio
          return this.uploadUserAvatar(file);
        }
      case 'product':
        if (!entityId) {
          return throwError(() => new Error('ID de producto requerido para subir avatar'));
        }
        return this.uploadProductImage(file, entityId);
      default:
        // Fallback al endpoint genérico
        return this.uploadGenericImage(file, entityType, entityId!, options);
    }
  }

  /**
   * Subir avatar de usuario
   */
  private uploadUserAvatar(file: File): Observable<FileUploadResponseDto> {
    // TODO: Implement when backend supports avatar upload
    console.warn('User avatar upload not implemented in backend');
    return throwError(() => new Error('User avatar upload not implemented'));
  }

  /**
   * Subir imagen principal de producto
   */
  private uploadProductImage(file: File, productId: number): Observable<FileUploadResponseDto> {
    // TODO: Implement when backend supports product image upload
    console.warn('Product image upload not implemented in backend');
    return throwError(() => new Error('Product image upload not implemented'));
  }

  /**
   * Subir thumbnail de producto
   */
  uploadProductThumbnail(file: File, productId: number): Observable<FileUploadResponseDto> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // TODO: Implement when backend supports product thumbnail upload
    console.warn('Product thumbnail upload not implemented in backend');
    return throwError(() => new Error('Product thumbnail upload not implemented'));
  }

  /**
   * Subir imagen general para una entidad (método genérico de fallback)
   */
  uploadImage(
    file: File, 
    entityType: EntityType, 
    entityId: number,
    options?: Partial<ImageUploadOptions>
  ): Observable<FileUploadResponseDto> {
    
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // Usar endpoints específicos cuando sea posible
    switch (entityType) {
      case 'product':
        return this.uploadProductImage(file, entityId);
      case 'user':
        return this.uploadUserAvatar(file);
      default:
        return this.uploadGenericImage(file, entityType, entityId, options);
    }
  }

  /**
   * Método genérico para upload usando el servicio general
   */
  private uploadGenericImage(
    file: File,
    entityType: EntityType,
    entityId: number,
    options?: Partial<ImageUploadOptions>
  ): Observable<FileUploadResponseDto> {

    // Validate entityId is a valid number
    if (!entityId || isNaN(Number(entityId)) || Number(entityId) <= 0) {
      return throwError(() => new Error('ID de entidad válido requerido para subir la imagen'));
    }

    const uploadOptions: ImageUploadOptions = {
      fileType: 'image',
      generateThumbnail: true,
      ...options
    };

    const uploadParams = this.createUploadParams(file, entityType, entityId, uploadOptions);

    return this.uploadService.uploadControllerUploadFile({ body: uploadParams }).pipe(
      catchError(error => {
        console.error('Error uploading generic image:', error);
        return throwError(() => new Error('Error al subir la imagen. Por favor, inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Obtener imágenes de una entidad
   */
  getEntityImages(entityType: EntityType, entityId: number): Observable<FileUploadResponseDto[]> {
    return this.uploadService.uploadControllerGetFilesByEntity({
      entityType,
      entityId
    }).pipe(
      map(files => files.filter(file => 
        file.fileType === 'avatar' || file.fileType === 'image' || file.fileType === 'thumbnail'
      )),
      catchError(error => {
        console.error('Error fetching entity images:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener avatar principal de una entidad
   */
  getEntityAvatar(entityType: EntityType, entityId: number): Observable<FileUploadResponseDto | null> {
    return this.getEntityImages(entityType, entityId).pipe(
      map(images => {
        // Buscar primero avatar específico, luego cualquier imagen
        const avatar = images.find(img => img.fileType === 'avatar');
        if (avatar) return avatar;
        
        const firstImage = images.find(img => img.fileType === 'image');
        return firstImage || null;
      })
    );
  }

  /**
   * Eliminar imagen
   */
  deleteImage(imageId: number): Observable<void> {
    return this.uploadService.uploadControllerDeleteFile({ id: imageId }).pipe(
      catchError(error => {
        console.error('Error deleting image:', error);
        return throwError(() => new Error('Error al eliminar la imagen. Por favor, inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Validar archivo de imagen
   */
  validateImageFile(file: File, config?: Partial<ImageUploadConfig>): ValidationResult {
    const errors: string[] = [];
    const finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...config };

    // Validar tipo de archivo
    if (!finalConfig.allowedTypes?.includes(file.type)) {
      errors.push(`Tipo de archivo no permitido. Tipos válidos: ${finalConfig.allowedTypes?.map(type => type.split('/')[1].toUpperCase()).join(', ')}`);
    }

    // Validar tamaño
    if (finalConfig.maxSize && file.size > finalConfig.maxSize) {
      const maxSizeMB = (finalConfig.maxSize / (1024 * 1024)).toFixed(1);
      errors.push(`El archivo es muy grande. Tamaño máximo: ${maxSizeMB}MB`);
    }

    // Validar que sea realmente un archivo
    if (file.size === 0) {
      errors.push('El archivo está vacío');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Crear parámetros para upload
   */
  private createUploadParams(
    file: File,
    entityType: EntityType,
    entityId: number,
    options: ImageUploadOptions
  ) {
    const params = {
      file: file as Blob,
      fileType: options.fileType,
      entityType,
      entityId: Number(entityId), // Ensure entityId is a number
      description: options.description
    };

    return params;
  }

  /**
   * Generar URL de thumbnail
   */
  getThumbnailUrl(imageId: number): string {
    // Asumo que el thumbnail endpoint devuelve la imagen directamente
    return `/api/upload/${imageId}/thumbnail`;
  }

  /**
   * Generar URL de imagen completa
   */
  getImageUrl(imageId: number): string {
    return `/api/upload/${imageId}`;
  }

  /**
   * Validar dimensiones de imagen (requiere cargar la imagen)
   */
  validateImageDimensions(
    file: File, 
    minWidth: number = 100, 
    minHeight: number = 100
  ): Observable<ValidationResult> {
    return new Observable(observer => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const errors: string[] = [];
        
        if (img.width < minWidth) {
          errors.push(`La imagen debe tener al menos ${minWidth}px de ancho`);
        }
        
        if (img.height < minHeight) {
          errors.push(`La imagen debe tener al menos ${minHeight}px de alto`);
        }

        URL.revokeObjectURL(url);
        
        observer.next({
          valid: errors.length === 0,
          errors
        });
        observer.complete();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        observer.next({
          valid: false,
          errors: ['No se pudo cargar la imagen. Verifica que sea un archivo válido.']
        });
        observer.complete();
      };

      img.src = url;
    });
  }

  /**
   * Crear preview de imagen
   */
  createImagePreview(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      
      reader.onerror = () => {
        observer.error(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}