import React, { useState } from 'react';
import { Trash2, Plus, Tag, Ruler, Palette, Box } from 'lucide-react';

interface Props {
  categories: string[];
  sizes: string[];
  colors: string[];
  others: string[];
  onUpdateCategories: (val: string[]) => void;
  onUpdateSizes: (val: string[]) => void;
  onUpdateColors: (val: string[]) => void;
  onUpdateOthers: (val: string[]) => void;
  onClose: () => void;
}

type TabType = 'categories' | 'sizes' | 'colors' | 'others';

export const ConfigurationManager: React.FC<Props> = ({ 
  categories, 
  sizes, 
  colors,
  others,
  onUpdateCategories, 
  onUpdateSizes, 
  onUpdateColors,
  onUpdateOthers,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [newValue, setNewValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newValue.trim();
    if (!trimmed) return;

    if (activeTab === 'categories') {
      if (!categories.includes(trimmed)) {
        onUpdateCategories([...categories, trimmed]);
      }
    } else if (activeTab === 'sizes') {
      if (!sizes.includes(trimmed)) {
        onUpdateSizes([...sizes, trimmed]);
      }
    } else if (activeTab === 'colors') {
      if (!colors.includes(trimmed)) {
        onUpdateColors([...colors, trimmed]);
      }
    } else if (activeTab === 'others') {
      if (!others.includes(trimmed)) {
        onUpdateOthers([...others, trimmed]);
      }
    }
    setNewValue('');
  };

  const handleDelete = (valToDelete: string) => {
    if (activeTab === 'categories') {
      onUpdateCategories(categories.filter(c => c !== valToDelete));
    } else if (activeTab === 'sizes') {
      onUpdateSizes(sizes.filter(s => s !== valToDelete));
    } else if (activeTab === 'colors') {
      onUpdateColors(colors.filter(c => c !== valToDelete));
    } else if (activeTab === 'others') {
      onUpdateOthers(others.filter(o => o !== valToDelete));
    }
  };

  let currentList: string[] = [];
  let placeholder = '';
  let title = '';
  let description = '';

  switch (activeTab) {
    case 'categories':
      currentList = categories;
      placeholder = "Nueva categoría...";
      title = "Gestión de Categorías";
      description = "Define las categorías para agrupar tu inventario.";
      break;
    case 'sizes':
      currentList = sizes;
      placeholder = "Nueva talla (ej. XL)...";
      title = "Configuración de Tallas";
      description = "Predefine las tallas para ropa (S, M, L, etc.).";
      break;
    case 'colors':
      currentList = colors;
      placeholder = "Nuevo color (ej. Negro)...";
      title = "Configuración de Colores";
      description = "Lista de colores comunes para tus variantes.";
      break;
    case 'others':
      currentList = others;
      placeholder = "Otro (ej. Material)...";
      title = "Otras Variantes";
      description = "Define otros tipos de variantes (Materiales, Estilos, etc.).";
      break;
  }

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
        activeTab === id 
          ? 'bg-dark-surface text-white shadow ring-1 ring-dark-border' 
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher Grid */}
      <div className="bg-dark-bg p-1 rounded-lg border border-dark-border grid grid-cols-2 sm:grid-cols-4 gap-1">
        <TabButton id="categories" label="Categorías" icon={Tag} />
        <TabButton id="sizes" label="Tallas" icon={Ruler} />
        <TabButton id="colors" label="Color" icon={Palette} />
        <TabButton id="others" label="Otro" icon={Box} />
      </div>

      <div className="bg-brand-orange/10 p-4 rounded-lg border border-brand-orange/20">
        <div className="text-sm text-gray-300">
          <p className="font-medium text-brand-orange">{title}</p>
          <p className="opacity-80 text-xs mt-1">{description}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-md border-dark-border border shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 bg-dark-bg text-white placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!newValue.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-orange hover:bg-brand-hover disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} className="mr-1" />
          Agregar
        </button>
      </form>

      <div className="border border-dark-border rounded-md divide-y divide-dark-border max-h-[300px] overflow-y-auto bg-dark-bg/30">
        {currentList.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Lista vacía.
          </div>
        ) : (
          currentList.map((item) => (
            <div key={item} className="flex justify-between items-center p-3 hover:bg-dark-bg transition-colors group">
              <span className="text-gray-300 font-medium">{item}</span>
              <button
                onClick={() => handleDelete(item)}
                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-dark-border flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};