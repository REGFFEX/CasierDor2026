/**
 * Configuration téléphonique : indicatifs, opérateurs MoMo, validation
 */

export interface OperatorConfig {
  regex: RegExp;
  operator: string;
  digits: number;
  prefix: string;
  apiEndpoint: string;
}

export const COUNTRY_NETWORK_CONFIG: Record<string, Record<string, OperatorConfig>> = {
  '+242': {
    MTN: {
      regex: /^06\d{7}$/,
      operator: 'MTN MoMo',
      digits: 9,
      prefix: '06',
      apiEndpoint: 'https://api.mtn-momo.com/v1_0/payment',
    },
    Airtel: {
      regex: /^0[45]\d{7}$/,
      operator: 'Airtel Money',
      digits: 9,
      prefix: '04/05',
      apiEndpoint: 'https://api.airtel-money.com/v1/payment',
    },
    Other: {
      regex: /^0\d{8}$/,
      operator: 'Autre',
      digits: 9,
      prefix: '0',
      apiEndpoint: '',
    },
  },
  '+243': {
    Vodacom: { regex: /^81\d{7}$/, operator: 'M-Pesa', digits: 9, prefix: '81', apiEndpoint: '' },
    Airtel: { regex: /^99\d{7}$/, operator: 'Airtel Money', digits: 9, prefix: '99', apiEndpoint: '' },
    Orange: { regex: /^8[459]\d{7}$/, operator: 'Orange Money', digits: 9, prefix: '84/85/89', apiEndpoint: '' },
    Africell: { regex: /^90\d{7}$/, operator: 'Afrimoney', digits: 9, prefix: '90', apiEndpoint: '' },
  },
  '+241': {
    Airtel: { regex: /^07\d{6}$/, operator: 'Airtel Money', digits: 8, prefix: '07', apiEndpoint: '' },
    Moov: { regex: /^06\d{6}$/, operator: 'Moov Money', digits: 8, prefix: '06', apiEndpoint: '' },
  },
  '+237': {
    MTN: { regex: /^6[578]\d{7}$/, operator: 'MTN MoMo', digits: 9, prefix: '65/67/68', apiEndpoint: '' },
    Orange: { regex: /^6[95]\d{7}$/, operator: 'Orange Money', digits: 9, prefix: '69/65', apiEndpoint: '' },
  },
  '+225': {
    MTN: { regex: /^05\d{8}$/, operator: 'MTN MoMo', digits: 10, prefix: '05', apiEndpoint: '' },
    Orange: { regex: /^07\d{8}$/, operator: 'Orange Money', digits: 10, prefix: '07', apiEndpoint: '' },
    Moov: { regex: /^01\d{8}$/, operator: 'Moov Money', digits: 10, prefix: '01', apiEndpoint: '' },
  },
  '+221': {
    Orange: { regex: /^7[78]\d{7}$/, operator: 'Orange Money', digits: 9, prefix: '77/78', apiEndpoint: '' },
    Free: { regex: /^76\d{7}$/, operator: 'Free Money', digits: 9, prefix: '76', apiEndpoint: '' },
    Expresso: { regex: /^70\d{7}$/, operator: 'E-Money', digits: 9, prefix: '70', apiEndpoint: '' },
  },
  '+33': {
    Mobile: { regex: /^0[67]\d{8}$/, operator: 'Mobile FR', digits: 10, prefix: '06/07', apiEndpoint: '' },
  },
  '+1': {
    Mobile: { regex: /^\d{10}$/, operator: 'Mobile', digits: 10, prefix: '', apiEndpoint: '' },
  },
  default: {
    Mobile: { regex: /^\d{8,12}$/, operator: 'Mobile', digits: 10, prefix: '', apiEndpoint: '' },
  },
};

export const PHONE_DIAL_OPTIONS = [
  { dial: '+242', iso2: 'cg', labelKey: 'country.cg', hintKey: 'phone.hintCG' },
  { dial: '+243', iso2: 'cd', labelKey: 'country.cd', hintKey: 'phone.hintCD' },
  { dial: '+241', iso2: 'ga', labelKey: 'country.ga', hintKey: 'phone.hintGA' },
  { dial: '+237', iso2: 'cm', labelKey: 'country.cm', hintKey: 'phone.hintCM' },
  { dial: '+225', iso2: 'ci', labelKey: 'country.ci', hintKey: 'phone.hintCI' },
  { dial: '+221', iso2: 'sn', labelKey: 'country.sn', hintKey: 'phone.hintSN' },
  { dial: '+33', iso2: 'fr', labelKey: 'country.fr', hintKey: 'phone.hintFR' },
  { dial: '+1', iso2: 'us', labelKey: 'country.us', hintKey: 'phone.hintUS' },
] as const;

