'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { useTranslation } from './LanguageProvider';

interface Props {
  vehicleId: number;
}

export default function AddExpenseModal({ vehicleId }: Props) {
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
        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Wrench className="w-4 h-4" />
        {t('otherExpenses')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('addExpenseTitle')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none p-1 -mr-1"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <ExpenseForm vehicleId={vehicleId} onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
