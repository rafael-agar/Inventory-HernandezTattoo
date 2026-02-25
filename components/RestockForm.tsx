import React, { useState } from 'react';
import { InventoryItem, Warehouse, ProductVariant } from '../types';
import { PackagePlus, Layers, Warehouse as WarehouseIcon, DollarSign } from 'lucide-react';

interface Props {
  item: InventoryItem;
  warehouses: Warehouse[];
  onSubmit: (itemId: string, variantId: string | undefined, warehouseId: string, quantity: number, unitCost: number) => void;
  onCancel: () => void;
}

export const RestockForm: React.FC<Props> = ({ item, warehouses, onSubmit, onCancel }) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses.find(w => w.isDefault)?.id || '');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');

  const hasVariants = item.variants && item.variants.length > 0;
  
  // Set default cost based on selection
  const currentVariant = hasVariants ? item.variants?.find(v => v.id === selectedVariantId) : null;
  
  // Initial cost population (one-time logic or effect could be used, but inline is fine for defaults)
  React.useEffect(() => {
    if (currentVariant) {
        setUnitCost(currentVariant.cost);
    } else if (!hasVariants) {
        setUnitCost(item.cost);
    }
  }, [selectedVariantId, item, hasVariants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof quantity === 'number' && quantity > 0 && selectedWarehouseId && typeof unitCost === 'number') {
      if (hasVariants && !selectedVariantId) return;
      onSubmit(item.id, selectedVariantId || undefined, selectedWarehouseId, quantity, unitCost);
    }
  };

  const isValid = 
    typeof quantity === 'number' && 
    quantity > 0 && 
    selectedWarehouseId !== '' &&
    typeof unitCost === 'number' && unitCost >= 0 &&
    (!hasVariants || selectedVariantId !== '');

  const inputClass = "block w-full text-base border-dark-border focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange sm:text-sm rounded-md border bg-dark-bg text-white placeholder-gray-600";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-bg border border-dark-border p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-500 mb-1">Producto a Reponer</p>
        <div className="flex justify-between items-start">
           <p className="font-medium text-white text-lg">{item.name}</p>
           {hasVariants && <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-orange/30"><Layers size={10}/> Variantes</span>}
        </div>
        <p className="text-xs text-gray-500 font-mono mt-1">SKU: {currentVariant ? currentVariant.sku : item.sku}</p>
      </div>

      <div className="space-y-4">
        {/* Warehouse Selector */}
        <div>
          <label className={labelClass}>
            Almacén de Destino *
          </label>
          <div className="relative">
              <WarehouseIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
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
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`${inputClass} pl-10 pr-3 py-2`}
                required
              >
                <option value="">Seleccione opción...</option>
                {item.variants?.map(v => (
                    <option key={v.id} value={v.id}>
                        {v.name} (Actual: {v.quantity})
                    </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            {/* Quantity Input */}
            <div>
            <label className={labelClass}>
                Cantidad a Agregar *
            </label>
            <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                placeholder="0"
                className="block w-full text-center text-xl font-bold text-green-400 bg-dark-bg border-dark-border rounded-lg focus:ring-green-500 focus:border-green-500 py-2 border placeholder:text-gray-700"
            />
            </div>

            {/* Cost Input */}
            <div>
            <label className={labelClass}>
                Costo Unitario ($) *
            </label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || '')}
                    className="block w-full pl-10 text-right text-xl font-bold text-white bg-dark-bg border-dark-border rounded-lg focus:ring-brand-orange focus:border-brand-orange py-2 border placeholder:text-gray-700"
                />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 text-right">Se registrará como gasto</p>
            </div>
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
          className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
        >
          <PackagePlus size={18} />
          Reponer Stock
        </button>
      </div>
    </form>
  );
};