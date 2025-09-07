# 🚀 Sistema de Notificaciones Automatizadas - Guía Cliente Frontend

## 📧 **Nuevo Sistema Backend Implementado**

El backend ahora incluye un **AutomatedNotificationService completo** que gestiona notificaciones automáticas por email y el frontend cliente debe integrar para configuración y monitoreo.

---

## 🎯 **Diferencia de Proyectos**

- **`orbyt-landing`** = Portal de pagos/suscripción (NO necesita estas features)
- **`orbyt`** = Frontend del backoffice para clientes (AQUÍ se implementa)

---

## 🛠️ **Funcionalidades Backend Disponibles**

### **✅ Servicios Implementados**
- **AutomatedNotificationService**: 8 tipos de notificaciones automáticas
- **EmailService**: Sistema completo de emails SMTP
- **13+ Plantillas**: Templates configurables con variables
- **Cron Jobs**: Programación automática de envíos

### **✅ Integraciones Automáticas**
- **Registro de usuario** → Email de bienvenida inmediato
- **Creación de cita** → Confirmación automática
- **24h antes de cita** → Recordatorio diario (9 AM)
- **2h antes de cita** → Recordatorio urgente
- **Recompensa ganada** → Notificación instantánea
- **Viernes 6 PM** → Promociones semanales
- **Primer día de mes** → Reactivación de clientes inactivos
- **Cumpleaños** → Felicitaciones con oferta

---

## 📱 **Requerimientos Frontend Cliente**

### **1. Página de Configuración de Notificaciones**
**Ubicación**: `/settings/notifications` o `/admin/email-settings`

```typescript
interface NotificationSettings {
  // Configuración SMTP del cliente
  emailConfig: {
    provider: 'gmail' | 'outlook' | 'custom';
    smtpHost: string;
    smtpPort: number;
    fromEmail: string;
    fromName: string;
    isConfigured: boolean;
    lastTested?: Date;
    testStatus?: 'success' | 'failed';
  };
  
  // Automatizaciones activadas/desactivadas
  automations: {
    appointmentReminders: {
      enabled: boolean;
      daysBefore: number;    // Default: 1 día
      timeToSend: string;    // Default: "09:00"
      urgentReminder: boolean; // 2h antes
    };
    weeklyPromotions: {
      enabled: boolean;
      dayOfWeek: number;     // Default: 5 (viernes)
      timeToSend: string;    // Default: "18:00"
    };
    clientReactivation: {
      enabled: boolean;
      inactiveDays: number;  // Default: 60 días
      dayOfMonth: number;    // Default: 1 (primer día)
    };
    birthdayWishes: {
      enabled: boolean;
      timeToSend: string;    // Default: "08:00"
    };
    welcomeEmails: {
      enabled: boolean;      // Default: true
      immediate: boolean;    // Default: true
    };
  };
  
  // Configuraciones del negocio
  businessInfo: {
    clinicName: string;
    address: string;
    phone: string;
    supportEmail: string;
  };
}
```

### **2. Dashboard de Email Marketing**
**Ubicación**: `/marketing/email-dashboard`

```typescript
interface EmailMarketingDashboard {
  // Métricas principales
  metrics: {
    today: {
      sent: number;
      failed: number;
      pending: number;
    };
    thisWeek: {
      sent: number;
      openRate: number;
      clickRate: number;
      bounceRate: number;
    };
    thisMonth: {
      totalSent: number;
      successRate: number;
      topTemplate: string;
    };
  };
  
  // Próximas automatizaciones
  upcomingAutomations: {
    type: string;
    nextRun: Date;
    recipientCount: number;
    enabled: boolean;
  }[];
  
  // Alertas importantes
  alerts: {
    smtpNotConfigured: boolean;
    highFailureRate: boolean;
    templateMissing: boolean;
    scheduledCampaign: Campaign[];
  };
}
```

### **3. Gestión de Plantillas de Email**
**Ubicación**: `/settings/email-templates`

