# Guía de Implementación: Sistema de Upload de Imágenes 📸

Esta guía describe la implementación del sistema completo de upload de imágenes para productos, usuarios, clientes y consultas médicas en Backoffice Hub.

---

## 📋 Visión General del Sistema

El sistema de upload de imágenes ha sido completamente implementado en el backend con las siguientes características:

### ✅ Funcionalidades Principales
- **Upload de imágenes** para productos, usuarios, clientes y consultas
- **Generación automática de thumbnails** usando Sharp
- **Validación de archivos** (tipos permitidos, tamaño máximo)
- **Almacenamiento organizado** en carpetas por tipo
- **URLs públicas** para acceder a las imágenes
- **Integración completa** con el sistema de permisos existente

### 🎯 Entidades Compatibles
- **Productos**: Imagen principal + thumbnail
- **Usuarios**: Avatar con thumbnail automático
- **Clientes**: Avatar con thumbnail automático
- **Consultas**: Múltiples archivos (imágenes y documentos)

---

## 🚀 Endpoints Disponibles

### 1. Sistema General de Upload

#### POST `/api/upload`
Upload general para cualquier tipo de archivo y entidad.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  file: File, // Archivo a subir
  fileType: 'image' | 'document' | 'avatar' | 'thumbnail',
  entityType: 'product' | 'user' | 'client' | 'consultation' | 'general',
  entityId: number, // ID de la entidad asociada
  description?: string // Descripción opcional
}
```

**Respuesta (201 Created):**
```json
{
  "id": 123,
  "filename": "1640995200000_abc123.jpg",
  "originalName": "mi-imagen.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "path": "images/1640995200000_abc123.jpg",
  "thumbnailPath": "thumbnails/thumb_1640995200000_abc123.jpg",
  "fileType": "image",
  "entityType": "product",
  "entityId": 1,
  "description": "Imagen principal del producto",
  "isActive": true,
  "uploadedBy": {
    "id": 1,
    "name": "Juan Pérez"
  },
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z",
  "url": "http://localhost:3001/api/upload/123",
  "thumbnailUrl": "http://localhost:3001/api/upload/123/thumbnail"
}
```

#### GET `/api/upload/entity/:entityType/:entityId`
Obtener todos los archivos de una entidad específica.

**Ejemplo:**
```
GET /api/upload/entity/product/1
```

#### GET `/api/upload/:id`
Descargar archivo por ID (imagen completa).

#### GET `/api/upload/:id/thumbnail`
Obtener thumbnail de una imagen.

---

### 2. Endpoints Específicos por Entidad

#### 🛍️ Productos

##### POST `/api/products/:id/upload-image`
Subir imagen principal del producto.

**Request:**
```javascript
// Form Data
{
  file: File // Imagen del producto
}
```

**Respuesta:** ProductResponseDto actualizado con imageUrl.

##### POST `/api/products/:id/upload-thumbnail`
Subir thumbnail del producto.

**Request:**
```javascript
// Form Data
{
  file: File // Thumbnail del producto
}
```

**Respuesta:** ProductResponseDto actualizado con thumbnailUrl.

#### 👤 Usuarios

##### POST `/api/users/upload-avatar`
Subir avatar del usuario autenticado.

**Request:**
```javascript
// Form Data
{
  file: File // Avatar del usuario
}
```

**Respuesta:** UserResponseDto actualizado con avatarUrl.

#### 🏥 Clientes

##### POST `/api/clients/:id/upload-avatar`
Subir avatar del cliente.

**Request:**
```javascript
// Form Data
{
  file: File // Avatar del cliente
}
```

**Respuesta:** ClientResponseDto actualizado con avatarUrl.

#### 📋 Consultas

##### POST `/api/consultations/:id/upload-file`
Subir archivo a una consulta (imágenes médicas, documentos).

**Request:**
```javascript
// Form Data
{
  file: File, // Archivo médico
  description?: string // Descripción del archivo
}
```

---

## 💻 Implementación Frontend

### 1. Componente Base de Upload

```typescript
import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  entityType: 'product' | 'user' | 'client' | 'consultation';
  entityId?: number;
  fileType?: 'image' | 'avatar' | 'thumbnail';
  currentImageUrl?: string;
  onUploadSuccess?: (response: any) => void;
  onUploadError?: (error: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  entityId,
  fileType = 'image',
  currentImageUrl,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validaciones del cliente
    if (!isValidImageFile(file)) {
      onUploadError?.('Tipo de archivo no válido. Use JPEG, PNG, WebP o GIF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      onUploadError?.('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (entityId) {
        formData.append('entityType', entityType);
        formData.append('entityId', entityId.toString());
        formData.append('fileType', fileType);
      }

      const endpoint = getUploadEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      onUploadSuccess?.(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Error uploading file');
      setPreview(currentImageUrl || null); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  const getUploadEndpoint = () => {
    // Usar endpoints específicos cuando están disponibles
    switch (entityType) {
      case 'product':
        return `/api/products/${entityId}/upload-${fileType}`;
      case 'user':
        return '/api/users/upload-avatar';
      case 'client':
        return `/api/clients/${entityId}/upload-avatar`;
      case 'consultation':
        return `/api/consultations/${entityId}/upload-file`;
      default:
        return '/api/upload';
    }
  };

  const isValidImageFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.mimetype);
  };

  return (
    <div className="image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="upload-area">
        {preview ? (
          <div className="image-preview">
            <img 
              src={preview} 
              alt="Preview" 
              className="preview-image"
              style={{ maxWidth: '200px', maxHeight: '200px' }}
            />
            <div className="upload-overlay">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="change-image-btn"
              >
                {uploading ? 'Subiendo...' : 'Cambiar imagen'}
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="upload-placeholder"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📸</div>
            <div className="upload-text">
              {uploading ? 'Subiendo...' : 'Subir imagen'}
            </div>
          </div>
        )}
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

### 2. Componente para Galería de Imágenes (Consultas)

```typescript
import React, { useState, useEffect } from 'react';

interface ImageGalleryProps {
  entityType: 'consultation';
  entityId: number;
  allowUpload?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  entityType,
  entityId,
  allowUpload = true
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, [entityId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/upload/entity/${entityType}/${entityId}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        const files = await response.json();
        setImages(files.filter(file => file.fileType === 'image'));
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewImage = (uploadResult: any) => {
    setImages(prev => [...prev, uploadResult]);
  };

  const deleteImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/upload/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  if (loading) {
    return <div className="gallery-loading">Cargando imágenes...</div>;
  }

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <h3>Imágenes ({images.length})</h3>
      </div>

      <div className="gallery-grid">
        {images.map(image => (
          <div key={image.id} className="gallery-item">
            <div className="image-container">
              <img 
                src={image.thumbnailUrl || image.url} 
                alt={image.description || 'Imagen'} 
                className="gallery-thumbnail"
                onClick={() => openImageModal(image)}
              />
              <div className="image-overlay">
                <button 
                  onClick={() => deleteImage(image.id)}
                  className="delete-btn"
                  title="Eliminar imagen"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="image-info">
              <div className="image-name">{image.originalName}</div>
              <div className="image-description">{image.description}</div>
              <div className="image-date">
                {new Date(image.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {allowUpload && (
          <div className="gallery-item upload-slot">
            <ImageUpload
              entityType={entityType}
              entityId={entityId}
              fileType="image"
              onUploadSuccess={handleNewImage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3. Hook para Gestión de Imágenes

```typescript
import { useState, useCallback } from 'react';

interface UseImageUploadOptions {
  entityType: string;
  entityId?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useImageUpload = (options: UseImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File, additionalData?: any) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.entityId) {
        formData.append('entityType', options.entityType);
        formData.append('entityId', options.entityId.toString());
      }

      // Agregar datos adicionales
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [options]);

  return {
    uploadImage,
    uploading,
    error,
    clearError: () => setError(null)
  };
};
```

---

## 🎨 Ejemplos de Uso

### 1. Avatar de Usuario (Perfil)

```typescript
const UserProfile = () => {
  const [user, setUser] = useState(null);

  const handleAvatarUpload = (result) => {
    setUser(prev => ({ ...prev, avatarUrl: result.avatarUrl }));
    toast.success('Avatar actualizado correctamente');
  };

  return (
    <div className="user-profile">
      <div className="avatar-section">
        <ImageUpload
          entityType="user"
          fileType="avatar"
          currentImageUrl={user?.avatarUrl}
          onUploadSuccess={handleAvatarUpload}
          onUploadError={(error) => toast.error(error)}
        />
        <h2>{user?.fullName}</h2>
      </div>
      {/* Resto del perfil */}
    </div>
  );
};
```

### 2. Imágenes de Producto

```typescript
const ProductForm = ({ productId }) => {
  const [product, setProduct] = useState(null);

  const handleImageUpload = (result) => {
    setProduct(prev => ({ 
      ...prev, 
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl 
    }));
  };

  return (
    <form className="product-form">
      <div className="product-images">
        <div className="main-image">
          <label>Imagen Principal</label>
          <ImageUpload
            entityType="product"
            entityId={productId}
            fileType="image"
            currentImageUrl={product?.imageUrl}
            onUploadSuccess={handleImageUpload}
          />
        </div>
        
        <div className="thumbnail-image">
          <label>Thumbnail</label>
          <ImageUpload
            entityType="product"
            entityId={productId}
            fileType="thumbnail"
            currentImageUrl={product?.thumbnailUrl}
            onUploadSuccess={handleImageUpload}
          />
        </div>
      </div>
      {/* Resto del formulario */}
    </form>
  );
};
```

### 3. Historia Clínica con Múltiples Imágenes

```typescript
const ConsultationDetail = ({ consultationId }) => {
  return (
    <div className="consultation-detail">
      <div className="consultation-info">
        {/* Información de la consulta */}
      </div>
      
      <div className="consultation-files">
        <ImageGallery
          entityType="consultation"
          entityId={consultationId}
          allowUpload={true}
        />
      </div>
    </div>
  );
};
```

---

## 🎨 Estilos CSS Sugeridos

```css
/* Estilos base para upload de imágenes */
.image-upload {
  position: relative;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.image-upload:hover {
  border-color: #2196f3;
  background-color: #f5f5f5;
}

.upload-area {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  text-align: center;
  cursor: pointer;
  padding: 2rem;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  color: #666;
  font-size: 1.1rem;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.preview-image {
  border-radius: 8px;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.image-preview:hover .upload-overlay {
  opacity: 1;
}

.change-image-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.change-image-btn:hover {
  background: #1976d2;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2196f3;
  width: 100%;
  animation: indeterminate 2s infinite linear;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Estilos para galería */
.image-gallery {
  margin-top: 2rem;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.gallery-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.gallery-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.gallery-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .image-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(244, 67, 54, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 14px;
}

.image-info {
  padding: 12px;
}

.image-name {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-description {
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.image-date {
  color: #999;
  font-size: 0.75rem;
}

.upload-slot {
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
```

---

## 🔧 Configuración y Notas Técnicas

### Tipos de Archivos Admitidos
- **Imágenes**: JPEG, PNG, WebP, GIF
- **Documentos**: PDF, TXT, DOC
- **Tamaño máximo**: 10MB por archivo

### Thumbnails Automáticos
- Se generan automáticamente para imágenes
- Tamaño: 300x300 píxeles
- Formato: JPEG con calidad 80%
- Fit: cover (centrado)

### Estructura de Directorios
```
uploads/
├── images/          # Imágenes originales
├── thumbnails/      # Thumbnails generados
├── avatars/         # Avatares de usuarios
└── documents/       # Documentos PDF, etc.
```

### URLs de Acceso
- **Imagen original**: `/uploads/images/filename.jpg`
- **Thumbnail**: `/uploads/thumbnails/thumb_filename.jpg`
- **API endpoint**: `/api/upload/:id` (con redirección automática)

### Compatibilidad con Hosting
El sistema está preparado para funcionar con Ionos y otros proveedores:
- Rutas relativas configurables
- Servicio de archivos estáticos integrado
- URLs base configurables por environment

---

## ✅ Checklist de Implementación Frontend

### Básico
- [ ] Componente `ImageUpload` genérico
- [ ] Hook `useImageUpload` para lógica reutilizable
- [ ] Validaciones del cliente (tipo, tamaño)
- [ ] Preview de imágenes antes de subir
- [ ] Manejo de estados de carga y error

### Específico por Entidad
- [ ] Upload de avatar en perfil de usuario
- [ ] Upload de imágenes de productos
- [ ] Upload de avatar de clientes
- [ ] Galería de imágenes para consultas médicas

### Avanzado
- [ ] Componente `ImageGallery` para múltiples imágenes
- [ ] Drag & drop para upload
- [ ] Redimensionamiento del cliente antes de subir
- [ ] Compresión de imágenes grandes
- [ ] Modal para vista previa de imágenes completas

### UX/UI
- [ ] Indicadores de progreso durante upload
- [ ] Mensajes de éxito y error
- [ ] Iconos y estados visuales claros
- [ ] Responsive design para móviles
- [ ] Accessibility (alt tags, ARIA labels)

---

## 🔄 Flujo de Trabajo Recomendado

1. **Implementar el componente base** `ImageUpload`
2. **Crear el hook** `useImageUpload` para lógica compartida
3. **Integrar en formularios existentes** (usuarios, productos)
4. **Implementar galería** para consultas médicas
5. **Agregar validaciones y UX mejorada**
6. **Testear con diferentes tipos de archivos**
7. **Optimizar para móviles**

El sistema backend está completamente listo y probado. Solo necesitas implementar los componentes frontend siguiendo esta guía.