# TODO - Tareas Frontend Prioritarias

Este archivo contiene todas las tareas de frontend que deben ser implementadas basadas en feedback del usuario y mejoras identificadas.

## 🚨 INSTRUCCIONES PARA EL AGENTE

**IMPORTANTE:** Este TODO es el archivo principal que debes consultar siempre para tareas de frontend:

1. **Antes de comenzar:** Lee este archivo completo y ejecuta `TodoWrite` para cargar las tareas pendientes
2. **Al trabajar:** Marca cada tarea como `in_progress` cuando comiences y `completed` cuando termines
3. **Al finalizar:** Actualiza este documento con el estado final

---

## 🔥 NUEVO: PORTAL DE CLIENTES - MÁXIMA PRIORIDAD

### ✅ Backend Completado
El sistema de portal de clientes está **100% implementado** en el backoffice-hub con endpoints funcionales.

### 🎯 Tareas Frontend para Portal de Clientes

#### **CRÍTICO - Sistema de Habilitación de Portal**
- [ ] **Botón "Habilitar Portal" en lista de clientes**
  - Agregar acción en tabla de clientes
  - Modal de confirmación con generación de contraseña temporal
  - Integrar con `POST /api/clients/{id}/enable-portal`
  
- [ ] **Indicador visual de clientes con portal habilitado**  
  - Badge o icono en lista de clientes
  - Columna "Portal Habilitado" en tabla
  - Filtro por clientes con/sin acceso al portal

#### **Gestión Administrativa de Portal**
- [ ] **Vista detallada del estado del portal por cliente**
  - Fecha de último login del cliente
  - Actividad en el portal (vistas, cambios de perfil)
  - Opción de desactivar/reactivar acceso

- [ ] **Sistema de contraseñas temporales**
  - Mostrar contraseña temporal generada al admin
  - Opción de regenerar contraseña para el cliente
  - Tracking de si el cliente ya cambió la contraseña inicial

#### **Visualización de Datos del Cliente**
- [ ] **Separar datos protegidos vs editables en UI**
  - Campos con icono 🔒 (solo admin): name, email, phone
  - Campos editables por cliente: preferredName, address, notes
  - Tooltip explicativo de la diferencia

- [ ] **Dashboard de actividad del portal**
  - Clientes más activos en portal
  - Estadísticas de login de clientes
  - Reportes de cambios de perfil por clientes

### 📋 Flujo Completo a Implementar

1. **Admin ve cliente sin portal** → Botón "Habilitar Portal"
2. **Admin hace clic** → Modal con contraseña temporal generada
3. **Sistema envía email** → Cliente recibe credenciales automáticamente  
4. **Admin comunica credenciales** → Por teléfono/WhatsApp/presencial
5. **Cliente hace login** → Usando email registrado + contraseña temporal
6. **Cliente cambia contraseña** → Sistema fuerza cambio en primer login
7. **Cliente accede a portal** → Ve citas, rewards, historial (solo lectura)

### 🛡️ Consideraciones de Seguridad Frontend
- Diferenciar claramente UI de admin vs cliente
- Validar que admin no pueda acceder con token de cliente
- Mostrar warnings si cliente intenta modificar campos protegidos
- Implementar timeout de sesión diferente para clientes

---

## 🔍 SISTEMA DE BÚSQUEDA DE PRODUCTOS - ALTA PRIORIDAD

### Problemas Identificados
- ❌ **Filtro estado pegado al filtro stock mínimo** - Layout roto en modal de búsqueda
- ❌ **Falta búsqueda de últimos productos buscados** - No hay historial de búsquedas
- ❌ **No se ven las imágenes en las tarjetas** - Problemas de visualización de thumbnails
- ❌ **Filtro automático es molesto** - Debería tener botón "Buscar" después de aplicar filtros
- ❌ **Falta autocompletado en input** - El input debería sugerir productos mientras se escribe
- ❌ **Datos mock detectados** - Verificar si hay datos mock en lugar de datos reales

### Tareas a Implementar

