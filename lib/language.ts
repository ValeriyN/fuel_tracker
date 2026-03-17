import { cookies } from 'next/headers';
import { Language, LANGUAGES, LANG_COOKIE, DEFAULT_LANG } from './i18n';

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const val = cookieStore.get(LANG_COOKIE)?.value;
  return val && (LANGUAGES as readonly string[]).includes(val)
    ? (val as Language)
    : DEFAULT_LANG;
}
