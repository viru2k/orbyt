# Plan de Implementación - Sistema de Carga de Imágenes para Usuarios, Clientes y Productos

## 📋 Resumen
Implementar funcionalidad completa de carga, visualización y gestión de imágenes para las entidades Usuario, Cliente y Producto usando el sistema de upload existente y componentes Avatar de PrimeNG.

## 🔍 Análisis de Estado Actual

### ✅ Endpoints Existentes (Ya Implementados)
El sistema ya cuenta con un sistema completo de upload de archivos:

**Upload Service** (`/src/app/api/services/upload.service.ts`):
- `POST /upload` - Subir archivo con soporte para entidades
- `GET /upload/entity/{entityType}/{entityId}` - Obtener archivos por entidad
- `GET /upload/{id}` - Descargar archivo
- `GET /upload/{id}/thumbnail` - Obtener thumbnail
- `DELETE /upload/{id}` - Eliminar archivo
- `GET /upload/my-files` - Obtener mis archivos

**Tipos de Entidad Soportados**:
- `user` - Usuarios
- `client` - Clientes  
- `product` - Productos
- `appointment` - Citas
- `consultation` - Consultas
- `general` - General

**Tipos de Archivo Soportados**:
- `image` - Imágenes generales
- `document` - Documentos
- `avatar` - Fotos de perfil
- `thumbnail` - Miniaturas

**Modelo de Respuesta** (`FileUploadResponseDto`):
```typescript
{
  id: number;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath?: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  fileType: 'image' | 'document' | 'avatar' | 'thumbnail';
  entityType: 'user' | 'client' | 'product' | 'appointment' | 'consultation' | 'general';
  entityId?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 📊 Componentes Existentes Analizados

**Usuarios** (`/src/app/features/users/`):
- `users-list.component` - Lista con orb-table
- `user-edit-form.component` - Modal de edición
- Campos actuales: email, fullName, active, isAdmin, roles

**Clientes** (`/src/app/features/client/`):
- `client-list.component` - Lista con orb-table
- `client-form.component` - Modal de edición
- Campos actuales: name, lastName, email, phone, address, birthDate, gender, status

**Productos** (`/src/app/features/stock/product/`):
- `product-list.component` - Lista con orb-table
- `product-form.component` - Modal de edición
- Campos actuales: name, description, currentPrice, status, owner

## 🎯 Objetivos de Implementación

### 1. Carga de Imágenes
- Implementar componente de carga de imágenes reutilizable
- Soporte para drag & drop y selección de archivos
- Preview de imagen antes de subir
- Validación de tipos de archivo (jpg, png, gif, webp)
- Límite de tamaño de archivo
- Generación automática de thumbnails

### 2. Visualización con Avatar
- Usar `p-avatar` de PrimeNG para mostrar imágenes
- Fallback a iniciales cuando no hay imagen
- Mostrar en listas y formularios
- Diferentes tamaños según contexto

### 3. Mejoras en Tablas
- Template personalizado para mostrar avatar + datos
- Mejor diseño visual siguiendo patrón de PrimeNG Table Template
- Responsive design

### 4. Gestión de Imágenes
- Cambiar imagen existente
- Eliminar imagen
- Historial de imágenes (opcional)

## 🚀 Plan de Implementación

### FASE 1: Componente Base de Upload de Imágenes (2-3 días)

#### 1.1 Crear Servicio de Gestión de Imágenes
**Archivo**: `/src/app/shared/services/image-upload.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  // Wrapper del UploadService específico para imágenes
  uploadAvatar(file: File, entityType: 'user' | 'client' | 'product', entityId: number): Observable<FileUploadResponseDto>
  getEntityImages(entityType: 'user' | 'client' | 'product', entityId: number): Observable<FileUploadResponseDto[]>
  deleteImage(imageId: number): Observable<void>
  validateImageFile(file: File): ValidationResult
}
```

#### 1.2 Crear Componente de Upload de Imágenes
**Archivo**: `/shared/components/orb-image-upload/orb-image-upload.component.ts`
```typescript
@Component({
  selector: 'orb-image-upload',
  // Funcionalidades:
  // - Drag & drop
  // - Preview de imagen
  // - Validación de archivos
  // - Progress indicator
  // - Error handling
})
```

**Props**:
- `entityType: 'user' | 'client' | 'product'`
- `entityId?: number`
- `currentImage?: FileUploadResponseDto`
- `allowedTypes?: string[]`
- `maxSize?: number`
- `aspectRatio?: number`

**Eventos**:
- `imageUploaded: EventEmitter<FileUploadResponseDto>`
- `imageDeleted: EventEmitter<void>`
- `uploadError: EventEmitter<string>`

#### 1.3 Crear Componente Avatar Display
**Archivo**: `/shared/components/orb-entity-avatar/orb-entity-avatar.component.ts`
```typescript
@Component({
  selector: 'orb-entity-avatar',
  template: `
    <p-avatar
      [image]="avatarUrl"
      [label]="initials"
      [size]="size"
      [shape]="shape"
      styleClass="entity-avatar">
    </p-avatar>
  `
})
```

**Props**:
- `entity: UserResponseDto | ClientResponseDto | ProductResponseDto`
- `size?: 'normal' | 'large' | 'xlarge'`
- `shape?: 'square' | 'circle'`
- `showUploadButton?: boolean`

### FASE 2: Integración en Usuarios (2-3 días)

#### 2.1 Actualizar Lista de Usuarios
**Archivo**: `/src/app/features/users/users-list/users-list.component.html`
- Agregar columna de avatar usando template personalizado
- Implementar diseño similar a PrimeNG Table Template example
- Layout: Avatar + Datos principales en misma celda

```html
<ng-container *ngSwitchCase="'profile'">
  <div class="flex align-items-center gap-2">
    <orb-entity-avatar [entity]="user" size="normal"></orb-entity-avatar>
    <div>
      <div class="font-medium">{{ user.fullName }}</div>
      <small class="text-muted">{{ user.email }}</small>
    </div>
  </div>
