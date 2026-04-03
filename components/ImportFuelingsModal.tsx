'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from './LanguageProvider';

interface Props {
  vehicleId: number;
}

type Step = 'upload' | 'confirm' | 'done';

export default function ImportFuelingsModal({ vehicleId }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const close = useCallback(() => {
    setOpen(false);
    setStep('upload');
    setSelectedFile(null);
    setError('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  function handleImportFileClick() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError('');
    setStep('confirm');
  }

  async function handleImport(deleteExisting: boolean) {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('deleteExisting', String(deleteExisting));

    const res = await fetch(`/api/vehicles/${vehicleId}/fuelings/import`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t('importError'));
      setStep('upload');
      return;
    }

    setResult(data);
    setStep('done');
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {t('importFuelings')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('importFuelingsTitle')}</h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {step === 'upload' && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('csvFileFormat')}</p>
                    <p className="text-xs text-gray-600">{t('csvFileFormatDesc')}</p>
                    <code className="block text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 leading-relaxed">
                      date, time, station_name,<br />
                      fuel_amount_l, mileage_km,<br />
                      total_cost_eur, full_tank
                    </code>
                    <p className="text-xs text-gray-500">{t('csvExampleRow')}</p>
                    <code className="block text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700">
                      2026-03-01,10:00,Shell,40.0,125000,66.36,true
                    </code>
                    <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                      <li>date: YYYY-MM-DD</li>
                      <li>time: HH:MM (optional, defaults to 12:00)</li>
                      <li>full_tank: true / false</li>
                      <li>station_name is optional</li>
                    </ul>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('addFile')}
                    </p>
                    <input
                      id="csv-file-input"
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="csv-file-input"
                        className="cursor-pointer border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Choose File
                      </label>
                      <span className="text-sm text-gray-500 truncate">
                        {selectedFile ? selectedFile.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    onClick={handleImportFileClick}
                    disabled={!selectedFile}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    {t('importFileBtn')}
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <p className="text-sm text-gray-700">{t('deleteBeforeImport')}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleImport(true)}
                      disabled={loading}
                      className="w-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
                    >
                      {loading ? t('importing') : t('yesDeleteExisting')}
                    </button>
                    <button
                      onClick={() => handleImport(false)}
                      disabled={loading}
                      className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
                    >
                      {loading ? t('importing') : t('noKeepExisting')}
                    </button>
                  </div>
                </>
              )}

              {step === 'done' && result && (
                <>
                  <div className="text-center py-2 space-y-1">
                    <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                    <p className="text-sm text-gray-600">records imported</p>
                    {result.skipped > 0 && (
                      <p className="text-sm text-gray-400">{result.skipped} rows skipped</p>
                    )}
                  </div>
                  <button
                    onClick={close}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
