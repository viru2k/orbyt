# Implementación Backend - Sistema de Gestión de Emails

## 📧 Implementación Completa del Sistema de Email

### 1. Controlador Principal - `EmailController`

```typescript
@Controller('email')
@ApiTags('Email Management')
export class EmailController {
  
  // CONFIGURACIÓN SMTP
  @Post('settings')
  @ApiOperation({ summary: 'Configurar settings SMTP' })
  async saveEmailSettings(@Body() settings: EmailSettingsDto): Promise<void> {}
  
  @Get('settings')
  @ApiOperation({ summary: 'Obtener configuración SMTP actual' })
  async getEmailSettings(): Promise<EmailSettingsResponseDto> {}
  
  @Put('settings')
  @ApiOperation({ summary: 'Actualizar configuración SMTP' })
  async updateEmailSettings(@Body() settings: UpdateEmailSettingsDto): Promise<void> {}
  
  @Post('settings/test')
  @ApiOperation({ summary: 'Probar conexión SMTP' })
  async testSmtpConnection(): Promise<TestConnectionResponseDto> {}

  // PLANTILLAS DE EMAIL
  @Get('templates')
  @ApiOperation({ summary: 'Listar todas las plantillas' })
  async getAllTemplates(): Promise<EmailTemplateResponseDto[]> {}
  
  @Post('templates')
  @ApiOperation({ summary: 'Crear nueva plantilla' })
  async createTemplate(@Body() template: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {}
  
  @Get('templates/:id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  async getTemplateById(@Param('id') id: string): Promise<EmailTemplateResponseDto> {}
  
  @Put('templates/:id')
  @ApiOperation({ summary: 'Actualizar plantilla' })
  async updateTemplate(@Param('id') id: string, @Body() template: UpdateEmailTemplateDto): Promise<EmailTemplateResponseDto> {}
  
  @Delete('templates/:id')
  @ApiOperation({ summary: 'Eliminar plantilla' })
  async deleteTemplate(@Param('id') id: string): Promise<void> {}

  // ENVÍO DE EMAILS
  @Post('send')
  @ApiOperation({ summary: 'Enviar email personalizado' })
  async sendCustomEmail(@Body() emailData: SendEmailDto): Promise<EmailSendResponseDto> {}
  
  @Post('send/template')
  @ApiOperation({ summary: 'Enviar email usando plantilla' })
  async sendTemplateEmail(@Body() emailData: SendTemplateEmailDto): Promise<EmailSendResponseDto> {}
  
  @Post('send/bulk')
  @ApiOperation({ summary: 'Envío masivo de emails' })
  async sendBulkEmails(@Body() bulkData: BulkEmailDto): Promise<BulkEmailResponseDto> {}

  // INTEGRACIÓN CON USUARIOS
  @Post('send/welcome/:userId')
  @ApiOperation({ summary: 'Enviar email de bienvenida' })
  async sendWelcomeEmail(@Param('userId') userId: string): Promise<EmailSendResponseDto> {}
  
  @Post('send/password-reset/:userId')
  @ApiOperation({ summary: 'Enviar email de reset de contraseña' })
  async sendPasswordResetEmail(@Param('userId') userId: string): Promise<EmailSendResponseDto> {}
  
  @Post('send/appointment-reminder/:appointmentId')
  @ApiOperation({ summary: 'Enviar recordatorio de cita' })
  async sendAppointmentReminder(@Param('appointmentId') appointmentId: string): Promise<EmailSendResponseDto> {}

  // LOGS Y ANALYTICS
  @Get('logs')
  @ApiOperation({ summary: 'Obtener logs de emails enviados' })
  async getEmailLogs(@Query() query: EmailLogsQueryDto): Promise<EmailLogsPaginatedResponseDto> {}
  
  @Get('logs/failed')
  @ApiOperation({ summary: 'Obtener emails fallidos' })
  async getFailedEmails(): Promise<EmailLogResponseDto[]> {}
  
  @Post('logs/retry/:logId')
  @ApiOperation({ summary: 'Reintentar envío de email fallido' })
  async retryFailedEmail(@Param('logId') logId: string): Promise<EmailSendResponseDto> {}
  
  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas del sistema de email' })
  async getEmailMetrics(@Query() dateRange: DateRangeQueryDto): Promise<EmailMetricsResponseDto> {}
  
  @Get('metrics/summary')
  @ApiOperation({ summary: 'Resumen rápido de métricas' })
  async getMetricsSummary(): Promise<EmailMetricsSummaryDto> {}
}
```

### 2. DTOs Completos para Email

