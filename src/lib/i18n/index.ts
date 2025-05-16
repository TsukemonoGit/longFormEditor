// src/lib/i18n/index.ts

import { initI18n, setTranslations } from '@konemono/svelte5-i18n';

const defaultLocale = 'en';
// 翻訳データを直接インポート（ビルド時に解決）
import ja from './locales/ja.json';
import en from './locales/en.json';

setTranslations({
	ja,
	en
});

initI18n({
	defaultLocale: defaultLocale,
	supportedLocales: ['ja', 'en'],
	loadPath: '/i18n/locales/{locale}.json'
});
