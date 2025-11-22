import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean; // Makes confirm button red
  showCancel?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = true,
  showCancel = true
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border-2 border-rose-200">
            <AlertTriangle size={24} strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-neutral-500 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            {/* Green for Cancel/No */}
            {showCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                {cancelText}
              </button>
            )}

            {/* Red for Confirm/Action */}
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 font-bold rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ${isDangerous
                ? 'bg-rose-600 text-white'
                : 'bg-indigo-600 text-white'
                }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
