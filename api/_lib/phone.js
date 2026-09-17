// Ghana phone normalisation. Zero-dependency CommonJS copy of src/auth/phone.ts
// (src/ is excluded from the Vercel bundle via .vercelignore, so the serverless
// functions carry their own copy). Keep both files in sync.

const GH_COUNTRY_CODE = '233';
const GH_MOBILE_FIRST_DIGITS = new Set(['2', '5']);

// Reduces any accepted local/international spelling down to the bare 9-digit
// subscriber number, e.g. "241234567".
function toSubscriber(input) {
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

function normalizeGhanaPhone(input) {
  const subscriber = toSubscriber(input);
  if (!/^\d{9}$/.test(subscriber)) return null;
  if (!GH_MOBILE_FIRST_DIGITS.has(subscriber[0])) return null;
  return `+${GH_COUNTRY_CODE}${subscriber}`;
}

function isValidGhanaPhone(input) {
  return normalizeGhanaPhone(input) !== null;
}

// Legacy rows store phones in mixed formats, so match on every spelling.
function phoneVariants(e164) {
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

function maskPhone(e164) {
  const normalized = normalizeGhanaPhone(e164);
  if (!normalized) return '';
  const subscriber = normalized.slice(4);
  return `+${GH_COUNTRY_CODE} ${subscriber.slice(0, 2)} *** ${subscriber.slice(5)}`;
}

module.exports = {
  normalizeGhanaPhone,
  isValidGhanaPhone,
  phoneVariants,
  maskPhone,
};
