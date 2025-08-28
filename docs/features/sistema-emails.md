# 📧 Sistema de Emails

## 📋 ¿Qué es?

El Sistema de Emails permite configurar y gestionar el envío automático de correos electrónicos, con plantillas personalizables, métricas de rendimiento y configuración SMTP.

## 🚀 ¿Cómo acceder?

**Menú Principal** → **Emails** → Seleccionar opción:
- 📊 **Dashboard**: `/email/dashboard`
- ⚙️ **Configuración**: `/email/settings` 
- 🧪 **Probar Email**: `/email/test`

---

## 📊 Dashboard de Emails

### ¿Qué puedes ver?

**Métricas principales:**
- 📨 Total de emails enviados
- ❌ Total de emails fallidos
- ✅ Tasa de éxito de entrega
- ⏱️ Tiempo promedio de procesamiento

**Gráficos de análisis:**
- **Distribución diaria**: Emails enviados por día de la semana
- **Horas más activas**: Picos de envío durante el día
- **Plantillas populares**: Más utilizadas vs menos utilizadas
- **Tendencias mensuales**: Evolución del volumen de emails

**Actividad reciente:**
- Últimos emails enviados exitosamente
- Errores recientes con detalles
- Cola de emails pendientes de envío

---

## ⚙️ Configuración SMTP

### Configurar servidor de correo

1. **Elegir proveedor:**
   - **Gmail** (recomendado para empezar)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Servidor personalizado**

2. **Configuración automática (Gmail):**
   - Host: `smtp.gmail.com`
   - Puerto: `587`
   - Seguridad: `TLS`
   - Usuario: tu email de Gmail
   - Contraseña: contraseña de aplicación

### ¿Cómo obtener contraseña de aplicación en Gmail?

1. Ve a tu cuenta de Google → Seguridad
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera nueva contraseña para "Correo"
5. Usa esa contraseña (no tu contraseña normal)

### Probar configuración

- Botón **"Test Connection"** verifica la conexión
- Si funciona: ✅ "Conexión exitosa"
- Si falla: ❌ Revisa usuario y contraseña

---

## 📝 Gestión de Plantillas

### Plantillas predefinidas

**Disponibles automáticamente:**
- 🎉 **Bienvenida**: Para nuevos usuarios
- 🔑 **Reset Password**: Recuperar contraseña
- 📅 **Recordatorio de Cita**: 24h antes
- ✅ **Confirmación de Cita**: Después de agendar
- 🎁 **Recompensa Ganada**: Cliente gana premio
- ⏰ **Recompensa por Vencer**: Antes de expirar

### Personalizar plantillas

**Variables disponibles:**
- `{{clientName}}`: Nombre del cliente
- `{{date}}`: Fecha de la cita
- `{{time}}`: Hora de la cita
- `{{businessName}}`: Nombre de tu negocio
- `{{rewardName}}`: Nombre de la recompensa
- `{{points}}`: Puntos ganados

**Ejemplo de plantilla:**
```
Hola {{clientName}},

¡Felicidades! Has ganado la recompensa "{{rewardName}}" 
por tu lealtad a {{businessName}}.

Tienes {{points}} puntos acumulados.

¡Gracias por confiar en nosotros!
```

---

## 🧪 Probar Email

### Tipos de prueba disponibles

1. **Email simple:**
   - Destinatario único
   - Mensaje de texto básico
   - Para verificar que la configuración funciona

2. **Email con plantilla:**
   - Seleccionar plantilla existente
   - Preview antes de enviar
   - Ver cómo se renderiza

3. **Email masivo:**
   - Lista de múltiples destinatarios
   - Usar plantilla común
   - Envío en lote controlado

4. **Test de conexión:**
   - Solo verifica conectividad SMTP
   - No envía emails reales
   - Diagnóstico rápido

### Consejos para pruebas

✅ **Siempre probar primero** con tu propio email
✅ **Verificar plantillas** en preview antes de envío masivo  
✅ **Empezar con pocos destinatarios** en emails masivos
✅ **Revisar spam** si no llegan los emails

---

## 🔄 ¿Cómo funciona automáticamente?

### Emails automáticos del sistema

El sistema envía emails automáticamente cuando:

1. **Cliente gana recompensa** → Email de felicitación
2. **Recompensa por vencer** → Email recordatorio  
3. **Cita agendada** → Email de confirmación
4. **24h antes de cita** → Email recordatorio
5. **Usuario registrado** → Email de bienvenida
6. **Reset de contraseña** → Email con link

