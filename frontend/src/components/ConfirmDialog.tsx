import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3">
        <div className={`p-2 rounded-full shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-gray-700 pt-1.5">{message}</p>
      </div>
      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