export type PhoneDialCode = (typeof PHONE_DIAL_OPTIONS)[number]['dial'];

export const APP_COUNTRY_TO_DIAL: Record<string, PhoneDialCode> = {
  cg: '+242',
  cd: '+243',
  fr: '+33',
  us: '+1',
  ca: '+1',
};

export function getDialCodeForAppCountry(appCountry?: string): PhoneDialCode {
  return APP_COUNTRY_TO_DIAL[appCountry || 'cg'] || '+242';
}

export function normalizeLocalNumber(num: string, dialCode: string): string {
  let clean = num.replace(/\s/g, '').replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) clean = clean.slice(1);
  const dialDigits = dialCode.replace(/\D/g, '');
  if (clean.startsWith(dialDigits)) {
    clean = clean.slice(dialDigits.length);
  }
  if (dialCode === '+242' && clean.length === 8 && /^[4566]/.test(clean)) {
    clean = `0${clean}`;
  }
  return clean.replace(/\D/g, '');
}

export function detectOperator(dialCode: string, localNum: string): string | null {
  const clean = normalizeLocalNumber(localNum, dialCode);
  const countryConfig = COUNTRY_NETWORK_CONFIG[dialCode];
  if (!countryConfig) return null;

  for (const [op, cfg] of Object.entries(countryConfig)) {
    if (op === 'Other') continue;
    if (cfg.regex.test(clean)) return op;
  }
  return null;
}

export interface PhoneValidationResult {
  valid: boolean;
  message: string;
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  config?: OperatorConfig;
  operator?: string;
}

export function validatePhoneNumber(
  num: string,
  dialCode: string,
  operator?: string
): PhoneValidationResult {
  const cleanNum = normalizeLocalNumber(num, dialCode);
  if (!cleanNum) {
    return { valid: false, message: '', messageKey: 'phone.errorEmpty' };
  }

  const countryConfig = COUNTRY_NETWORK_CONFIG[dialCode] || COUNTRY_NETWORK_CONFIG.default;
  const isDefault = countryConfig === COUNTRY_NETWORK_CONFIG.default;

  if (isDefault) {
    const cfg = countryConfig.Mobile;
    const ok = cfg.regex.test(cleanNum);
    return ok
      ? { valid: true, message: '', messageKey: 'phone.valid', config: cfg, operator: 'Mobile' }
      : {
          valid: false,
          message: '',
          messageKey: 'phone.errorLength',
          messageParams: { digits: cfg.digits },
          config: cfg,
        };
  }

  const detected = detectOperator(dialCode, cleanNum);
  const opKey = operator || detected;

  if (!opKey) {
    const hint = dialCode === '+242' ? 'phone.errorCGPrefix' : 'phone.errorInvalid';
    return {
      valid: false,
      message: '',
      messageKey: hint,
      messageParams: { dial: dialCode },
    };
  }

  const opConfig = countryConfig[opKey] || countryConfig[Object.keys(countryConfig)[0]];

  if (cleanNum.length !== opConfig.digits) {
    return {
      valid: false,
      message: '',
      messageKey: 'phone.errorDigits',
      messageParams: { digits: opConfig.digits, prefix: opConfig.prefix, operator: opConfig.operator },
      config: opConfig,
      operator: opKey,
    };
  }

  if (!opConfig.regex.test(cleanNum)) {
    if (operator && detected && operator !== detected) {
      return {
        valid: false,
        message: '',
        messageKey: 'phone.errorWrongOperator',
        messageParams: {
          expected: countryConfig[detected]?.operator || detected,
          operator: opConfig.operator,
        },
        config: opConfig,
        operator: opKey,
      };
    }
    return {
      valid: false,
      message: '',
      messageKey: 'phone.errorOperatorFormat',
      messageParams: { operator: opConfig.operator, prefix: opConfig.prefix },
      config: opConfig,
      operator: opKey,
    };
  }

  return {
    valid: true,
    message: '',
    messageKey: 'phone.validWithOperator',
    messageParams: { operator: opConfig.operator },
    config: opConfig,
    operator: opKey,
  };
}

export function formatPhoneMessage(
  result: PhoneValidationResult,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (result.messageKey) {
    const msg = t(result.messageKey, result.messageParams);
    if (msg !== result.messageKey) return msg;
  }
  return result.message || '';
}

export function formatFullPhone(localNum: string, dialCode: string): string {
  const local = normalizeLocalNumber(localNum, dialCode);
  return local ? `${dialCode}${local.replace(/^0/, '')}` : '';
}
