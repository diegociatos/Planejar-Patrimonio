import React from 'react';
import Icon from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in-up" 
        onClick={onClose} 
        aria-hidden="true"
        style={{ animationDuration: '0.2s' }}
      ></div>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-fade-in-up"
          style={{ animationDuration: '0.3s' }}
        >
          <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
            <h2 id="modal-title" className="text-xl font-bold text-brand-primary">{title}</h2>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-gray-200"
              aria-label="Fechar"
            >
              <Icon name="close" className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            {children}
          </div>
           <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 bg-brand-secondary text-white rounded-lg font-semibold text-sm hover:bg-brand-primary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
