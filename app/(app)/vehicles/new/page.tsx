'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';
import { FUEL_TYPE_KEYS } from '@/lib/i18n';

export default function NewVehiclePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<'car' | 'motorcycle'>('car');
  const [fuelType, setFuelType] = useState('Petrol 95');
  const [customFuel, setCustomFuel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveFuelType = fuelType === '__custom__' ? customFuel : fuelType;

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
    router.push(`/vehicles/${data.id}`);
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vehicles" className="text-gray-400 hover:text-gray-600 transition-colors">
          {t('backToVehicles')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addVehicleTitle')}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleName')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder={t('namePlaceholder')}
              autoFocus
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
  );
}
