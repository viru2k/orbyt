export interface ServiceResponseDto {
  id: number;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  duration?: number;
  status: 'ACTIVE' | 'INACTIVE';
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  duration?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  duration?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface ServiceCategoryDto {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export interface InvoiceItemSelection {
  itemId: number | null;
  itemType: 'service' | 'product' | 'manual';
  name: string;
  description: string;
  basePrice: number;
  category?: string;
  duration?: number;
}