# 🎯 How-To: Sistema Completo de Recompensas, Emails y Notificaciones

## 📋 Guía Completa de Funcionalidades Implementadas

---

## 🎁 Sistema de Recompensas

### 📍 **Acceso al Sistema**
- **Menú Principal**: `Recompensas` → `Dashboard | Gestión de Programas | Vista del Cliente`
- **URLs Directas**:
  - Dashboard: `/rewards/dashboard`
  - Gestión: `/rewards/management`
  - Vista Cliente: `/rewards/client-view`

### 🎯 **Funcionalidades Principales**

#### **1. Dashboard de Recompensas** (`/rewards/dashboard`)
**¿Qué hace?**
- Muestra métricas generales del sistema de recompensas
- Gráficos de tendencias y distribución
- Top 3 programas más populares
- Actividad reciente de usuarios

**Métricas que muestra:**
- **Programas Totales**: Cantidad de programas creados
- **Recompensas Otorgadas**: Total de recompensas ganadas por clientes
- **Puntos Acumulados**: Suma de puntos en el sistema
- **Tasa de Canje**: Porcentaje de recompensas canjeadas

**Gráficos disponibles:**
- **Distribución de Recompensas**: Canjeadas vs Pendientes vs Expiradas
- **Tendencia de Puntos**: Evolución mensual de puntos otorgados y canjeados
- **Programas Más Populares**: Ranking por número de canjes

#### **2. Gestión de Programas** (`/rewards/management`)
**¿Qué hace?**
- CRUD completo de programas de recompensas
- Configuración de condiciones y recompensas
- Activar/desactivar programas
- Ver estadísticas por programa

**Tipos de Condiciones (Triggers):**
- `VISIT_COUNT`: Número de visitas/citas
- `PURCHASE_AMOUNT`: Monto mínimo de compra
- `REFERRAL`: Cliente refiere a otro cliente
- `BIRTHDAY`: Recompensa de cumpleaños
- `LOYALTY_TIME`: Tiempo de permanencia como cliente

**Tipos de Recompensas:**
- `DISCOUNT_PERCENTAGE`: Descuento porcentual
- `DISCOUNT_FIXED`: Descuento fijo en pesos
- `FREE_SERVICE`: Servicio gratuito
- `POINTS`: Puntos acumulables
- `GIFT`: Regalo físico o digital

**Configuración avanzada:**
- Máximo de usos por cliente
- Fechas de validez
- Apilable con otros descuentos
- Aplicación automática o manual

#### **3. Vista del Cliente** (`/rewards/client-view`)
**¿Qué hace?**
- Muestra las recompensas desde la perspectiva del cliente
- Recompensas activas con progreso
- Historial de canjes
- Recompensas disponibles para usar

**Información mostrada:**
- Progreso hacia la próxima recompensa
- Recompensas listas para canjear
- Fechas de expiración
- Historial completo de actividad

---

## 📧 Sistema de Emails

### 📍 **Acceso al Sistema**
- **Menú Principal**: `Emails` → `Dashboard | Configuración | Probar Email`
- **URLs Directas**:
  - Dashboard: `/email/dashboard`
  - Configuración: `/email/settings`
  - Pruebas: `/email/test`

### 🎯 **Funcionalidades Principales**

#### **1. Dashboard de Emails** (`/email/dashboard`)
**¿Qué hace?**
- Analytics completo del sistema de emails
- Estadísticas de entrega y rendimiento
- Métricas por plantilla
- Cola de emails pendientes

**Métricas que muestra:**
- **Total Enviados**: Emails enviados exitosamente
- **Total Fallidos**: Emails que no se pudieron enviar
- **Tasa de Éxito**: Porcentaje de entrega exitosa
- **Tiempo Promedio**: Tiempo de procesamiento

**Estadísticas detalladas:**
- Distribución por hora del día
- Plantillas más utilizadas
- Análisis de errores comunes
- Tendencias diarias/mensuales

#### **2. Configuración SMTP** (`/email/settings`)
**¿Qué hace?**
- Configurar servidor SMTP para envío de emails
- Presets para proveedores populares
- Prueba de conectividad
- Gestión de plantillas

