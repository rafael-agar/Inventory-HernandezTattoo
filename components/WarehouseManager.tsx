import React, { useState } from 'react';
import { Trash2, Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import { Warehouse } from '../types';

interface Props {
  warehouses: Warehouse[];
  onUpdate: (newWarehouses: Warehouse[]) => void;
  onClose: () => void;
}

export const WarehouseManager: React.FC<Props> = ({ warehouses, onUpdate, onClose }) => {
  const [newWarehouseName, setNewWarehouseName] = useState('');

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWarehouseName.trim();
    if (trimmed) {
      const isDuplicate = warehouses.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (!isDuplicate) {
        onUpdate([...warehouses, { id: generateId(), name: trimmed }]);
        setNewWarehouseName('');
      } else {
        alert('Ya existe un almacén con ese nombre.');
      }
    }
  };

  const handleDelete = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    if (warehouse?.isDefault) {
      alert("No puedes eliminar el Almacén Principal.");
      return;
    }
    if (confirm(`¿Seguro que quieres eliminar "${warehouse?.name}"? Asegúrate de transferir su inventario antes de borrarlo.`)) {
      onUpdate(warehouses.filter(w => w.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-orange/10 p-4 rounded-lg border border-brand-orange/20 flex gap-3 items-start">
        <WarehouseIcon className="text-brand-orange shrink-0 mt-1" size={20} />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-brand-orange">Gestión de Almacenes</p>
          <p className="opacity-80">
            Crea múltiples ubicaciones para tu inventario (ej. "Camioneta", "Convención X", "Bodega B"). 
            Podrás transferir mercancía entre ellos.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newWarehouseName}
          onChange={(e) => setNewWarehouseName(e.target.value)}
          placeholder="Nombre del nuevo almacén..."
          className="flex-1 rounded-md border-dark-border border shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 bg-dark-bg text-white placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!newWarehouseName.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-orange hover:bg-brand-hover disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} className="mr-1" />
          Crear
        </button>
      </form>

      <div className="border border-dark-border rounded-md divide-y divide-dark-border max-h-[300px] overflow-y-auto bg-dark-bg/30">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="flex justify-between items-center p-3 hover:bg-dark-bg transition-colors group">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">{warehouse.name}</span>
              {warehouse.isDefault && (
                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">Principal</span>
              )}
            </div>
            {!warehouse.isDefault && (
              <button
                onClick={() => handleDelete(warehouse.id)}
                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                title="Eliminar almacén"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
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