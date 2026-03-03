const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pickFirstNonEmpty = (...values) => {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }
  return '';
};

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const isEmailIdentifier = (value = '') => EMAIL_REGEX.test(String(value || '').trim());

const normalizePhoneForStorage = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (isEmailIdentifier(raw)) {
    // Legacy compatibility: some existing accounts may have email persisted in `phone`.
    return normalizeEmail(raw);
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) {
    return raw;
  }

  return raw.startsWith('+') ? `+${digitsOnly}` : digitsOnly;
};

const buildPhoneLookupQuery = (value = '') => {
  const raw = String(value || '').trim();
  const digitsOnly = raw.replace(/\D/g, '');

  const exactCandidates = new Set(
    [raw, raw.replace(/\s+/g, ''), raw.replace(/[^\d+]/g, ''), digitsOnly].filter(Boolean)
  );

  if (digitsOnly) {
    exactCandidates.add(`+${digitsOnly}`);
  }

  const conditions = [];

  if (digitsOnly) {
    const fullDigitsPattern = digitsOnly.split('').join('\\D*');
    conditions.push({
      phone: {
        $regex: new RegExp(`^\\+?\\D*${fullDigitsPattern}\\D*$`)
      }
    });
  }

  if (digitsOnly.length >= 10) {
    const lastTenDigits = digitsOnly.slice(-10);
    const lastTenPattern = lastTenDigits.split('').join('\\D*');
    exactCandidates.add(lastTenDigits);
    exactCandidates.add(`+${lastTenDigits}`);

    conditions.push({
      phone: {
        $regex: new RegExp(`^\\+?\\D*(?:\\d\\D*){0,3}${lastTenPattern}\\D*$`)
      }
    });
  }

  conditions.unshift({ phone: { $in: [...exactCandidates] } });
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
};

const resolveLoginIdentifier = ({ identifier, phone, email } = {}) =>
  pickFirstNonEmpty(identifier, phone, email);

const resolveRegistrationIdentifiers = ({ identifier, phone, email } = {}) => {
  const normalizedEmail = isEmailIdentifier(email) ? normalizeEmail(email) : '';
  const loginIdentifier = resolveLoginIdentifier({ identifier, phone, email });
  const identifierLooksEmail = isEmailIdentifier(loginIdentifier);

  const resolvedEmail = normalizedEmail || (identifierLooksEmail ? normalizeEmail(loginIdentifier) : '');

  let resolvedPhone = '';
  if (phone && !isEmailIdentifier(phone)) {
    resolvedPhone = normalizePhoneForStorage(phone);
  } else if (loginIdentifier && !identifierLooksEmail) {
    resolvedPhone = normalizePhoneForStorage(loginIdentifier);
  }

  if (!resolvedPhone && resolvedEmail) {
    // Keep schema compatibility where `phone` is required; this also keeps older logins working.
    resolvedPhone = resolvedEmail;
  }

  return {
    normalizedPhone: resolvedPhone,
    normalizedEmail: resolvedEmail,
    loginIdentifier
  };
};

module.exports = {
  normalizeEmail,
  normalizePhoneForStorage,
  isEmailIdentifier,
  buildPhoneLookupQuery,
  resolveLoginIdentifier,
  resolveRegistrationIdentifiers
};
