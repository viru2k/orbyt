export interface InvoiceItem {
  itemId: number | null; // null para items manuales
  itemType: 'service' | 'product' | 'manual';
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  notes?: string;
  // Nuevos campos según requerimientos
  category?: string;
  duration?: number; // Para servicios
}