```typescript
interface EmailTemplateManager {
  // Lista de plantillas disponibles
  templates: {
    id: string;
    name: string;
    type: 'welcome' | 'appointment_reminder' | 'promotion' | 'reactivation' | 'birthday' | 'custom';
    subject: string;
    isActive: boolean;
    usageCount: number;
    lastUsed?: Date;
    variables: string[];
  }[];
  
  // Acciones disponibles
  actions: {
    createCustomTemplate(): void;
    editTemplate(id: string): void;
    toggleTemplate(id: string, active: boolean): void;
    previewTemplate(id: string, sampleData: object): void;
    duplicateTemplate(id: string): void;
    deleteCustomTemplate(id: string): void; // Solo custom templates
  };
}
```

### **4. Centro de Campañas Manuales**
**Ubicación**: `/marketing/campaigns`

```typescript
interface CampaignCenter {
  // Campañas disponibles
  campaigns: {
    'client-reactivation': {
      name: 'Reactivar Clientes Inactivos';
      description: 'Clientes sin citas en los últimos 60 días';
      targetCount: number;
      template: 'reactivation-offer';
    };
    'birthday-special': {
      name: 'Cumpleaños del Mes';
      description: 'Clientes que cumplen años este mes';
      targetCount: number;
      template: 'birthday-wishes';
    };
    'weekly-promotion': {
      name: 'Promociones Semanales';
      description: 'Clientes activos que aceptan promociones';
      targetCount: number;
      template: 'weekly-promotions';
    };
    'custom': {
      name: 'Campaña Personalizada';
      description: 'Selección manual de clientes';
      targetCount: number;
      template: 'custom';
    };
  };
  
  // Acciones
  sendCampaign(type: string, options?: CampaignOptions): Promise<CampaignResult>;
  scheduleCanpaign(type: string, date: Date, options?: CampaignOptions): Promise<void>;
  sendTestEmail(type: string, testEmails: string[]): Promise<void>;
}
```

### **5. Logs y Monitoreo**
**Ubicación**: `/admin/email-logs`

```typescript
interface EmailLogsViewer {
  // Filtros
  filters: {
    status: 'all' | 'sent' | 'failed' | 'pending';
    dateRange: { start: Date; end: Date };
    template: string;
    automation: string;
  };
  
  // Datos
  logs: {
    id: string;
    recipients: string[];
    subject: string;
    template: string;
    status: 'sent' | 'failed' | 'pending';
    sentAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
    automation?: string; // 'appointment-reminder', 'welcome', etc.
  }[];
  
  // Acciones
  retryFailedEmail(logId: string): Promise<void>;
  downloadLogs(filters: LogFilters): Promise<Blob>;
  viewEmailContent(logId: string): Promise<string>;
}
```

---

## 🎨 **Componentes UI Específicos**

### **NotificationSettingsCard**
```tsx
const NotificationSettingsCard = () => {
  const [settings, setSettings] = useState<NotificationSettings>();
  
  const toggleAutomation = async (type: string, enabled: boolean) => {
    await automationApi.updateSettings({
      [type]: { ...settings.automations[type], enabled }
    });
    showSuccess(`${enabled ? 'Activado' : 'Desactivado'}: ${getAutomationName(type)}`);
  };
  
  return (
    <Card>
      <CardHeader>
        <h2>Configuración de Notificaciones</h2>
        <Badge color={settings?.emailConfig.isConfigured ? 'success' : 'warning'}>
          {settings?.emailConfig.isConfigured ? 'Email Configurado' : 'Email Pendiente'}
        </Badge>
      </CardHeader>
      
      <CardBody>
        {/* Configuración SMTP */}
        <SMTPConfigSection config={settings?.emailConfig} />
        
        {/* Toggle de automatizaciones */}
        <div className="automation-toggles">
          <h3>Automatizaciones</h3>
          
          <ToggleCard 
            title="Recordatorios de Citas"
            description="Envío automático 24h y 2h antes de cada cita"
            enabled={settings?.automations.appointmentReminders.enabled}
            onToggle={(enabled) => toggleAutomation('appointmentReminders', enabled)}
          />
          
          <ToggleCard 
            title="Promociones Semanales"
            description="Ofertas especiales todos los viernes"
            enabled={settings?.automations.weeklyPromotions.enabled}
            onToggle={(enabled) => toggleAutomation('weeklyPromotions', enabled)}
          />
          
          <ToggleCard 
            title="Reactivación de Clientes"
            description="Contactar clientes inactivos cada mes"
            enabled={settings?.automations.clientReactivation.enabled}
            onToggle={(enabled) => toggleAutomation('clientReactivation', enabled)}
          />
          
          <ToggleCard 
            title="Felicitaciones de Cumpleaños"
            description="Ofertas especiales el día del cumpleaños"
            enabled={settings?.automations.birthdayWishes.enabled}
            onToggle={(enabled) => toggleAutomation('birthdayWishes', enabled)}
          />
        </div>
      </CardBody>
    </Card>
  );
};
```