#### Configuración SMTP
```typescript
export class EmailSettingsDto {
  @IsEnum(['gmail', 'outlook', 'yahoo', 'custom'])
  @ApiProperty()
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';

  @IsString()
  @ApiProperty()
  smtpHost: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @ApiProperty()
  smtpPort: number;

  @IsBoolean()
  @ApiProperty()
  smtpSecure: boolean;

  @IsEmail()
  @ApiProperty()
  smtpUser: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  smtpPassword: string;

  @IsEmail()
  @ApiProperty()
  fromEmail: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  fromName: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ required: false })
  replyToEmail?: string;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  advancedSettings?: {
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  };
}

export class UpdateEmailSettingsDto extends PartialType(EmailSettingsDto) {}

export class EmailSettingsResponseDto extends EmailSettingsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  lastTestedAt?: Date;

  @ApiProperty()
  testStatus?: 'success' | 'failed';

  // Ocultar contraseña en respuestas
  smtpPassword: string = '***HIDDEN***';
}
```

#### Plantillas de Email
```typescript
export class CreateEmailTemplateDto {
  @IsString()
  @MinLength(1)
  @ApiProperty()
  name: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  subject: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  htmlContent: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  textContent?: string;

  @IsEnum(['welcome', 'password_reset', 'appointment_reminder', 'appointment_confirmation', 'reward_notification', 'custom'])
  @ApiProperty()
  type: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  variables: string[];

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

export class UpdateEmailTemplateDto extends PartialType(CreateEmailTemplateDto) {}

export class EmailTemplateResponseDto extends CreateEmailTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  lastUsed?: Date;
}
```

#### Envío de Emails
```typescript
export class SendEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @ApiProperty()
  to: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  cc?: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  bcc?: string[];

  @IsString()
  @MinLength(1)
  @ApiProperty()
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  htmlContent?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  textContent?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false })
  attachments?: EmailAttachmentDto[];

  @IsEnum(['low', 'normal', 'high'])
  @IsOptional()
  @ApiProperty({ required: false })
  priority?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  trackOpens?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  trackClicks?: boolean;
}

export class SendTemplateEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @ApiProperty()
  to: string[];

  @IsString()
  @ApiProperty()
  templateId: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  templateVariables?: Record<string, any>;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  cc?: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  bcc?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false })
  attachments?: EmailAttachmentDto[];
}

export class EmailAttachmentDto {
  @IsString()
  @ApiProperty()
  filename: string;

  @IsString()
  @ApiProperty()
  content: string; // Base64

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  contentType?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  disposition?: 'attachment' | 'inline';
}

export class BulkEmailDto {
  @IsString()
  @ApiProperty()
  templateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkEmailRecipientDto)
  @ApiProperty()
  recipients: BulkEmailRecipientDto[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  scheduleDelivery?: boolean;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false })
  scheduledAt?: string;
}

export class BulkEmailRecipientDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  variables?: Record<string, any>;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;
}
```

#### Logs y Métricas
```typescript
export class EmailLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  to: string[];

  @ApiProperty()
  cc?: string[];

  @ApiProperty()
  bcc?: string[];

  @ApiProperty()
  subject: string;

  @ApiProperty()
  status: 'sent' | 'failed' | 'pending' | 'scheduled';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  sentAt?: Date;

  @ApiProperty()
  failedAt?: Date;

  @ApiProperty()
  errorMessage?: string;

  @ApiProperty()
  templateUsed?: string;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  relatedEntity?: {
    type: string;
    id: string;
  };

  @ApiProperty()
  deliveryStats?: {
    opens: number;
    clicks: number;
    bounces: number;
  };
}

export class EmailLogsQueryDto {
  @IsOptional()
  @IsEnum(['sent', 'failed', 'pending', 'scheduled'])
  @ApiProperty({ required: false })
  status?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  templateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({ required: false })
  limit?: number = 20;
}

export class EmailMetricsResponseDto {
  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  totalFailed: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  averageDeliveryTime: number; // en segundos

  @ApiProperty()
  topTemplates: {
    id: string;
    name: string;
    count: number;
    successRate: number;
  }[];

  @ApiProperty()
  dailyStats: {
    date: string;
    sent: number;
    failed: number;
    pending: number;
  }[];

  @ApiProperty()
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];

  @ApiProperty()
  errorAnalysis: {
    error: string;
    count: number;
    percentage: number;
  }[];
}
```

### 3. Servicios Backend Requeridos

#### `EmailService`
```typescript
@Injectable()
export class EmailService {
  // Configuración
  async saveSettings(settings: EmailSettingsDto): Promise<void> {}
  async getSettings(): Promise<EmailSettingsResponseDto> {}
  async testConnection(): Promise<TestConnectionResponseDto> {}

  // Plantillas
  async createTemplate(template: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {}
  async updateTemplate(id: string, template: UpdateEmailTemplateDto): Promise<EmailTemplateResponseDto> {}
  async deleteTemplate(id: string): Promise<void> {}
  async getTemplates(): Promise<EmailTemplateResponseDto[]> {}

  // Envío
  async sendEmail(emailData: SendEmailDto): Promise<EmailSendResponseDto> {}
  async sendTemplateEmail(emailData: SendTemplateEmailDto): Promise<EmailSendResponseDto> {}
  async sendBulkEmails(bulkData: BulkEmailDto): Promise<BulkEmailResponseDto> {}

  // Integraciones
  async sendWelcomeEmail(userId: string): Promise<EmailSendResponseDto> {}
  async sendPasswordResetEmail(userId: string, resetToken: string): Promise<EmailSendResponseDto> {}
  async sendAppointmentReminder(appointmentId: string): Promise<EmailSendResponseDto> {}
}
```

