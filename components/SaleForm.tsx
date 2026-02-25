import React, { useState, useEffect } from 'react';
import { InventoryItem, Warehouse, ProductVariant } from '../types';
import { Store, Layers, Warehouse as WarehouseIcon } from 'lucide-react';

interface Props {
  item: InventoryItem;
  warehouses: Warehouse[];
  onSubmit: (quantity: number, warehouseName: string, warehouseId: string, variantId?: string) => void;
  onCancel: () => void;
}

export const SaleForm: React.FC<Props> = ({ item, warehouses, onSubmit, onCancel }) => {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  
  const hasVariants = item.variants && item.variants.length > 0;
  
  // Logic to determine MAX available stock for the selected configuration
  let maxStock = 0;
  let currentPrice = item.price;

  if (selectedWarehouseId) {
      if (hasVariants && selectedVariantId) {
          const variant = item.variants!.find(v => v.id === selectedVariantId);
          if (variant) {
              maxStock = variant.stockByWarehouse?.[selectedWarehouseId] || 0;
              currentPrice = variant.price;
          }
      } else if (!hasVariants) {
          maxStock = item.stockByWarehouse?.[selectedWarehouseId] || 0;
      }
  }

  const currentVariant = hasVariants ? item.variants?.find(v => v.id === selectedVariantId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof quantity === 'number' && quantity > 0 && selectedWarehouseId) {
      if (hasVariants && !selectedVariantId) return; // Guard clause

      const warehouse = warehouses.find(s => s.id === selectedWarehouseId);
      if (warehouse) {
        onSubmit(quantity, warehouse.name, warehouse.id, selectedVariantId || undefined);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setQuantity('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        setQuantity(num);
      }
    }
  };

  const isValid = 
    typeof quantity === 'number' && 
    quantity > 0 && 
    quantity <= maxStock && 
    selectedWarehouseId !== '' &&
    (!hasVariants || selectedVariantId !== '');

  const inputClass = "block w-full text-base border-dark-border focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange sm:text-sm rounded-md border bg-dark-bg text-white placeholder-gray-600";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-bg border border-dark-border p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-500 mb-1">Producto</p>
        <div className="flex justify-between items-start">
           <p className="font-medium text-white text-lg">{item.name}</p>
           {hasVariants && <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-orange/30"><Layers size={10}/> Variantes</span>}
        </div>
        <p className="text-xs text-gray-500 font-mono mt-1">SKU: {currentVariant ? currentVariant.sku : item.sku}</p>
        
        {/* Info panel logic */}
        <div className="flex justify-between mt-3 text-sm border-t border-dark-border pt-3">
          <span className="text-gray-400">Stock en Almacén Seleccionado:</span>
          <span className={`font-bold ${maxStock === 0 ? 'text-red-500' : 'text-white'}`}>
             {!selectedWarehouseId ? '-' : maxStock}
          </span>
        </div>
        
        <div className="flex justify-between mt-1 text-sm">
             <span className="text-gray-400">Precio Unitario:</span>
             <span className="font-medium text-brand-orange">${currentPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Warehouse Selector */}
        <div>
          <label className={labelClass}>
            Almacén de Venta (Origen) *
          </label>
          <div className="relative">
              <WarehouseIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                    setSelectedWarehouseId(e.target.value);
                    setQuantity(''); 
                }}
                className={`${inputClass} pl-10 pr-3 py-2`}
                required
              >
                <option value="">Seleccione almacén...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Variant Selector */}
        {hasVariants && (
          <div>
            <label className={labelClass}>
              Variante del Producto *
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  setQuantity(''); // Reset quantity on variant change to avoid invalid states
                }}
                className={`${inputClass} pl-10 pr-3 py-2`}
                required
                disabled={!selectedWarehouseId}
              >
                <option value="">Seleccione opción...</option>
                {item.variants?.map(v => {
                   // Show stock for this specific warehouse in the dropdown for better UX
                   const stockInWarehouse = selectedWarehouseId ? (v.stockByWarehouse?.[selectedWarehouseId] || 0) : 0;
                   return (
                    <option key={v.id} value={v.id} disabled={selectedWarehouseId ? stockInWarehouse === 0 : false}>
                        {v.name} (Stock: {selectedWarehouseId ? stockInWarehouse : '?'}) - ${v.price}
                    </option>
                   );
                })}
              </select>
            </div>
            {!selectedWarehouseId && <p className="text-xs text-gray-500 mt-1">Selecciona un almacén primero.</p>}
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className={labelClass}>
            Unidades Vendidas *
          </label>
          <input
            type="number"
            min="1"
            max={maxStock}
            value={quantity}
            onChange={handleChange}
            placeholder="0"
            disabled={!selectedWarehouseId || (hasVariants && !selectedVariantId) || maxStock === 0}
            className="block w-full text-center text-3xl font-bold text-brand-orange bg-dark-bg border-dark-border rounded-lg focus:ring-brand-orange focus:border-brand-orange py-4 border placeholder:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {selectedWarehouseId && maxStock === 0 && (
            <p className="text-red-500 text-xs mt-1">No hay stock disponible en este almacén.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-dark-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20"
        >
          Confirmar Venta
        </button>
      </div>
    </form>
  );
};