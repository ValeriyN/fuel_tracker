'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from './LanguageProvider';
import { CURRENCIES, MILEAGE_UNITS, FUEL_UNITS, UserUnits, currencySymbol } from '@/lib/units';

interface Props {
  initial: UserUnits;
}

export default function SettingsForm({ initial }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currency, setCurrency] = useState(initial.currency);
  const [mileage, setMileage] = useState(initial.mileage);
  const [fuel, setFuel] = useState(initial.fuel);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch('/api/me/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency, mileage_unit: mileage, fuel_unit: fuel }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">{t('currency')}</p>
        <div className="flex gap-3">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => { setCurrency(c); setSaved(false); }}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                currency === c
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {currencySymbol(c)} {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">{t('distanceUnit')}</p>
        <div className="flex gap-3">
          {MILEAGE_UNITS.map(u => (
            <button
              key={u}
              onClick={() => { setMileage(u); setSaved(false); }}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                mileage === u
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">{t('fuelUnit')}</p>
        <div className="flex gap-3">
          {FUEL_UNITS.map(u => (
            <button
              key={u}
              onClick={() => { setFuel(u); setSaved(false); }}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                fuel === u
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? '…' : t('saveSettings')}
        </button>
        <button
          onClick={() => router.push('/vehicles')}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {t('cancel')}
        </button>
        {saved && <span className="text-sm text-green-600">{t('settingsSaved')}</span>}
      </div>
    </div>
  );
}
