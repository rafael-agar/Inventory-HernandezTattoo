import React, { useState, useEffect } from 'react';
import { ChannelType, InventoryItem, ProductVariant, Warehouse } from '../types';
import { Plus, Trash2, Layers, Tag, Palette, Box, Ruler, Wand2, Check } from 'lucide-react';

interface Props {
  initialData?: InventoryItem | null;
  categories: string[];
  sizes?: string[];
  colors?: string[];
  others?: string[];
  warehouses: Warehouse[];
  onSubmit: (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<Props> = ({ 
  initialData, 
  categories, 
  sizes = [], 
  colors = [], 
  others = [], 
  warehouses, 
  onSubmit, 
  onCancel 
}) => {
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  // Selection states for variant generator
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOthers, setSelectedOthers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    cost: '',
    price: '',
    quantity: '',
    category: '',
  });

  const defaultWarehouseId = warehouses.find(w => w.isDefault)?.id || warehouses[0]?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        sku: initialData.sku,
        cost: initialData.cost.toString(),
        price: (initialData.price || 0).toString(),
        quantity: initialData.quantity.toString(),
        category: initialData.category,
      });

      if (initialData.variants && initialData.variants.length > 0) {
        setHasVariants(true);
        setVariants(initialData.variants);
      }
    }
  }, [initialData]);

  const generateTempId = () => Math.random().toString(36).substr(2, 9);

  // Toggle selection helper
  const toggleSelection = (item: string, current: string[], setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(item)) {
      setFn(current.filter(i => i !== item));
    } else {
      setFn([...current, item]);
    }
  };

  // Generate combinations based on selections
  const generateCombinations = () => {
    if (selectedSizes.length === 0 && selectedColors.length === 0 && selectedOthers.length === 0) return;

    // Use [null] to iterate at least once if the array is empty, acting as a placeholder that contributes nothing to the name
    const sArr = selectedSizes.length > 0 ? selectedSizes : [null];
    const cArr = selectedColors.length > 0 ? selectedColors : [null];
    const oArr = selectedOthers.length > 0 ? selectedOthers : [null];

    const newVariants: ProductVariant[] = [];
    // If main form cost/price is empty, default to NaN to force user entry in variants
    const defaultCost = formData.cost === '' ? NaN : parseFloat(formData.cost);
    const defaultPrice = formData.price === '' ? NaN : parseFloat(formData.price);

    const isDuplicate = (name: string) => {
        return variants.some(v => v.name === name) || newVariants.some(v => v.name === name);
    };

    sArr.forEach(s => {
        cArr.forEach(c => {
            oArr.forEach(o => {
                if(!s && !c && !o) return; // Skip if all are null
                
                // Combine parts: "S", "Red" -> "S / Red"
                const parts = [s, c, o].filter(Boolean);
                const name = parts.join(' / ');
                
                if (!isDuplicate(name)) {
                     // Generate a SKU suffix based on the combined name
                     const skuSuffix = parts.join('-').toUpperCase().replace(/[^A-Z0-9-]/g, '');
                     const variantSku = formData.sku ? `${formData.sku}-${skuSuffix}` : '';

                     newVariants.push({
                        id: generateTempId(),
                        name: name,
                        sku: variantSku,
                        cost: defaultCost,
                        price: defaultPrice,
                        quantity: 0,
                        stockByWarehouse: { [defaultWarehouseId]: 0 }
                     });
                }
            });
        });
    });

    if (newVariants.length > 0) {
        if ((variants.length + newVariants.length) > 200) {
            alert("Límite de variantes excedido. Intenta agregar menos combinaciones a la vez.");
        } else {
             setVariants([...variants, ...newVariants]);
             // Clear selections after successful add
             setSelectedSizes([]);
             setSelectedColors([]);
             setSelectedOthers([]);
        }
    }
  };

  const addManualVariant = () => {
    if (variants.length >= 200) return;
    
    setVariants([
      ...variants,
      {
        id: generateTempId(),
        name: '', 
        sku: formData.sku ? `${formData.sku}-${variants.length + 1}` : '',
        cost: formData.cost === '' ? NaN : parseFloat(formData.cost),
        price: formData.price === '' ? NaN : parseFloat(formData.price),
        quantity: 0,
        stockByWarehouse: { [defaultWarehouseId]: 0 } 
      }
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for variants
    if (hasVariants) {
        if (variants.length === 0) {
            alert("Debe agregar al menos una variante.");
            return;
        }
        
        // Strict check: Ensure no NaN or invalid numbers
        const invalidVariant = variants.find(v => 
            isNaN(v.cost) || v.cost < 0 ||
            isNaN(v.price) || v.price < 0 ||
            isNaN(v.quantity) || v.quantity < 0
        );
        
        if (invalidVariant) {
            alert("Todas las variantes deben tener Costo, Precio y Cantidad válidos.");
            return;
        }
    }

    let finalCost = parseFloat(formData.cost) || 0;
    let finalPrice = parseFloat(formData.price) || 0;
    let finalQuantity = parseInt(formData.quantity) || 0;

    if (hasVariants && variants.length > 0) {
      finalQuantity = variants.reduce((acc, v) => acc + (v.quantity || 0), 0);
    }

    const cleanVariants = hasVariants ? variants.map(v => {
        const qty = Number(v.quantity) || 0;
        const currentStockMap = v.stockByWarehouse || {};
        
        let finalStockMap = { ...currentStockMap };
        if (!initialData) {
            finalStockMap = { [defaultWarehouseId]: qty };
        } else {
            // Reconcile variants as well if edited
            const otherStock = Object.entries(currentStockMap)
                .filter(([id]) => id !== defaultWarehouseId)
                .reduce((acc, [_, q]) => acc + q, 0);
            const defaultStock = Math.max(0, qty - otherStock);
            finalStockMap = { ...currentStockMap, [defaultWarehouseId]: defaultStock };
        }

        return {
          ...v,
          cost: Number(v.cost) || 0,
          price: Number(v.price) || 0,
          quantity: qty,
          stockByWarehouse: finalStockMap
        };
    }) : [];

    let mainStockMap = initialData?.stockByWarehouse || {};
    
    // Logic for non-variant items: Reconcile stock
    if (!hasVariants) {
         if (!initialData) {
             mainStockMap = { [defaultWarehouseId]: finalQuantity };
         } else {
             // Calculate stock present in other warehouses
             const otherStock = Object.entries(mainStockMap)
                .filter(([id]) => id !== defaultWarehouseId)
                .reduce((acc, [_, qty]) => acc + qty, 0);
             
             // Assign the remainder to the default warehouse
             const newDefaultStock = Math.max(0, finalQuantity - otherStock);
             
             mainStockMap = { 
                 ...mainStockMap, 
                 [defaultWarehouseId]: newDefaultStock
             };
         }
    }

    onSubmit({
      name: formData.name,
      sku: formData.sku,
      cost: finalCost,
      price: finalPrice,
      quantity: finalQuantity,
      category: formData.category,
      channel: ChannelType.MAIN,
      variants: cleanVariants,
      stockByWarehouse: mainStockMap
    });
  };

  const inputClass = "mt-1 block w-full rounded-md border-dark-border shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm border p-2 bg-dark-bg text-white placeholder-gray-600";
  const labelClass = "block text-sm font-medium text-gray-300";

  // Helper component for toggle buttons
  const ToggleGroup = ({ label, icon: Icon, items, selected, setSelected }: any) => {
      if (!items || items.length === 0) return null;
      return (
        <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icon size={12} /> {label}
            </label>
            <div className="flex flex-wrap gap-2">
                {items.map((item: string) => {
                    const isSelected = selected.includes(item);
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection(item, selected, setSelected)}
                            className={`px-3 py-1.5 text-xs rounded border transition-all flex items-center gap-1.5 ${
                                isSelected 
                                ? 'bg-brand-orange border-brand-orange text-white shadow-sm' 
                                : 'bg-dark-surface border-dark-border text-gray-300 hover:border-gray-500'
                            }`}
                        >
                            {isSelected && <Check size={10} strokeWidth={4} />}
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
      );
  };

  const combinationCount = 
    (selectedSizes.length || 1) * (selectedColors.length || 1) * (selectedOthers.length || 1);
  const isGeneratorReady = selectedSizes.length > 0 || selectedColors.length > 0 || selectedOthers.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Nombre del Producto *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className={inputClass}
            placeholder="Ej. Camiseta Básica"
          />
        </div>

        <div>
          <label className={labelClass}>SKU Base *</label>
          <input
            type="text"
            required
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
            className={`${inputClass} font-mono`}
            placeholder="CAM-001"
          />
        </div>

        <div>
          <label className={labelClass}>Categoría *</label>
          <input
            type="text"
            required
            list="category-suggestions"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className={inputClass}
            placeholder="Seleccionar o escribir..."
          />
          <datalist id="category-suggestions">
            {categories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex items-center gap-2 py-3 border-t border-b border-dark-border my-4">
        <input
          type="checkbox"
          id="hasVariants"
          checked={hasVariants}
          onChange={(e) => {
            setHasVariants(e.target.checked);
          }}
          className="h-4 w-4 text-brand-orange bg-dark-bg border-dark-border rounded focus:ring-brand-orange focus:ring-offset-dark-surface"
        />
        <label htmlFor="hasVariants" className="text-sm font-medium text-gray-200 flex items-center gap-2 cursor-pointer select-none">
          <Layers size={16} className="text-brand-orange" />
          Este producto tiene variantes (Talla, Color, etc.)
        </label>
      </div>

      {!hasVariants ? (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Costo ($) *</label>
            <input
              type="number"
              required={!hasVariants}
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>Precio ($) *</label>
            <input
              type="number"
              required={!hasVariants}
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>Cantidad Inicial *</label>
            <input
              type="number"
              required={!hasVariants}
              min="0"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className={inputClass}
              placeholder="0"
            />
             <p className="text-xs text-gray-500 mt-1">Se asignará al Almacén Principal</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 bg-dark-bg/50 p-4 rounded-lg border border-dark-border">
           
           {/* GENERATOR SECTION */}
           <div className="space-y-2">
             <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-400" />
                    Generador de Combinaciones
                </label>
                <span className="text-xs text-gray-500">Selecciona atributos para combinar</span>
             </div>
             
             <div className="bg-dark-surface/50 p-3 rounded border border-dark-border/50">
                <ToggleGroup label="Tallas" icon={Ruler} items={sizes} selected={selectedSizes} setSelected={setSelectedSizes} />
                <ToggleGroup label="Colores" icon={Palette} items={colors} selected={selectedColors} setSelected={setSelectedColors} />
                <ToggleGroup label="Otros" icon={Box} items={others} selected={selectedOthers} setSelected={setSelectedOthers} />
                
                <div className="mt-4 pt-3 border-t border-dark-border/50 flex justify-end">
                    <button
                        type="button"
                        onClick={generateCombinations}
                        disabled={!isGeneratorReady}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} />
                        {isGeneratorReady 
                            ? `Generar ${combinationCount > 0 ? combinationCount : ''} Variantes` 
                            : 'Selecciona atributos para generar'}
                    </button>
                </div>
             </div>
           </div>

           <hr className="border-dark-border" />

           <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variantes Generadas</span>
             <span className="text-xs text-brand-orange font-medium">{variants.length} variantes</span>
           </div>
           
           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {variants.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm italic border border-dashed border-gray-700 rounded">
                    No hay variantes creadas. Usa el generador arriba.
                </div>
            )}
            {variants.map((variant, index) => (
                <div key={variant.id || index} className="grid grid-cols-12 gap-2 items-center bg-dark-surface p-2 rounded border border-dark-border shadow-sm">
                    <div className="col-span-4">
                    <label className="text-[10px] text-gray-500 uppercase block mb-0.5">Nombre *</label>
                    <input 
                        type="text" 
                        value={variant.name} 
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="w-full text-xs bg-dark-bg border-dark-border rounded focus:ring-brand-orange focus:border-brand-orange py-1 px-2 text-white placeholder-gray-600"
                        placeholder="Nombre Variante"
                        required
                    />
                    <div className="text-[9px] text-gray-500 font-mono mt-0.5 truncate pl-1">{variant.sku}</div>
                    </div>
                    <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase block mb-0.5">Costo *</label>
                    <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        required
                        value={isNaN(variant.cost) ? '' : variant.cost} 
                        onChange={(e) => updateVariant(index, 'cost', parseFloat(e.target.value))}
                        className="w-full text-xs bg-dark-bg border-dark-border rounded focus:ring-brand-orange focus:border-brand-orange py-1 px-2 text-white"
                        placeholder="0.00"
                    />
                    </div>
                    <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase block mb-0.5">Precio *</label>
                    <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        required
                        value={isNaN(variant.price) ? '' : variant.price} 
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                        className="w-full text-xs bg-dark-bg border-dark-border rounded focus:ring-brand-orange focus:border-brand-orange py-1 px-2 text-white"
                        placeholder="0.00"
                    />
                    </div>
                    <div className="col-span-3">
                    <label className="text-[10px] text-gray-500 uppercase block mb-0.5">Cantidad *</label>
                    <input 
                        type="number" 
                        min="0"
                        step="1"
                        required
                        value={isNaN(variant.quantity) ? '' : variant.quantity} 
                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value))}
                        className="w-full text-xs bg-dark-bg border-dark-border rounded focus:ring-brand-orange focus:border-brand-orange py-1 px-2 font-bold text-white"
                        placeholder="0"
                    />
                    </div>
                    <div className="col-span-1 flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => removeVariant(index)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    >
                        <Trash2 size={14} />
                    </button>
                    </div>
                </div>
            ))}
           </div>

           <button
            type="button"
            onClick={addManualVariant}
            className="w-full py-2 border border-dashed border-gray-600 rounded-md text-xs font-medium text-gray-400 hover:border-brand-orange hover:text-brand-orange transition-colors flex justify-center items-center gap-2"
           >
             <Plus size={14} /> Agregar Variante Manualmente (Vacia)
           </button>

           <div className="text-right text-sm text-gray-400 mt-2">
             Total Unidades: <span className="font-bold text-white">{variants.reduce((acc, v) => acc + (v.quantity || 0), 0)}</span>
           </div>
        </div>
      )}

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
          className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-brand-orange border border-transparent rounded-lg hover:bg-brand-hover shadow-lg shadow-brand-orange/20 transition-all"
        >
          {initialData ? 'Guardar Cambios' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
};