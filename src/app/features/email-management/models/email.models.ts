export interface EmailSettings {
  id?: number;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  supportEmail: string;
  isActive: boolean;
  provider: EmailProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmailSettingsDto {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  supportEmail: string;
  provider: EmailProvider;
}

export interface UpdateEmailSettingsDto extends Partial<CreateEmailSettingsDto> {
  isActive?: boolean;
}

export enum EmailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  YAHOO = 'yahoo',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  CUSTOM = 'custom'
}

export interface TestEmailRequest {
  to: string;
  subject?: string;
  message?: string;
}

export interface TestEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface EmailTemplate {
  id?: number;
  name: string;
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum EmailTemplateType {
  PASSWORD_RESET = 'password-reset',
  ACCOUNT_LOCKOUT = 'account-lockout',
  SECURITY_ALERT = 'security-alert',
  PASSWORD_CHANGED = 'password-changed',
  WELCOME = 'welcome',
  TEST = 'test'
}

export interface EmailLog {
  id: number;
  to: string;
  subject: string;
  templateType: EmailTemplateType;
  status: EmailStatus;
  messageId?: string;
  error?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailHistory {
  logs: EmailLog[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

// Predefined SMTP configurations for popular providers
export const SMTP_PRESETS: Record<EmailProvider, Partial<EmailSettings>> = {
  [EmailProvider.GMAIL]: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    provider: EmailProvider.GMAIL
  },
  [EmailProvider.OUTLOOK]: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    provider: EmailProvider.OUTLOOK
  },
  [EmailProvider.YAHOO]: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    provider: EmailProvider.YAHOO
  },
  [EmailProvider.SENDGRID]: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    provider: EmailProvider.SENDGRID
  },
  [EmailProvider.MAILGUN]: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    provider: EmailProvider.MAILGUN
  },
  [EmailProvider.CUSTOM]: {
    host: '',
    port: 587,
    secure: false,
    provider: EmailProvider.CUSTOM
  }
};