**Proveedores soportados:**
- **Gmail**: Configuración automática
- **Outlook**: Configuración automática  
- **Yahoo**: Configuración automática
- **Personalizado**: Configuración manual

**Configuración SMTP:**
```
Host: smtp.gmail.com
Puerto: 587
Seguridad: TLS/SSL
Usuario: tu-email@gmail.com
Contraseña: contraseña-de-aplicación
```

**Plantillas predefinidas:**
- Bienvenida de usuario
- Reset de contraseña
- Recordatorio de cita
- Confirmación de cita
- Notificación de recompensa
- Plantillas personalizadas

#### **3. Probar Email** (`/email/test`)
**¿Qué hace?**
- Envío de emails de prueba
- Validación de configuración
- Test de plantillas
- Preview de emails

**Tipos de prueba:**
- Email simple (texto plano)
- Email con plantilla
- Email masivo (lista de destinatarios)
- Test de conexión SMTP

---

## 🔔 Sistema de Notificaciones

### 📍 **Integración Automática**
- Las notificaciones están integradas automáticamente en todo el sistema
- No requieren configuración adicional por parte del usuario
- Se muestran en tiempo real mediante WebSockets

### 🎯 **Funcionalidades Automáticas**

#### **1. Notificaciones en Tiempo Real**
**¿Cómo funcionan?**
- Conexión WebSocket automática
- Notificaciones toast no intrusivas
- Contador de no leídas en header
- Persistencia en base de datos

**Tipos de notificaciones:**
- **Recompensa Ganada**: Cliente gana nueva recompensa
- **Recompensa por Vencer**: Recompensa expira pronto
- **Email Enviado**: Confirmación de envío exitoso
- **Email Fallido**: Alerta de email no entregado
- **Cita Programada**: Nueva cita en agenda
- **Sistema**: Actualizaciones del sistema

#### **2. Centro de Notificaciones**
**Acceso**: Icono de campana en el header
- Lista de todas las notificaciones
- Marcar como leída/no leída
- Filtros por tipo y fecha
- Acciones rápidas por notificación

#### **3. Notificaciones por Email**
**Integración automática:**
- Las notificaciones importantes se envían también por email
- Utiliza las plantillas del sistema de emails
- Respeta las preferencias del usuario
- Fallback si WebSocket no está disponible

---

## 🔧 Integraciones Entre Sistemas

### **Recompensas ↔ Emails**
1. **Nueva recompensa ganada** → Email de felicitación
2. **Recompensa por vencer** → Email recordatorio
3. **Canje exitoso** → Email de confirmación

### **Recompensas ↔ Notificaciones**
1. **Cliente gana puntos** → Notificación en tiempo real
2. **Nueva recompensa disponible** → Toast notification
3. **Progreso hacia recompensa** → Actualización de progreso

### **Emails ↔ Notificaciones**
1. **Email enviado exitosamente** → Notificación de confirmación
2. **Email falló** → Notificación de error
3. **Cola de emails saturada** → Alerta administrativa

### **Agenda ↔ Sistemas**
1. **Cita completada** → Trigger de recompensas
2. **Recordatorio de cita** → Email automático
3. **Cita cancelada** → Email de notificación

---

## 🚀 Flujos de Trabajo Típicos

### **Scenario 1: Configuración Inicial**
1. Ir a `/email/settings`
2. Configurar SMTP (Gmail recomendado)
3. Probar conexión
4. Ir a `/rewards/management`
5. Crear programa de recompensas básico:
   - Nombre: "Cliente Fiel"
   - Condición: 5 visitas
   - Recompensa: 10% descuento
6. Activar programa

### **Scenario 2: Cliente Gana Recompensa**
1. **Trigger automático**: Cliente completa 5ta cita
2. **Sistema evalúa**: Cliente cumple condición "5 visitas"
3. **Recompensa otorgada**: Se asigna descuento 10%
4. **Email enviado**: Felicitación con código de descuento
5. **Notificación**: Toast "¡Cliente ganó recompensa!"
6. **Dashboard actualizado**: Métricas reflejan nueva recompensa

