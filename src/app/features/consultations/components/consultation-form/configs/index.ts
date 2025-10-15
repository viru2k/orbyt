import { BusinessTypeFormConfig } from '../interfaces/form-config.interface';
import { HAIR_SALON_CONFIG } from './hair-salon.config';
import { MEDICAL_CONFIG } from './medical.config';
import { VETERINARY_CONFIG } from './veterinary.config';

// Export individual configs
export { HAIR_SALON_CONFIG } from './hair-salon.config';
export { MEDICAL_CONFIG } from './medical.config';
export { VETERINARY_CONFIG } from './veterinary.config';

// Business type configurations registry
export const BUSINESS_TYPE_CONFIGS: { [key: string]: BusinessTypeFormConfig } = {
  'hair_salon': HAIR_SALON_CONFIG,
  'medical': MEDICAL_CONFIG,
  'veterinary': VETERINARY_CONFIG,
  // TODO: Add more business types as needed
  'beauty': HAIR_SALON_CONFIG, // Temporary fallback
  'psychology': MEDICAL_CONFIG, // Temporary fallback
  'office': MEDICAL_CONFIG // Temporary fallback
};

/**
 * Get business type configuration by code
 */
export function getBusinessTypeConfig(businessTypeCode: string): BusinessTypeFormConfig | null {
  return BUSINESS_TYPE_CONFIGS[businessTypeCode] || BUSINESS_TYPE_CONFIGS['hair_salon'];
}