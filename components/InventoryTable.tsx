import React, { useMemo } from 'react';
import { InventoryItem, SortField, SortOrder, Warehouse } from '../types';
import { ArrowDown, ArrowUp, Edit2, Trash2, ShoppingCart, AlertCircle, Layers, Store, PackagePlus } from 'lucide-react';

interface Props {
  items: InventoryItem[];
  warehouses: Warehouse[]; // Added to resolve names
  onDelete: (id: string) => void;
  onEdit: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export const InventoryTable: React.FC<Props> = ({ 
  items, 
  warehouses,
  onDelete, 
  onEdit, 
  onSell,
  onRestock,
  sortField,
  sortOrder,
  onSort
}) => {
  
  const sortedItems = useMemo(() => {
    // Clone array to avoid mutating props
    return [...items].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Safe access
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Case insensitive string sort
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const HeaderCell = ({ field, label, align = 'left' }: { field: SortField, label: string, align?: string }) => (
    <th 
      className={`px-4 py-3 text-${align} text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-dark-bg transition-colors select-none`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-dark-surface rounded-lg shadow-sm border border-dark-border">
        <AlertCircle size={48} className="mb-4 text-gray-600" />
        <p className="text-lg font-medium text-gray-300">Inventario Vacío</p>
        <p className="text-sm">Agrega tu primer producto para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-lg shadow-sm border border-dark-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-border">
          <thead className="bg-dark-bg/50">
            <tr>
              <HeaderCell field="name" label="Producto / Variantes" />
              <HeaderCell field="sku" label="SKU" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
              <HeaderCell field="cost" label="Costo" align="right" />
              <HeaderCell field="price" label="Precio" align="right" />
              <HeaderCell field="quantity" label="Stock Total" align="right" />
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Total (Costo)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-dark-surface divide-y divide-dark-border">
            {sortedItems.map((item) => {
              const hasVariants = item.variants && item.variants.length > 0;
              const safeCost = typeof item.cost === 'number' ? item.cost : 0;
              const safePrice = typeof item.price === 'number' ? item.price : 0;
              const safeQuantity = typeof item.quantity === 'number' ? item.quantity : 0;
              
              // If variants, maybe show a range or "Varios"
              const displayCost = hasVariants && item.variants ? `${Math.min(...item.variants.map(v=>v.cost)).toFixed(2)}` : safeCost.toFixed(2);
              const displayPrice = hasVariants && item.variants ? `${Math.min(...item.variants.map(v=>v.price)).toFixed(2)}` : safePrice.toFixed(2);
              const isRange = hasVariants && item.variants && (item.variants.some(v => v.price !== item.variants![0].price));

              // Calculate total value based on variants if they exist
              const totalValue = hasVariants && item.variants
                ? item.variants.reduce((acc, v) => acc + (v.cost * v.quantity), 0)
                : safeCost * safeQuantity;

              // Calculate Breakdown per Warehouse
              const breakdown = warehouses.map(w => {
                 let qty = 0;
                 if (hasVariants && item.variants) {
                    qty = item.variants.reduce((acc, v) => acc + (v.stockByWarehouse?.[w.id] || 0), 0);
                 } else {
                    qty = item.stockByWarehouse?.[w.id] || 0;
                 }
                 return { name: w.name, qty, isDefault: w.isDefault };
              }).filter(b => b.qty > 0); // Only show warehouses with stock

              return (
              <tr key={item.id} className="hover:bg-dark-bg/50 transition-colors group">
                <td className="px-4 py-3 align-top min-w-[200px]">
                  <div className="text-sm font-medium text-gray-200">
                    {item.name}
                  </div>
                  {hasVariants && (
                    <div className="mt-2 space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                      {item.variants!.map(v => (
                        <div key={v.id} className="flex items-center justify-between text-[11px] bg-dark-bg/30 px-2 py-1.5 rounded border border-dark-border/30 hover:border-dark-border transition-colors group/variant">
                          <span className="text-gray-400 font-medium truncate max-w-[140px]" title={v.name}>{v.name}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-600 font-mono hidden group-hover/variant:inline-block">{v.sku}</span>
                             <span className={`font-mono ${v.quantity > 0 ? 'text-gray-300' : 'text-red-400'}`}>
                                {v.quantity}
                             </span>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-top">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-md bg-dark-bg border border-dark-border text-gray-400 font-mono mt-0.5">
                    {item.sku}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top pt-3.5">
                  {item.category || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right align-top pt-3.5">
                  ${displayCost}{hasVariants && isRange ? '+' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium text-right align-top pt-3.5">
                  ${displayPrice}{hasVariants && isRange ? '+' : ''}
                </td>
                
                {/* Stock Column with Breakdown */}
                <td className="px-4 py-3 whitespace-nowrap text-right align-top pt-3">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold ${safeQuantity === 0 ? 'text-red-500' : safeQuantity < 5 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {safeQuantity}
                    </span>
                    {/* Visual Breakdown */}
                    {breakdown.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {breakdown.map((b, idx) => (
                           <div key={idx} className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
                             <span className={`${b.isDefault ? 'text-blue-400' : 'text-gray-500'}`}>{b.name.substring(0, 10)}{b.name.length > 10 ? '...' : ''}:</span>
                             <span className="font-mono text-gray-300">{b.qty}</span>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right align-top pt-3.5">
                  ${totalValue.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium align-top pt-2">
                  <div className="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onSell(item)}
                      title="Registrar Venta"
                      className="p-1.5 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition-colors border border-green-900/50"
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <button 
                      onClick={() => onRestock(item)}
                      title="Reponer Mercancía"
                      className="p-1.5 bg-orange-900/30 text-orange-400 rounded hover:bg-orange-900/50 transition-colors border border-orange-900/50"
                    >
                      <PackagePlus size={16} />
                    </button>
                    <button 
                      onClick={() => onEdit(item)}
                      title="Editar"
                      className="p-1.5 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors border border-blue-900/50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)}
                      title="Eliminar"
                      className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors border border-red-900/50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};