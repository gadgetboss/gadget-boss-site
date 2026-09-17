/**
 * Ghana phone normalisation, shared + unit-tested source of truth.
 *
 * `api/_lib/phone.js` is a hand-maintained CommonJS copy of this module: `src/`
 * is excluded from the Vercel bundle (`.vercelignore`) and the serverless
 * functions run with zero dependencies, so they cannot import TypeScript.
 * Keep the two files in sync.
 */

const GH_COUNTRY_CODE = '233';
const GH_MOBILE_FIRST_DIGITS = new Set(['2', '5']);

/** Reduces any accepted local/international spelling to the bare 9-digit subscriber number. */
function toSubscriber(input: unknown): string {
  if (input === null || input === undefined) return '';
  const raw = String(input).trim();
  let digits = raw.replace(/\D/g, '');

  for (let guard = 0; guard < 4; guard += 1) {
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
      continue;
    }
    if (digits.startsWith(GH_COUNTRY_CODE) && digits.length > 9) {
      digits = digits.slice(3);
      continue;
    }
    if (digits.startsWith('0') && digits.length > 9) {
      digits = digits.slice(1);
      continue;
    }
    break;
  }

  return digits;
}

/** Returns the E.164 form (`+233241234567`) or `null` when the input is not a GH mobile number. */
export function normalizeGhanaPhone(input: unknown): string | null {
  const subscriber = toSubscriber(input);
  if (!/^\d{9}$/.test(subscriber)) return null;
  if (!GH_MOBILE_FIRST_DIGITS.has(subscriber[0])) return null;
  return `+${GH_COUNTRY_CODE}${subscriber}`;
}

export function isValidGhanaPhone(input: unknown): boolean {
  return normalizeGhanaPhone(input) !== null;
}

/** Every spelling a legacy row might use, for `customer_phone IN (...)` lookups. */
export function phoneVariants(e164: unknown): string[] {
  const normalized = normalizeGhanaPhone(e164);
  if (!normalized) return [];
  const subscriber = normalized.slice(4);
  return [
    `+${GH_COUNTRY_CODE}${subscriber}`,
    `${GH_COUNTRY_CODE}${subscriber}`,
    `0${subscriber}`,
    subscriber,
  ];
}

/** Display-safe form, e.g. `+233 24 *** 4567`. */
export function maskPhone(e164: unknown): string {
  const normalized = normalizeGhanaPhone(e164);
  if (!normalized) return '';
  const subscriber = normalized.slice(4);
  return `+${GH_COUNTRY_CODE} ${subscriber.slice(0, 2)} *** ${subscriber.slice(5)}`;
}
