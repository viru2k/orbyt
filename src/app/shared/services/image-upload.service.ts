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
    return this.usersService.userControllerUploadAvatar({
      body: { file }
    }).pipe(
      map((userResponse: UserResponseDto) => {
        // Convertir UserResponseDto a FileUploadResponseDto
        return {
          id: userResponse.id,
          filename: `user_${userResponse.id}_avatar`,
          originalName: file.name,
          fileType: 'avatar' as const,
          mimeType: file.type,
          size: file.size,
          url: userResponse.avatarUrl || '',
          thumbnailUrl: userResponse.avatarUrl || '',
          entityType: 'user' as const,
          entityId: userResponse.id,
          description: 'Avatar de usuario',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          path: `avatars/user_${userResponse.id}`,
          thumbnailPath: `thumbnails/user_${userResponse.id}`,
          isActive: true,
          uploadedBy: {}
        } as FileUploadResponseDto;
      }),
      catchError(error => {
        console.error('Error uploading user avatar:', error);
        return throwError(() => new Error('Error al subir el avatar del usuario. Por favor, inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Subir imagen principal de producto
   */
  private uploadProductImage(file: File, productId: number): Observable<FileUploadResponseDto> {
    return this.productsService.productControllerUploadImage({
      id: productId,
      body: { file }
    }).pipe(
      map((productResponse: ProductResponseDto) => {
        // Convertir ProductResponseDto a FileUploadResponseDto
        return {
          id: productResponse.id,
          filename: `product_${productResponse.id}_image`,
          originalName: file.name,
          fileType: 'image' as const,
          mimeType: file.type,
          size: file.size,
          url: productResponse.imageUrl || '',
          thumbnailUrl: productResponse.thumbnailUrl || '',
          entityType: 'product' as const,
          entityId: productResponse.id,
          description: 'Imagen principal del producto',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          path: `products/images/${productResponse.id}`,
          thumbnailPath: `products/thumbnails/${productResponse.id}`,
          isActive: true,
          uploadedBy: {}
        } as FileUploadResponseDto;
      }),
      catchError(error => {
        console.error('Error uploading product image:', error);
        return throwError(() => new Error('Error al subir la imagen del producto. Por favor, inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Subir thumbnail de producto
   */
  uploadProductThumbnail(file: File, productId: number): Observable<FileUploadResponseDto> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    return this.productsService.productControllerUploadThumbnail({
      id: productId,
      body: { file }
    }).pipe(
      map((productResponse: ProductResponseDto) => {
        // Convertir ProductResponseDto a FileUploadResponseDto
        return {
          id: productResponse.id,
          filename: `product_${productResponse.id}_thumbnail`,
          originalName: file.name,
          fileType: 'thumbnail' as const,
          mimeType: file.type,
          size: file.size,
          url: productResponse.thumbnailUrl || '',
          thumbnailUrl: productResponse.thumbnailUrl || '',
          entityType: 'product' as const,
          entityId: productResponse.id,
          description: 'Thumbnail del producto',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          path: `products/thumbnails/${productResponse.id}`,
          thumbnailPath: `products/thumbnails/${productResponse.id}`,
          isActive: true,
          uploadedBy: {}
        } as FileUploadResponseDto;
      }),
      catchError(error => {
        console.error('Error uploading product thumbnail:', error);
        return throwError(() => new Error('Error al subir el thumbnail del producto. Por favor, inténtalo de nuevo.'));
      })
    );
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
      entityId,
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