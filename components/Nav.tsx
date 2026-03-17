'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from './LanguageProvider';
import { LANGUAGES } from '@/lib/i18n';

export default function Nav({ username }: { username: string }) {
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function handleLangChange(newLang: typeof LANGUAGES[number]) {
    setLang(newLang);
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/vehicles" className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
          {t('appName')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  lang === l
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
