import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className={`bg-dark-surface border border-dark-border rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-dark-border bg-dark-surface shrink-0">
          <h3 className="text-xl font-bold text-brand-orange">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-dark-bg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};