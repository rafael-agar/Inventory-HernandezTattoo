import React, { useState } from 'react';
import { Trash2, Plus, Store } from 'lucide-react';
import { Station } from '../types';

interface Props {
  stations: Station[];
  onUpdate: (newStations: Station[]) => void;
  onClose: () => void;
}

export const StationManager: React.FC<Props> = ({ stations, onUpdate, onClose }) => {
  const [newStationName, setNewStationName] = useState('');

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStationName.trim();
    if (trimmed) {
      const isDuplicate = stations.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (!isDuplicate) {
        onUpdate([...stations, { id: generateId(), name: trimmed }]);
        setNewStationName('');
      } else {
        alert('Ya existe una estación con ese nombre.');
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que quieres eliminar esta estación?')) {
      onUpdate(stations.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30 flex gap-3 items-start">
        <Store className="text-purple-400 shrink-0 mt-1" size={20} />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-purple-400">Gestión de Estaciones (Puntos de Venta)</p>
          <p className="opacity-80">
            Registra los lugares físicos, eventos o canales digitales donde realizas ventas (ej. "Tienda Centro", "Convención Tattoo", "Instagram").
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newStationName}
          onChange={(e) => setNewStationName(e.target.value)}
          placeholder="Nombre de la estación..."
          className="flex-1 rounded-md border-dark-border border shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm p-2 bg-dark-bg text-white placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!newStationName.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-orange hover:bg-brand-hover disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} className="mr-1" />
          Agregar
        </button>
      </form>

      <div className="border border-dark-border rounded-md divide-y divide-dark-border max-h-[300px] overflow-y-auto bg-dark-bg/30">
        {stations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No hay estaciones definidas. Agrega una para poder registrar ventas.
          </div>
        ) : (
          stations.map((station) => (
            <div key={station.id} className="flex justify-between items-center p-3 hover:bg-dark-bg transition-colors group">
              <span className="text-gray-300 font-medium">{station.name}</span>
              <button
                onClick={() => handleDelete(station.id)}
                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                title="Eliminar estación"
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