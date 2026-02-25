import { ChannelType, ChannelConfig } from './types';
import { Archive } from 'lucide-react';

export const CHANNELS: Record<ChannelType, ChannelConfig> = {
  [ChannelType.MAIN]: {
    id: ChannelType.MAIN,
    label: 'Almacén Principal',
    colorClass: 'text-brand-orange',
    bgClass: 'bg-brand-orange/10',
    borderClass: 'border-brand-orange/20'
  }
};

export const CHANNEL_ICONS = {
  [ChannelType.MAIN]: Archive,
};

export const STORAGE_KEY = 'inventory_app_v2'; 
export const CATEGORY_STORAGE_KEY = 'inventory_categories_v1';
export const SIZE_STORAGE_KEY = 'inventory_sizes_v1';
export const COLOR_STORAGE_KEY = 'inventory_colors_v1'; // New
export const OTHER_VARIANT_STORAGE_KEY = 'inventory_others_v1'; // New
export const TRANSACTION_STORAGE_KEY = 'inventory_transactions_v2';
export const WAREHOUSE_STORAGE_KEY = 'inventory_warehouses_v1';