#### Fase 1: Componente de Búsqueda Mejorado
- [ ] **Crear ProductSearchComponent reutilizable**
  - Autocompletado mientras se escribe (debounced)
  - Historial de últimos productos buscados
  - Productos pre-seleccionados/favoritos
  - Input con dropdown de sugerencias

- [ ] **Mejorar layout del modal de búsqueda**
  - Separar filtro de estado del filtro stock mínimo
  - Organizar filtros en grid responsive
  - Añadir botón "Buscar" para aplicar filtros
  - Remover filtrado automático/en tiempo real

- [ ] **Implementar visualización de imágenes**
  - Verificar ruta de imágenes en ProductResponseDto
  - Implementar placeholder para productos sin imagen
  - Optimizar carga de thumbnails
  - Lazy loading para mejor performance

#### Fase 2: Funcionalidades Avanzadas
- [ ] **Sistema de historial de búsquedas**
  - LocalStorage para persistir últimas búsquedas
  - Componente de "Búsquedas recientes"
  - Opción de limpiar historial

- [ ] **Sistema de productos favoritos/pre-seleccionados**
  - Marcar productos como favoritos
  - Lista de acceso rápido a productos más usados
  - Estadísticas de productos más buscados

- [ ] **Verificar y eliminar datos mock**
  - Revisar todos los componentes de productos
  - Asegurar uso de APIs reales del backend
  - Eliminar cualquier dato hardcodeado

---

## 📅 SISTEMA DE AGENDA - ALTA PRIORIDAD

### ✅ Completado Recientemente
- ✅ **Nuevo sistema de selección de cliente con modal de búsqueda**
- ✅ **Nuevo sistema de selección de servicio con modal de búsqueda**
- ✅ **Título se auto-completa con Cliente + Servicio**

### 🔄 Problemas Identificados - En Progreso
- ❌ **Modal de búsqueda de clientes necesita mejoras de UI** - Imagen 404, mejores estilos
- ❌ **Orden de campos incorrecto** - Cliente debe ir primero, luego servicio, luego título
- ❌ **Campo título debe ser editable** - Aunque se auto-complete, debe permitir edición
- ❌ **Imagen no-product-image.svg da 404** - Crear asset faltante

### Problemas Identificados - Pendientes
- ❌ **Traducciones incorrectas** - Los textos no se muestran correctamente
- ❌ **Fecha desde incorrecta en modal editar** - Debería ser fecha/hora actual
- ❌ **Falta calendario visual** - Necesita círculos de colores para días de atención
- ❌ **Falta notificación de consulta** - Al cerrar modal, preguntar si crear consulta
- ❌ **Solo botón eliminar visible** - Faltan botones cancelar (gris) y confirmar (azul)
- ❌ **Modo tabla con datos incorrectos** - No se visualizan correctamente
- ❌ **Tags de estado vacíos** - Algunos estados se muestran sin contenido
- ❌ **Modal componentes con anchos diferentes** - Inconsistencia visual

### Tareas a Implementar

#### Fase 1: Correcciones Inmediatas de Modal de Agenda
- [ ] **Arreglar imagen faltante no-product-image.svg**
  - Crear asset en `/assets/images/no-product-image.svg`
  - O cambiar referencia a imagen existente
  - Verificar rutas de imágenes en modales

- [ ] **Mejorar modal de búsqueda de clientes**
  - Seguir patrón de product-search-modal.component.html
  - Mejor layout responsive
  - Mejores estilos visuales
  - Loading states más claros

- [ ] **Reordenar campos en modal de crear cita**
  - 1º: Selección de Cliente (con modal de búsqueda)
  - 2º: Selección de Servicio (con modal de búsqueda)
  - 3º: Título (auto-completado pero editable)
  - 4º: Descripción
  - Mantener lógica de auto-completado del título

- [ ] **Corregir sistema de traducciones**
  - Verificar archivos de traducción (i18n)
  - Actualizar claves de traducción faltantes
  - Asegurar carga correcta del idioma seleccionado