</ng-container>
```

#### 2.2 Actualizar Modal de Usuario
**Archivo**: `/src/app/features/users/modal/user-edit-form.component.html`
- Agregar sección de imagen de perfil
- Integrar componente `orb-image-upload`
- Preview del avatar actual

#### 2.3 Actualizar Store/Service de Usuarios
- Método para cargar imágenes de usuario
- Cache de imágenes en estado
- Actualización reactiva tras upload

### FASE 3: Integración en Clientes (2-3 días)

#### 3.1 Actualizar Lista de Clientes
**Archivo**: `/src/app/features/client/client-list/client-list.component.html`
- Template similar a usuarios
- Avatar + Nombre completo + Info de contacto

#### 3.2 Actualizar Modal de Cliente
**Archivo**: `/src/app/features/client/modal/client-form.component.html`
- Sección de foto de perfil del cliente
- Integración con upload component

#### 3.3 Actualizar Store/Service de Clientes
- Métodos de gestión de imágenes
- Estado reactivo

### FASE 4: Integración en Productos (2-3 días)

#### 4.1 Actualizar Lista de Productos
**Archivo**: `/src/app/features/stock/product/product-list/product-list.component.html`
- Avatar cuadrado para productos
- Nombre + Precio + Imagen

#### 4.2 Actualizar Modal de Producto
**Archivo**: `/src/app/features/stock/product/modal/product-form.component.html`
- Galería de imágenes del producto
- Imagen principal + imágenes adicionales

#### 4.3 Actualizar Store/Service de Productos
- Soporte para múltiples imágenes por producto
- Imagen principal vs secundarias

### FASE 5: Funcionalidades Avanzadas (2-3 días)

#### 5.1 Gestión Avanzada de Imágenes
- Crop/resize de imágenes
- Múltiples imágenes por entidad
- Ordenamiento de imágenes
- Compresión automática

#### 5.2 Optimizaciones
- Lazy loading de imágenes
- Cache de thumbnails
- Preloading inteligente
- Error boundaries

#### 5.3 Accesibilidad y UX
- Soporte para lectores de pantalla
- Keyboard navigation
- Loading states
- Error recovery

## 🏗️ Estructura de Archivos

```
/shared/components/
├── orb-image-upload/
│   ├── orb-image-upload.component.ts
│   ├── orb-image-upload.component.html
│   └── orb-image-upload.component.scss
├── orb-entity-avatar/
│   ├── orb-entity-avatar.component.ts
│   ├── orb-entity-avatar.component.html
│   └── orb-entity-avatar.component.scss
└── orb-image-gallery/
    ├── orb-image-gallery.component.ts
    ├── orb-image-gallery.component.html
    └── orb-image-gallery.component.scss

/shared/services/
└── image-upload.service.ts

