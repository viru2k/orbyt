# 🔔 Sistema de Notificaciones

## 📋 ¿Qué es?

El Sistema de Notificaciones mantiene a los usuarios informados en tiempo real sobre eventos importantes del sistema mediante notificaciones instantáneas, persistentes y organizadas.

## 🚀 ¿Cómo funciona?

**Automático**: Las notificaciones aparecen automáticamente en toda la aplicación
**Acceso rápido**: Icono de campana 🔔 en la barra superior
**En tiempo real**: WebSocket para notificaciones instantáneas

---

## 🔔 Centro de Notificaciones

### ¿Dónde encuentro mis notificaciones?

- **Icono de campana** en la barra superior derecha
- **Contador rojo** muestra notificaciones no leídas
- **Click en la campana** abre el panel de notificaciones

### ¿Qué veo en el panel?

**Lista de notificaciones:**
- Más recientes primero
- Estado: leída/no leída
- Fecha y hora del evento
- Acciones rápidas disponibles

**Filtros disponibles:**
- 📅 **Hoy**: Solo notificaciones de hoy
- 📝 **No leídas**: Solo pendientes de leer
- 🎁 **Recompensas**: Solo de recompensas
- 📧 **Emails**: Solo del sistema de emails
- ⚙️ **Sistema**: Solo alertas del sistema

---

## 🎯 Tipos de Notificaciones

### 🎁 Recompensas
- **Cliente gana recompensa**: "Juan Pérez ganó 'Descuento 15%'"
- **Recompensa por vencer**: "5 recompensas expiran mañana"
- **Meta alcanzada**: "¡100 recompensas canjeadas este mes!"
- **Programa popular**: "Loyalty Points es el programa más usado"

### 📧 Sistema de Emails  
- **Email enviado exitoso**: "Email de bienvenida enviado a María"
- **Error de envío**: "Falló envío a cliente@email.com"
- **Cola saturada**: "50 emails pendientes de envío"
- **Configuración**: "SMTP configurado correctamente"

### 📅 Agenda y Citas
- **Nueva cita**: "Cita agendada: Juan - 15/03 10:30am"
- **Cita cancelada**: "Cliente canceló cita del viernes"
- **Recordatorio**: "5 citas programadas para mañana"
- **Bloqueo de horario**: "Horario bloqueado exitosamente"

### 👥 Gestión de Usuarios
- **Nuevo usuario**: "Usuario Ana García registrado"
- **Permisos cambiados**: "Permisos actualizados para Juan"
- **Inicio de sesión**: "Nuevo inicio de sesión desde IP X.X.X.X"
- **Seguridad**: "Intento de acceso no autorizado"

### 💰 Facturación y Pagos
- **Pago recibido**: "Pago de $5,000 procesado correctamente"
- **Factura generada**: "Factura #F-2024-001 creada"
- **Pago pendiente**: "3 facturas vencen esta semana"
- **Error de procesamiento**: "Falló procesamiento de tarjeta"

### 🏪 Inventario
- **Stock bajo**: "Solo quedan 5 unidades de Shampoo Kerastase"
- **Producto agotado**: "Mascarilla Hidratante sin stock"
- **Movimiento registrado**: "Entrada de 20 unidades procesada"
- **Ajuste de inventario**: "Inventario ajustado manualmente"

---

## ⚡ Notificaciones en Tiempo Real

### ¿Cómo aparecen?

1. **Toast emergente**: Aparece en esquina superior derecha
2. **Duración**: 5 segundos (automático) o hasta que hagas click
3. **Sonido sutil**: Opcional según configuración del navegador
4. **No intrusivas**: No bloquean el trabajo

### Configuración del navegador

**Para habilitar notificaciones:**
- Chrome: Permitir notificaciones del sitio
- Firefox: Aceptar permisos cuando se soliciten
- Safari: Configuración → Sitios web → Notificaciones

**Para personalizar:**
- **Sonido**: En configuración del navegador
- **Persistencia**: Las importantes se guardan automáticamente
- **Frecuencia**: Controlada automáticamente por el sistema

---

## 📱 Notificaciones por Email (Respaldo)

### ¿Cuándo se envían emails también?

**Notificaciones críticas** se envían también por email:
- Errores del sistema que requieren atención inmediata
- Alertas de seguridad importantes
- Resumen diario de actividad (si está configurado)
- Cuando las notificaciones web no están disponibles

### Configurar email de respaldo

El sistema usa automáticamente:
- Email del usuario logueado
- Configuración SMTP del sistema de emails
- Plantillas específicas para notificaciones
- Horarios de envío inteligentes (no spam)

---

## 🎨 Estados de Notificaciones

### Estados visuales

📍 **No leída**: 
- Fondo azul claro
- Texto en negrita
- Punto azul a la izquierda

✅ **Leída**:
- Fondo blanco/gris claro  
- Texto normal
- Sin indicadores

⭐ **Importante**:
- Borde amarillo
- Icono de estrella
- Se mantiene visible más tiempo

🚨 **Crítica**:
- Borde rojo
- Icono de alerta
- Requiere acción manual para desaparecer

### Acciones disponibles

