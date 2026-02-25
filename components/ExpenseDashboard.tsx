import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, InventoryItem } from '../types';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Trash2, Filter, ArrowUpRight, ArrowDownLeft, Store, Layers, Search } from 'lucide-react';

interface Props {
  expenses: Transaction[]; // Named expenses prop for compatibility but contains all transactions
  items: InventoryItem[];
  onDeleteExpense: (id: string) => void;
  onClose: () => void;
}

export const ExpenseDashboard: React.FC<Props> = ({ expenses: transactions, items, onDeleteExpense, onClose }) => {
  // Helper to format date to YYYY-MM-DD in local time
  const toLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [startDate, setStartDate] = useState(toLocalDateStr(firstDayOfMonth));
  const [endDate, setEndDate] = useState(toLocalDateStr(now));
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALES' | 'PURCHASES'>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date Filter
      const tDate = new Date(t.date);
      const tDateStr = toLocalDateStr(tDate);
      
      // Compare strings "YYYY-MM-DD" lexicographically works correctly
      if (tDateStr < startDate || tDateStr > endDate) return false;

      // Type Filter
      if (typeFilter === 'SALES' && t.type !== 'OUT_SALE') return false;
      if (typeFilter === 'PURCHASES' && (t.type === 'OUT_SALE')) return false;

      // Item Filter
      if (selectedItemId && t.itemId !== selectedItemId) return false;

      return true;
    }).sort((a, b) => b.date - a.date);
  }, [transactions, startDate, endDate, typeFilter, selectedItemId]);

  // Calculations
  const sales = filteredTransactions.filter(t => t.type === 'OUT_SALE');
  const purchases = filteredTransactions.filter(t => t.type !== 'OUT_SALE');

  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);
  const totalSpent = purchases.reduce((acc, curr) => acc + curr.total, 0);
  
  // Estimated Profit: Revenue - (Cost of goods sold)
  const costOfGoodsSold = sales.reduce((acc, curr) => acc + (curr.unitCost * curr.quantity), 0);
  const estimatedProfit = totalRevenue - costOfGoodsSold;
  
  // Sort items for dropdown
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-dark-bg p-4 rounded-lg border border-dark-border">
        <div>
           <h2 className="text-lg font-semibold text-white flex items-center gap-2">
             <TrendingUp className="text-brand-orange" size={20} />
             Reporte Financiero
           </h2>
           <p className="text-sm text-gray-500">Movimientos de inventario, ventas y ganancias.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto flex-wrap">
          
          <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-md px-3 py-2 shadow-sm w-full sm:w-auto min-w-[200px]">
            <Search size={16} className="text-gray-500 shrink-0" />
            <select 
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-gray-300 font-medium outline-none w-full"
            >
              <option value="" className="bg-dark-surface">Todos los Productos</option>
              {sortedItems.map(item => (
                <option key={item.id} value={item.id} className="bg-dark-surface">
                   {item.name} {item.sku ? `(${item.sku})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-md px-3 py-2 shadow-sm w-full sm:w-auto">
            <Filter size={16} className="text-gray-500 shrink-0" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-gray-300 font-medium outline-none w-full"
            >
              <option value="ALL" className="bg-dark-surface">Todos los Tipos</option>
              <option value="SALES" className="bg-dark-surface">Solo Ventas</option>
              <option value="PURCHASES" className="bg-dark-surface">Compras / Cargas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-md px-3 py-2 shadow-sm flex-1">
              <span className="text-xs text-gray-500">Desde:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 outline-none text-gray-300 font-mono w-full"
              />
            </div>

            <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-md px-3 py-2 shadow-sm flex-1">
              <span className="text-xs text-gray-500">Hasta:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 outline-none text-gray-300 font-mono w-full"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Card */}
        <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-emerald-500 text-sm font-medium">Ingresos por Ventas</p>
            <div className="p-1.5 bg-emerald-900/20 rounded-lg">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-600 mt-1">{sales.length} ventas registradas</p>
        </div>

        {/* Expenses Card */}
        <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
             <p className="text-orange-500 text-sm font-medium">Compras / Inversión</p>
             <div className="p-1.5 bg-orange-900/20 rounded-lg">
               <TrendingDown size={16} className="text-orange-500" />
             </div>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-orange-600 mt-1">{purchases.length} movimientos de entrada</p>
        </div>

        {/* Profit Card */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-400 text-sm font-medium">Ganancia Estimada</p>
            <div className="p-1.5 bg-dark-bg rounded-lg">
               <DollarSign size={16} className="text-gray-400" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${estimatedProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
            ${estimatedProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ventas - Costo de productos vendidos</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-dark-bg/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-24">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Estación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cant.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredTransactions.length === 0 ? (
                 <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Filter size={32} className="mb-2 opacity-20" />
                      <p className="text-sm">No se encontraron movimientos con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isSale = t.type === 'OUT_SALE';
                  return (
                    <tr key={t.id} className="hover:bg-dark-bg transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-300">{new Date(t.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isSale ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50">
                            <ArrowUpRight size={12} className="mr-1" /> Venta
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-900/50">
                            <ArrowDownLeft size={12} className="mr-1" /> Compra
                          </span>
                        )}
                      </td>
                       <td className="px-4 py-3 text-sm text-gray-400">
                        {t.warehouseName ? (
                          <span className="flex items-center gap-1">
                            <Store size={12} className="text-gray-500" />
                            {t.warehouseName}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div className="font-medium flex items-center flex-wrap gap-2">
                            {t.itemName}
                            {t.variantName && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                                {t.variantName}
                              </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{t.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-right font-medium">
                        {t.quantity}
                      </td>
                      <td className={`px-4 py-3 text-sm font-bold text-right ${isSale ? 'text-green-400' : 'text-orange-400'}`}>
                        {isSale ? '+' : '-'}${t.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                         <button 
                          onClick={() => onDeleteExpense(t.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-transparent border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cerrar Reporte
        </button>
      </div>
    </div>
  );
};