/shared/models/
├── image-upload.interfaces.ts
└── entity-avatar.interfaces.ts
```

## 🎨 Design System

### Tamaños de Avatar
- **Small**: 32x32px (listas compactas)
- **Normal**: 48x48px (listas estándar)
- **Large**: 64x64px (headers, cards)
- **XLarge**: 96x96px (perfiles, modals)

### Formas de Avatar
- **Circle**: Usuarios y clientes (más personal)
- **Square**: Productos (mejor para mostrar productos)

### Estados Visuales
- **Loading**: Skeleton loader
- **Error**: Icono de error con retry
- **Empty**: Iniciales con color de fondo
- **Success**: Imagen con overlay de éxito

## 🔧 Configuración Técnica

### Tipos de Archivo Soportados
```typescript
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
];
```

### Límites de Archivo
- **Tamaño máximo**: 5MB por archivo
- **Dimensiones recomendadas**: 
  - Usuarios/Clientes: 200x200px mínimo
  - Productos: 300x300px mínimo
- **Aspect ratio**: 1:1 para avatares, flexible para productos

### Validaciones
- Tipo de archivo válido
- Tamaño dentro del límite
- Dimensiones mínimas
- Detección de malware (futuro)

## 📱 Consideraciones Responsive

### Mobile
- Upload por tap (no drag & drop)
- Avatares más pequeños en listas
- Modal de crop simplificado

### Tablet
- Drag & drop habilitado
- Tamaños intermedios
- Layout de dos columnas

### Desktop
- Full drag & drop
- Preview grande
- Shortcuts de teclado

## 🧪 Testing

### Unit Tests
- Servicios de upload
- Validaciones de archivo
- Componentes individuales

### Integration Tests
- Flujo completo de upload
- Integración con backend
- Error scenarios

### E2E Tests
- Upload desde cada módulo
- Visualización en listas
- Gestión de imágenes

## 🚧 Consideraciones Técnicas

### Performance
- **Lazy loading** de imágenes en tablas grandes
- **Virtual scrolling** para listas con muchas imágenes
- **Image optimization** automática
- **CDN integration** (futuro)

### Security
- **File type validation** en frontend y backend
- **Size limits** estrictos
- **Malware scanning** (futuro)
- **Rate limiting** para uploads

### Accessibility
- **Alt text** para todas las imágenes
- **Keyboard navigation** para upload
- **Screen reader** compatibility
- **High contrast** support

## 📈 Métricas de Éxito

### Funcionalidad
- ✅ Upload exitoso en <5 segundos
- ✅ Thumbnails generados automáticamente
- ✅ Visualización correcta en todos los contextos
- ✅ Eliminación sin errores

### Performance
- ✅ Tiempo de carga de lista <2 segundos
- ✅ Tiempo de upload <5 segundos
- ✅ Tamaño de bundle impact <50KB

### UX
- ✅ Interfaz intuitiva
- ✅ Feedback visual claro
- ✅ Error handling robusto
- ✅ Responsive en todos los dispositivos

## 🔄 Cronograma de Desarrollo

| Fase | Duración | Dependencias | Entregables |
|------|----------|--------------|-------------|
| **Fase 1** | 2-3 días | - | Componentes base de upload |
| **Fase 2** | 2-3 días | Fase 1 | Usuarios con imágenes |
| **Fase 3** | 2-3 días | Fases 1-2 | Clientes con imágenes |
| **Fase 4** | 2-3 días | Fases 1-3 | Productos con imágenes |
| **Fase 5** | 2-3 días | Fases 1-4 | Funcionalidades avanzadas |

**Total estimado**: 10-15 días de desarrollo

## 📝 Notas de Implementación

### Prioridades
1. **Alta**: Funcionalidad básica de upload y visualización
2. **Media**: Templates avanzados en tablas
3. **Baja**: Funcionalidades avanzadas (crop, múltiples imágenes)

### Riesgos Identificados
- **Tamaño de archivos** grandes pueden impactar performance
- **Compatibilidad** con navegadores antiguos
- **Storage costs** si se suben muchas imágenes

### Mitigaciones
- Compresión automática de imágenes
- Progressive enhancement para browsers
- Límites de almacenamiento por usuario/entidad

---

**Fecha de creación**: $(date +%Y-%m-%d)
**Última actualización**: $(date +%Y-%m-%d)
**Autor**: Claude Code Assistant
**Estado**: 📋 Planificación Completa