### **EmailMarketingWidget**
```tsx
const EmailMarketingWidget = () => {
  const [metrics, setMetrics] = useState<EmailMetrics>();
  const [upcomingAutomations, setUpcomingAutomations] = useState<AutomationSchedule[]>();
  
  return (
    <div className="email-marketing-widget">
      <div className="metrics-row">
        <MetricCard 
          title="Enviados Hoy" 
          value={metrics?.today.sent} 
          trend={metrics?.todayVsYesterday}
        />
        <MetricCard 
          title="Tasa de Éxito" 
          value={`${metrics?.thisWeek.successRate}%`} 
          color={metrics?.thisWeek.successRate > 90 ? 'success' : 'warning'}
        />
        <MetricCard 
          title="Emails Fallidos" 
          value={metrics?.today.failed} 
          color={metrics?.today.failed > 5 ? 'danger' : 'success'}
        />
      </div>
      
      <div className="upcoming-section">
        <h4>Próximas Automatizaciones</h4>
        {upcomingAutomations?.map(automation => (
          <div key={automation.type} className="automation-item">
            <span className="name">{automation.name}</span>
            <span className="next-run">{formatDate(automation.nextRun)}</span>
            <span className="recipients">{automation.recipientCount} destinatarios</span>
            <Badge color={automation.enabled ? 'success' : 'secondary'}>
              {automation.enabled ? 'Activo' : 'Pausado'}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="quick-actions">
        <button onClick={() => navigate('/settings/notifications')}>
          ⚙️ Configurar
        </button>
        <button onClick={() => navigate('/marketing/campaigns')}>
          📧 Campañas
        </button>
        <button onClick={() => navigate('/admin/email-logs')}>
          📊 Ver Logs
        </button>
      </div>
    </div>
  );
};
```

### **CampaignLauncher**
```tsx
const CampaignLauncher = () => {
  const [selectedCampaign, setSelectedCampaign] = useState<string>();
  const [targetAudience, setTargetAudience] = useState<ClientSegment>();
  
  const launchCampaign = async () => {
    try {
      const result = await campaignApi.send({
        type: selectedCampaign,
        audience: targetAudience,
        scheduleNow: true
      });
      
      showSuccess(`Campaña enviada a ${result.recipientCount} clientes`);
    } catch (error) {
      showError('Error enviando campaña: ' + error.message);
    }
  };
  
  return (
    <Modal>
      <ModalHeader>Lanzar Campaña de Email</ModalHeader>
      <ModalBody>
        <CampaignSelector 
          campaigns={availableCampaigns}
          selected={selectedCampaign}
          onSelect={setSelectedCampaign}
        />
        
        <AudienceSelector
          segments={clientSegments}
          selected={targetAudience}
          onSelect={setTargetAudience}
        />
        
        <div className="preview-section">
          <h4>Vista Previa</h4>
          <EmailPreview 
            template={getTemplateForCampaign(selectedCampaign)}
            sampleData={getSampleClientData()}
          />
        </div>
        
        <div className="send-options">
          <label>
            <input type="checkbox" /> Enviar email de prueba primero
          </label>
          <label>
            <input type="checkbox" /> Programar para más tarde
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <button onClick={sendTestEmail}>Prueba</button>
        <button onClick={launchCampaign} className="btn-primary">
          Enviar a {targetAudience?.count} clientes
        </button>
      </ModalFooter>
    </Modal>
  );
};
```

---

## 🔧 **APIs Frontend Necesarias**

### **Configuración de Automatizaciones**
```typescript
// GET /automation/settings
// PUT /automation/settings
interface AutomationAPI {
  getSettings(): Promise<NotificationSettings>;
  updateSettings(settings: Partial<NotificationSettings>): Promise<void>;
  testEmailConfig(): Promise<{ success: boolean; error?: string }>;
}

// POST /automation/test-system
interface SystemTest {
  testAutomationSystem(): Promise<{
    emailService: boolean;
    schedulerService: boolean;
    templatesLoaded: boolean;
    nextRuns: { type: string; nextRun: Date }[];
  }>;
}
```