#### `EmailQueueService`
```typescript
@Injectable()
export class EmailQueueService {
  async addToQueue(emailJob: EmailJobDto): Promise<void> {}
  async processQueue(): Promise<void> {}
  async retryFailed(logId: string): Promise<void> {}
  async getQueueStats(): Promise<QueueStatsDto> {}
}
```

#### `EmailAnalyticsService`
```typescript
@Injectable()
export class EmailAnalyticsService {
  async getMetrics(dateRange?: DateRangeQueryDto): Promise<EmailMetricsResponseDto> {}
  async trackOpen(emailId: string): Promise<void> {}
  async trackClick(emailId: string, linkUrl: string): Promise<void> {}
  async recordBounce(emailId: string, reason: string): Promise<void> {}
}
```

### 4. Entidades de Base de Datos

#### `EmailSettings`
```typescript
@Entity('email_settings')
export class EmailSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column()
  smtpHost: string;

  @Column()
  smtpPort: number;

  @Column()
  smtpSecure: boolean;

  @Column()
  smtpUser: string;

  @Column({ type: 'text' })
  smtpPassword: string; // Encriptado

  @Column()
  fromEmail: string;

  @Column()
  fromName: string;

  @Column({ nullable: true })
  replyToEmail: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  advancedSettings: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastTestedAt: Date;

  @Column({ nullable: true })
  testStatus: string;
}
```

#### `EmailTemplate`
```typescript
@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column('text')
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column()
  type: string;

  @Column('json')
  variables: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  lastUsed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;
}
```

#### `EmailLog`
```typescript
@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json')
  to: string[];

  @Column({ type: 'json', nullable: true })
  cc: string[];

  @Column({ type: 'json', nullable: true })
  bcc: string[];

  @Column()
  subject: string;

  @Column()
  status: 'sent' | 'failed' | 'pending' | 'scheduled';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  templateUsed: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'json', nullable: true })
  relatedEntity: any;

  @Column({ type: 'json', nullable: true })
  deliveryStats: any;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ default: 'normal' })
  priority: string;
}
```

### 5. Configuración y Dependencias

#### Módulo Principal
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([EmailSettings, EmailTemplate, EmailLog]),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailQueueService,
    EmailAnalyticsService,
    EmailProcessor,
  ],
  exports: [EmailService],
})
export class EmailModule {}
```

#### Variables de Entorno
```env
# Email System
EMAIL_QUEUE_REDIS_HOST=localhost
EMAIL_QUEUE_REDIS_PORT=6379
EMAIL_ENCRYPTION_KEY=your-32-char-encryption-key
EMAIL_MAX_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=60000

# Default SMTP (fallback)
DEFAULT_SMTP_HOST=smtp.gmail.com
DEFAULT_SMTP_PORT=587
DEFAULT_FROM_EMAIL=noreply@orbyt.com
DEFAULT_FROM_NAME=Sistema Orbyt
```

#### Dependencias package.json
```json
{
  "nodemailer": "^6.9.0",
  "@nestjs/bull": "^10.0.0",
  "bull": "^4.11.0",
  "handlebars": "^4.7.0",
  "crypto-js": "^4.1.1",
  "@types/nodemailer": "^6.4.0"
}
```

### 6. Plantillas por Defecto

El sistema debe incluir plantillas predefinidas para:

1. **Bienvenida de Usuario**
2. **Reset de Contraseña**
3. **Confirmación de Cita**
4. **Recordatorio de Cita**
5. **Notificación de Recompensa**
6. **Cancelación de Cita**

### 7. Integraciones con Otros Módulos

#### Con Sistema de Usuarios
- Hook en registro de usuario → enviar email de bienvenida
- Hook en solicitud de reset → enviar email con token
- Hook en cambio de perfil → email de confirmación

#### Con Sistema de Citas
- Hook en creación de cita → email de confirmación
- Cron job para recordatorios → emails automáticos
- Hook en cancelación → email de notificación

#### Con Sistema de Recompensas
- Hook en nueva recompensa → email de notificación
- Hook en vencimiento próximo → email de recordatorio
- Hook en canje exitoso → email de confirmación

## 🚀 Plan de Implementación Sugerido

### Fase 1 (Crítico - 1 semana)
1. ✅ Configuración básica SMTP
2. ✅ CRUD de plantillas
3. ✅ Envío básico de emails

### Fase 2 (Importante - 1 semana)
1. ✅ Sistema de colas con Redis
2. ✅ Logs y métricas básicas
3. ✅ Integraciones con usuarios

### Fase 3 (Deseable - 1 semana)
1. ✅ Analytics avanzados
2. ✅ Envío masivo
3. ✅ Tracking de opens/clicks

Una vez implementado, el frontend consumirá automáticamente estos endpoints a través de la generación OpenAPI.