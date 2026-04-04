'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from './LanguageProvider';
import { FUEL_TYPE_KEYS } from '@/lib/i18n';

export default function AddVehicleModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [type, setType] = useState<'car' | 'motorcycle'>('car');
  const [fuelType, setFuelType] = useState('Petrol 95');
  const [customFuel, setCustomFuel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveFuelType = fuelType === '__custom__' ? customFuel : fuelType;

  const close = useCallback(() => {
    setOpen(false);
    setName('');
    setType('car');
    setFuelType('Petrol 95');
    setCustomFuel('');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveFuelType.trim()) {
      setError(t('fuelTypeRequired'));
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, fuel_type: effectiveFuelType }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t('failedCreateVehicle'));
      return;
    }
    close();
    router.push(`/vehicles/${data.id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {t('addVehicle')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('addVehicleTitle')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none p-1 -mr-1"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleName')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder={t('namePlaceholder')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicleType')}</label>
                  <div className="flex gap-3">
                    {(['car', 'motorcycle'] as const).map(vt => (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setType(vt)}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          type === vt
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{vt === 'car' ? '🚗' : '🏍️'}</span>
                        {vt === 'car' ? t('car') : t('motorcycle')}
                      </button>
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
                    {FUEL_TYPE_KEYS.map(({ value, labelKey }) => (
                      <option key={value} value={value}>{t(labelKey)}</option>
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

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  {loading ? t('saving') : t('addVehicleTitle')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
