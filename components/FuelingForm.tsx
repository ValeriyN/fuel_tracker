'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fueling } from '@/lib/types';
import { useTranslation } from './LanguageProvider';

interface Props {
  vehicleId: number;
  initial?: Fueling;
}

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Convert dd.mm.yyyy → yyyy-mm-dd for the API
function displayToIso(display: string): string {
  const [d, m, y] = display.split('.');
  return `${y}-${m}-${d}`;
}

// Convert yyyy-mm-dd → dd.mm.yyyy for display
function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function FuelingForm({ vehicleId, initial }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = !!initial;

  const [date, setDate] = useState(initial?.date ? isoToDisplay(initial.date) : today());
  const [time, setTime] = useState(initial?.time ?? nowTime());
  const [station, setStation] = useState(initial?.station_name ?? '');
  const [amount, setAmount] = useState(initial?.fuel_amount_l?.toString() ?? '');
  const [mileage, setMileage] = useState(initial?.mileage_km?.toString() ?? '');
  const [pricePerL, setPricePerL] = useState(initial?.price_per_liter_eur?.toString() ?? '');
  const [fullTank, setFullTank] = useState(initial?.full_tank ?? true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const computedTotal =
    amount && pricePerL
      ? (parseFloat(amount) * parseFloat(pricePerL)).toFixed(2)
      : '—';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isEdit
      ? `/api/vehicles/${vehicleId}/fuelings/${initial!.id}`
      : `/api/vehicles/${vehicleId}/fuelings`;

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: displayToIso(date),
        time,
        station_name: station,
        fuel_amount_l: parseFloat(amount),
        mileage_km: parseInt(mileage),
        price_per_liter_eur: parseFloat(pricePerL),
        full_tank: fullTank,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t('failedSave'));
      return;
    }

    router.push(`/vehicles/${vehicleId}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(t('confirmDelete'))) return;
    setLoading(true);
    await fetch(`/api/vehicles/${vehicleId}/fuelings/${initial!.id}`, { method: 'DELETE' });
    router.push(`/vehicles/${vehicleId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fueling-date" className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
          <input
            id="fueling-date"
            type="text"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            placeholder="dd.mm.yyyy"
            pattern="\d{2}\.\d{2}\.\d{4}"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="fueling-time" className="block text-sm font-medium text-gray-700 mb-1">{t('time')}</label>
          <input
            id="fueling-time"
            type="text"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
            placeholder="hh:mm"
            pattern="\d{2}:\d{2}"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="fueling-station" className="block text-sm font-medium text-gray-700 mb-1">{t('fuelStation')}</label>
        <input
          id="fueling-station"
          type="text"
          value={station}
          onChange={e => setStation(e.target.value)}
          placeholder={t('stationPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="fueling-mileage" className="block text-sm font-medium text-gray-700 mb-1">{t('mileageKm')}</label>
        <input
          id="fueling-mileage"
          type="number"
          value={mileage}
          onChange={e => setMileage(e.target.value)}
          required
          min={0}
          step={1}
          placeholder={t('mileagePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fueling-amount" className="block text-sm font-medium text-gray-700 mb-1">{t('amountL')}</label>
          <input
            id="fueling-amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min={0}
            step={0.01}
            placeholder={t('amountPlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="fueling-price" className="block text-sm font-medium text-gray-700 mb-1">{t('pricePerLitre')}</label>
          <input
            id="fueling-price"
            type="number"
            value={pricePerL}
            onChange={e => setPricePerL(e.target.value)}
            required
            min={0}
            step={0.001}
            placeholder={t('pricePlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-600">{t('totalCost')}</span>
        <span className="text-lg font-semibold text-gray-900">
          {computedTotal !== '—' ? `${computedTotal} €` : '—'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="full_tank"
          type="checkbox"
          checked={fullTank}
          onChange={e => setFullTank(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="full_tank" className="text-sm font-medium text-gray-700">{t('fullTank')}</label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? t('saving') : isEdit ? t('saveChanges') : t('addFuelingTitle')}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {t('delete')}
          </button>
        )}
      </div>
    </form>
  );
}
