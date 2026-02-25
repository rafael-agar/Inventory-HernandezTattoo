import { InventoryItem, Transaction, Warehouse } from '../types';
import { STORAGE_KEY, CATEGORY_STORAGE_KEY, SIZE_STORAGE_KEY, COLOR_STORAGE_KEY, OTHER_VARIANT_STORAGE_KEY, TRANSACTION_STORAGE_KEY, WAREHOUSE_STORAGE_KEY } from '../constants';

export const saveInventory = (items: InventoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save inventory", e);
  }
};

export const loadInventory = (): InventoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load inventory", e);
    return [];
  }
};

export const saveCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save categories", e);
  }
};

export const loadCategories = (): string[] => {
  try {
    const data = localStorage.getItem(CATEGORY_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : ['General', 'Ropa', 'Electrónica', 'Hogar'];
    return Array.isArray(parsed) ? parsed : ['General'];
  } catch (e) {
    return ['General'];
  }
};

export const saveSizes = (sizes: string[]): void => {
  try {
    localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(sizes));
  } catch (e) {
    console.error("Failed to save sizes", e);
  }
};

export const loadSizes = (): string[] => {
  try {
    const data = localStorage.getItem(SIZE_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : ['XS', 'S', 'M', 'L', 'XL', 'XXL']; 
    return Array.isArray(parsed) ? parsed : ['S', 'M', 'L'];
  } catch (e) {
    return ['S', 'M', 'L'];
  }
};

export const saveColors = (colors: string[]): void => {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error("Failed to save colors", e);
  }
};

export const loadColors = (): string[] => {
  try {
    const data = localStorage.getItem(COLOR_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : ['Negro', 'Blanco', 'Rojo', 'Azul']; 
    return Array.isArray(parsed) ? parsed : ['Negro', 'Blanco'];
  } catch (e) {
    return ['Negro', 'Blanco'];
  }
};

export const saveOtherVariants = (others: string[]): void => {
  try {
    localStorage.setItem(OTHER_VARIANT_STORAGE_KEY, JSON.stringify(others));
  } catch (e) {
    console.error("Failed to save other variants", e);
  }
};

export const loadOtherVariants = (): string[] => {
  try {
    const data = localStorage.getItem(OTHER_VARIANT_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : ['Estándar', 'Premium', 'Pack']; 
    return Array.isArray(parsed) ? parsed : ['Estándar'];
  } catch (e) {
    return ['Estándar'];
  }
};

export const saveWarehouses = (warehouses: Warehouse[]): void => {
  try {
    localStorage.setItem(WAREHOUSE_STORAGE_KEY, JSON.stringify(warehouses));
  } catch (e) {
    console.error("Failed to save warehouses", e);
  }
};

export const loadWarehouses = (): Warehouse[] => {
  try {
    const data = localStorage.getItem(WAREHOUSE_STORAGE_KEY);
    let parsed = data ? JSON.parse(data) : [];
    
    // Ensure there is at least a Main Warehouse
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaultWarehouse: Warehouse = {
        id: 'MAIN_WAREHOUSE',
        name: 'Almacén Principal',
        isDefault: true
      };
      parsed = [defaultWarehouse];
      saveWarehouses(parsed);
    }
    return parsed;
  } catch (e) {
    return [{ id: 'MAIN_WAREHOUSE', name: 'Almacén Principal', isDefault: true }];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save transactions", e);
  }
};

export const loadTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const exportToCSV = (items: InventoryItem[]): void => {
  const headers = ['ID', 'Nombre', 'SKU', 'Categoría', 'Costo Unit.', 'Precio Venta', 'Cantidad Total', 'Valor Total (Costo)', 'Última Actualización'];
  
  const rows = items.map(item => [
    item.id,
    `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
    item.sku,
    item.category || '',
    (item.cost || 0).toFixed(2),
    (item.price || 0).toFixed(2),
    item.quantity || 0,
    ((item.cost || 0) * (item.quantity || 0)).toFixed(2),
    new Date(item.lastUpdated).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `inventario_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};