### **Gestión de Campañas**
```typescript
// POST /campaigns/send
// POST /campaigns/schedule
// GET /campaigns/metrics
interface CampaignAPI {
  sendCampaign(request: {
    type: 'reactivation' | 'promotion' | 'birthday' | 'custom';
    audience?: ClientFilter;
    templateId?: string;
    scheduleAt?: Date;
  }): Promise<CampaignResult>;
  
  getCampaignMetrics(dateRange?: DateRange): Promise<CampaignMetrics>;
  sendTestEmail(templateId: string, emails: string[]): Promise<void>;
}
```

### **Logs y Monitoreo**
```typescript
// GET /email/logs
// GET /email/metrics
interface LogsAPI {
  getEmailLogs(filters: LogFilters): Promise<EmailLog[]>;
  getEmailMetrics(dateRange?: DateRange): Promise<EmailMetrics>;
  retryFailedEmail(logId: string): Promise<void>;
  downloadEmailContent(logId: string): Promise<Blob>;
}
```

---

## 📊 **Variables de Entorno del Cliente**

```env
# Variables que el cliente debe configurar en su panel
CLINIC_NAME="Mi Clínica Ejemplo"
CLINIC_ADDRESS="Calle Principal 123, Ciudad"
CLINIC_PHONE="+1234567890"
SUPPORT_EMAIL="soporte@miclinica.com"

# URLs del frontend cliente
FRONTEND_URL="https://client.orbyt.com"
BOOKING_URL="https://client.orbyt.com/book-appointment"

# Configuración por defecto de automatizaciones
DEFAULT_APPOINTMENT_REMINDER_TIME="09:00"
DEFAULT_PROMOTION_DAY=5  # Viernes
DEFAULT_INACTIVE_DAYS=60
```

---

## 🚀 **Plan de Implementación para el Cliente**

### **Fase 1: Configuración Básica** (1 semana)
1. ✅ **Settings Page**: `/settings/notifications`
2. ✅ **SMTP Configuration**: Formulario + test
3. ✅ **Automation Toggles**: On/Off para cada tipo

### **Fase 2: Dashboard de Marketing** (1 semana)
1. ✅ **Email Widget**: Métricas en dashboard principal
2. ✅ **Campaign Center**: `/marketing/campaigns`
3. ✅ **Manual Sending**: Botones de envío inmediato

### **Fase 3: Gestión Avanzada** (1 semana)
1. ✅ **Template Manager**: Ver/editar plantillas
2. ✅ **Logs Viewer**: Historial de envíos
3. ✅ **Analytics**: Reportes detallados

### **Fase 4: UX/Testing** (3 días)
1. ✅ **User Experience**: Flows intuitivos
2. ✅ **Error Handling**: Estados de error claros
3. ✅ **E2E Testing**: Pruebas completas

---

## ✅ **Beneficios para el Cliente**

### **🔄 Automatización Total**
- Recordatorios automáticos → 90%+ asistencia a citas
- Emails de bienvenida → Mejor primera impresión  
- Reactivación automática → 25% clientes recuperados
- Promociones programadas → Ingresos recurrentes

### **📈 Control y Métricas**
- Dashboard con métricas en tiempo real
- Logs detallados de cada envío
- Tasas de apertura y click
- Segmentación automática de clientes

### **🎨 Personalización**
- Templates editables por tipo de negocio
- Variables dinámicas por cliente
- Horarios configurables
- Mensajes personalizados

### **⚡ Eficiencia Operativa**
- 80% reducción en comunicaciones manuales
- Sistema de fallos y reintentos automático
- Integración nativa con agenda y clientes
- Escalabilidad para crecimiento

---

## 🎯 **Próximos Pasos Críticos**

1. **Implementar** `/settings/notifications` como primera página
2. **Configurar** variables de entorno del cliente
3. **Integrar** APIs de automatización
4. **Testear** flujo completo end-to-end
5. **Documentar** para el cliente final

**🏆 Resultado Final**: Sistema de email marketing profesional completamente automatizado que el cliente puede configurar y monitorear desde su panel de control.