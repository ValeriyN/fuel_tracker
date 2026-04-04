'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FuelingForm from './FuelingForm';
import { useTranslation } from './LanguageProvider';

interface Props {
  vehicleId: number;
}

export default function AddFuelingModal({ vehicleId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  function handleSuccess() {
    close();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {t('addFueling')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('addFuelingTitle')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <FuelingForm vehicleId={vehicleId} onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