### **Scenario 3: Campaña de Email**
1. Ir a `/email/test`
2. Seleccionar plantilla "Promoción mensual"
3. Cargar lista de emails de clientes VIP
4. Preview del email
5. Enviar campaña
6. **Dashboard monitorea**: Entrega en tiempo real
7. **Notificaciones**: Alertas de emails fallidos

### **Scenario 4: Análisis y Reportes**
1. **Dashboard Recompensas**: Ver ROI de programas
2. **Dashboard Emails**: Analizar tasa de apertura
3. **Centro de Notificaciones**: Revisar actividad reciente
4. **Tomar decisiones**: Ajustar programas según métricas

---

## 📊 APIs y Endpoints Disponibles

### **Recompensas API**
```
GET /rewards/programs - Listar programas
POST /rewards/programs - Crear programa
PUT /rewards/programs/:id - Actualizar programa
DELETE /rewards/programs/:id - Eliminar programa
GET /rewards/metrics - Métricas del sistema
POST /rewards/trigger/:clientId - Trigger manual
```

### **Email API**
```
GET /email/settings - Configuración SMTP
POST /email/settings - Guardar configuración
POST /email/settings/test - Probar conexión
GET /email/templates - Listar plantillas
POST /email/send - Enviar email
POST /email/send/bulk - Envío masivo
GET /email/metrics - Analytics de emails
```

### **Notificaciones API**
```
GET /notifications - Listar notificaciones
POST /notifications - Crear notificación
PUT /notifications/:id/read - Marcar como leída
GET /notifications/unread - No leídas
POST /notifications/test-websocket - Test WebSocket
```

---

## 🎯 Best Practices

### **Para Recompensas:**
1. **Empezar simple**: Un programa básico por tipo de cliente
2. **Testear condiciones**: Verificar que los triggers funcionan
3. **Monitorear métricas**: ROI y tasa de canje
4. **Comunicar valor**: Emails claros sobre beneficios

### **Para Emails:**
1. **Configurar SMTP primero**: Sin esto nada funciona
2. **Probar plantillas**: Preview antes de envío masivo
3. **Monitorear entregas**: Dashboard en tiempo real
4. **Listas segmentadas**: Emails relevantes por grupo

### **Para Notificaciones:**
1. **No spam**: Solo notificaciones importantes
2. **Timing apropiado**: Horarios laborales
3. **Acciones claras**: CTA específicos
4. **Persistencia**: Importante que se guarden

---

## 🆘 Troubleshooting Común

### **Emails no se envían**
1. Verificar configuración SMTP en `/email/settings`
2. Probar conexión con botón "Test Connection"
3. Revisar logs en `/email/dashboard`
4. Verificar contraseña de aplicación (Gmail)

### **Recompensas no se activan**
1. Verificar que el programa esté activo
2. Revisar condiciones del trigger
3. Comprobar fechas de validez
4. Ver logs en Dashboard

### **Notificaciones no llegan**
1. Verificar conexión WebSocket
2. Refrescar la página
3. Revisar permisos de notificaciones del navegador
4. Comprobar que el backend esté corriendo

### **Dashboard muestra datos vacíos**
1. Verificar que el backend esté respondiendo
2. Revisar consola del navegador por errores
3. Comprobar que hay datos en el sistema
4. Refrescar métricas con botón refresh

---

## 🔄 Actualizaciones y Mantenimiento

### **Monitoreo Regular**
- Dashboard de emails: Revisar tasa de entrega diaria
- Dashboard de recompensas: Evaluar ROI semanal
- Centro de notificaciones: Revisar alertas de sistema

### **Optimizaciones**
- Ajustar programas de recompensas según métricas
- Optimizar plantillas de email por tasa de apertura
- Configurar alertas automáticas para fallos

### **Backup y Seguridad**
- Las configuraciones SMTP están encriptadas
- Los logs de email se archivan automáticamente
- Las métricas se respaldan diariamente

---

**✅ Sistema completamente implementado y funcional**
**🔧 Backend APIs operativos en localhost:3000**
**🎨 Frontend integrado en menús y rutas**
**📱 Responsive y optimizado para móviles**