import 'i18next';

import type { tr } from './tr';

// t('...') anahtarları tip kontrollü olsun: olmayan bir anahtar derleme hatası verir.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof tr };
  }
}
