export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'time' | 'datetime' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  suffix?: string;
  min?: number;
  max?: number;
}

export interface FormSection {
  key: string;
  title: string;
  fields: FormField[];
}

export interface BusinessTypeFormConfig {
  businessTypeCode: string;
  sections: FormSection[];
}