'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from './LanguageProvider';
import { FUEL_TYPE_KEYS } from '@/lib/i18n';
import { Vehicle } from '@/lib/types';

interface Props {
  vehicle: Vehicle;
}

export default function EditVehicleModal({ vehicle }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(vehicle.name);
  const [type, setType] = useState<'car' | 'motorcycle'>(vehicle.type as 'car' | 'motorcycle');
  const [fuelType, setFuelType] = useState(() => {
    const isPreset = FUEL_TYPE_KEYS.some(k => k.value === vehicle.fuel_type);
    return isPreset ? vehicle.fuel_type : '__custom__';
  });
  const [customFuel, setCustomFuel] = useState(() => {
    const isPreset = FUEL_TYPE_KEYS.some(k => k.value === vehicle.fuel_type);
    return isPreset ? '' : vehicle.fuel_type;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const close = useCallback(() => {
    setOpen(false);
    setConfirmingDelete(false);
    setError('');
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const effectiveFuelType = fuelType === '__custom__' ? customFuel : fuelType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveFuelType.trim()) {
      setError(t('fuelTypeRequired'));
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, fuel_type: effectiveFuelType }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t('failedUpdateVehicle'));
      return;
    }
    close();
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t('failedDeleteVehicle'));
      return;
    }
    router.push('/vehicles');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        {t('editVehicle')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('editVehicle')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none p-1 -mr-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleName')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleType')}</label>
                <div className="flex gap-3">
                  {(['car', 'motorcycle'] as const).map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={v}
                        checked={type === v}
                        onChange={() => setType(v)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{v === 'car' ? t('car') : t('motorcycle')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fuelType')}</label>
                <select
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FUEL_TYPE_KEYS.map(k => (
                    <option key={k.value} value={k.value}>{t(k.labelKey)}</option>
                  ))}
                  <option value="__custom__">{t('otherFuelType')}</option>
                </select>
                {fuelType === '__custom__' && (
                  <input
                    type="text"
                    value={customFuel}
                    onChange={e => setCustomFuel(e.target.value)}
                    placeholder={t('enterFuelType')}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? t('saving') : t('saveChanges')}
              </button>

              <div className="pt-1 border-t border-gray-100">
                {confirmingDelete ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 font-medium">{t('confirmDeleteVehicle')}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        {t('deleteVehicle')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-red-500 hover:text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {t('deleteVehicle')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
