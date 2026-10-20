import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`
          w-full ${maxWidthStyles[maxWidth]} max-w-[calc(100vw-24px)] bg-[#FAF8F5]
          border-4 border-[#102040] shadow-[8px_8px_0px_rgba(0,0,0,0.6)]
          flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden
        `}
      >
        {/* Modal Header */}
        <div className="bg-[#102040] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b-4 border-[#102040] shrink-0 gap-2">
          <h2 className="font-pixel text-xs sm:text-sm uppercase tracking-wider break-words leading-snug pr-1 flex-1">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center bg-[#D32F2F] text-white font-pixel text-xs border-2 border-white hover:bg-[#B71C1C] cursor-pointer active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto min-h-0 flex-1 font-sans text-sm text-[#102040]">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="bg-[#EAE5D9] px-3 sm:px-4 py-2.5 sm:py-3 border-t-4 border-[#102040] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
