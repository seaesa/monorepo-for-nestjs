import type { i18n as I18n, TFunction } from 'i18next';

import type { Locale } from '@repo/contracts';
import { createI18n, type Namespace } from '@repo/i18n';

const instances = new Map<Locale, I18n>();

/** `t` for one namespace in a recipient's language, for text the server writes (emails, push). */
export function translator<N extends Namespace>(locale: Locale, ns: N): TFunction<N> {
  let instance = instances.get(locale);
  if (!instance) {
    instance = createI18n(locale);
    instances.set(locale, instance);
  }
  return instance.getFixedT(locale, ns);
}