- [ ] **Mejorar modal de editar/crear agenda**
  - Fecha desde = fecha/hora actual por defecto
  - Ajustar automáticamente al slot disponible
  - Consistencia de anchos en todos los componentes
  - Usuario actual como profesional por defecto (si tiene agenda)

- [ ] **Implementar calendario visual mejorado**
  - Círculos de colores para días de atención (verde)
  - Días no laborales en rojo (sin bloquear selección)
  - Rango automático pero con opción manual
  - Integrar componente de calendario existente

#### Fase 2: Funcionalidades Avanzadas
- [ ] **Sistema de notificación de consulta**
  - Modal de confirmación al cerrar agenda
  - "¿Desea crear una consulta para este paciente?"
  - Si SÍ: abrir modal de consulta con datos precargados
  - Si NO: cerrar normalmente
  - Si paciente no existe: formulario de creación o solicitar datos

- [ ] **Mejorar botones de acción**
  - Botón Cancelar (gris) siempre visible
  - Botón Confirmar/Guardar (azul) siempre visible
  - Botón Eliminar (rojo) solo en modo edición
  - Consistencia en todos los modales

#### Fase 3: Vista de Tabla
- [ ] **Corregir modo tabla de agenda**
  - Verificar mapeo correcto de datos
  - Asegurar visualización de todos los campos
  - Corregir estados que se muestran como tags vacíos
  - Implementar filtros funcionales

---

## 📄 SISTEMA DE FACTURAS - ALTA PRIORIDAD

### Problemas Identificados
- ❌ **Modal seleccionar item muestra productos como inactivos** - Estados incorrectos
- ❌ **Tag duplicado en Items de Factura** - Tipo de item aparece con y sin tag
- ❌ **Fecha no se pressetea** - Debería usar fecha de hoy por defecto

### Tareas a Implementar

#### Fase 1: Correcciones Inmediatas
- [ ] **Corregir modal de selección de items**
  - Verificar campo de estado en ProductResponseDto
  - Mostrar productos activos correctamente
  - Corregir lógica de filtrado por estado

- [ ] **Corregir visualización de items en tabla**
  - Eliminar tag duplicado de tipo de item
  - Mostrar tipo de item solo una vez (con tag)
  - Mejorar layout de información del item

- [ ] **Implementar fecha por defecto**
  - Presetear fecha con día de hoy
  - Formato correcto según configuración regional
  - Permitir modificación manual de fecha

---

## 🔄 INTEGRACIÓN AGENDA-FACTURA - MEDIA PRIORIDAD

### Funcionalidad Requerida
- ❌ **Workflow de turno a factura** - Cuando paciente llega, ofrecer crear factura

### Tareas a Implementar

#### Fase 1: Integración de Workflows
- [ ] **Implementar transición turno → factura**
  - Al marcar turno como "ingresado" o estado similar
  - Modal de confirmación: "¿Desea crear una factura?"
  - Si SÍ: abrir modal de nueva factura con datos del cliente precargados
  - Datos precargados: cliente, fecha, datos de contacto

- [ ] **Mejorar UX del workflow**
  - Botón rápido "Crear Factura" en vista de agenda
  - Datos automáticos: servicios basados en tipo de consulta
  - Precios sugeridos según historial del cliente

---

## 🏷️ MEJORAS VISUALES GENERALES - BAJA PRIORIDAD

### Problemas Identificados
- ❌ **Estado de productos sin tag con color** - Falta indicador visual
- ❌ **Inconsistencia de colores** - Tags y estados sin standard

### Tareas a Implementar

#### Fase 1: Standardización Visual
- [ ] **Implementar sistema de tags con colores**
  - Estado de productos: Activo (verde), Inactivo (gris), etc.
  - Estados de agenda: Confirmado (azul), Completado (verde), Cancelado (rojo)
  - Estados de factura: Pagado (verde), Pendiente (amarillo), Vencido (rojo)

