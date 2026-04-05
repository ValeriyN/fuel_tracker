'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { Expense } from '@/lib/types';
import ExpenseForm from './ExpenseForm';
import { useTranslation } from './LanguageProvider';
import { useUnits } from './UnitsProvider';
import { currencySymbol } from '@/lib/units';
import { EXPENSE_TYPE_KEYS, MAINTENANCE_OPERATIONS } from '@/lib/i18n';

interface Props {
  expenses: Expense[];
  vehicleId: number;
}

export default function ExpenseTable({ expenses, vehicleId }: Props) {
  const { t } = useTranslation();
  const units = useUnits();
  const sym = currencySymbol(units.currency);
  const router = useRouter();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const close = useCallback(() => setEditing(null), []);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, close]);

  function handleSuccess() {
    close();
    router.refresh();
  }

  function expenseTypeLabel(type: string): string {
    const found = EXPENSE_TYPE_KEYS.find(k => k.value === type);
    return found ? t(found.labelKey) : type;
  }

  function operationsSummary(ops: string[] | null): string {
    if (!ops || ops.length === 0) return '';
    return ops
      .map(key => {
        const found = MAINTENANCE_OPERATIONS.find(o => o.key === key);
        return found ? t(found.labelKey) : key;
      })
      .join(', ');
  }

  const typeBadgeColor: Record<string, string> = {
    maintenance: 'bg-blue-100 text-blue-700',
    repair:      'bg-orange-100 text-orange-700',
    tires:       'bg-purple-100 text-purple-700',
    accessories: 'bg-teal-100 text-teal-700',
    other:       'bg-gray-100 text-gray-600',
  };

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">{t('noExpenses')}</p>
    );
  }

  return (
    <>
    {/* Mobile card list */}
    <div className="sm:hidden space-y-3">
      {expenses.map(e => {
        const summary = e.expense_type === 'maintenance'
          ? operationsSummary(e.operations)
          : e.description;
        return (
          <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{e.date}</p>
                {e.station_name && <p className="text-xs text-gray-500 mt-0.5">{e.station_name}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor[e.expense_type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {expenseTypeLabel(e.expense_type)}
                </span>
                {e.document_image && (
                  <button
                    onClick={() => setViewingImageUrl(`/api/vehicles/${vehicleId}/expenses/${e.id}/image`)}
                    className="text-gray-400 hover:text-gray-600 text-base leading-none"
                    title={t('viewPhoto')}
                  >
                    📷
                  </button>
                )}
                <button onClick={() => setEditing(e)} className="text-blue-600 hover:underline text-xs font-medium">
                  {t('edit')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
              {e.mileage_km != null && (
                <div>
                  <p className="text-xs text-gray-400">{t('mileageKm')} ({units.mileage})</p>
                  <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">{e.mileage_km.toLocaleString()}</p>
                </div>
              )}
              {e.total_cost_eur != null && (
                <div>
                  <p className="text-xs text-gray-400">{t('totalEur')} ({sym})</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{e.total_cost_eur.toFixed(2)}</p>
                </div>
              )}
            </div>
            {summary && (
              <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 line-clamp-2">{summary}</p>
            )}
          </div>
        );
      })}
    </div>

    {/* Desktop table */}
    <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('date')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('expenseType')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('station')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('mileageKm')} ({units.mileage})</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('totalEur')} ({sym})</th>
              <th className="px-4 py-3 font-medium text-gray-500">{t('operations')} / {t('expenseDescription')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map(e => {
              const summary = e.expense_type === 'maintenance'
                ? operationsSummary(e.operations)
                : e.description;
              return (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor[e.expense_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {expenseTypeLabel(e.expense_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.station_name || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {e.mileage_km != null ? e.mileage_km.toLocaleString() : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {e.total_cost_eur != null ? e.total_cost_eur.toFixed(2) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    {summary ? <span className="line-clamp-2 text-xs">{summary}</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {e.document_image && (
                        <button
                          onClick={() => setViewingImageUrl(`/api/vehicles/${vehicleId}/expenses/${e.id}/image`)}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title={t('viewPhoto')}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(e)}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {t('edit')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Edit modal */}
    {editing && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{t('editExpense')}</h2>
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none p-1 -mr-1"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-5">
            <ExpenseForm vehicleId={vehicleId} initial={editing} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    )}

    {/* Image lightbox */}
    {viewingImageUrl && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        onClick={() => setViewingImageUrl(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={viewingImageUrl}
          alt="Document"
          className="max-w-full max-h-full rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={() => setViewingImageUrl(null)}
          className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
        >
          ×
        </button>
      </div>
    )}
    </>
  );
}
