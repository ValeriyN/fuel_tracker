'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB } from 'date-fns/locale/en-GB';
import { uk } from 'date-fns/locale/uk';
import 'react-datepicker/dist/react-datepicker.css';
import { Expense, ExpenseType } from '@/lib/types';
import { useTranslation } from './LanguageProvider';
import { useUnits } from './UnitsProvider';
import { currencySymbol } from '@/lib/units';
import { EXPENSE_TYPE_KEYS, MAINTENANCE_OPERATIONS } from '@/lib/i18n';

registerLocale('en', enGB);
registerLocale('uk', uk);

interface Props {
  vehicleId: number;
  initial?: Expense;
  onSuccess?: () => void;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Web Speech API type shim
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

function hasSpeechRecognition(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export default function ExpenseForm({ vehicleId, initial, onSuccess }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const units = useUnits();
  const sym = currencySymbol(units.currency);
  const isEdit = !!initial;

  const [date, setDate] = useState<Date>(initial?.date ? parseIsoDate(initial.date) : new Date());
  const [expenseType, setExpenseType] = useState<ExpenseType>(initial?.expense_type ?? 'maintenance');
  const [station, setStation] = useState(initial?.station_name ?? '');
  const [mileage, setMileage] = useState(initial?.mileage_km?.toString() ?? '');
  const [totalCost, setTotalCost] = useState(initial?.total_cost_eur?.toString() ?? '');
  const [operations, setOperations] = useState<string[]>(initial?.operations ?? []);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechSupported(hasSpeechRecognition());
  }, []);

  const existingImageUrl = isEdit && initial?.document_image && !removeImage
    ? `/api/vehicles/${vehicleId}/expenses/${initial.id}/image`
    : null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t('photoTooLarge'));
      return;
    }
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function toggleOperation(key: string) {
    setOperations(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function toggleVoice() {
    if (!hasSpeechRecognition()) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = lang === 'uk' ? 'uk-UA' : 'en-US';
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setDescription(prev => prev ? prev + ' ' + transcript : transcript);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isEdit
      ? `/api/vehicles/${vehicleId}/expenses/${initial!.id}`
      : `/api/vehicles/${vehicleId}/expenses`;

    const body = {
      date: dateToIso(date),
      expense_type: expenseType,
      station_name: station,
      mileage_km: mileage ? parseInt(mileage) : null,
      total_cost_eur: totalCost ? parseFloat(totalCost) : null,
      operations: expenseType === 'maintenance' ? operations : null,
      description: expenseType !== 'maintenance' ? (description || null) : null,
    };

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || t('failedSaveExpense'));
      return;
    }

    const expenseId = isEdit ? initial!.id : data.id;
    const imageBase = `/api/vehicles/${vehicleId}/expenses/${expenseId}/image`;

    if (imageFile) {
      const form = new FormData();
      form.append('image', imageFile);
      await fetch(imageBase, { method: 'PUT', body: form });
    } else if (removeImage) {
      await fetch(imageBase, { method: 'DELETE' });
    }

    setLoading(false);

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/vehicles/${vehicleId}/expenses/${initial!.id}`, { method: 'DELETE' });
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
        <DatePicker
          id="expense-date"
          selected={date}
          onChange={(d: Date | null) => d && setDate(d)}
          dateFormat="dd.MM.yyyy"
          locale={lang}
          required
          className={inputClass}
        />
      </div>

      {/* Expense type */}
      <div>
        <label htmlFor="expense-type" className="block text-sm font-medium text-gray-700 mb-1">{t('expenseType')}</label>
        <select
          id="expense-type"
          value={expenseType}
          onChange={e => setExpenseType(e.target.value as ExpenseType)}
          required
          className={inputClass}
        >
          {EXPENSE_TYPE_KEYS.map(({ value, labelKey }) => (
            <option key={value} value={value}>{t(labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Station name */}
      <div>
        <label htmlFor="expense-station" className="block text-sm font-medium text-gray-700 mb-1">{t('serviceStation')}</label>
        <input
          id="expense-station"
          type="text"
          value={station}
          onChange={e => setStation(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Mileage + Total cost */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expense-mileage" className="block text-sm font-medium text-gray-700 mb-1">{t('mileageKm')} ({units.mileage})</label>
          <input
            id="expense-mileage"
            type="number"
            value={mileage}
            onChange={e => setMileage(e.target.value)}
            min={0}
            step={1}
            placeholder={t('mileagePlaceholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="expense-cost" className="block text-sm font-medium text-gray-700 mb-1">{t('totalCost')} ({sym})</label>
          <input
            id="expense-cost"
            type="number"
            value={totalCost}
            onChange={e => setTotalCost(e.target.value)}
            min={0}
            step={0.01}
            placeholder="e.g. 150.00"
            className={inputClass}
          />
        </div>
      </div>

      {/* Conditional section */}
      {expenseType === 'maintenance' ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">{t('operations')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MAINTENANCE_OPERATIONS.map(({ key, labelKey }) => (
              <label key={key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={operations.includes(key)}
                  onChange={() => toggleOperation(key)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                <span className="text-sm text-gray-700">{t(labelKey)}</span>
              </label>
            ))}
          </div>
          <div>
            <label htmlFor="expense-comment" className="block text-sm font-medium text-gray-700 mb-1">{t('maintenanceComment')}</label>
            <div className="relative">
              <textarea
                id="expense-comment"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  title={listening ? t('listening') : t('voiceInput')}
                  className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${listening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
            {listening && <p className="text-xs text-red-500 mt-1">{t('listening')}</p>}
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="expense-description" className="block text-sm font-medium text-gray-700 mb-1">{t('expenseDescription')}</label>
          <div className="relative">
            <textarea
              id="expense-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                title={listening ? t('listening') : t('voiceInput')}
                className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${listening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          {listening && <p className="text-xs text-red-500 mt-1">{t('listening')}</p>}
        </div>
      )}

      {/* Document image */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1.5">{t('attachDocument')}</p>
        <input
          id="expense-image-input"
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
        />
        {(imagePreview || existingImageUrl) ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview ?? existingImageUrl!}
                alt="Document"
                className="h-32 w-auto rounded-lg border border-gray-200 object-cover cursor-pointer"
                onClick={() => setViewingImage(true)}
              />
            </div>
            <div className="flex gap-2">
              <label htmlFor="expense-image-input" className="cursor-pointer text-xs text-blue-600 hover:underline">
                {t('addPhoto')}
              </label>
              <span className="text-xs text-gray-300">|</span>
              <button type="button" onClick={handleRemoveImage} className="text-xs text-red-500 hover:underline">
                {t('removePhoto')}
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="expense-image-input"
            className="cursor-pointer inline-flex items-center gap-2 border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>{t('addPhoto')}</span>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? t('saving') : isEdit ? t('saveChanges') : t('addExpenseTitle')}
        </button>
        {isEdit && !confirmingDelete && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={loading}
            className="px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {t('delete')}
          </button>
        )}
      </div>

      {isEdit && confirmingDelete && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-red-700">{t('confirmDeleteExpense')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {t('delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-white transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </form>

    {viewingImage && (imagePreview || existingImageUrl) && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        onClick={() => setViewingImage(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePreview ?? existingImageUrl!}
          alt="Document"
          className="max-w-full max-h-full rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={() => setViewingImage(false)}
          className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
        >
          ×
        </button>
      </div>
    )}
    </>
  );
}
