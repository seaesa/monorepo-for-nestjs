import 'dayjs/locale/vi';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export { dayjs };

/** Formats follow the active locale (`usePreferencesStore().locale`): `Oct 30, 2026` / `30 thg 10, 2026`. */
export const formatDate = (value: string | Date): string => dayjs(value).format('ll');

export const formatDateTime = (value: string | Date): string => dayjs(value).format('lll');

/** `3 minutes ago`, in the active locale. */
export const fromNow = (value: string | Date): string => dayjs(value).fromNow();