### Integración con otros sistemas

- **Recompensas**: Emails cuando se ganan puntos
- **Agenda**: Recordatorios automáticos de citas
- **Usuarios**: Bienvenida y recuperación
- **Notificaciones**: Backup cuando notif. fallan

---

## 💡 Tips y mejores prácticas

### Para maximizar entregas

1. **Configuración correcta**: Verificar SMTP siempre
2. **Contraseña de app**: Nunca usar contraseña normal
3. **Horarios apropiados**: Evitar fines de semana y noches
4. **Contenido relevante**: No spam, solo info útil

### Evitar que lleguen a spam

❌ Evitar palabras como "GRATIS", "URGENTE", "GANAR DINERO"
❌ No usar MAYÚSCULAS excesivas
❌ Incluir siempre opción de "dar de baja"
✅ Usar remitente reconocible (tu nombre/negocio)
✅ Contenido personal y relevante

### Monitorear rendimiento

📈 **Tasa de entrega** debe ser > 95%
📊 **Tiempo de procesamiento** debe ser < 30 segundos
🔍 **Revisar errores** diariamente en Dashboard
📝 **Ajustar plantillas** según feedback de clientes

---

## ⚡ Casos de uso comunes

### Salón de Belleza
- **Recordatorio 24h**: "Tu cita de manicure es mañana a las 3pm"
- **Post-servicio**: "¡Gracias por visitarnos! Ganaste 50 puntos"
- **Promoción mensual**: "20% off en tratamientos faciales este mes"

### Consultorio Médico  
- **Confirmación**: "Cita confirmada para el 15/03 a las 10:30am"
- **Recordatorio**: "No olvides tu cita mañana, Dr. García te espera"
- **Seguimiento**: "¿Cómo te sientes después del tratamiento?"

### Spa & Wellness
- **Bienvenida VIP**: "Bienvenido al programa VIP, disfruta beneficios exclusivos"
- **Cumpleaños**: "¡Feliz cumpleaños! Tienes un regalo especial esperándote"
- **Reactivación**: "Te extrañamos, regresa y obtén 30% descuento"

---

## 🆘 Problemas comunes

### "No se envían los emails"
1. ✅ Verificar configuración SMTP en `/email/settings`
2. ✅ Probar conexión con botón "Test Connection"  
3. ✅ Revisar si usas contraseña de aplicación (Gmail)
4. ✅ Verificar que el servidor SMTP esté correcto

### "Los emails llegan a spam"
1. ✅ Cambiar el asunto (evitar palabras spam)
2. ✅ Usar remitente reconocible  
3. ✅ Incluir contenido personal
4. ✅ Evitar enlaces sospechosos

### "Emails muy lentos"
1. ✅ Verificar conexión a internet
2. ✅ Revisar configuración del servidor SMTP
3. ✅ Reducir cantidad en envíos masivos
4. ✅ Contactar a tu proveedor de email

### "Error de autenticación"
1. ✅ Verificar usuario y contraseña
2. ✅ Para Gmail: usar contraseña de aplicación
3. ✅ Verificar que 2FA esté activo (Gmail)
4. ✅ Revisar configuración de seguridad de la cuenta

---

## 📋 Checklist de configuración inicial

### Paso 1: Configurar SMTP
- [ ] Ir a `/email/settings`
- [ ] Seleccionar proveedor (Gmail recomendado)
- [ ] Configurar usuario y contraseña de aplicación
- [ ] Hacer clic en "Test Connection"
- [ ] Verificar mensaje ✅ "Conexión exitosa"

### Paso 2: Probar funcionamiento  
- [ ] Ir a `/email/test`
- [ ] Enviar email simple a tu propio correo
- [ ] Verificar que llegue correctamente
- [ ] Probar una plantilla

### Paso 3: Personalizar plantillas
- [ ] Revisar plantillas predefinidas
- [ ] Personalizar con nombre de tu negocio
- [ ] Hacer preview de cada plantilla
- [ ] Probar con datos reales

### Paso 4: Monitoreo
- [ ] Ir a `/email/dashboard` diariamente
- [ ] Revisar tasa de éxito (debe ser >95%)
- [ ] Verificar que no hay errores acumulados
- [ ] Ajustar según métricas

---

**🎯 ¡Con el sistema configurado, tus clientes recibirán comunicación automática y profesional!**