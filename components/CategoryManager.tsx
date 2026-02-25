import React, { useState } from 'react';
import { Trash2, Plus, Tag } from 'lucide-react';

interface Props {
  categories: string[];
  onUpdate: (newCategories: string[]) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<Props> = ({ categories, onUpdate, onClose }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onUpdate([...categories, trimmed]);
      setNewCategory('');
    }
  };

  const handleDelete = (catToDelete: string) => {
    onUpdate(categories.filter(c => c !== catToDelete));
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-orange/10 p-4 rounded-lg border border-brand-orange/20 flex gap-3 items-start">
        <Tag className="text-brand-orange shrink-0 mt-1" size={20} />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-brand-orange">Gestión de Categorías</p>
          <p className="opacity-80">
            Define las categorías disponibles para estandarizar tu inventario. 
            Estas aparecerán como sugerencias al crear productos.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nueva categoría..."
          className="flex-1 rounded-md border-dark-border border shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 bg-dark-bg text-white placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!newCategory.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-orange hover:bg-brand-hover disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} className="mr-1" />
          Agregar
        </button>
      </form>

      <div className="border border-dark-border rounded-md divide-y divide-dark-border max-h-[300px] overflow-y-auto bg-dark-bg/30">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No hay categorías definidas.
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="flex justify-between items-center p-3 hover:bg-dark-bg transition-colors group">
              <span className="text-gray-300 font-medium">{cat}</span>
              <button
                onClick={() => handleDelete(cat)}
                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                title="Eliminar categoría"
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