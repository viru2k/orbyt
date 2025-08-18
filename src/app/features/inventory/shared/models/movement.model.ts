export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  USAGE = 'usage'
}

export interface StockMovement {
  id: number;
  productNameAtTime: string;
  quantity: number;
  type: MovementType;
  reason?: string;
  date: Date;
  createdAt: Date;
  product: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
}

export interface CreateStockMovementDto {
  productId: number;
  quantity: number;
  type: MovementType;
  reason?: string;
  date: Date;
}

export interface StockSummary {
  productId: number;
  productName: string;
  productDescription?: string;
  productCurrentPrice: number;
  productStatus: string;
  availableStock: number;
}

export interface MovementFilters {
  productId?: number;
  type?: MovementType;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: number;
}