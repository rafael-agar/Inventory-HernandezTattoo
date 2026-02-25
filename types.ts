export enum ChannelType {
  MAIN = 'MAIN',
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Rojo / XL"
  sku: string;
  cost: number;
  price: number;
  quantity: number; // Global Total
  stockByWarehouse: Record<string, number>; // { warehouseId: quantity }
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string; // Master SKU
  cost: number; // Used as default or range min
  price: number; // Used as default or range min
  quantity: number; // Total sum if variants exist
  category: string;
  channel: ChannelType; 
  variants?: ProductVariant[]; // New variants array
  stockByWarehouse: Record<string, number>; // { warehouseId: quantity } (Only used if no variants)
  lastUpdated: number;
}

export interface Warehouse {
  id: string;
  name: string;
  isDefault?: boolean; // To identify the main warehouse
}

export interface Station {
  id: string;
  name: string;
}

export type TransactionType = 'IN_INITIAL' | 'IN_RESTOCK' | 'OUT_SALE' | 'TRANSFER';

export interface Transaction {
  id: string;
  date: number;
  itemId: string;
  itemName: string;
  variantId?: string; 
  variantName?: string; 
  sku: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  total: number;
  type: TransactionType;
  fromWarehouseId?: string; // For transfers or sales
  toWarehouseId?: string;   // For transfers
  warehouseName?: string;   // Readable name for UI
}

export interface ChannelConfig {
  id: ChannelType;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export type SortField = 'name' | 'sku' | 'quantity' | 'cost' | 'price';
export type SortOrder = 'asc' | 'desc';