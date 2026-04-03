'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Fueling } from '@/lib/types';
import FuelingForm from './FuelingForm';
import { useTranslation } from './LanguageProvider';
import { useUnits } from './UnitsProvider';
import { currencySymbol } from '@/lib/units';

interface Props {
  fuelings: Fueling[];
  vehicleId: number;
}

export default function FuelingTable({ fuelings, vehicleId }: Props) {
  const { t } = useTranslation();
  const units = useUnits();
  const sym = currencySymbol(units.currency);
  const router = useRouter();
  const [editing, setEditing] = useState<Fueling | null>(null);
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

  return (
    <>
    {/* Mobile card list */}
    <div className="sm:hidden space-y-3">
      {fuelings.map((f, i) => {
        const prev = fuelings[i + 1];
        const diff = prev != null ? f.mileage_km - prev.mileage_km : null;
        const daysDiff = prev != null
          ? Math.round((new Date(f.date).getTime() - new Date(prev.date).getTime()) / 86400000)
          : null;
        return (
          <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{f.date} {f.time}</p>
                {f.station_name && <p className="text-xs text-gray-500 mt-0.5">{f.station_name}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.full_tank && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs">✓</span>
                )}
                {f.invoice_image && (
                  <button
                    onClick={() => setViewingImageUrl(`/api/vehicles/${vehicleId}/fuelings/${f.id}/image`)}
                    className="text-gray-400 hover:text-gray-600 text-base leading-none"
                    title={t('viewPhoto')}
                  >
                    📷
                  </button>
                )}
                <button onClick={() => setEditing(f)} className="text-blue-600 hover:underline text-xs font-medium">
                  {t('edit')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
              <div>
                <p className="text-xs text-gray-400">{t('amountL')} ({units.fuel})</p>
                <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">{f.fuel_amount_l.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('pricePerL')}</p>
                <p className="text-sm font-mono text-gray-900 mt-0.5">{f.price_per_liter_eur.toFixed(2)} {sym}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('totalEur')} ({sym})</p>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{f.total_cost_eur.toFixed(2)}</p>
              </div>
            </div>
            {(diff != null || daysDiff != null) && (
              <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-100 pt-2">
                {diff != null && (
                  <span>{t('mileageDiff')}: <span className={`font-medium ${diff < 0 ? 'text-red-500' : 'text-gray-700'}`}>{diff} {units.mileage}</span></span>
                )}
                {daysDiff != null && (
                  <span>{t('days')}: <span className="font-medium text-gray-700">{daysDiff}</span></span>
                )}
              </div>
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
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('dateTime')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('station')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('mileageKm')} ({units.mileage})</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('days')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('amountL')} ({units.fuel})</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('pricePerL')} ({sym}/{units.fuel})</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('totalEur')} ({sym})</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">{t('full')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fuelings.map((f, i) => {
              const prev = fuelings[i + 1];
              const diff = prev != null ? f.mileage_km - prev.mileage_km : null;
              const daysDiff = prev != null
                ? Math.round((new Date(f.date).getTime() - new Date(prev.date).getTime()) / 86400000)
                : null;
              return (
              <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                  {f.date} {f.time}
                </td>
                <td className="px-4 py-3 text-gray-700">{f.station_name || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {diff != null
                    ? <span className={diff < 0 ? 'text-red-500' : 'text-gray-900'}>{diff}</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {daysDiff != null
                    ? <span className="text-gray-900">{daysDiff}</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{f.fuel_amount_l.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{f.price_per_liter_eur.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono font-medium">{f.total_cost_eur.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  {f.full_tank && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs">✓</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {f.invoice_image && (
                      <button
                        onClick={() => setViewingImageUrl(`/api/vehicles/${vehicleId}/fuelings/${f.id}/image`)}
                        className="text-gray-400 hover:text-gray-600 text-base leading-none"
                        title={t('viewPhoto')}
                      >
                        📷
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(f)}
                      className="text-blue-600 hover:underline text-xs"
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

    {viewingImageUrl && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={() => setViewingImageUrl(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={viewingImageUrl}
          alt="Invoice"
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

    {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('editFueling')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <FuelingForm vehicleId={vehicleId} initial={editing} onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
