import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, X, Loader2, Sparkles, Warehouse as WarehouseIcon } from 'lucide-react';
import { InventoryItem, Transaction, Warehouse } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  transactions: Transaction[];
  categories: string[];
  warehouses: Warehouse[];
}


interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC<Props> = ({ isOpen, onClose, items, transactions, categories, warehouses }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy tu asistente experto en inventario. Puedo analizar tu stock por almacén, sugerir transferencias para eventos o darte estrategias de venta. ¿En qué te ayudo?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const buildContext = () => {
    // Resumen de inventario enfocado en distribución por almacén
    const inventorySummary = items.slice(0, 100).map(i => { // Limit to 100 items for token limit safety
      const variantsInfo = i.variants 
        ? i.variants.map(v => {
            // Detalle de stock por almacén para variantes
            const stockDist = Object.entries(v.stockByWarehouse || {})
                .map(([wId, qty]) => {
                    const wName = warehouses.find(w => w.id === wId)?.name || wId;
                    return `${wName}:${qty}`;
                }).join(', ');
            return `[${v.name} (Total:${v.quantity} | Dist: ${stockDist})]`;
          }).join(', ') 
        : 'Sin variantes';
      
      // Detalle de stock por almacén para items simples
      const mainStockDist = !i.variants 
        ? Object.entries(i.stockByWarehouse || {})
            .map(([wId, qty]) => {
                const wName = warehouses.find(w => w.id === wId)?.name || wId;
                return `${wName}:${qty}`;
            }).join(', ')
        : 'Ver variantes';

      return `- ${i.name} (${i.category}): Total ${i.quantity}. Costo $${i.cost}, Precio $${i.price}. Distribución: ${mainStockDist}. Variantes: ${variantsInfo}`;
    }).join('\n');

    // Últimas transacciones para contexto de movimiento
    const recentTransactions = transactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
      .map(t => {
        const date = new Date(t.date).toLocaleDateString();
        const location = t.warehouseName || 'General';
        let typeInfo: string = t.type;
        if (t.type === 'TRANSFER') {
            const fromName = warehouses.find(w => w.id === t.fromWarehouseId)?.name || 'Origen';
            const toName = warehouses.find(w => w.id === t.toWarehouseId)?.name || 'Destino';
            typeInfo = `TRANSFERENCIA de ${fromName} a ${toName}`;
        }
        return `- ${date}: ${typeInfo} - ${t.itemName} (${t.quantity} un.) - Ref: ${location} - Total $${t.total}`;
      }).join('\n');

    return `
      ACTÚA COMO: Un experto gerente de logística y marketing para "Hernandez Tattoo Studio".
      
      DATOS DEL SISTEMA:
      
      1. ALMACENES ACTIVOS:
      ${warehouses.map(w => `- ${w.name} ${w.isDefault ? '(Principal)' : ''}`).join('\n')}

      2. RESUMEN DE INVENTARIO (Muestra):
      ${inventorySummary}

      3. HISTORIAL RECIENTE:
      ${recentTransactions}

      4. CATEGORÍAS: ${categories.join(', ')}

      TUS OBJETIVOS:
      - Ayudar a localizar mercancía en los diferentes almacenes.
      - Sugerir transferencias si un almacén (ej. un Evento) se está quedando sin stock de productos populares.
      - Analizar ventas para recomendar qué llevar a futuros eventos.
      - Responder preguntas sobre valor de inventario y ganancias.

      FORMATO DE RESPUESTA:
      - Usa Markdown.
      - Sé directo y profesional.
      - Si sugieres una transferencia, especifica origen y destino.
    `;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const context = buildContext();
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "Eres el asistente inteligente del sistema de gestión de inventarios."
        },
        contents: [
            { role: 'user', parts: [{ text: context }] },
            ...messages.filter(m => m.role !== 'model').slice(-10).map(m => ({ role: 'user', parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMsg }] }
        ]
      });

      const text = response.text;
      setMessages(prev => [...prev, { role: 'model', text: text || 'No pude procesar la respuesta.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error de conexión con la IA. Verifica tu API Key o conexión.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-surface border border-dark-border w-full max-w-2xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-brand-orange/10 p-4 border-b border-dark-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange text-white rounded-lg shadow-lg shadow-brand-orange/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Asistente de Almacén</h3>
              <p className="text-xs text-brand-orange">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-700 text-gray-300' : 'bg-brand-orange text-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg text-sm max-w-[85%] leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gray-800 text-white border border-gray-700' 
                  : 'bg-dark-surface text-gray-200 border border-dark-border'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                    <div key={i} className="min-h-[1.2em]">
                        {line || <br/>}
                    </div>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-dark-surface border border-dark-border p-3 rounded-lg flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand-orange" />
                <span className="text-xs text-gray-400">Analizando almacenes...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-dark-surface border-t border-dark-border flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre stock, transferencias o ventas..."
            className="flex-1 bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange placeholder-gray-600"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-brand-orange hover:bg-brand-hover text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-orange/10"
          >
            <Send size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};