import React, { useState, useEffect } from 'react';
import { InventoryItem, SortField, SortOrder, Transaction, TransactionType, Warehouse } from './types';
import { saveInventory, loadInventory, exportToCSV, saveCategories, loadCategories, saveTransactions, loadTransactions, saveWarehouses, loadWarehouses, loadSizes, saveSizes, loadColors, saveColors, loadOtherVariants, saveOtherVariants } from './services/storage';
import { InventoryTable } from './components/InventoryTable';
import { Modal } from './components/Modal';
import { ProductForm } from './components/ProductForm';
import { SaleForm } from './components/SaleForm';
import { RestockForm } from './components/RestockForm';
import { ConfigurationManager } from './components/ConfigurationManager';
import { WarehouseManager } from './components/WarehouseManager';
import { TransferForm } from './components/TransferForm';
import { ExpenseDashboard } from './components/ExpenseDashboard';
import { AIChat } from './components/AIChat';
import { Plus, Download, Search, LayoutDashboard, DollarSign, PackageOpen, Settings, PieChart, Sparkles, ArrowRightLeft, Warehouse as WarehouseIcon } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [otherVariants, setOtherVariants] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Load data on mount with Auto-Repair logic
  useEffect(() => {
    const loadedWarehouses = loadWarehouses();
    setWarehouses(loadedWarehouses);
    
    setCategories(loadCategories());
    setSizes(loadSizes());
    setColors(loadColors());
    setOtherVariants(loadOtherVariants());
    setTransactions(loadTransactions());
    
    // Auto-repair inventory: Assign orphaned stock to default warehouse
    const loadedItems = loadInventory();
    const defaultWarehouseId = loadedWarehouses.find(w => w.isDefault)?.id || loadedWarehouses[0]?.id;

    const repairedItems = loadedItems.map(item => {
        const hasVariants = item.variants && item.variants.length > 0;

        if (hasVariants) {
            const newVariants = item.variants!.map(v => {
                const mapSum = Object.values(v.stockByWarehouse || {}).reduce((a, b) => a + b, 0);
                // If variant has quantity but no warehouse assignment, assign to default
                if (v.quantity > 0 && mapSum === 0) {
                    return {
                        ...v,
                        stockByWarehouse: { [defaultWarehouseId]: v.quantity }
                    };
                }
                return v;
            });
            return { ...item, variants: newVariants };
        } else {
            const mapSum = Object.values(item.stockByWarehouse || {}).reduce((a, b) => a + b, 0);
             // If item has quantity but no warehouse assignment, assign to default
            if (item.quantity > 0 && mapSum === 0) {
                return {
                    ...item,
                    stockByWarehouse: { [defaultWarehouseId]: item.quantity }
                };
            }
        }
        return item;
    });

    setItems(repairedItems);
    // Determine if we need to save the repaired items immediately to persist the fix
    const needsSave = JSON.stringify(loadedItems) !== JSON.stringify(repairedItems);
    if (needsSave) {
        saveInventory(repairedItems);
    }

  }, []);

  // Save data on change
  useEffect(() => {
    if (items.length > 0) saveInventory(items);
  }, [items]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSizes(sizes);
  }, [sizes]);

  useEffect(() => {
    saveColors(colors);
  }, [colors]);

  useEffect(() => {
    saveOtherVariants(otherVariants);
  }, [otherVariants]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveWarehouses(warehouses);
  }, [warehouses]);

  // Helper to log transaction
  const logTransaction = (
    type: TransactionType,
    item: { id: string, name: string, sku: string },
    quantity: number,
    cost: number,
    price: number,
    warehouseName?: string,
    variantInfo?: { id: string, name: string },
    transferInfo?: { fromId: string, toId: string }
  ) => {
    if (quantity <= 0) return;

    const total = type === 'OUT_SALE' ? (price * quantity) : (type === 'TRANSFER' ? 0 : (cost * quantity));

    const newTransaction: Transaction = {
      id: generateId(),
      date: Date.now(),
      itemId: item.id,
      itemName: item.name,
      variantId: variantInfo?.id,
      variantName: variantInfo?.name,
      sku: item.sku,
      quantity: quantity,
      unitCost: cost,
      unitPrice: price,
      total: total,
      type,
      warehouseName,
      fromWarehouseId: transferInfo?.fromId,
      toWarehouseId: transferInfo?.toId
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  // Actions
  const handleAddItem = (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newId = generateId();
    const newItem: InventoryItem = {
      ...data,
      id: newId,
      lastUpdated: Date.now()
    };
    setItems(prev => [...prev, newItem]);
    
    const defaultWarehouseName = warehouses.find(w => w.isDefault)?.name || 'Principal';

    if (data.variants && data.variants.length > 0) {
      data.variants.forEach(v => {
        if(v.quantity > 0) {
           logTransaction('IN_INITIAL', { id: newId, name: data.name, sku: v.sku || data.sku }, v.quantity, v.cost, v.price, defaultWarehouseName, { id: v.id, name: v.name });
        }
      });
    } else {
      logTransaction('IN_INITIAL', { id: newId, name: data.name, sku: data.sku }, data.quantity, data.cost, data.price, defaultWarehouseName);
    }
    
    setIsAddModalOpen(false);
  };

  const handleEditItem = (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!editingItem) return;

    setItems(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...data, lastUpdated: Date.now() } 
        : item
    ));
    
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSale = (quantity: number, warehouseName: string, warehouseId: string, variantId?: string) => {
    if (!sellingItem) return;
    
    const updateStockMap = (map: Record<string, number> | undefined, wId: string, qtyToRemove: number) => {
        const current = map?.[wId] || 0;
        return { ...(map || {}), [wId]: Math.max(0, current - qtyToRemove) };
    };

    if (variantId && sellingItem.variants) {
       const variant = sellingItem.variants.find(v => v.id === variantId);
       if (variant) {
         logTransaction(
           'OUT_SALE', 
           { ...sellingItem, sku: variant.sku || sellingItem.sku },
           quantity, 
           variant.cost, 
           variant.price, 
           warehouseName,
           { id: variant.id, name: variant.name }
         );

         setItems(prev => prev.map(item => {
           if (item.id === sellingItem.id) {
             const updatedVariants = item.variants!.map(v => 
               v.id === variantId ? { 
                   ...v, 
                   quantity: v.quantity - quantity,
                   stockByWarehouse: updateStockMap(v.stockByWarehouse, warehouseId, quantity)
               } : v
             );
             const newTotal = updatedVariants.reduce((acc, v) => acc + v.quantity, 0);
             return { ...item, variants: updatedVariants, quantity: newTotal, lastUpdated: Date.now() };
           }
           return item;
         }));
       }
    } else {
      logTransaction(
        'OUT_SALE', 
        sellingItem, 
        quantity, 
        sellingItem.cost, 
        sellingItem.price, 
        warehouseName
      );

      setItems(prev => prev.map(item => {
          if (item.id === sellingItem.id) {
              return {
                  ...item,
                  quantity: item.quantity - quantity,
                  stockByWarehouse: updateStockMap(item.stockByWarehouse, warehouseId, quantity),
                  lastUpdated: Date.now()
              }
          }
          return item;
      }));
    }

    setSellingItem(null);
  };

  const handleRestock = (itemId: string, variantId: string | undefined, warehouseId: string, quantity: number, unitCost: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const warehouseName = warehouses.find(w => w.id === warehouseId)?.name || 'Unknown';

    const addStockMap = (map: Record<string, number> | undefined, wId: string, qtyToAdd: number) => {
        const current = map?.[wId] || 0;
        return { ...(map || {}), [wId]: current + qtyToAdd };
    };

    if (variantId && item.variants) {
        const variant = item.variants.find(v => v.id === variantId);
        if(variant) {
            logTransaction(
                'IN_RESTOCK',
                { ...item, sku: variant.sku || item.sku },
                quantity,
                unitCost,
                variant.price,
                warehouseName,
                { id: variant.id, name: variant.name }
            );

            setItems(prev => prev.map(i => {
                if (i.id === itemId) {
                    const updatedVariants = i.variants!.map(v =>
                        v.id === variantId ? {
                            ...v,
                            quantity: v.quantity + quantity,
                            stockByWarehouse: addStockMap(v.stockByWarehouse, warehouseId, quantity)
                        } : v
                    );
                    const newTotal = updatedVariants.reduce((acc, v) => acc + v.quantity, 0);
                    return { ...i, variants: updatedVariants, quantity: newTotal, lastUpdated: Date.now() };
                }
                return i;
            }));
        }
    } else {
        logTransaction(
            'IN_RESTOCK',
            item,
            quantity,
            unitCost,
            item.price,
            warehouseName
        );

        setItems(prev => prev.map(i => {
            if (i.id === itemId) {
                return {
                    ...i,
                    quantity: i.quantity + quantity,
                    stockByWarehouse: addStockMap(i.stockByWarehouse, warehouseId, quantity),
                    lastUpdated: Date.now()
                }
            }
            return i;
        }));
    }
    setRestockingItem(null);
  };


  const handleTransfer = (itemId: string, variantId: string | undefined, fromId: string, toId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const fromName = warehouses.find(w => w.id === fromId)?.name || 'Unknown';
    const toName = warehouses.find(w => w.id === toId)?.name || 'Unknown';

    const moveStock = (map: Record<string, number> | undefined) => {
        const currentFrom = map?.[fromId] || 0;
        const currentTo = map?.[toId] || 0;
        return {
            ...(map || {}),
            [fromId]: Math.max(0, currentFrom - qty),
            [toId]: currentTo + qty
        };
    };

    if (variantId && item.variants) {
        const variant = item.variants.find(v => v.id === variantId);
        if(!variant) return;

        logTransaction('TRANSFER', { id: item.id, name: item.name, sku: variant.sku || item.sku }, qty, 0, 0, `${fromName} -> ${toName}`, { id: variant.id, name: variant.name }, { fromId, toId });

        setItems(prev => prev.map(i => {
            if (i.id === itemId) {
                const updatedVariants = i.variants!.map(v => 
                    v.id === variantId ? { ...v, stockByWarehouse: moveStock(v.stockByWarehouse) } : v
                );
                return { ...i, variants: updatedVariants, lastUpdated: Date.now() };
            }
            return i;
        }));

    } else {
        logTransaction('TRANSFER', { id: item.id, name: item.name, sku: item.sku }, qty, 0, 0, `${fromName} -> ${toName}`, undefined, { fromId, toId });

        setItems(prev => prev.map(i => {
            if (i.id === itemId) {
                return { ...i, stockByWarehouse: moveStock(i.stockByWarehouse), lastUpdated: Date.now() };
            }
            return i;
        }));
    }
    setIsTransferModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('¿Eliminar este registro histórico? (Esto no afectará al inventario actual)')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredItems = items.filter(item => 
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalStock = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  
  const totalValue = items.reduce((acc, curr) => {
    if (curr.variants && curr.variants.length > 0) {
      const variantValue = curr.variants.reduce((vAcc, v) => vAcc + (v.cost * v.quantity), 0);
      return acc + variantValue;
    }
    return acc + ((curr.cost || 0) * (curr.quantity || 0));
  }, 0);

  return (
    <div className="min-h-screen bg-dark-bg font-sans text-gray-200 pb-20">
      
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-orange text-white rounded-lg">
                <LayoutDashboard size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Gestión de Inventario</h1>
              <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">Inventario</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange w-48 lg:w-64 transition-colors placeholder-gray-600"
                />
               </div>

               <button 
                onClick={() => setIsAIChatOpen(true)}
                className="p-2 text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg transition-transform hover:scale-105 shadow-lg border border-transparent"
                title="Asistente IA"
              >
                <Sparkles size={20} />
              </button>

               <button 
                onClick={() => setIsTransferModalOpen(true)}
                className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors border border-blue-900/30 bg-blue-900/10"
                title="Transferir Mercancía"
              >
                <ArrowRightLeft size={20} />
              </button>

               <button 
                onClick={() => setIsExpensesModalOpen(true)}
                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-dark-bg rounded-lg transition-colors border border-transparent hover:border-dark-border"
                title="Reporte Financiero"
              >
                <PieChart size={20} />
              </button>

              <button 
                onClick={() => setIsWarehouseModalOpen(true)}
                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-dark-bg rounded-lg transition-colors border border-transparent hover:border-dark-border"
                title="Gestionar Almacenes"
              >
                <WarehouseIcon size={20} />
              </button>

              <button 
                onClick={() => setIsConfigModalOpen(true)}
                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-dark-bg rounded-lg transition-colors border border-transparent hover:border-dark-border"
                title="Configuración"
              >
                <Settings size={20} />
              </button>

              <button 
                onClick={() => exportToCSV(items)}
                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-dark-bg rounded-lg transition-colors border border-transparent hover:border-dark-border"
                title="Exportar CSV"
              >
                <Download size={20} />
              </button>
              
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand-orange/20 font-medium text-sm border border-transparent"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuevo Producto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile Search */}
        <div className="mb-6 md:hidden">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
            <input
              type="text"
              placeholder="Buscar SKU, nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange placeholder-gray-600"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl border bg-dark-surface border-dark-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-900/20 text-blue-400">
                <PackageOpen size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Total Unidades en Almacén</p>
                <p className="text-2xl font-bold text-white">{totalStock}</p>
              </div>
            </div>
          </div>

           <div className="p-6 rounded-xl border bg-dark-surface border-dark-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-900/20 text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Valor Total del Inventario</p>
                <p className="text-2xl font-bold text-white">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <InventoryTable 
          items={filteredItems} 
          warehouses={warehouses}
          onDelete={handleDeleteItem}
          onEdit={setEditingItem}
          onSell={setSellingItem}
          onRestock={setRestockingItem}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Agregar Nuevo Producto"
      >
        <ProductForm 
          categories={categories}
          sizes={sizes}
          colors={colors}
          others={otherVariants}
          warehouses={warehouses}
          onSubmit={handleAddItem}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        title="Editar Producto"
      >
        <ProductForm 
          initialData={editingItem}
          categories={categories}
          sizes={sizes}
          colors={colors}
          others={otherVariants}
          warehouses={warehouses}
          onSubmit={handleEditItem}
          onCancel={() => setEditingItem(null)}
        />
      </Modal>

      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configuración"
      >
        <ConfigurationManager 
          categories={categories}
          sizes={sizes}
          colors={colors}
          others={otherVariants}
          onUpdateCategories={setCategories}
          onUpdateSizes={setSizes}
          onUpdateColors={setColors}
          onUpdateOthers={setOtherVariants}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </Modal>
      
      <Modal 
        isOpen={isWarehouseModalOpen} 
        onClose={() => setIsWarehouseModalOpen(false)} 
        title="Gestión de Almacenes"
      >
        <WarehouseManager 
          warehouses={warehouses}
          onUpdate={setWarehouses}
          onClose={() => setIsWarehouseModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferir Mercancía"
      >
        <TransferForm
            items={items}
            warehouses={warehouses}
            onSubmit={handleTransfer}
            onCancel={() => setIsTransferModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={isExpensesModalOpen} 
        onClose={() => setIsExpensesModalOpen(false)} 
        title="Reporte Financiero (Ventas y Compras)"
        maxWidth="max-w-6xl"
      >
        <ExpenseDashboard 
          expenses={transactions}
          items={items}
          onDeleteExpense={handleDeleteTransaction}
          onClose={() => setIsExpensesModalOpen(false)}
        />
      </Modal>

      {/* AI Chat Component */}
      <AIChat 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        items={items}
        transactions={transactions}
        categories={categories}
        warehouses={warehouses}
      />

       <Modal 
        isOpen={!!sellingItem} 
        onClose={() => setSellingItem(null)} 
        title="Registrar Venta"
      >
        {sellingItem && (
          <SaleForm 
            item={sellingItem}
            warehouses={warehouses}
            onSubmit={handleSale}
            onCancel={() => setSellingItem(null)}
          />
        )}
      </Modal>

      <Modal 
        isOpen={!!restockingItem} 
        onClose={() => setRestockingItem(null)} 
        title="Reponer Mercancía (Agregar Stock)"
      >
        {restockingItem && (
          <RestockForm 
            item={restockingItem}
            warehouses={warehouses}
            onSubmit={handleRestock}
            onCancel={() => setRestockingItem(null)}
          />
        )}
      </Modal>

    </div>
  );
}