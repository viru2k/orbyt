# Mejoras Requeridas en Backend - Sistema de Recompensas y Email

## 🎯 Sistema de Recompensas - Pendientes Backend

### 1. DTOs Incompletos
Los siguientes DTOs están vacíos y necesitan implementación completa:

#### `CreateRewardProgramDto`
```typescript
export interface CreateRewardProgramDto {
  name: string;
  description: string;
  businessType: string;
  rewardType: 'DISCOUNT_PERCENTAGE' | 'DISCOUNT_FIXED' | 'FREE_SERVICE' | 'POINTS' | 'GIFT';
  triggerType: 'APPOINTMENT_COMPLETED' | 'PURCHASE_AMOUNT' | 'VISIT_COUNT' | 'REFERRAL' | 'BIRTHDAY';
  triggerValue: number;
  rewardValue: number;
  pointsRequired?: number;
  maxRedemptions?: number;
  validityDays: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  terms?: string;
  eligibleClientTypes?: string[];
  minimumSpend?: number;
  stackable: boolean;
  autoApply: boolean;
}
```

#### `UpdateRewardProgramDto`
```typescript
export interface UpdateRewardProgramDto extends Partial<CreateRewardProgramDto> {
  id: string;
}
```

### 2. Modelos de Respuesta Faltantes
Necesitamos los siguientes modelos de respuesta:

#### `RewardProgramResponseDto`
```typescript
export interface RewardProgramResponseDto {
  id: string;
  name: string;
  description: string;
  businessType: string;
  rewardType: string;
  triggerType: string;
  triggerValue: number;
  rewardValue: number;
  pointsRequired?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  validityDays: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  terms?: string;
  eligibleClientTypes?: string[];
  minimumSpend?: number;
  stackable: boolean;
  autoApply: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

#### `ClientRewardResponseDto`
```typescript
export interface ClientRewardResponseDto {
  id: string;
  clientId: string;
  programId: string;
  programName: string;
  rewardType: string;
  rewardValue: number;
  pointsEarned: number;
  pointsUsed: number;
  pointsBalance: number;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  earnedDate: string;
  expiryDate?: string;
  redeemedDate?: string;
  triggerEvent: string;
  metadata?: any;
}
```

#### `RewardMetricsResponseDto`
```typescript
export interface RewardMetricsResponseDto {
  totalPrograms: number;
  activePrograms: number;
  totalRewards: number;
  redeemedRewards: number;
  totalPoints: number;
  averagePointsPerClient: number;
  redemptionRate: number;
  topPrograms: TopRewardProgramDto[];
  recentActivity: RewardActivityDto[];
  monthlyTrends: MonthlyRewardTrendDto[];
}
```

### 3. DTOs de Soporte Faltantes

#### `TopRewardProgramDto`
```typescript
export interface TopRewardProgramDto {
  id: string;
  name: string;
  totalRedemptions: number;
  totalPoints: number;
  activeClients: number;
}
```

#### `RewardActivityDto`
```typescript
export interface RewardActivityDto {
  id: string;
  clientId: string;
  clientName: string;
  programId: string;
  programName: string;
  type: 'earned' | 'redeemed';
  points: number;
  date: string;
  triggerEvent?: string;
}
```

#### `MonthlyRewardTrendDto`
```typescript
export interface MonthlyRewardTrendDto {
  month: string;
  pointsEarned: number;
  pointsRedeemed: number;
  newRewards: number;
  activeClients: number;
}
```

## 📧 Sistema de Email - Implementación Backend Completa

### 1. Controlador de Email
Crear `EmailController` con los siguientes endpoints:

```typescript
// Configuración SMTP
POST /api/email/settings
GET /api/email/settings
PUT /api/email/settings

// Plantillas de email
GET /api/email/templates
POST /api/email/templates
PUT /api/email/templates/:id
DELETE /api/email/templates/:id

// Envío de emails
POST /api/email/send
POST /api/email/test

// Analytics y logs
GET /api/email/logs
GET /api/email/metrics
GET /api/email/failed

// Integración con usuarios
POST /api/email/send-welcome/:userId
POST /api/email/send-reset-password/:userId
POST /api/email/send-appointment-reminder/:appointmentId
```

### 2. DTOs de Email

#### `EmailSettingsDto`
```typescript
export interface EmailSettingsDto {
  provider: 'gmail' | 'outlook' | 'custom';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  isActive: boolean;
}
```

#### `EmailTemplateDto`
```typescript
export interface EmailTemplateDto {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: 'welcome' | 'password_reset' | 'appointment_reminder' | 'custom';
  variables: string[];
  isActive: boolean;
}
```

#### `SendEmailDto`
```typescript
export interface SendEmailDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  attachments?: EmailAttachmentDto[];
}
```

#### `EmailLogDto`
```typescript
export interface EmailLogDto {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  failedAt?: string;
  errorMessage?: string;
  templateUsed?: string;
  userId?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
}
```

#### `EmailMetricsDto`
```typescript
export interface EmailMetricsDto {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  averageDeliveryTime: number;
  topTemplates: {
    name: string;
    count: number;
  }[];
  dailyStats: {
    date: string;
    sent: number;
    failed: number;
  }[];
}
```

### 3. Servicios Backend Requeridos

#### `EmailService`
- Configuración SMTP
- Envío de emails
- Gestión de plantillas
- Logging y métricas
- Integración con otros módulos

#### `EmailQueueService`
- Cola de emails pendientes
- Retry de emails fallidos
- Priorización de envíos

### 4. Integraciones Requeridas

#### Con Sistema de Usuarios
- Email de bienvenida al registrarse
- Reset de contraseña
- Notificaciones de perfil

#### Con Sistema de Citas
- Confirmación de cita
- Recordatorio de cita
- Cancelación de cita

#### Con Sistema de Recompensas
- Notificación de nueva recompensa
- Recordatorio de recompensa por vencer
- Confirmación de canje

## 🔧 Configuración y Infraestructura

### 1. Variables de Entorno
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@orbyt.com
DEFAULT_FROM_NAME=Orbyt System

# Queue Configuration
REDIS_URL=redis://localhost:6379
EMAIL_QUEUE_NAME=email_queue
EMAIL_RETRY_ATTEMPTS=3
```

### 2. Base de Datos
Tablas requeridas:
- `email_settings`
- `email_templates` 
- `email_logs`
- `email_queue`

### 3. Dependencias NPM
```json
{
  "nodemailer": "^6.9.0",
  "@nestjs/bull": "^10.0.0",
  "bull": "^4.11.0",
  "handlebars": "^4.7.0"
}
```

## 📋 Prioridades de Implementación

### Fase 1 - Crítico
1. ✅ Completar DTOs de recompensas vacíos
2. ✅ Implementar controlador básico de email
3. ✅ Configuración SMTP básica

### Fase 2 - Importante  
1. ✅ Sistema de plantillas de email
2. ✅ Métricas de recompensas
3. ✅ Integración email-usuarios

### Fase 3 - Deseable
1. ✅ Cola de emails avanzada
2. ✅ Analytics detallados
3. ✅ Integraciones completas

## 🎯 Notas para el Desarrollo

1. **Validación**: Todos los DTOs necesitan validaciones con `class-validator`
2. **Seguridad**: Encriptar credenciales SMTP
3. **Performance**: Usar cola Redis para emails masivos
4. **Logging**: Implementar logs detallados para debugging
5. **Testing**: Unit tests para todos los servicios
6. **Documentation**: Swagger/OpenAPI para todos los endpoints

Una vez implementado el backend, el frontend ya está preparado para consumir estos endpoints automáticamente.