**Marcar como leída**: Click en la notificación
**Marcar todas como leídas**: Botón en la parte superior
**Eliminar notificación**: Botón X (solo algunas)
**Acción rápida**: Botón específico según el tipo

---

## 🔧 Gestión y Organización

### Centro de control

**Acceso**: Click prolongado en el icono de campana
- Ver todas las notificaciones (últimas 30 días)
- Filtrar por fecha, tipo, estado
- Estadísticas de notificaciones recibidas
- Configurar preferencias

### Preferencias personalizables

- **Tipos a mostrar**: Seleccionar qué notificaciones ver
- **Horario activo**: Solo en horario laboral
- **Sonidos**: Activar/desactivar
- **Email backup**: Configurar cuándo enviar por email
- **Frequencia**: Cada evento vs resumen agrupado

### Limpieza automática

- **30 días**: Notificaciones antiguas se archivan automáticamente
- **100 notificaciones**: Límite máximo por usuario
- **Críticas**: Se mantienen hasta ser marcadas como resueltas
- **Sistema**: Se limpian automáticamente cada semana

---

## 💡 Tips para usuarios

### Maximizar efectividad

✅ **Revisar diariamente**: Al iniciar y finalizar jornada
✅ **Marcar como leídas**: Mantener lista limpia
✅ **Prestar atención a críticas**: Pueden afectar el negocio
✅ **Usar filtros**: Para encontrar rápidamente lo que buscas

### Evitar saturación

❌ No ignorar notificaciones críticas
❌ No acumular muchas sin leer (ruido)
✅ Configurar solo notificaciones relevantes a tu rol
✅ Usar horario activo para evitar interrupciones

### Integrar con flujo de trabajo

📋 **Al abrir la app**: Revisar notificaciones pendientes
⚡ **Durante el trabajo**: Responder a críticas inmediatamente
📊 **Al final del día**: Revisar resumen de actividad
📱 **Fuera de horario**: Solo críticas por email

---

## ⚡ Ejemplos por Rol de Usuario

### Administrador/Propietario
- Todas las notificaciones críticas
- Resumen de métricas importantes
- Alertas de seguridad y sistema
- Notificaciones financieras

**Ejemplo típico:**
```
🚨 Error crítico: Sistema de emails desconectado
💰 Ingresos del día: $25,000 (+15% vs ayer)
👥 3 nuevos usuarios registrados
🎁 Meta mensual de recompensas alcanzada (85%)
```

### Recepcionista
- Citas agendadas/canceladas
- Nuevos clientes registrados  
- Recordatorios de tareas
- Notificaciones de agenda

**Ejemplo típico:**
```
📅 Nueva cita: María González - Corte - 2pm
📞 Cliente canceló cita de mañana (Juan Pérez)
👤 Nuevo cliente registrado: Ana Ruiz
⏰ Recordar: Llamar para confirmar citas de mañana
```

### Especialista/Profesional
- Citas del día
- Cambios en agenda personal
- Recompensas ganadas por sus clientes
- Inventario relacionado a sus servicios

**Ejemplo típico:**
```
📅 Tu próxima cita: Juan Pérez - Tratamiento facial - 3pm
🎁 Tu cliente María ganó la recompensa "Descuento 20%"
📦 Stock bajo: Crema hidratante que usas frecuentemente
⭐ Excelente evaluación de cliente (5 estrellas)
```

---

## 🆘 Problemas comunes

### "No llegan notificaciones"
1. ✅ Verificar permisos del navegador
2. ✅ Comprobar conexión a internet
3. ✅ Refrescar la página (F5)
4. ✅ Verificar que WebSocket esté conectado

### "Demasiadas notificaciones"
1. ✅ Ir a configuración de notificaciones
2. ✅ Desactivar tipos no relevantes para tu rol
3. ✅ Configurar horario activo
4. ✅ Activar modo resumen vs individual

### "No suenan las notificaciones"
1. ✅ Verificar configuración del navegador
2. ✅ Comprobar volumen del sistema
3. ✅ Verificar que el sitio tenga permisos de audio
4. ✅ Probar con notificación de prueba

### "Se acumulan sin leer"
1. ✅ Usar el botón "Marcar todas como leídas"
2. ✅ Configurar limpieza automática más frecuente
3. ✅ Filtrar por tipos relevantes
4. ✅ Establecer rutina de revisión diaria

---

## 📋 Checklist de configuración

### Configuración inicial
- [ ] Permitir notificaciones en el navegador
- [ ] Verificar que el icono de campana funcione
- [ ] Probar con una notificación de prueba
- [ ] Configurar preferencias según tu rol

### Personalización
- [ ] Seleccionar tipos de notificación relevantes
- [ ] Configurar horario activo
- [ ] Activar/desactivar sonidos según preferencia
- [ ] Configurar email de respaldo si es necesario

### Mantenimiento
- [ ] Revisar notificaciones al inicio del día
- [ ] Marcar como leídas regularmente
- [ ] Actuar sobre notificaciones críticas inmediatamente
- [ ] Limpiar notificaciones antiguas semanalmente

---

**🎯 ¡El sistema de notificaciones te mantiene informado y organizado para que no te pierdas nada importante!**