- [ ] **Crear componente StatusTag reutilizable**
  - Mapeo automático estado → color
  - Configuración centralizada de colores
  - Íconos opcionales por estado

---

## 📋 VERIFICACIÓN DE DATOS MOCK

### Tarea Crítica
- [ ] **Auditoría completa de datos mock**
  - Revisar todos los componentes del sistema
  - Identificar cualquier dato hardcodeado o mock
  - Asegurar conexión real con APIs del backend
  - Documentar cualquier componente que use datos de prueba

### Componentes a Verificar
- [ ] **ProductSearchModal y componentes relacionados**
- [ ] **AgendaComponent y vistas de calendario**
- [ ] **InvoiceComponent y selección de items**
- [ ] **Dashboard y métricas generales**
- [ ] **Cliente/Customer components**

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN ACTUALIZADAS

### **🔥 Semana 1 - CRÍTICO**
1. **Portal de Clientes - Habilitación** (NUEVO - MÁXIMA PRIORIDAD)
   - Botón habilitar portal en lista clientes
   - Modal con contraseña temporal
   - Integración con endpoint backend
2. Sistema de búsqueda de productos (layout, imágenes, botón buscar)
3. Correcciones de agenda (traducciones, fecha desde, botones)

### **📋 Semana 2 - IMPORTANTE** 
1. **Portal de Clientes - Indicadores visuales** (NUEVO)
   - Badges de portal habilitado
   - Separación de campos protegidos/editables
2. Correcciones de facturas (estados, fecha por defecto)
3. Componente ProductSearch con autocompletado

### **🔧 Semana 3 - MEJORAS**
1. **Portal de Clientes - Dashboard actividad** (NUEVO)
   - Estadísticas de logins de clientes
   - Reportes de actividad en portal
2. Calendario visual en agenda
3. Integración agenda-factura

### **🎨 Semana 4 - REFINAMIENTO**
1. Sistema de historial de búsquedas
2. Notificaciones de consulta
3. Standardización visual (tags, colores)

---

## 📊 ESTADO ACTUAL

**Fecha de creación:** 2025-01-03  
**Última actualización:** 2025-01-04 - Portal de Clientes agregado  
**Basado en feedback de usuario y nueva funcionalidad backend**  
**Estado general:** ❌ PENDIENTE - Tareas identificadas pero no implementadas  

### 🚀 Próximos Pasos Inmediatos (ACTUALIZADOS)

#### **NUEVA PRIORIDAD #1: Portal de Clientes Frontend**
1. **Habilitar botón "Habilitar Portal"** en componente de lista de clientes
2. **Crear modal de confirmación** con mostrar contraseña temporal generada
3. **Integrar endpoint** `POST /api/clients/{id}/enable-portal` en servicio cliente
4. **Agregar columna/badge** para mostrar estado de portal habilitado

#### **Tareas Existentes (Prioridad reducida)**
5. Implementar correcciones de layout en ProductSearchModal
6. Corregir sistema de traducciones en agenda  
7. Verificar y corregir datos mock en todos los componentes
8. Implementar botón "Buscar" en lugar de filtrado automático

### 🔗 Recursos Técnicos para Portal de Clientes

**Endpoints Backend ya disponibles:**
```typescript
// Admin habilita portal para cliente
POST /api/clients/{id}/enable-portal
Response: { message: string, initialPassword: string }

// Nuevos campos en Client entity:  
hasPortalAccess: boolean    // Para mostrar badge
lastLogin: Date            // Para estadísticas
preferredName: string      // Campo editable por cliente
personalNotes: string      // Campo editable por cliente
```

**Cambios requeridos en ClientService/Component:**
- Agregar método `enablePortalAccess(clientId: number)`
- Actualizar ClientResponseDto para incluir campos del portal
- Modificar UI para mostrar indicadores visuales

---

**NOTA:** Este archivo debe ser consultado antes de cualquier trabajo de frontend. **EL PORTAL DE CLIENTES ES AHORA LA MÁXIMA PRIORIDAD** ya que el backend está 100% funcional y esperando integración frontend.