import React, { useState, useEffect } from 'react';
import { InventoryItem, Warehouse, ProductVariant } from '../types';
import { ArrowRightLeft, AlertCircle, Layers } from 'lucide-react';

interface Props {
  items: InventoryItem[];
  warehouses: Warehouse[];
  onSubmit: (itemId: string, variantId: string | undefined, fromId: string, toId: string, qty: number) => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<Props> = ({ items, warehouses, onSubmit, onCancel }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses.find(w => w.isDefault)?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const selectedItem = items.find(i => i.id === selectedItemId);
  const hasVariants = selectedItem && selectedItem.variants && selectedItem.variants.length > 0;
  
  // Calculate available stock in "From" warehouse
  let availableStock = 0;
  if (selectedItem && fromWarehouseId) {
    if (hasVariants && selectedVariantId) {
      const variant = selectedItem.variants!.find(v => v.id === selectedVariantId);
      availableStock = variant?.stockByWarehouse?.[fromWarehouseId] || 0;
    } else if (!hasVariants) {
      availableStock = selectedItem.stockByWarehouse?.[fromWarehouseId] || 0;
    }
  }

  const isValid = 
    selectedItemId && 
    fromWarehouseId && 
    toWarehouseId && 
    fromWarehouseId !== toWarehouseId &&
    (!hasVariants || selectedVariantId) &&
    typeof quantity === 'number' && 
    quantity > 0 && 
    quantity <= availableStock;

  return (
    <div className="space-y-4">
      <div className="bg-brand-orange/10 p-4 rounded-lg border border-brand-orange/20 flex gap-3 items-center mb-4">
        <ArrowRightLeft className="text-brand-orange shrink-0" size={24} />
        <div className="text-sm text-gray-300">
          <p className="font-bold text-brand-orange">Transferencia entre Almacenes</p>
          <p className="opacity-80">Mueve mercancía (ej. Principal {'->'} Evento) sin registrar venta.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* FROM */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Origen (Desde)</label>
          <select
            value={fromWarehouseId}
            onChange={(e) => setFromWarehouseId(e.target.value)}
            className="block w-full rounded-md border-dark-border bg-dark-bg text-white shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 border"
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* TO */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Destino (Hacia)</label>
          <select
            value={toWarehouseId}
            onChange={(e) => setToWarehouseId(e.target.value)}
            className="block w-full rounded-md border-dark-border bg-dark-bg text-white shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 border"
          >
            <option value="">Seleccionar...</option>
            {warehouses.filter(w => w.id !== fromWarehouseId).map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Producto a transferir</label>
        <select
          value={selectedItemId}
          onChange={(e) => {
            setSelectedItemId(e.target.value);
            setSelectedVariantId('');
            setQuantity('');
          }}
          className="block w-full rounded-md border-dark-border bg-dark-bg text-white shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 border"
        >
          <option value="">Seleccionar producto...</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
          ))}
        </select>
      </div>

      {/* Variant Selection */}
      {hasVariants && (
        <div className="bg-dark-bg/50 p-3 rounded border border-dark-border">
          <label className="block text-sm font-medium text-brand-orange mb-1 flex items-center gap-2">
            <Layers size={14} /> Selecciona Variante
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => {
              setSelectedVariantId(e.target.value);
              setQuantity('');
            }}
            className="block w-full rounded-md border-dark-border bg-dark-bg text-white shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 border"
          >
            <option value="">Seleccionar variante...</option>
            {selectedItem.variants!.map(v => {
               const stockInOrigin = v.stockByWarehouse?.[fromWarehouseId] || 0;
               return (
                 <option key={v.id} value={v.id}>
                   {v.name} (Stock en Origen: {stockInOrigin})
                 </option>
               )
            })}
          </select>
        </div>
      )}

      {/* Stock Info & Quantity */}
      {selectedItemId && (!hasVariants || selectedVariantId) && fromWarehouseId && (
        <div className="bg-dark-surface border border-dark-border p-4 rounded-lg flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 mb-2">Disponible en Origen</p>
            <p className={`text-3xl font-bold ${availableStock === 0 ? 'text-red-500' : 'text-white'}`}>
              {availableStock}
            </p>
            
            <div className="w-full mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-1 text-left">Cantidad a Mover</label>
              <input
                type="number"
                min="1"
                max={availableStock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                placeholder="0"
                className="block w-full text-center text-xl font-bold bg-dark-bg border-dark-border rounded-lg text-white p-2 border focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
            {typeof quantity === 'number' && quantity > availableStock && (
               <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                 <AlertCircle size={12} /> Cantidad excede stock disponible.
               </p>
            )}
        </div>
      )}

      <div className="flex gap-3 mt-8 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSubmit(selectedItemId, selectedVariantId || undefined, fromWarehouseId, toWarehouseId, Number(quantity))}
          disabled={!isValid}
          className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
        >
          Transferir
        </button>
      </div>
    </div>
  );
};